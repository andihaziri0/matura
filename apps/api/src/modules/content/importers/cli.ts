/**
 * CLI entry point for `pnpm content:import`.
 *
 * Reads raw content under `content/raw/math/` and writes Questions as DRAFT.
 *
 * Pipeline:
 *   1. Boot a minimal NestJS context to get config + S3Service (so we can
 *      upload images to R2/MinIO using the same code as the API).
 *   2. For each .json file in content/raw/<subject>/json, pick the first
 *      adapter that matches and stream `ImportedQuestion`s.
 *   3. Upsert each one as DRAFT in Postgres.
 *
 * Add a new adapter by:
 *   - implementing `ContentAdapter` in this folder, and
 *   - appending it to `ADAPTERS` below (order matters; first match wins).
 */
import 'reflect-metadata';
import { resolve, basename, extname } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { CreateQuestionInputSchema } from '@matura/shared';
import { prisma } from '@matura/db';
import { AppModule } from '../../../app.module';
import { S3Service } from '../../media/s3.service';
import { legacyJsonAdapter } from './legacy-json';
import type { ContentAdapter, ImporterContext } from './adapter';

const REPO_ROOT = resolve(__dirname, '../../../../../..');
const RAW_MATH_JSON = resolve(REPO_ROOT, 'content/raw/math/json');
const RAW_MATH_PNG = resolve(REPO_ROOT, 'content/raw/math/png');

const ADAPTERS: readonly ContentAdapter[] = [legacyJsonAdapter];

async function ensureSeedAuthor(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { firebaseUid: '__seed__' },
    create: {
      firebaseUid: '__seed__',
      email: 'seed@akademiaas.com',
      name: 'AkademiaAS Seed',
      role: 'OWNER',
    },
    update: {},
  });
  return user.id;
}

async function main(): Promise<void> {
  if (!existsSync(RAW_MATH_JSON)) {
    console.warn(`[import] no raw json folder at ${RAW_MATH_JSON} — nothing to do`);
    return;
  }
  const files = readdirSync(RAW_MATH_JSON).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.warn(`[import] no .json files in ${RAW_MATH_JSON} — nothing to do`);
    return;
  }

  // Boot Nest just enough to instantiate S3Service (needs ConfigModule). Keep it as a
  // standalone application context so we don't bind to an HTTP port.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const s3 = app.get(S3Service);

  const authorId = await ensureSeedAuthor();
  let imported = 0;

  const ctx: ImporterContext = {
    jsonDir: RAW_MATH_JSON,
    pngDir: RAW_MATH_PNG,
    authorId,
    uploadImage: async (localPath: string) => {
      const ext = extname(localPath).slice(1) || 'png';
      const key = `questions/imported/${randomUUID()}.${ext}`;
      await s3.putObjectFromFile({
        key,
        localPath,
        contentType: ext === 'png' ? 'image/png' : `image/${ext}`,
      });
      return key;
    },
  };

  for (const file of files) {
    const absoluteJsonPath = resolve(RAW_MATH_JSON, file);
    const adapter = ADAPTERS.find((a) => a.matches(file));
    if (!adapter) {
      console.warn(`[import] ${file}: no adapter matched — skipping`);
      continue;
    }
    let count = 0;
    for await (const q of adapter.load({ absoluteJsonPath, ctx })) {
      const validated = CreateQuestionInputSchema.parse(q);
      await prisma.question.upsert({
        where: { externalId: validated.externalId! },
        create: {
          externalId: validated.externalId!,
          subjectSlug: validated.subjectSlug,
          topicPath: validated.topicPath,
          kind: validated.kind,
          difficulty: validated.difficulty,
          year: validated.year ?? null,
          source: validated.source ?? null,
          tracks: validated.tracks,
          promptMd: validated.promptMd,
          correctAnswer: validated.correctAnswer ?? null,
          explanationMd: validated.explanationMd,
          hints: validated.hints,
          tags: validated.tags,
          estimatedSec: validated.estimatedSec,
          status: 'DRAFT',
          createdById: authorId,
          options: validated.options.length > 0 ? { create: validated.options } : undefined,
          images: validated.images.length > 0 ? { create: validated.images } : undefined,
        },
        update: {
          subjectSlug: validated.subjectSlug,
          topicPath: validated.topicPath,
          kind: validated.kind,
          difficulty: validated.difficulty,
          year: validated.year ?? null,
          source: validated.source ?? null,
          tracks: validated.tracks,
          promptMd: validated.promptMd,
          correctAnswer: validated.correctAnswer ?? null,
          explanationMd: validated.explanationMd,
          hints: validated.hints,
          tags: validated.tags,
          estimatedSec: validated.estimatedSec,
        },
      });
      count += 1;
    }
    console.log(`[import] ${basename(file)} (${adapter.name}) -> ${count} questions`);
    imported += count;
  }

  console.log(`[import] total imported: ${imported}`);
  await app.close();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

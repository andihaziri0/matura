/**
 * Upload PNGs from content/matura-fotot to S3-compatible storage and attach
 * QuestionImage rows for questions listed in content/seed/math/matura-foto.json.
 *
 * Requires DATABASE_URL and the same S3 env vars as apps/api (S3_ENDPOINT,
 * S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET,
 * S3_FORCE_PATH_STYLE, S3_PUBLIC_BASE_URL).
 *
 * Usage (from repo root):
 *   pnpm --filter @matura/db attach:matura-foto-images
 *   pnpm --filter @matura/db attach:matura-foto-images -- --dry-run
 *   pnpm --filter @matura/db attach:matura-foto-images -- --write-json
 *   pnpm --filter @matura/db attach:matura-foto-images -- --skip-upload
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');
const SEED_JSON = resolve(REPO_ROOT, 'content/seed/math/matura-foto.json');
const FOTO_DIR = resolve(REPO_ROOT, 'content/matura-fotot');

interface SeedImage {
  r2Key: string;
  alt: string;
  order: number;
  role: 'INLINE' | 'FIGURE' | 'FULL_QUESTION';
}

interface SeedQuestion {
  externalId: string;
  tags?: string[];
  images?: SeedImage[];
}

function imgStemFromTags(tags?: string[]): string | null {
  if (!tags) return null;
  const raw = tags.find((x) => x.startsWith('img:'));
  if (!raw) return null;
  return raw.slice('img:'.length).trim();
}

function r2KeyForStem(stem: string): string {
  return `questions/matura-foto/${stem}.png`;
}

function loadS3(): {
  client: S3Client;
  bucket: string;
} {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? 'auto';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'Missing S3 env: need S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET',
    );
  }

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const skipUpload = argv.includes('--skip-upload');
  const writeJson = argv.includes('--write-json');

  if (!existsSync(SEED_JSON)) {
    throw new Error(`Seed file not found: ${SEED_JSON}`);
  }
  const raw = readFileSync(SEED_JSON, 'utf-8');
  const questions = JSON.parse(raw) as SeedQuestion[];

  let s3Client: S3Client | null = null;
  let bucket = '';
  if (!dryRun && !skipUpload) {
    const s3 = loadS3();
    s3Client = s3.client;
    bucket = s3.bucket;
  }

  for (const q of questions) {
    const stem = imgStemFromTags(q.tags);
    if (!stem) {
      console.warn(`[attach-matura-foto] skip ${q.externalId}: no img:* tag`);
      continue;
    }
    const localPath = resolve(FOTO_DIR, `${stem}.png`);
    if (!existsSync(localPath)) {
      throw new Error(`Missing image file for ${q.externalId}: ${localPath}`);
    }
    const r2Key = r2KeyForStem(stem);
    const alt = 'Figurë nga provimi i Maturës.';
    const img: SeedImage = { r2Key, alt, order: 0, role: 'FULL_QUESTION' };

    if (dryRun) {
      console.log(`[dry-run] ${q.externalId} → ${r2Key} ← ${localPath}`);
      continue;
    }

    const dbRow = await prisma.question.findUnique({
      where: { externalId: q.externalId },
      select: { id: true },
    });
    if (!dbRow) {
      console.warn(`[attach-matura-foto] DB: no question with externalId=${q.externalId} (run seed:questions first?)`);
      continue;
    }

    if (!skipUpload && s3Client) {
      const body = readFileSync(localPath);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: r2Key,
          Body: body,
          ContentType: 'image/png',
        }),
      );
      console.log(`[upload] ${r2Key}`);
    }

    await prisma.questionImage.deleteMany({
      where: { questionId: dbRow.id, r2Key },
    });
    await prisma.questionImage.create({
      data: {
        questionId: dbRow.id,
        r2Key,
        alt: img.alt,
        order: img.order,
        role: img.role,
      },
    });
    console.log(`[db] QuestionImage for ${q.externalId}`);
  }

  if (writeJson && !dryRun) {
    const out = questions.map((q) => {
      const stem = imgStemFromTags(q.tags);
      if (!stem) return q;
      const r2Key = r2KeyForStem(stem);
      return {
        ...q,
        images: [{ r2Key, alt: 'Figurë nga provimi i Maturës.', order: 0, role: 'FULL_QUESTION' as const }],
      };
    });
    writeFileSync(SEED_JSON, `${JSON.stringify(out, null, 2)}\n`, 'utf-8');
    console.log(`[write-json] updated ${SEED_JSON}`);
  }

  if (dryRun && writeJson) {
    console.log('[dry-run] skipped --write-json');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { prisma } from '../client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEED_FILE = resolve(__dirname, '../../../../content/seed/math/questions.json');
const SEED_USER_EMAIL = 'seed@akademiaas.com';
const SEED_USER_FIREBASE_UID = '__seed__';

interface SeedOption {
  label: string;
  isCorrect: boolean;
  order: number;
}

interface SeedImage {
  r2Key: string;
  alt: string;
  order: number;
  role: 'INLINE' | 'FIGURE' | 'FULL_QUESTION';
}

interface SeedQuestion {
  externalId: string;
  subjectSlug: string;
  topicPath: string;
  kind: 'MCQ' | 'SHORT' | 'LONG';
  difficulty: number;
  year?: number;
  source?: string;
  tracks: string[];
  promptMd: string;
  correctAnswer?: string;
  explanationMd: string;
  hints?: string[];
  tags?: string[];
  estimatedSec?: number;
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  options?: SeedOption[];
  images?: SeedImage[];
}

async function ensureSeedAuthor(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { firebaseUid: SEED_USER_FIREBASE_UID },
    create: {
      firebaseUid: SEED_USER_FIREBASE_UID,
      email: SEED_USER_EMAIL,
      name: 'AkademiaAS Seed',
      role: 'OWNER',
    },
    update: {},
  });
  return user.id;
}

export async function seedQuestions(): Promise<void> {
  if (!existsSync(SEED_FILE)) {
    console.warn(`[seed:questions] no seed file at ${SEED_FILE} — skipping`);
    return;
  }

  const raw = readFileSync(SEED_FILE, 'utf-8');
  const questions = JSON.parse(raw) as SeedQuestion[];
  const authorId = await ensureSeedAuthor();

  let upserted = 0;
  for (const q of questions) {
    await prisma.$transaction(async (tx) => {
      const created = await tx.question.upsert({
        where: { externalId: q.externalId },
        create: {
          externalId: q.externalId,
          subjectSlug: q.subjectSlug,
          topicPath: q.topicPath,
          kind: q.kind,
          difficulty: q.difficulty,
          year: q.year ?? null,
          source: q.source ?? null,
          tracks: q.tracks,
          promptMd: q.promptMd,
          correctAnswer: q.correctAnswer ?? null,
          explanationMd: q.explanationMd,
          hints: q.hints ?? [],
          tags: q.tags ?? [],
          estimatedSec: q.estimatedSec ?? 60,
          status: q.status ?? 'PUBLISHED',
          createdById: authorId,
        },
        update: {
          subjectSlug: q.subjectSlug,
          topicPath: q.topicPath,
          kind: q.kind,
          difficulty: q.difficulty,
          year: q.year ?? null,
          source: q.source ?? null,
          tracks: q.tracks,
          promptMd: q.promptMd,
          correctAnswer: q.correctAnswer ?? null,
          explanationMd: q.explanationMd,
          hints: q.hints ?? [],
          tags: q.tags ?? [],
          estimatedSec: q.estimatedSec ?? 60,
          status: q.status ?? 'PUBLISHED',
        },
      });

      await tx.questionOption.deleteMany({ where: { questionId: created.id } });
      if (q.options && q.options.length > 0) {
        await tx.questionOption.createMany({
          data: q.options.map((o) => ({
            questionId: created.id,
            label: o.label,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        });
      }

      await tx.questionImage.deleteMany({ where: { questionId: created.id } });
      if (q.images && q.images.length > 0) {
        await tx.questionImage.createMany({
          data: q.images.map((img) => ({
            questionId: created.id,
            r2Key: img.r2Key,
            alt: img.alt,
            order: img.order,
            role: img.role,
          })),
        });
      }
    });
    upserted += 1;
  }

  console.log(`[seed:questions] upserted ${upserted} questions`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedQuestions()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

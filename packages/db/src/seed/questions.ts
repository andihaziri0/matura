import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { prisma } from '../client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MATURA_FOTO_PARTS_DIR = resolve(
  __dirname,
  '../../../../content/seed/math/matura-foto-parts',
);

function maturaFotoPartSeedPaths(): string[] {
  if (!existsSync(MATURA_FOTO_PARTS_DIR)) return [];
  return readdirSync(MATURA_FOTO_PARTS_DIR)
    .filter((f) => /^batch-\d+\.json$/.test(f))
    .sort()
    .map((f) => resolve(MATURA_FOTO_PARTS_DIR, f));
}

// Order matters: later files win on duplicate externalId. AkademiaAS bank
// loads first; `questions.json` is hand-curated; optional `matura-foto-parts/batch-*.json`
// (transkripte në parti); `matura-foto.json` loads last (mbivendos pjesët).
const SEED_FILES = [
  resolve(__dirname, '../../../../content/seed/math/akademiaas-bank.json'),
  resolve(__dirname, '../../../../content/seed/math/questions.json'),
  ...maturaFotoPartSeedPaths(),
  resolve(__dirname, '../../../../content/seed/math/matura-foto.json'),
];
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
  const questions: SeedQuestion[] = [];
  const seenIds = new Set<string>();
  for (const file of SEED_FILES) {
    if (!existsSync(file)) {
      console.warn(`[seed:questions] no seed file at ${file} — skipping`);
      continue;
    }
    const raw = readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw) as SeedQuestion[];
    let added = 0;
    let replaced = 0;
    for (const q of parsed) {
      if (seenIds.has(q.externalId)) {
        // Later file wins; drop the earlier copy from the queue.
        const idx = questions.findIndex((x) => x.externalId === q.externalId);
        if (idx >= 0) questions.splice(idx, 1);
        replaced += 1;
      }
      seenIds.add(q.externalId);
      questions.push(q);
      added += 1;
    }
    console.log(
      `[seed:questions] loaded ${added} from ${file.split('/').slice(-3).join('/')}` +
        (replaced > 0 ? ` (${replaced} overrode earlier files)` : ''),
    );
  }
  if (questions.length === 0) {
    console.warn('[seed:questions] no questions to seed');
    return;
  }

  const authorId = await ensureSeedAuthor();
  const total = questions.length;
  const progressEvery = 50;
  console.log(
    `[seed:questions] duke shkruar në DB (${total} pyetje unike pas bashkimit të skedarëve)…`,
  );
  console.log(
    `[seed:questions] (mund të zgjasë disa minuta me Neon — një transaksion për pyetje)`,
  );

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
    if (upserted % progressEvery === 0 || upserted === total) {
      console.log(`[seed:questions] … ${upserted} / ${total}`);
    }
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

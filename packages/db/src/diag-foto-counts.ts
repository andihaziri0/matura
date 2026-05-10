/**
 * Diagnostik për filtrat e bankës (foto e plotë + burimi foto).
 * Ngarkon `.env` nga rrënja e repo-s përpara Prisma klientit.
 *
 *   pnpm --filter @matura/db diag:foto-counts
 *
 * Për prod: vendos `DATABASE_URL` të Neon-it, pastaj të njëjtën komandë; pastaj
 * nëse numrat janë 0: `pnpm seed:questions`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function parseEnvLine(line: string): { key: string; val: string } | null {
  let t = line.trim();
  if (!t || t.startsWith('#')) return null;
  if (t.startsWith('export ')) t = t.slice('export '.length).trim();
  const eq = t.indexOf('=');
  if (eq < 1) return null;
  const key = t.slice(0, eq).trim();
  let rest = t.slice(eq + 1).trim();
  if (!key) return null;

  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1);
    rest = end === -1 ? rest.slice(1) : rest.slice(1, end);
  } else if (rest.startsWith("'")) {
    const end = rest.indexOf("'", 1);
    rest = end === -1 ? rest.slice(1) : rest.slice(1, end);
  } else {
    const cut = rest.search(/\s+#/);
    if (cut !== -1) rest = rest.slice(0, cut).trim();
  }
  return { key, val: rest };
}

function loadRootEnv(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(here, '../../../.env');
  if (!existsSync(envPath)) return;
  let text = readFileSync(envPath, 'utf-8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (process.env[parsed.key] === undefined) process.env[parsed.key] = parsed.val;
  }
}

loadRootEnv();

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error(
      '[diag:foto] Mungon DATABASE_URL. Vendose në mjedis ose krijo .env në rrënjën e repo-s.',
    );
    process.exit(1);
  }

  const { prisma } = await import('./client.js');

  const fullScan = await prisma.$queryRaw<{ c: number }[]>`
    SELECT count(*)::int AS c
    FROM "Question" q
    JOIN "QuestionImage" i ON i."questionId" = q.id
    WHERE i.role = 'FULL_QUESTION' AND q."subjectSlug" = 'matematike'
  `;
  const fotoTag = await prisma.$queryRaw<{ c: number }[]>`
    SELECT count(*)::int AS c
    FROM "Question"
    WHERE 'source:foto-matura' = ANY(tags) AND "subjectSlug" = 'matematike'
  `;

  const full = fullScan[0]?.c ?? 0;
  const tag = fotoTag[0]?.c ?? 0;
  console.log(`[diag:foto] QuestionImage FULL_QUESTION (matematike): ${full}`);
  console.log(`[diag:foto] Question tag source:foto-matura (matematike): ${tag}`);
  if (full === 0 && tag > 0) {
    console.warn(
      '[diag:foto] Ka pyetje me tag foto por pa FULL_QUESTION në DB — checkbox “vetëm foto e plotë” do të jetë bosh.',
    );
  }
  if (tag === 0) {
    console.warn(
      '[diag:foto] Nuk ka pyetje me source:foto-matura — rifresko: pnpm seed:questions (kundrejt kësaj DATABASE_URL).',
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

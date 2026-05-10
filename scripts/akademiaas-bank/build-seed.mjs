#!/usr/bin/env node
// One-shot converter for the AkademiaAS Matematikë question bank.
//
// Reads the canonical JS array from ./source.data.mjs (515 MCQ items as
// shipped by the AkademiaAS authoring tool on 2026-05-10) and emits a
// canonical seed file at content/seed/math/akademiaas-bank.json that the
// existing @matura/db seed pipeline can ingest.
//
// Mapping rules are documented in chat (and reproduced inline below).
// Re-run this script when AkademiaAS exports a refreshed bank: replace
// source.data.mjs and re-run `node scripts/akademiaas-bank/build-seed.mjs`.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { questions } from './source.data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');
const OUT_FILE = resolve(REPO_ROOT, 'content/seed/math/akademiaas-bank.json');

// 20 source categories → canonical topicPath strings used by the practice
// engine. The dotted hierarchy mirrors what's already in questions.json.
const TOPIC_BY_CAT = {
  logjike: 'aritmetike.logjike',
  numra: 'aritmetike.numra-real',
  'fuqi-rrenje': 'aritmetike.fuqi-rrenje',
  polinome: 'algjeber.polinome',
  'ekuacione-lineare': 'algjeber.ekuacione.lineare',
  'ekuacione-kuadratike': 'algjeber.ekuacione.kuadratike',
  'funksione-kuadratike': 'algjeber.funksione.kuadratike',
  eksponenciale: 'algjeber.eksponenciale-logaritme',
  komplekse: 'algjeber.numra-komplekse',
  matrica: 'algjeber.matrica',
  trigonometri: 'trigonometri.identitete',
  vargje: 'vargje.aritmetike-gjeometrike',
  limite: 'analize.limite',
  derivate: 'analize.derivate',
  gjeometri: 'gjeometri.plane',
  vektore: 'gjeometri.vektore',
  analitike: 'gjeometri.analitike',
  statistike: 'statistike.deskriptive',
  probabilitet: 'kombinatorike.probabilitet',
  kombinatorike: 'kombinatorike.kombinime',
};

// Hide questions that lean on a missing figure. The AkademiaAS export
// references images under matura-fotot/* which we do not have on the prod
// stack yet; rather than ship broken UX, mark these DRAFT so they don't
// surface in /practice. They remain importable and the OWNER can promote
// them via /admin once images are uploaded to R2.
const FIGURE_HINTS = [
  /figur[ëe]/i,
  /grafiku/i,
  /siç shihet/i,
  /(?:dh[eë]n[eë] n[eë]|n[eë]) figur/i,
  /diagrami/i,
  /tabel[eë]n/i,
  /\bskem[ae]\b/i,
  /\bdot plot\b/i,
];

function refersToFigure(q) {
  const haystack = [q.q, ...q.o].join(' ');
  return FIGURE_HINTS.some((re) => re.test(haystack));
}

// Convert KaTeX `\( ... \)` / `\[ ... \]` delimiters used by the source
// file into the markdown-flavoured `$...$` / `$$...$$` form the rest of
// the codebase uses.
function convertLatex(s) {
  let out = s;
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `$$${inner}$$`);
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => `$${inner}$`);
  return out;
}

const ALL_TRACKS = ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'];

function buildOptions(q) {
  return q.o.map((label, idx) => ({
    label: convertLatex(label),
    isCorrect: idx === q.a,
    order: idx,
  }));
}

// Minimal explanation: at MVP we don't have authored explanations. Echo
// the correct option so students at least see "right answer was B".
// Authors can replace these via the admin UI.
function buildExplanation(q) {
  const letter = 'ABCD'[q.a];
  const correctLabel = convertLatex(q.o[q.a]);
  return `Përgjigja e saktë është **${letter}**: ${correctLabel}.`;
}

function transform(q) {
  const topicPath = TOPIC_BY_CAT[q.cat];
  if (!topicPath) {
    throw new Error(`Unmapped category for id=${q.id}: ${q.cat}`);
  }
  const externalId = `akademiaas-math:${String(q.id).padStart(4, '0')}`;
  const isFigure = refersToFigure(q);
  const status = isFigure ? 'DRAFT' : 'PUBLISHED';
  const tags = [`source:${q.s}`];
  if (isFigure) tags.push('requires-figure');

  return {
    externalId,
    subjectSlug: 'matematike',
    topicPath,
    kind: 'MCQ',
    difficulty: q.s === 'foto' ? 3 : 2,
    source: q.s === 'foto' ? 'AkademiaAS — Matura banka' : 'AkademiaAS — Stërvitje',
    tracks: ALL_TRACKS,
    promptMd: convertLatex(q.q),
    explanationMd: buildExplanation(q),
    estimatedSec: 60,
    status,
    tags,
    options: buildOptions(q),
  };
}

function main() {
  const seenIds = new Set();
  const seenExternalIds = new Set();
  const out = [];
  for (const q of questions) {
    if (seenIds.has(q.id)) {
      throw new Error(`Duplicate id in source: ${q.id}`);
    }
    seenIds.add(q.id);
    if (typeof q.a !== 'number' || q.a < 0 || q.a > 3) {
      throw new Error(`Invalid answer index for id=${q.id}: ${q.a}`);
    }
    if (!Array.isArray(q.o) || q.o.length !== 4) {
      throw new Error(`Expected exactly 4 options for id=${q.id}, got ${q.o?.length}`);
    }
    const transformed = transform(q);
    if (seenExternalIds.has(transformed.externalId)) {
      throw new Error(`Duplicate externalId: ${transformed.externalId}`);
    }
    seenExternalIds.add(transformed.externalId);
    out.push(transformed);
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf-8');

  // Summary
  const byCat = {};
  const byStatus = { PUBLISHED: 0, DRAFT: 0, REVIEW: 0 };
  for (const q of out) {
    byCat[q.topicPath] = (byCat[q.topicPath] ?? 0) + 1;
    byStatus[q.status] = (byStatus[q.status] ?? 0) + 1;
  }
  console.log(`[build] wrote ${out.length} questions to ${OUT_FILE}`);
  console.log(`[build] status: ${byStatus.PUBLISHED} PUBLISHED, ${byStatus.DRAFT} DRAFT (figure-dependent)`);
  console.log('[build] by topicPath:');
  for (const [k, v] of Object.entries(byCat).sort()) {
    console.log(`  ${k.padEnd(45)} ${v}`);
  }
}

main();

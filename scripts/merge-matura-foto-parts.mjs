#!/usr/bin/env node
/**
 * Merges content/seed/math/matura-foto-parts/batch-*.json into a single array,
 * dedupes by externalId (first occurrence wins), writes to stdout as JSON.
 *
 * Usage: node scripts/merge-matura-foto-parts.mjs > /tmp/merged.json
 * Or integrate into release process.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const partsDir = resolve(root, 'content/seed/math/matura-foto-parts');

if (!existsSync(partsDir)) {
  console.error('[merge-matura-foto] no parts directory:', partsDir);
  process.exit(1);
}

const partFiles = readdirSync(partsDir)
  .filter((f) => /^batch-\d+\.json$/.test(f))
  .sort();

const seen = new Set();
const out = [];

for (const f of partFiles) {
  const raw = readFileSync(resolve(partsDir, f), 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) {
    console.error('[merge-matura-foto] expected array in', f);
    process.exit(1);
  }
  for (const q of arr) {
    if (!q.externalId) continue;
    if (seen.has(q.externalId)) continue;
    seen.add(q.externalId);
    out.push(q);
  }
}

process.stdout.write(JSON.stringify(out, null, 2) + '\n');
console.error(`[merge-matura-foto] merged ${out.length} unique questions from ${partFiles.length} part files`);

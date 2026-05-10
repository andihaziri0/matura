import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function normalizePublicStorageBase(v: string | undefined): string | undefined {
  const t = typeof v === 'string' ? v.trim() : '';
  if (!t) return undefined;
  return t.replace(/\/$/, '');
}

/** Minimal KEY=value parser (covers repo-root `.env`, same subset as next.config merge). */
function parseDotenvContent(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = text.replace(/^\uFEFF/u, '').split(/\r?\n/u);
  for (let line of lines) {
    const hash = line.indexOf('#');
    if (hash !== -1) line = line.slice(0, hash);
    line = line.trim();
    if (!line) continue;
    if (/^export\s+/iu.test(line)) line = line.replace(/^export\s+/iu, '').trim();
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_]\w*$/u.test(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * R2 / MinIO public origin for fetching question assets by `QuestionImage.r2Key`.
 * Server-only — uses injected env plus optional repo-root `.env` fallback (cwd `apps/web`).
 */
export function getPublicStorageOrigin(): string | undefined {
  const b =
    normalizePublicStorageBase(process.env.S3_PUBLIC_BASE_URL) ??
    normalizePublicStorageBase(process.env.NEXT_PUBLIC_R2_PUBLIC_URL);
  if (b) return b;

  try {
    const repoRoot = join(process.cwd(), '..', '..');
    let merged: Record<string, string> = {};
    for (const name of ['.env', '.env.local']) {
      const p = join(repoRoot, name);
      if (!existsSync(p)) continue;
      merged = { ...merged, ...parseDotenvContent(readFileSync(p, 'utf8')) };
    }
    return (
      normalizePublicStorageBase(merged.S3_PUBLIC_BASE_URL) ??
      normalizePublicStorageBase(merged.NEXT_PUBLIC_R2_PUBLIC_URL)
    );
  } catch {
    return undefined;
  }
}

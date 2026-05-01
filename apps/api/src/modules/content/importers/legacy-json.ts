/**
 * Legacy JSON importer.
 *
 * The AkademiaAS team will commit their existing question files into
 * `content/raw/math/json/*.json` (and matching screenshots into
 * `content/raw/math/png/`). The exact JSON shape is not yet known.
 *
 * Until a real sample is shared, this adapter assumes the file is *already*
 * either a single canonical `CreateQuestionInput`-shaped object or an array
 * of them. The `mapLegacyQuestion` function is the single point to extend
 * once we know the legacy shape (see TODO below).
 *
 * For PNG-only questions (no body, just a screenshot of the printed page),
 * provide `imageFile: "abc.png"` and `kind: "LONG"` with an empty `promptMd`
 * placeholder; the adapter will upload the PNG to R2/MinIO and attach it as
 * a `FULL_QUESTION` image.
 */
import { readFileSync, existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import type { CreateQuestionInput } from '@matura/shared';
import type { ContentAdapter, ImportedQuestion, ImporterContext } from './adapter';

/** Heuristic: legacy file shapes we tolerate. Extend as the team's format evolves. */
interface LegacyQuestionShape extends Partial<CreateQuestionInput> {
  /** When set, we treat this as a PNG-backed question and upload the file. */
  imageFile?: string;
  /** Optional explicit external id; otherwise we derive one from filename + index. */
  externalId?: string;
}

export const legacyJsonAdapter: ContentAdapter = {
  name: 'legacy-json',

  matches(filename: string): boolean {
    return filename.endsWith('.json');
  },

  async *load({ absoluteJsonPath, ctx }) {
    const raw = readFileSync(absoluteJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    const fileTag = basename(absoluteJsonPath, '.json');

    let idx = 0;
    for (const item of items) {
      const legacy = item as LegacyQuestionShape;
      const mapped = mapLegacyQuestion(legacy);

      const externalId = legacy.externalId ?? mapped.externalId ?? `legacy:${fileTag}:${idx}`;

      const images = mapped.images ? [...mapped.images] : [];

      if (legacy.imageFile) {
        const localPath = resolve(ctx.pngDir, legacy.imageFile);
        if (!existsSync(localPath)) {
          throw new Error(
            `[legacy-json] file ${absoluteJsonPath} references missing image ${legacy.imageFile}`,
          );
        }
        const r2Key = await ctx.uploadImage(localPath);
        images.push({
          r2Key,
          alt: `Pyetja ${externalId}`,
          order: images.length,
          role: 'FULL_QUESTION',
        });
      }

      const out: ImportedQuestion = {
        externalId,
        subjectSlug: mapped.subjectSlug ?? 'matematike',
        topicPath: mapped.topicPath ?? 'aritmetike.numra-real',
        kind: mapped.kind ?? 'SHORT',
        difficulty: mapped.difficulty ?? 3,
        year: mapped.year,
        source: mapped.source,
        tracks: mapped.tracks ?? ['pergjithshem'],
        promptMd: mapped.promptMd ?? '',
        correctAnswer: mapped.correctAnswer,
        explanationMd: mapped.explanationMd ?? '',
        hints: mapped.hints ?? [],
        tags: mapped.tags ?? [],
        estimatedSec: mapped.estimatedSec ?? 60,
        status: mapped.status ?? 'DRAFT',
        options: mapped.options ?? [],
        images,
      };
      yield out;
      idx += 1;
    }
  },
};

/**
 * TODO(content-import): replace this passthrough with a real mapper once the
 * AkademiaAS team commits one example file under `content/raw/math/json/`.
 */
function mapLegacyQuestion(input: LegacyQuestionShape): Partial<CreateQuestionInput> {
  return input;
}

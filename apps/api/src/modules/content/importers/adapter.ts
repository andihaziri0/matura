/**
 * Pluggable adapter contract for content importers.
 *
 * An adapter reads raw files under `content/raw/<subject>/...` and yields
 * canonical `CreateQuestionInput` objects. The CLI is responsible for:
 *   - authentication context (seed author user)
 *   - image upload (delegated to `ImageUploader`)
 *   - persistence (always upserts as DRAFT)
 *
 * Add a new adapter by implementing `ContentAdapter` and registering it
 * inside `apps/api/src/modules/content/importers/cli.ts`.
 */
import type { CreateQuestionInput } from '@matura/shared';

export interface ImporterContext {
  /** Repo-relative folder containing raw JSON files for this subject. */
  jsonDir: string;
  /** Repo-relative folder containing raw PNG files referenced by JSON. */
  pngDir: string;
  /** Postgres User.id of the seed/owner author. */
  authorId: string;
  /** Upload a local image file and return its r2 key. */
  uploadImage: (localPngPath: string) => Promise<string>;
}

/**
 * The shape returned by each importer. `externalId` is required so that
 * re-running the import is idempotent (upsert by externalId).
 */
export type ImportedQuestion = CreateQuestionInput & { externalId: string };

export interface ContentAdapter {
  /** Stable identifier used in logs. */
  readonly name: string;
  /** Returns true if this adapter recognises the file at the given path. */
  matches(filename: string): boolean;
  /** Yields canonical questions, one by one, ready for the CLI to upsert. */
  load(args: { absoluteJsonPath: string; ctx: ImporterContext }): AsyncIterable<ImportedQuestion>;
}

# Feature: Content import

CLI-only pipeline that turns the AkademiaAS team's existing question files
(JSON + PNG) into `Question` rows. Always writes `DRAFT` so an owner reviews
before publishing.

## Folder layout

```
content/
├── raw/                       # AkademiaAS-owned originals — not generated
│   └── math/
│       ├── json/<file>.json   # legacy JSON questions, one or many per file
│       └── png/<file>.png     # screenshots referenced by `imageFile` in the JSON
└── seed/                      # tracked, idempotent demo content (Phase 10)
    └── math/questions.json
```

## How it runs

```bash
pnpm content:import
```

Internally:

1. Boots a minimal NestJS application context (no HTTP server).
2. For each file in `content/raw/math/json`, picks the first matching adapter
   in `apps/api/src/modules/content/importers/cli.ts > ADAPTERS`.
3. For each `ImportedQuestion` the adapter yields:
   - validates against `CreateQuestionInputSchema` from `@matura/shared`,
   - uploads any referenced PNG via `S3Service.putObjectFromFile()` to R2/MinIO,
   - upserts the row in Postgres by `externalId`, status forced to `DRAFT`.
4. Logs counts per file and a final total.

## Adapter contract

`apps/api/src/modules/content/importers/adapter.ts`

```ts
export interface ContentAdapter {
  readonly name: string;
  matches(filename: string): boolean;
  load(args: {
    absoluteJsonPath: string;
    ctx: ImporterContext;
  }): AsyncIterable<ImportedQuestion>;
}
```

`ImporterContext.uploadImage(localPngPath)` is provided by the CLI and resolves
to the new R2 key — adapters never touch the S3 client directly.

## The `legacy-json` adapter

Status: **stub**. It currently accepts files that already follow the canonical
`CreateQuestionInput` shape, so it works for unit-style fixtures.

To handle the team's real format, edit
`apps/api/src/modules/content/importers/legacy-json.ts > mapLegacyQuestion()`.
Steps to extend:

1. Add the team's JSON shape as a TypeScript interface near `LegacyQuestionShape`.
2. In `mapLegacyQuestion`, project every field into a `CreateQuestionInput`.
3. If a question is "PNG-only" (just a screenshot, no transcribed text), set
   `imageFile: "<filename>.png"` in the source JSON; the adapter will upload
   it as a `FULL_QUESTION` image.

## Idempotency

Every `ImportedQuestion` carries an `externalId`. Re-running `pnpm content:import`
on the same files produces zero new rows — only field updates on the existing
question, plus uploads of any new images. Drop the safe `externalId` strategy
only with a migration that renames legacy ids first.

## Constraints

- The importer never publishes — every imported question lands as `DRAFT`.
- Image upload runs **synchronously** during import. For very large batches,
  enqueue a BullMQ job per file instead (future work).
- The CLI requires the same env file as the API (S3 keys, DATABASE_URL).

## TODOs (tracked in the file itself)

- `mapLegacyQuestion`: replace passthrough once the team commits one example file.

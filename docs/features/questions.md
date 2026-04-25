# Feature: Questions

The first end-to-end vertical slice. Owners author questions; everyone can read published ones.

## Endpoints (apps/api)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/questions` | public | List with cursor pagination + filters (`subjectSlug`, `topicPath`, `status`, `difficulty`, `search`). |
| GET | `/api/questions/:id` | public | Single question with options + images. |
| POST | `/api/questions` | OWNER | Create. Validated by `CreateQuestionInputSchema`. |
| PATCH | `/api/questions/:id` | OWNER | Update. Replaces options/images when provided. |
| POST | `/api/questions/:id/status` | OWNER | Set `DRAFT` / `REVIEW` / `PUBLISHED`. |
| DELETE | `/api/questions/:id` | OWNER | Hard delete (cascades to options, images, attempts). |
| POST | `/api/media/presign-image` | OWNER | Issue a presigned R2 PUT URL for question images. |

All inputs are validated by the corresponding Zod schemas in `@matura/shared`. The `MCQ` constraint (≥2 options, exactly one correct) is enforced in `CreateQuestionInputSchema` via `superRefine`.

## Web (apps/web/src/app/(admin)/admin/questions)

| Route | Component | Purpose |
|---|---|---|
| `/admin/questions` | `page.tsx` + `questions-list.tsx` | Lists the latest 50 questions, links to edit. |
| `/admin/questions/new` | `new/page.tsx` + `question-editor.tsx` | Create flow. Saves DRAFT. |
| `/admin/questions/[id]` | `[id]/page.tsx` + `question-editor.tsx` | Edit + publish. |

The editor is a single client component (`question-editor.tsx`) with:

- Topic selector populated from `MathTaxonomy.TOPICS`.
- Live KaTeX preview of `promptMd`, options, and `explanationMd` via `<Markdown />` from `@matura/ui`.
- Image uploader (`image-uploader.tsx`) that:
  1. Calls `POST /api/media/presign-image` with `{ filename, contentType, sizeBytes }`.
  2. PUTs the file directly to the returned `uploadUrl` (R2/MinIO).
  3. Appends `{ r2Key, alt, order, role: 'INLINE' }` to the form draft.
- `Save draft` button — `POST /api/questions` (create) or `PATCH /api/questions/:id` (edit).
- `Publish` button — only on edit, calls `POST /api/questions/:id/status`.

## Data model touchpoints

- `Question`, `QuestionOption`, `QuestionImage` in `packages/db/prisma/schema.prisma`.
- `externalId` is unique and used by both seed and importer to upsert idempotently.
- `topicPath` is a dotted string indexed for prefix matches.

## Manual smoke test

1. `pnpm dev:infra && pnpm db:migrate && pnpm db:seed && pnpm dev`.
2. Sign in as an owner (set `role` to `OWNER` directly in Postgres for the first user).
3. Navigate to `/admin/questions/new`.
4. Paste sample LaTeX in the prompt: `Le të jetë $f(x) = 2x^2 - 3x + 1$. Sa është $f(2)$?`.
5. Add 4 options, mark one correct, write an explanation, attach an image.
6. Save → should land on `/admin/questions/<id>`.
7. Publish → status badge flips to `PUBLISHED`.
8. Visit `/practice/matematike` (Phase 12) and verify the question appears.

## Open work

- Migrate the admin pages from raw `fetch()` to `@matura/sdk` once `pnpm openapi:generate` has run at least once.
- Add bulk operations (publish many, delete many) when needed.
- Add a content review workflow when more than four authors exist.

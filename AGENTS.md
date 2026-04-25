# AGENTS.md

> **You are an AI agent (Cursor, Claude Code, Codex, etc.) working on this repo. Read this file first, every time. It is short on purpose.**

## What this project is

A web application for Kosovo 12th-grade students preparing for **Testi i Maturës** (the state matura exam). Built by `AkademiaAS` (a private course teaching Math + programming).

- Public MVP target: practice Matematikë questions with instant feedback and Albanian explanations. **The MVP scaffold milestone is done — see `docs/status.md`.**
- Long-term: adaptive practice, AI tutor (Albanian), mock past papers, study plan generator, all subjects + tracks.

## Where to look first

In this exact order:

1. **`docs/status.md`** — what is done, in progress, and next. **Always read this before picking up work.**
2. **`.agent/state.yaml`** — the same info, machine-readable. Update both files in the same commit when you change feature status.
3. **`docs/product/scope.md`** — what is in scope for the current milestone and, more importantly, what is **not**.
4. **`docs/architecture/overview.md`** — the system at a glance.
5. **`docs/architecture/decisions/`** — numbered ADRs. Decisions are immutable; supersede, don't edit.
6. **`docs/features/<feature>.md`** — read the feature doc before touching `apps/api/src/modules/<feature>` or any related web route.

## Conventions you must follow

### Repository

- Monorepo: **pnpm workspaces + Turborepo**. Always run from the repo root.
- Package namespace: **`@matura/*`** (`@matura/db`, `@matura/shared`, `@matura/sdk`, `@matura/ui`).
- Apps: `apps/api` (NestJS), `apps/web` (Next.js App Router).
- One feature = one folder. Feature folders mirror across `apps/api/src/modules/<feature>/` and `apps/web/app/(app)/<feature>/` and `docs/features/<feature>.md`.

### Code style

- TypeScript strict everywhere. No `any` unless guarded by a `// eslint-disable-next-line` with a reason.
- Validate every external input with a **Zod schema from `@matura/shared`**. Never define ad-hoc validation in the API or web.
- API ↔ web contract is **OpenAPI-generated** into `packages/sdk`. Never hand-roll `fetch()` calls in `apps/web`; use the SDK.
- Prisma is the only DB access. No raw SQL except in migrations or for pgvector queries that Prisma can't express.
- Albanian copy in the UI lives in `packages/shared/src/i18n/sq.ts`. Never hardcode Albanian strings in components.
- Math content uses Markdown + LaTeX (`$...$` inline, `$$...$$` block). Render with the shared `<Markdown />` component from `@matura/ui`.

### Auth

- Identity is **Firebase Auth**. Profile + roles are in **Postgres**.
- Web obtains a Firebase ID token, sends it as `Authorization: Bearer <token>`.
- `FirebaseAuthGuard` in `apps/api/src/common/auth/` validates the token and the `@CurrentUser()` decorator auto-provisions a `User` row in Postgres on first request.
- Roles enum: currently `OWNER` only for the four humans (the course teacher and three students). Treat `STUDENT` and `TEACHER` as future-reserved.

### Workflow

When picking up work:

1. Read `docs/status.md`. Pick a `[ ]` item under the **current milestone**.
2. Read the linked feature doc (or create one if missing).
3. Mark the item `[~]` in `docs/status.md` and bump it to `in_progress` in `.agent/state.yaml`.
4. Implement. Update both the feature doc and Prisma/Zod schemas as needed.
5. Mark the item `[x]` and `done` in the same commit as the code.
6. Never leave the two files out of sync.

When making architectural changes:

1. Open a new ADR under `docs/architecture/decisions/` with the next number.
2. Reference the ADR from the relevant feature doc.
3. Old ADRs are **never edited** — write a new one that supersedes the previous.

### Things you must NOT do

- Do not write tests unless the user asks. (Decision in ADR-0009. Don't argue about it.)
- Do not add analytics, cookie banners, or GDPR machinery. Decision is "GDPR-style minimal data" but no extra UI surface.
- Do not invent libraries. Stick to what is in [docs/architecture/stack.md](docs/architecture/stack.md). New dependency = new ADR.
- Do not bypass the SDK. If it's missing an endpoint, regenerate it.
- Do not use English copy in user-facing UI. Albanian only at MVP.
- Do not hardcode question content in components. Content lives in DB or in `content/seed/math/questions.json`.

## How to run locally

See [README.md](README.md) for the bootstrap commands. TL;DR:

```bash
pnpm install
pnpm dev:infra     # docker compose up postgres + redis + minio
pnpm db:migrate    # prisma migrate deploy
pnpm db:seed       # seed subjects + 50 matematike questions
pnpm dev           # turbo run dev (api + web in parallel)
```

## Glossary

- **Matura / Testi i Maturës** — the Kosovo state high-school exit exam.
- **Drejtimi** — track / stream. Values: `pergjithshem` (general), `natyror` (natural sciences), `shoqeror` (social sciences), `gjuhesor` (languages).
- **AkademiaAS** — the course operating this product.
- **OWNER** — the four people authoring questions (the teacher + three students). All have full admin rights.

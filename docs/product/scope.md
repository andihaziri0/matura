# Scope

This document defines what is in scope **for the current milestone** and, more importantly, what is explicitly **out of scope**.

When in doubt, do less.

---

## Current milestone: MVP scaffold

A runnable repo with one end-to-end vertical slice.

### In scope

**Platform**
- Monorepo with NestJS API + Next.js web.
- Local development via Docker Compose (Postgres + Redis + MinIO).
- OpenAPI-generated typed SDK consumed by web.

**Auth & roles**
- Firebase Auth: email/password and Google OAuth on the web.
- Single `OWNER` role for the four humans.
- Auto-provisioned `User` row in Postgres on first authenticated request.

**Content domain**
- Subjects table with `matematike` seeded.
- Questions: `MCQ`, `SHORT`, `LONG` kinds.
- Question images via Cloudflare R2 (MinIO locally).
- Albanian-only copy and explanations.
- LaTeX rendered with KaTeX.

**First feature — question authoring**
- `/admin/questions` list, search, filter by status/topic/difficulty.
- `/admin/questions/new` editor with live KaTeX preview.
- Image upload via presigned URL.
- Publish / unpublish.

**First feature — practice**
- `/practice/matematike` page, fetches 10 random PUBLISHED questions.
- Instant per-question feedback with explanation.
- Records attempts so we can later compute progress.

**Seed content**
- 50 Matematikë questions in `content/seed/math/questions.json`, idempotently upserted.

**Agent spine**
- `AGENTS.md`, `docs/status.md`, `.agent/state.yaml`, ADRs, feature docs.

### Out of scope (this milestone)

The following are *intentionally* deferred. Do not build them. If a reason emerges, write a new ADR proposing the change.

**Adaptive & AI**
- No spaced-repetition or IRT-lite question selection. Random selection only.
- No AI tutor chat. The `ai` NestJS module exists as an empty shell.
- No embeddings generation, even though the schema has an `embedding` column.
- No AI-generated explanations at runtime; all explanations are authored.

**Other subjects & tracks**
- Matematikë only. The schema supports all subjects/tracks but no other subject is seeded or surfaced.
- Track filter (`drejtimi`) is stored on the user but has no effect on question selection yet.

**Past-paper / mock-exam mode**
- No timed full-paper simulator.
- No `MOCK` `Session.kind` flow wired up. Schema includes the value but no UI/endpoint uses it.

**Plans & readiness**
- No study-plan generator.
- No readiness score.
- `Plan` and `SrsCard` tables are created empty.

**Social**
- No leaderboards, no friends, no streaks UI. (Streak counter is fine to compute later from `Attempt`s; not surfaced now.)

**Teacher / parent**
- No second role beyond `OWNER`. No dashboard for non-owners.

**Native mobile / offline**
- Web only. No PWA install prompt yet.
- No offline mode.

**Monetization**
- Free for everyone.
- No subscription, no payment, no Stripe wiring.

**Compliance & infra**
- No GDPR / cookie banners / data export / parental consent flow.
- No analytics / product telemetry tooling.
- No tests written. Test runners can stay default-installed but no tests authored.
- No production deploy automation. Vercel/Railway/Neon wiring is out of scope; production envs come in a later plan.

**Quality bars**
- No load testing, no SLO, no on-call. Single-region, best-effort.

---

## What "done" means for this milestone

All twelve phases in [`status.md`](../status.md) are checked. Specifically:

- `pnpm install && pnpm dev:infra && pnpm db:migrate && pnpm db:seed && pnpm dev` works on a clean clone.
- An `OWNER` can sign in, create a question with LaTeX + an image, publish it, and see it appear in `/practice/matematike`.
- A non-owner user can sign in and complete a 10-question practice session with feedback.
- `docs/status.md` and `.agent/state.yaml` reflect reality.

Anything beyond that is a new milestone, a new plan.

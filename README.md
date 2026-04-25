# Matura AkademiaAS

Web application that helps Kosovo 12th-grade students prepare for **Testi i Maturës**.

Built and operated by [AkademiaAS](https://akademiaas.com) — a private course teaching Math and programming. The MVP focuses on **Matematikë**: practice questions with instant feedback and explanations in Albanian.

> **Working on this repo with an AI agent? Read [`AGENTS.md`](AGENTS.md) first.**

## Status

Current milestone: **MVP scaffold**. See [`docs/status.md`](docs/status.md) for the live tracker.

## Stack at a glance

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| API | NestJS 11 |
| Web | Next.js 15 (App Router) + React 19 + Tailwind v4 + shadcn/ui |
| DB | Postgres 16 + pgvector (Neon in prod) |
| ORM | Prisma 6 |
| Files | Cloudflare R2 (MinIO locally) |
| Cache / queues | Upstash Redis + BullMQ |
| Auth | Firebase Auth (identity) + Postgres (profile + roles) |
| Math rendering | KaTeX + remark-math |
| API contract | OpenAPI generated into `@matura/sdk` |

Full stack rationale: [`docs/architecture/stack.md`](docs/architecture/stack.md).

## Repo layout

```
apps/
├── api/        NestJS — REST + OpenAPI + SSE
└── web/        Next.js — student app + /admin

packages/
├── db/         Prisma schema, client, migrations, seed
├── shared/     Zod schemas, taxonomy, Albanian i18n keys
├── sdk/        Typed API client generated from OpenAPI
└── ui/         Shared shadcn wrappers + KaTeX renderer

content/
├── raw/math/   Source content pushed by owners
└── seed/math/  Generated seed questions

docs/           Product, architecture, ADRs, feature docs
.agent/         Machine-readable agent state
```

## Local development

### Prerequisites

- Node 22 LTS (`.nvmrc`)
- pnpm 9+
- Docker + Docker Compose

### Bootstrap

```bash
pnpm install                # install all workspaces
cp .env.example .env        # fill in Firebase + R2 credentials if you have them
pnpm dev:infra              # postgres + redis + minio
pnpm db:migrate             # apply Prisma migrations
pnpm db:seed                # seed subjects + 50 matematike questions
pnpm dev                    # api on :4000, web on :3000
```

API docs: http://localhost:4000/docs
Web app:  http://localhost:3000

### Common scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run api + web in parallel |
| `pnpm dev:api` | Only NestJS API |
| `pnpm dev:web` | Only Next.js web |
| `pnpm dev:infra` | Bring up Postgres + Redis + MinIO via Docker Compose |
| `pnpm dev:infra:down` | Stop and remove infra containers |
| `pnpm db:migrate` | Apply pending Prisma migrations |
| `pnpm db:reset` | Drop + recreate + migrate + seed |
| `pnpm db:seed` | Run seed scripts (subjects + questions) |
| `pnpm openapi:generate` | Regenerate `@matura/sdk` from the running API |
| `pnpm content:import` | Import raw content from `content/raw/math/` into Postgres |
| `pnpm lint` / `pnpm format` | Lint and format the whole repo |

## Contributing

This repo is owned by AkademiaAS. The four `OWNER` accounts (the teacher + three students) author questions and ship features. There is no external contribution flow yet.

When picking up work, follow the agent workflow in [`AGENTS.md`](AGENTS.md): read `docs/status.md`, pick an open item, update both the markdown tracker and `.agent/state.yaml` as you go.

## License

Proprietary. All rights reserved by AkademiaAS.

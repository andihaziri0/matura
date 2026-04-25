# Stack

Every dependency we run, with the reason. Adding a new dependency requires a new ADR.

## Languages and runtime

| Tool | Why |
|---|---|
| **TypeScript (strict)** | One language across web, api, and shared packages. Strict mode catches the bugs that cost us time. |
| **Node 22 LTS** | Current LTS; native fetch, native test runner if we want it later, stable WebStreams. Pinned in `.nvmrc`. |

## Monorepo

| Tool | Why |
|---|---|
| **pnpm 9+ (workspaces)** | Fastest installer, strictest by default, hoisting that doesn't lie. |
| **Turborepo** | Best caching for our shape (multiple apps + packages). Easy to learn for the three students. |

## Backend (`apps/api`)

| Tool | Why |
|---|---|
| **NestJS 11** | Decorator-driven structure — easy to teach, standard module/controller/service split, clean DI. Industry-standard pattern the students will see in real jobs. |
| **`@nestjs/swagger`** | Auto-generates OpenAPI from controllers + DTOs; powers the typed SDK. |
| **`@nestjs/bullmq`** | Background jobs (content import, future AI generation, future emails) using Redis. |
| **`@nestjs/config`** | Env loading + validation via Zod schemas. |
| **`firebase-admin`** | Verifies Firebase ID tokens server-side, no shared secret needed. |
| **`@matura/db` (Prisma client)** | All DB access. No raw SQL except in migrations / pgvector queries. |
| **`@matura/shared` (Zod)** | Validation for every external input. |
| **`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`** | R2 is S3-compatible; we use the AWS SDK against R2's endpoint. |
| **`ai`** (Vercel AI SDK) | Provider-agnostic LLM client. Wired in `ai` module shell only at MVP. |

## Frontend (`apps/web`)

| Tool | Why |
|---|---|
| **Next.js 15 (App Router)** | React Server Components, streaming, route groups for `(marketing)`/`(app)`/`(admin)`. Vercel-native deploy. |
| **React 19** | Latest stable, native `use()`, Actions in client components when we need them. |
| **Tailwind v4** | Zero-config, CSS-engine performance, `@theme` keeps tokens declarative. |
| **shadcn/ui** | Components live in our repo — readable and editable by both humans and LLMs. |
| **`firebase` (Web SDK)** | Sign-in flows, ID token retrieval, session persistence. |
| **`@matura/sdk`** | The only way the web talks to the API. |
| **`@matura/ui`** | Shared shadcn wrappers + the `<Markdown />` (KaTeX) renderer. |
| **`react-katex` / `katex`** | Math rendering. Static SSR-friendly. |
| **`remark-math` + `rehype-katex`** | Markdown pipeline that recognizes `$...$` and `$$...$$`. |

## Data layer

| Tool | Why |
|---|---|
| **Postgres 16 + `pgvector`** | Boring, proven, future-proof. `pgvector` enabled on day one for free; used later. |
| **Prisma 6** | Type-safe queries, declarative schema, painless migrations. Default ORM for our students' learning. |
| **Neon** (prod) | Serverless Postgres, Frankfurt region, branch-per-PR. |
| **Cloudflare R2** | S3-compatible, zero egress cost — critical for image-heavy content. |
| **Upstash Redis** | Serverless Redis, used as BullMQ broker and rate-limit store. |

## Auth

| Tool | Why |
|---|---|
| **Firebase Auth** | Identity provider only (passwords, OAuth, email verify, reset, rate-limit). |
| **Postgres `User`** | Profile, roles, business data. Linked by `firebaseUid`. |

## Local dev

| Tool | Why |
|---|---|
| **Docker Compose** | One command to run Postgres + Redis + MinIO. Same on every machine. |
| **MinIO** | R2 stand-in locally; same S3 API surface. |

## Tooling

| Tool | Why |
|---|---|
| **ESLint** | Lint TypeScript across the monorepo. Shared config at the root. |
| **Prettier** | Format. No bikeshedding. |
| **`tsx`** | Run TypeScript scripts (seed, importers) without a build step. |
| **`openapi-typescript` + `openapi-fetch`** | Generate the typed SDK from the API's OpenAPI spec; no runtime overhead. |
| **`zod`** | Single source of truth for runtime validation; mirrors Prisma models. |

## Deferred (not installed at MVP)

These are deliberately *not* in the repo. Adding any of them requires a new ADR.

- **Test runners** (Jest/Vitest/Playwright) — see ADR-0009.
- **Analytics** (PostHog, GA, Plausible) — out of scope.
- **Email provider** (Resend/Postmark) — comes when transactional email matters.
- **Sentry / error tracking** — added when production opens.
- **i18next or similar** — Albanian only at MVP, simple key map suffices.
- **State managers** (Zustand, Redux, Jotai) — Server Components + URL state cover MVP needs.
- **Form libraries beyond `react-hook-form`** — to be added in phase 9 if needed.

## Hosting (production, deferred)

Documented for clarity, not wired yet.

- Web → **Vercel** (eu-central / fra1).
- API → **Railway** or **Fly.io** (EU region).
- DB → **Neon** (eu-central, Frankfurt).
- Redis → **Upstash** (eu-west-1 or fra1).
- Files → **Cloudflare R2** (auto).
- Domain → `matura.akademiaas.com`.

Production wiring lands in a future plan, not this scaffold.

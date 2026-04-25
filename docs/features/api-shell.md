# Feature: API shell

The NestJS application skeleton. Lives in `apps/api/`.

## Modules

| Module | Path | Public surface |
|---|---|---|
| `AppConfig` | `src/config/` | Validates env via Zod, exposes `AppConfigService`. |
| `Prisma` | `src/common/prisma/` | Global `PrismaService` injects the `@matura/db` client. |
| `Auth` | `src/common/auth/` | `FirebaseAuthGuard` (global), `RolesGuard`, `@CurrentUser()`, `@Roles()`, `@Public()`. |
| `Health` | `src/modules/health/` | `GET /api/health/live`, `GET /api/health/ready`. |
| `Users` | `src/modules/users/` | `GET /api/users/me`, `PATCH /api/users/me`. |
| `Subjects` | `src/modules/subjects/` | `GET /api/subjects` (public). |
| `Questions` | `src/modules/questions/` | CRUD + `POST /:id/status`. Owner-only writes. |
| `Attempts` | `src/modules/attempts/` | `POST /api/attempts` records and evaluates. |
| `Sessions` | `src/modules/sessions/` | `POST /api/sessions/practice`, `POST /api/sessions/:id/end`. |
| `Media` | `src/modules/media/` | `POST /api/media/presign-image` (owner-only). |
| `Content` | `src/modules/content/` | Empty NestJS module + `importers/cli.ts` for `pnpm content:import`. |
| `Ai` | `src/modules/ai/` | Empty shell (Vercel AI SDK lands here). |
| `Admin` | `src/modules/admin/` | `GET /api/admin/metrics` (owner-only). |

## Auth flow

1. Web sends `Authorization: Bearer <Firebase ID token>`.
2. Global `FirebaseAuthGuard` verifies via `firebase-admin`.
3. The guard upserts a Postgres `User` (linked by `firebaseUid`) and attaches it to the request.
4. `@CurrentUser()` resolves that `User` for any handler.
5. `@Public()` opts a route out (used by `/health/*`, `/subjects`, `/questions` GETs).
6. `@Roles('OWNER')` + `@UseGuards(RolesGuard)` enforces role access.

## Configuration

Env validation happens at boot through `EnvSchema` (`src/config/env.schema.ts`). Missing or malformed variables crash the process with a clear message. See `.env.example` at the repo root for the canonical list.

## OpenAPI

`pnpm openapi:generate` boots the app in-process and writes `packages/sdk/openapi.json`. Swagger UI is available at `http://localhost:4000/docs` while the API runs.

## Observability

Logger is the default Nest logger at MVP. Sentry / structured logs added later — see `docs/architecture/decisions/` for any future ADR.

## Manual smoke checks

After `pnpm dev:infra && pnpm db:migrate && pnpm db:seed && pnpm dev:api`:

- `curl http://localhost:4000/api/health/live` returns `{"status":"ok"}`.
- `curl http://localhost:4000/api/health/ready` returns `{"status":"ok","db":true}`.
- `curl http://localhost:4000/api/subjects` lists `matematike`.
- Authenticated calls require a real Firebase ID token (see `apps/web` for the client flow).

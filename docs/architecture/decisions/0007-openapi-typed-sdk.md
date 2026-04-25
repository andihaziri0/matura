# ADR-0007: OpenAPI-generated typed SDK between API and web

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi

## Context

NestJS and Next.js are separate apps. We need end-to-end type safety: when the API DTO changes, the web should fail to compile until updated.

## Decision

- NestJS auto-generates an **OpenAPI 3 spec** from controller decorators and DTOs (using `@nestjs/swagger`).
- A Turbo task in `apps/api` writes the spec to `packages/sdk/openapi.json` whenever the API builds.
- `packages/sdk` uses **`openapi-typescript`** to derive types and **`openapi-fetch`** as the runtime client.
- `apps/web` consumes the SDK via `createApiClient()` — the only way to call the API.

## Consequences

### Positive
- Single source of truth; no hand-maintained type duplication.
- Zero runtime overhead (`openapi-fetch` is tiny).
- Easy to share the OpenAPI spec with future mobile / CLI / partner integrations.
- Discoverable via `/docs` Swagger UI in dev.

### Negative
- Build-step coupling: web build depends on api build.
- Requires discipline: every controller method must declare its DTOs and `@ApiResponse(...)` to produce a clean spec.

## Alternatives considered

- **tRPC**: see ADR-0002 — fights NestJS conventions.
- **Manual fetch + shared zod schemas**: would force us to reinvent codegen partially; OpenAPI gives us Swagger UI for free as a bonus.
- **GraphQL**: heavier than we need.

## Operational notes

- The SDK package exposes `createApiClient({ getIdToken })` so callers inject the auth provider — Firebase on web, future Expo on mobile.
- Pipeline order: `api#openapi` → `sdk#build` → `web#build`. Defined in `turbo.json`.

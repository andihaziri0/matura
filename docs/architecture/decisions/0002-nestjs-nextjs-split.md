# ADR-0002: Split backend (NestJS) and frontend (Next.js)

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi

## Context

A Next.js-only fullstack architecture (Server Components + Server Actions + Route Handlers) would be the simplest path. The alternative is a separate NestJS API with Next.js as a pure consumer.

## Decision

Use **NestJS 11 as a separate API service** under `apps/api`, and **Next.js 15 as a UI consumer** under `apps/web`. The two communicate over HTTPS using a typed SDK generated from the API's OpenAPI spec.

## Consequences

### Positive
- NestJS modules / DI / guards / decorators give a strong, teachable structure for the three student contributors who will see this pattern in real jobs.
- A future Expo mobile app can reuse the same API.
- Owners can poke the API directly via Swagger, useful for content debugging.
- Server Components in Next.js still work — they just call the API instead of hitting the DB.

### Negative
- Two deployments instead of one (Vercel + Railway).
- Type sync requires the SDK pipeline (ADR-0007).
- Slightly more boilerplate for trivial CRUD.

## Alternatives considered

- **Next.js only**: faster to start, but couples web shell to business logic and complicates a future mobile app.
- **tRPC**: best DX but fights NestJS's decorator/guard model.

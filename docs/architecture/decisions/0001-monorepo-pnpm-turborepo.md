# ADR-0001: Use a pnpm + Turborepo monorepo

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi (operator)

## Context

We have two long-lived apps (`api` NestJS, `web` Next.js) and several shared packages (`db`, `shared`, `sdk`, `ui`). They share types, validation schemas, taxonomy, and a typed API client.

The realistic choices are:

1. Two separate repos with a published npm package for shared code.
2. A single repo with a monorepo tool (pnpm workspaces, npm workspaces, yarn workspaces, Nx, Turborepo).

## Decision

Use a **single monorepo** managed with **pnpm workspaces** and **Turborepo** for task orchestration.

Package namespace: `@matura/*`.

## Consequences

### Positive
- Shared Zod schemas live in one place, used at the API boundary and at form validation in web.
- Atomic changes across api ↔ shared ↔ sdk ↔ web are one PR.
- Turbo caches builds and `tsc` runs across packages, fast local DX.
- The three students learn one workflow.

### Negative
- Slightly more upfront setup than a single Next.js project.
- We must keep package boundaries disciplined or `packages/shared` becomes a dumping ground.

## Alternatives considered

- **Polyrepo + npm publish**: too much friction for four people and a single product.
- **Nx**: more powerful but heavier; better suited to many apps. Overkill at this size.
- **npm/yarn workspaces**: pnpm is faster and stricter; we like the strictness.

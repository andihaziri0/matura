# ADR-0003: Postgres + Prisma, hosted on Neon (prod)

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi

## Context

We need a relational database with vector support (for future semantic search), painless migrations, and a hosted option that keeps us close to Kosovo.

## Decision

- **Database**: Postgres 16 with the `pgvector` extension enabled in the first migration.
- **ORM**: Prisma 6, all DB access through it. No raw SQL except in migrations and pgvector queries.
- **Production hosting**: Neon (Frankfurt / eu-central). Branch-per-PR for preview environments.
- **Local development**: Postgres in Docker Compose (with the pgvector image).

## Consequences

### Positive
- Prisma is the team's existing tool of choice — zero ramp-up.
- Neon's serverless model + branching gives free preview DBs per PR.
- pgvector ready from day one; we never have to migrate it in later under load.

### Negative
- Prisma's mediocre support for pgvector means we'll write a small amount of raw SQL for vector queries (acceptable, isolated).
- Neon's cold starts on the free tier are noticeable; mitigated by pinning a starter plan in production.

## Alternatives considered

- **Supabase Postgres** — see ADR-0004 (rejected).
- **Drizzle ORM** — fine choice; we picked Prisma for team familiarity.
- **MySQL / MongoDB** — worse fit; vector support and JSON ergonomics are weaker.

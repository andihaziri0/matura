# ADR-0006: BullMQ on Upstash Redis for background jobs

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi

## Context

Several jobs must not run inside an HTTP request: bulk content import, image post-processing, future AI explanation generation, future emails, future embedding computation.

## Decision

Use **BullMQ** (via `@nestjs/bullmq`) backed by **Upstash Redis** in production and a local Redis 7 container in dev.

## Consequences

### Positive
- Stays inside our existing stack — no extra SaaS dependency.
- BullMQ has good tooling (Bull Board for inspection, repeatable jobs, rate-limiting, retries).
- Redis is also useful for rate-limiting auth-adjacent endpoints later.

### Negative
- Self-hosted-ish: we have to think about queue scaling and worker placement at production time. Acceptable; we have months before that matters.
- BullMQ pins us to a specific Redis client model.

## Alternatives considered

- **Inngest / Trigger.dev**: better DX, adds an external dependency and pricing surface.
- **DB-backed queues** (e.g., Graphile Worker): great option, but team is more familiar with BullMQ.
- **Cron only**: not enough; we need ad-hoc enqueueing from API calls.

## Operational notes

- One Redis connection from the API, reused for queues and (later) rate-limiting.
- Workers run inside the same NestJS process at MVP. Splitting workers into a separate deploy is a future ADR.

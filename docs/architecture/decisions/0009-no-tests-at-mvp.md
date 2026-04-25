# ADR-0009: No automated tests at MVP

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi

## Context

The team is four people building a product they will personally onboard onto. There are no real users yet. The blockers are content quality and product-market fit, not regression rate.

## Decision

**Do not write tests at MVP.** Specifically:

- No unit tests in `apps/api`.
- No component tests in `apps/web`.
- No integration / e2e tests anywhere.

We keep test runners installable but unused:

- NestJS's default Jest config stays in `apps/api` (it ships with the framework).
- Vitest, Playwright, React Testing Library are **not** added to the dependency graph.

## Consequences

### Positive
- Faster iteration on a moving target.
- Less time teaching three students testing patterns before they understand the domain.
- No test maintenance debt as we refactor the schema and module shapes.

### Negative
- Regressions will be caught manually or by users.
- Once content authors trust the system, every fixed bug should be re-verified by hand. Cost grows with surface.

## When to revisit

Trigger any of the following and write a new ADR superseding this one:

- The product has more than ~50 active students, or
- Content authors have made the same content mistake twice (test the import pipeline), or
- We've shipped two regressions to a feature that previously worked, or
- We start charging money.

## Operational notes

- Manual smoke checks are documented in feature docs (`docs/features/*.md`) — author runs them before publishing.
- Type safety + Zod validation already cover a large class of bugs at the boundaries.

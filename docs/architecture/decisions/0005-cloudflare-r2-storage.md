# ADR-0005: Cloudflare R2 for object storage

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi

## Context

Math content is image-heavy (geometry diagrams, scanned past papers, figures inside questions). We need cheap, fast, S3-compatible storage with CDN reach across the Balkans.

## Decision

Use **Cloudflare R2** as the production object store. Locally, run **MinIO** in Docker Compose with the same S3 API surface.

Access via the AWS SDK (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) configured with R2's endpoint.

## Consequences

### Positive
- **Zero egress fees** — critical for image-heavy content served to mobile users.
- S3-compatible API means we can swap to AWS S3 without code changes if we ever need to.
- Cloudflare's CDN is already global and fast in the Balkans.
- MinIO locally means dev parity is perfect.

### Negative
- Different account / billing relationship than the rest of our stack.
- R2 doesn't have S3's full feature set (some advanced lifecycle rules differ); none of these affect us.

## Alternatives considered

- **AWS S3**: standard, but we'd pay egress for every image view.
- **Supabase Storage**: would have required Supabase overall.
- **Bytea in Postgres**: hard no — bloats the DB and ruins backups.
- **Vercel Blob**: convenient but expensive at scale.

## Operational notes

- Single bucket at MVP: `matura-content`. Subkey conventions: `questions/<questionId>/<imageId>.png`.
- All images are uploaded via presigned PUT URLs — the API issues the URL, the browser uploads directly to R2.
- Buckets are private. Reads are signed (short-TTL GET URLs) at MVP for simplicity. We'll switch to a public bucket + signed URLs only for sensitive content if needed.

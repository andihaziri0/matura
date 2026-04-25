# ADR-0004: Firebase Auth for identity, Postgres for profile

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi

## Context

We need email/password and Google OAuth, email verification, password reset, rate-limiting, and a clear path to mobile sign-in.

The realistic choices are:

1. Roll our own with Passport / Better Auth in NestJS.
2. Use a hosted identity provider (Firebase Auth, Supabase Auth, Clerk, Auth0).

## Decision

Use **Firebase Auth** as the identity provider. The Postgres `User` table holds profile, role, and all business data, linked by `firebaseUid`.

Web obtains a Firebase ID token; NestJS verifies it via `firebase-admin` in a `FirebaseAuthGuard`. A `@CurrentUser()` decorator upserts the local `User` record on first request.

## Consequences

### Positive
- Email verification, password reset, OAuth providers, and auth rate-limiting are free.
- Mobile (Expo) can reuse the same identity later.
- We don't store password hashes — smaller breach blast radius.

### Negative
- Vendor lock-in for passwords specifically: if we leave Firebase, we cannot export hashes; users would need to re-set passwords.
- Two systems to keep in sync (Firebase identity ↔ Postgres profile). The auto-provisioning decorator pays this cost.
- Token revocation is non-trivial (JWT-based). For our threat model (4-owner content app), acceptable.

## Alternatives considered

- **Better Auth in NestJS**: more control, but significantly more code and missing OAuth provider polish.
- **Clerk**: best UX, paid at scale, third-party dependency.
- **Supabase Auth**: would have pushed us toward Supabase overall — rejected (see ADR-0003 + comment in ADR-0001).

## Operational notes

- Custom claims (e.g., `role: OWNER`) are mirrored from Postgres to Firebase when role changes. Useful for short-circuit checks.
- Public keys for token verification are cached by `firebase-admin`; refreshed automatically.

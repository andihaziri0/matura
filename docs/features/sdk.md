# Feature: SDK

The typed API client lives in `packages/sdk/`. It is the only sanctioned way the web app may call the API.

## Pipeline

```
apps/api/src    --(decorators+DTOs)-->   apps/api openapi:generate
                                            ↓
                            packages/sdk/openapi.json
                                            ↓ openapi-typescript
                            packages/sdk/src/generated/schema.d.ts
                                            ↓ openapi-fetch wrapper
                            packages/sdk/src/index.ts
                                            ↓
                            apps/web/src/lib/api/client.ts
```

## Regeneration

```bash
# from repo root
pnpm openapi:generate     # boots NestJS in-process, writes packages/sdk/openapi.json
pnpm sdk:build            # generates packages/sdk/src/generated/schema.d.ts
```

The Turbo task graph encodes the dependency: `@matura/api#openapi:generate` runs before `@matura/sdk#sdk:build` (see `turbo.json`).

## Usage in `apps/web`

```tsx
'use client';
import { getApiClient } from '@/lib/api/client';

export function UseExample() {
  const api = getApiClient();
  // GET /api/subjects — fully typed once the spec is generated
  // const { data, error } = await api.GET('/api/subjects');
  return null;
}
```

## Why

- Single source of truth for request/response shapes. Schema drift fails at compile time.
- Server-Components-friendly: the same client works on the server with no Firebase token (calls go out unauthenticated; public endpoints succeed, private ones get 401).
- Mobile-ready: a future Expo app can consume the same SDK; only the `getIdToken` resolver changes.

## Constraints

- Never hand-roll `fetch()` calls in `apps/web` against the API. If the SDK lacks an endpoint, regenerate it.
- The placeholder `openapi.json` shipped at scaffold time has no paths; the first real run of `pnpm openapi:generate` populates it.

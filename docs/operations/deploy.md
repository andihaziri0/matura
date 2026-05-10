# Production deploy runbook

This is the step-by-step operator runbook for the **Production deploy** milestone (see `docs/status.md`). It walks through provisioning every cloud resource the prod app needs, wiring secrets, hooking up CI/CD, and shipping the first deploy.

The decisions baked into this runbook are locked in [ADR-0010](../architecture/decisions/0010-deploy-topology.md). Read it once before starting; it explains _why_ each provider was chosen.

> **Time budget**: ~2 hours of focused work, mostly clicking through dashboards. Most cloud dashboard sign-ups need an email + a credit card; total cost should stay under €30/month at MVP scale.

> **Order matters**: each section depends on the one before it. Don't skip ahead.

---

## Pre-flight

- [ ] You own the domain `akademiaas.com`.
- [ ] You can edit DNS records for `akademiaas.com` (so we can add `matura.akademiaas.com` and `api.matura.akademiaas.com`).
- [ ] You have a GitHub account with admin rights on the repo.
- [ ] You can pay with a credit card (most providers have free tiers but require a card for verification).

If you don't yet own `akademiaas.com`: register it via any registrar (Cloudflare Registrar is the cheapest and integrates well with the rest of the stack). Wait for it to propagate before continuing.

---

## Section 0 — Rotate the credentials shared in chat (do this FIRST)

The Neon DB password and Upstash Redis token shared in the agent chat on **2026-05-10** are considered compromised. Rotate them before doing anything else.

### Neon

1. Open Neon dashboard → your project → **Roles** → `neondb_owner`.
2. Click **Reset password**. Copy the new pooled and direct URLs.
3. Replace any local `.env` files using the old URL.

### Upstash

1. Open Upstash dashboard → your Redis DB → **Settings**.
2. Click **Reset password** (regenerates the token in the connection URL).
3. Copy the new `rediss://...` URL.

Record the rotation in the **Rotation log** at the bottom of this file.

---

## Section 1 — Cloudflare R2 (object storage)

Used for question images. R2 is S3-compatible; the API talks to it via the `@aws-sdk/client-s3` package.

1. Sign up at [cloudflare.com](https://www.cloudflare.com/) if you don't have an account.
2. Cloudflare dashboard → **R2 Object Storage** → enable (requires a payment method, free tier is generous).
3. Create a bucket:
   - **Name**: `matura-content`
   - **Location hint**: `WEUR` (Western Europe)
4. Generate an API token:
   - **R2 → Manage R2 API Tokens → Create API Token**
   - **Permissions**: "Object Read & Write"
   - **Specify bucket**: `matura-content`
   - **TTL**: forever (no expiry; rotate manually)
   - Save the **Access Key ID**, **Secret Access Key**, and the **endpoint URL** shown after creation. The endpoint looks like `https://<account-id>.r2.cloudflarestorage.com`.
5. Configure public access for the bucket:
   - Bucket → **Settings → Public Access** → enable the **r2.dev subdomain**. Cloudflare gives you a URL like `https://pub-<hash>.r2.dev`. That's your `S3_PUBLIC_BASE_URL` — use it **as-is**, do NOT append `/matura-content`. The hash is already bucket-scoped.
   - (Optional, recommended later: bind a custom subdomain like `https://images.matura.akademiaas.com`. Skip for MVP — `pub-*.r2.dev` works.)

Record these values; you'll paste them into Railway in Section 5:

```
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=<from step 4>
S3_SECRET_ACCESS_KEY=<from step 4>
S3_BUCKET=matura-content
S3_FORCE_PATH_STYLE=false
S3_PUBLIC_BASE_URL=https://pub-<hash>.r2.dev
```

---

## Section 2 — Firebase prod project

Used for auth identity. Keep this **separate** from any dev Firebase project so prod users can't be polluted by dev test accounts.

1. Open [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Project name**: `matura-akademiaas-prod` (the URL slug it picks doesn't matter much).
3. Disable Google Analytics for this project — nothing to track at MVP.
4. Once created: **Build → Authentication → Get started**.
5. Enable sign-in providers:
   - **Email/Password** → enable.
   - **Google** → enable, set the support email.
6. **Project Settings (gear icon) → General → Your apps → Add app → Web (`</>`).**
   - **App nickname**: `matura-web-prod`
   - **Also set up Firebase Hosting**: NO (we use Vercel).
   - Copy the **Firebase config** object. You'll need:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=<...>
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<projectId>.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=<...>
     NEXT_PUBLIC_FIREBASE_APP_ID=<...>
     ```
7. **Project Settings → Service accounts → Generate new private key**.
   - This downloads a JSON file. **Don't commit this anywhere.**
   - Convert it to base64 for env-friendly storage. From your terminal:
     ```bash
     base64 -i ~/Downloads/matura-akademiaas-prod-firebase-adminsdk-xxx.json | tr -d '\n'
     ```
   - That base64 string is your `FIREBASE_SERVICE_ACCOUNT_BASE64`. Save it.
8. **Project Settings → General → Authorized domains** (or **Authentication → Settings → Authorized domains** depending on Firebase UI version):
   - Add `matura.akademiaas.com`
   - Leave `localhost` if it's already there (helps if you ever need to point local dev at the prod project).
   - You'll come back to add the Vercel preview wildcard in Section 4 if needed.
9. **Authentication → Settings → User actions** → confirm "Email enumeration protection" is ON (default in newer projects).

> Cost: free unless you exceed Firebase Auth's Spark tier limits (50k MAU). Won't happen at MVP.

---

## Section 3 — GitHub repo prep

Make sure `main` is ready to be the source of truth for prod.

1. The repo already exists. Confirm `main` is the default branch.
2. Add a branch protection rule (Settings → Branches → Add rule):
   - **Branch name pattern**: `main`
   - **Require a pull request before merging** → on
   - **Require status checks to pass** → on (we'll add them in Section 7)
   - **Do not allow bypassing** → on
3. Confirm the repo can be reached by Vercel and Railway (it should be — they install GitHub Apps which we'll do in their respective sections).

---

## Section 4 — Vercel (web)

1. Sign up at [vercel.com](https://vercel.com) using your GitHub account.
2. **Add New → Project → Import Git Repository → matura**.
3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `apps/web` (click **Edit**, type `apps/web`).
   - **Build & Output Settings**: leave default — `apps/web/vercel.json` already overrides `installCommand`, `buildCommand`, `outputDirectory` and `regions`.
   - **Node.js Version**: 22.x (Settings → General → Node.js Version after first deploy if needed).
4. **Environment Variables** (set for **Production** AND **Preview**):

   ```
   NEXT_PUBLIC_API_URL=https://api.matura.akademiaas.com
   NEXT_PUBLIC_FIREBASE_API_KEY=<from Section 2>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<from Section 2>
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<from Section 2>
   NEXT_PUBLIC_FIREBASE_APP_ID=<from Section 2>
   ```
5. Click **Deploy**. The first deploy will go to a `*.vercel.app` URL — that's expected. We'll point the real domain at it once Railway is up too.
6. Settings → Domains → add `matura.akademiaas.com`. Vercel will give you a CNAME / A record to add at your DNS provider:
   - Add the CNAME / A as instructed at your DNS provider for `akademiaas.com`.
   - Wait until the domain shows "Valid Configuration" (usually < 5 min, can be up to ~30 min).
7. Back in Firebase (Section 2.8): authorized domains → also add the Vercel preview wildcard if you plan to test auth on previews. Firebase doesn't support `*.vercel.app` directly — you'll need to add specific preview URLs as needed, or skip auth on previews.

---

## Section 5 — Railway (API)

1. Sign up at [railway.app](https://railway.app) using your GitHub account.
2. **New Project → Deploy from GitHub repo → matura**.
3. **Configure**:
   - **Service Name**: `matura-api`
   - **Root Directory**: `apps/api`
   - Railway should auto-detect `apps/api/railway.toml` and use the Dockerfile build.
4. **Variables** tab — paste in everything below. Use the values from previous sections:

   ```
   NODE_ENV=production
   API_PORT=${{PORT}}
   WEB_ORIGIN=https://matura.akademiaas.com,https://*.vercel.app

   DATABASE_URL=<your Neon POOLED URL>
   REDIS_URL=<your Upstash rediss:// URL>

   S3_ENDPOINT=<from Section 1>
   S3_REGION=auto
   S3_ACCESS_KEY_ID=<from Section 1>
   S3_SECRET_ACCESS_KEY=<from Section 1>
   S3_BUCKET=matura-content
   S3_FORCE_PATH_STYLE=false
   S3_PUBLIC_BASE_URL=<from Section 1>

   FIREBASE_SERVICE_ACCOUNT_BASE64=<from Section 2.7>
   ```

   Notes:
   - `${{PORT}}` is Railway's reference syntax. It resolves to whatever port Railway assigns at runtime. The API's env loader treats `PORT` as a fallback for `API_PORT`, so even if you forget this, it'll still bind correctly — but setting it explicitly is clearest.
   - `DATABASE_URL` should be the **pooled** URL (the one with `-pooler` in the host). The `-pooler` URL goes through Neon's PgBouncer; the direct URL is for migrations only when running locally.
   - `WEB_ORIGIN` is comma-separated. Add `https://staging.<x>.akademiaas.com` etc. later if needed.
5. Click **Deploy**. The first build runs the multi-stage Dockerfile, runs `prisma migrate deploy`, then starts the API. First build is slow (~5 min); subsequent builds are faster due to layer cache.
6. Watch **Deploys → Build Logs**. Common failures:
   - **Migration failure** → check the deploy log for the SQL error. Often a missing pgvector extension; fix in Neon (Section 6 below) and redeploy.
   - **Healthcheck failure** → API didn't bind on time, or `/api/health/ready` returned non-200. Check **runtime logs**.
7. Settings → Networking → **Generate Domain**. Railway gives you `<service>.up.railway.app`. Verify the API responds: `curl https://<service>.up.railway.app/api/health/ready` should return `{"status":"ok","db":true}`.
8. **Custom Domain**: add `api.matura.akademiaas.com`. Railway gives you a CNAME target. Add it to your DNS. Wait for SSL cert to provision (~5 min).

---

## Section 6 — Neon: enable pgvector + verify migrations

Prisma's first migration tries to enable the `vector` extension. On a brand-new Neon DB, that should "just work" because Neon enables `pgvector` automatically. But if Railway's first deploy fails on a missing extension, do this:

1. Open Neon dashboard → your project → **SQL Editor**.
2. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Redeploy on Railway.

To inspect prod data:
- Use Neon's SQL Editor for ad-hoc queries.
- Or, on your local machine, set `DATABASE_URL` to the Neon **direct** URL in `.env.production.local` (gitignored) and run `pnpm db:studio`.

> **Migration safety**: every push to `main` runs `prisma migrate deploy` on container boot. If a migration is broken, the API won't start, Railway's healthcheck times out, and the deploy is marked failed — but the previous good deploy keeps serving. This is the right failure mode at single-instance scale (see ADR-0010).

---

## Section 7 — GitHub Actions CI (covered in Phase D5)

Set up in a separate phase. CI does not run yet.

When Phase D5 lands:
- `.github/workflows/ci.yml` runs on every PR: install + lint + typecheck + Prisma validate + OpenAPI drift check.
- Vercel deploys automatically on `main` (no extra action needed — its GitHub integration handles it).
- Railway deploys automatically on `main` (same).

---

## Section 8 — Sentry

The SDK is already wired into both apps (Phase D6 code is committed). It's a no-op until you set the DSN env vars below.

1. Sign up at [sentry.io](https://sentry.io). When choosing the data region, pick **European Union (EU)**. This is locked once chosen — Sentry treats EU and US as separate accounts.
2. Create two projects under your org:
   - **matura-api**, platform: **Node.js → NestJS**.
   - **matura-web**, platform: **JavaScript → Next.js**.
3. For each project, copy the DSN: **Settings → Projects → \<project\> → Client Keys (DSN)**.
4. **In Railway** (matura-api → Variables) add:
   ```
   SENTRY_DSN=<from matura-api>
   SENTRY_ENVIRONMENT=production
   SENTRY_TRACES_SAMPLE_RATE=0.1
   ```
5. **In Vercel** (matura-web → Settings → Environment Variables, both Production AND Preview) add:
   ```
   NEXT_PUBLIC_SENTRY_DSN=<from matura-web>
   NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
   ```
6. **Source maps** (optional but recommended). In Sentry → Settings → Auth Tokens → **Create New Token** with `project:releases` scope. Then in Vercel add (Environment: Production only):
   ```
   SENTRY_AUTH_TOKEN=<the token>
   SENTRY_ORG=<your-org-slug>
   SENTRY_PROJECT=matura-web
   ```
   Without these, runtime error tracking still works but stack traces stay minified. Add them whenever you have time.
7. Trigger a redeploy on Vercel and Railway. After the first prod request, errors will start appearing in the Sentry dashboard.

### UptimeRobot

1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free tier covers what we need).
2. **Add New Monitor**:
   - **Type**: HTTPS
   - **URL**: `https://api.matura.akademiaas.com/api/health/ready`
   - **Interval**: 5 minutes
   - **Alert contacts**: your email + (optionally) a Telegram or Slack webhook.
3. Optionally add a second monitor for `https://matura.akademiaas.com` (the web).

---

## Section 9 — DNS configuration summary

Once Vercel and Railway both have custom domains pending verification, your DNS provider needs:

| Type  | Name                   | Value                                    |
|-------|------------------------|------------------------------------------|
| CNAME | `matura`               | `cname.vercel-dns.com` (Vercel will tell you the exact value) |
| CNAME | `api.matura`           | `<service>.up.railway.app` (Railway will tell you) |

If you're using Cloudflare DNS, set both records to **DNS only** (gray cloud) — both Vercel and Railway issue their own SSL certs.

---

## Section 10 — Smoke test (Phase D7)

After all the above, run through this checklist:

- [ ] `https://matura.akademiaas.com` loads.
- [ ] `https://api.matura.akademiaas.com/api/health/ready` returns `{"status":"ok","db":true}`.
- [ ] Sign-in with email + password works (use your prod Firebase project).
- [ ] Sign in as the OWNER account → `/admin/questions/new` → create one Matematikë question with LaTeX + an image.
- [ ] Publish it.
- [ ] Sign out, sign in as a different student account, run `/practice/matematike` — get exactly 1 question (the one you just published, since the seed wasn't loaded against the prod DB; that's expected) and complete the flow.
- [ ] Optionally: load the seed against prod by running `pnpm db:seed` locally with `DATABASE_URL` pointing at the Neon **direct** URL.

If everything passes:
- [ ] Update `docs/status.md`: mark Phase D7 done, milestone status `Production deploy → DONE`.
- [ ] Update `.agent/state.yaml` to match.
- [ ] Update `AGENTS.md` if any new workflow changed.

---

## Rotation log

Track every credential rotation here. Format: `YYYY-MM-DD  | provider | reason`.

| Date       | Provider | What was rotated                | Reason                          |
|------------|----------|--------------------------------|---------------------------------|
| 2026-05-10 | Neon     | `neondb_owner` password         | Exposed in agent chat transcript |
| 2026-05-10 | Upstash  | Redis connection token          | Exposed in agent chat transcript |

---

## Cost expectations (MVP scale: <50 users)

| Provider     | Plan                         | Monthly  |
|--------------|------------------------------|----------|
| Vercel       | Hobby (free) or Pro          | €0–€20   |
| Railway      | Hobby                         | ~€5–€10  |
| Neon         | Launch (paid, no scale-to-zero) | ~€19    |
| Upstash      | Pay-as-you-go                | ~€0–€5   |
| Cloudflare R2| Pay-as-you-go                | ~€0–€1   |
| Firebase Auth| Spark (free)                  | €0       |
| Sentry       | Developer (free)              | €0       |
| Domain       | Cloudflare Registrar          | ~€10/yr  |
| **Total**    |                              | **~€25–€35/month** |

If costs creep above ~€100/month, that's a trigger to revisit ADR-0010.

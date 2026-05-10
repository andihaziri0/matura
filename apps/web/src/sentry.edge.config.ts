/**
 * Sentry — Next.js edge runtime (middleware, edge route handlers).
 *
 * No-op when SENTRY_DSN is unset.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production',
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE) ?? 0.1,
    sendDefaultPii: false,
  });
}

function parseSampleRate(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  return undefined;
}

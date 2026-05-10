/**
 * Sentry — Next.js server runtime (Node).
 *
 * No-op when SENTRY_DSN is unset. Local dev and CI stay quiet.
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

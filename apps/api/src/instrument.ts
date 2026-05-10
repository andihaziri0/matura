/**
 * Sentry instrumentation for the API.
 *
 * MUST be imported as the very first thing in main.ts (before NestJS, before
 * @nestjs/* packages, before everything). The Sentry SDK installs OpenTelemetry
 * hooks at module-load time; later imports won't be auto-instrumented.
 *
 * The SDK is a no-op when SENTRY_DSN is unset — local dev and CI stay quiet.
 */
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production',
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE) ?? 0.1,

    // Trim payload — we don't want full request bodies (might contain answers
    // a student is mid-typing; Albanian explanations; etc.).
    sendDefaultPii: false,

    // Filter out low-signal events.
    ignoreErrors: [
      // Health-check noise; the / and /api/health/* paths are hammered by Railway.
      /^Cannot GET \/(api\/)?health/,
    ],
  });
}

function parseSampleRate(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  return undefined;
}

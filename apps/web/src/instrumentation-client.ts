/**
 * Sentry — Next.js browser runtime.
 *
 * Auto-loaded by Next.js for client-side bundle. No-op without
 * NEXT_PUBLIC_SENTRY_DSN.
 *
 * Note: client-side DSN must be public (Vercel inlines NEXT_PUBLIC_* into the
 * bundle). That's fine — Sentry DSNs are designed to be public and protected
 * by the SDK's rate limiting + your project's org-level controls.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production',
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    sendDefaultPii: false,

    // Replays are off by default — we don't have user consent for session
    // recording yet. Enable later if/when we add a privacy notice.
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

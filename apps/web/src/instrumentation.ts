/**
 * Next.js instrumentation entry point. Auto-loaded by Next.js at server startup.
 * Routes initialization to the right Sentry config based on which runtime is
 * booting (Node vs Edge).
 */
import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;

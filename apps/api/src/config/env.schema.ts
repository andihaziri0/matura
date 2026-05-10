import { z } from 'zod';

/**
 * Comma-separated WEB_ORIGIN entries.
 *
 * Each entry is one of:
 *  - an exact origin like `https://matura.akademiaas.com`
 *  - a wildcard like `https://*.vercel.app` (one wildcard per entry; matches any
 *    DNS label in that position).
 *
 * Parsed at boot into a list of `string | RegExp`, consumed by the CORS layer.
 */
const WebOriginSchema = z
  .string()
  .min(1)
  .default('http://localhost:3000');

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: WebOriginSchema,

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  S3_PUBLIC_BASE_URL: z.string().url(),

  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),

  // Sentry — all optional. With no DSN, Sentry is a no-op (the init call is
  // skipped entirely; no overhead, no console noise).
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  // Railway / Heroku / Cloud Run convention: the platform sets PORT.
  // Honour it as a fallback for API_PORT so the platform "just works"
  // without forcing the operator to add a custom env mapping.
  const merged: NodeJS.ProcessEnv = {
    ...source,
    API_PORT: source.API_PORT ?? source.PORT,
  };

  const parsed = EnvSchema.safeParse(merged);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

/**
 * Parse a comma-separated WEB_ORIGIN value into the form Nest's enableCors expects:
 * an array of exact strings + wildcard regexes.
 *
 * Empty / whitespace entries are ignored. Wildcards are anchored to the full
 * origin (scheme + host + optional port) so e.g. `https://*.vercel.app` does
 * NOT match `http://evil.com/?x=https://foo.vercel.app`.
 */
export function parseWebOrigins(raw: string): Array<string | RegExp> {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      if (!entry.includes('*')) return entry;
      // Build a regex from the wildcard pattern. Escape every char except `*`,
      // then replace `*` with a "one DNS label" pattern.
      const escaped = entry
        .split('*')
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('[a-z0-9-]+');
      return new RegExp(`^${escaped}$`, 'i');
    });
}

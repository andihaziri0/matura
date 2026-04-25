import createClient, { type Client, type Middleware } from 'openapi-fetch';
import type { paths } from './generated/schema.js';

export type { paths } from './generated/schema.js';

export type ApiClient = Client<paths>;

export interface CreateApiClientOptions {
  /**
   * Base URL of the NestJS API, including the `/api` prefix or not — the SDK assumes the
   * spec already encodes it. Defaults to `process.env.NEXT_PUBLIC_API_URL` then `http://localhost:4000`.
   */
  baseUrl?: string;
  /**
   * Resolves the current Firebase ID token. Called on every request; return null when unauthenticated.
   */
  getIdToken?: () => Promise<string | null> | string | null;
  /**
   * Extra headers to attach to every request.
   */
  defaultHeaders?: Record<string, string>;
}

export function createApiClient(options: CreateApiClientOptions = {}): ApiClient {
  const baseUrl =
    options.baseUrl ??
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ??
    'http://localhost:4000';

  const client = createClient<paths>({
    baseUrl,
    headers: options.defaultHeaders,
  });

  if (options.getIdToken) {
    const auth: Middleware = {
      async onRequest({ request }) {
        const token = await options.getIdToken!();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
        return request;
      },
    };
    client.use(auth);
  }

  return client;
}

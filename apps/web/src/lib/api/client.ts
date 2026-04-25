'use client';

import { createApiClient, type ApiClient } from '@matura/sdk';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';

let cached: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (cached) return cached;
  cached = createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    getIdToken: async () => {
      if (!isFirebaseConfigured()) return null;
      const auth = getFirebaseAuth();
      const u = auth.currentUser;
      if (!u) return null;
      return u.getIdToken();
    },
  });
  return cached;
}

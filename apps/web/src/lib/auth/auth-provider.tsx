'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase/client';
import type { PublicUser } from '@matura/shared';

interface AuthState {
  loading: boolean;
  firebaseUser: FirebaseUser | null;
  profile: PublicUser | null;
  getIdToken: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!isFirebaseConfigured()) return null;
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    if (!u) return null;
    return u.getIdToken();
  }, []);

  const fetchProfile = useCallback(async (): Promise<void> => {
    const token = await getIdToken();
    if (!token) {
      setProfile(null);
      return;
    }
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const data = (await res.json()) as PublicUser;
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [fetchProfile]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      firebaseUser,
      profile,
      getIdToken,
      refreshProfile: fetchProfile,
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signUpWithEmail: async (email, password) => {
        await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signInWithGoogle: async () => {
        await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      },
      signOut: async () => {
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [loading, firebaseUser, profile, getIdToken, fetchProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

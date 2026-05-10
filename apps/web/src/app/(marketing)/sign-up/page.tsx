'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';
import {
  AuthShell,
  Divider,
  ErrorBanner,
  Field,
  GoogleIcon,
  googleBtnCls,
  inputCls,
  primaryBtnCls,
} from '@/components/auth-form';

export default function SignUpPage(): React.ReactElement {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      router.push('/practice/matematike');
    } catch {
      setError(Sq.sq.errors.unknown);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/practice/matematike');
    } catch {
      setError(Sq.sq.errors.unknown);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
        {Sq.sq.auth.signUpTitle}
      </h1>
      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Field label={Sq.sq.auth.email}>
          <input
            type="email"
            required
            placeholder={Sq.sq.auth.emailPlaceholder}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={Sq.sq.auth.password}>
          <input
            type="password"
            required
            minLength={6}
            placeholder={Sq.sq.auth.passwordHint}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </Field>
        {error && <ErrorBanner message={error} />}
        <button type="submit" disabled={loading} className={primaryBtnCls}>
          {loading ? Sq.sq.common.loading : Sq.sq.nav.signUp}
        </button>
      </form>

      <Divider />

      <button type="button" onClick={handleGoogle} disabled={loading} className={googleBtnCls}>
        <GoogleIcon />
        {Sq.sq.auth.signInWithGoogle}
      </button>

      <p className="mt-7 text-center text-sm text-[var(--color-fg-muted)]">
        {Sq.sq.auth.haveAccount}{' '}
        <Link href="/sign-in" className="font-medium text-[var(--color-brand)] hover:underline">
          {Sq.sq.nav.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}

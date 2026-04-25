'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';

export default function SignUpPage(): JSX.Element {
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

  return (
    <section className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold">{Sq.sq.auth.signUpTitle}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          placeholder={Sq.sq.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder={Sq.sq.auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2"
        />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[var(--color-accent)] px-3 py-2 text-[var(--color-accent-fg)] disabled:opacity-50"
        >
          {Sq.sq.nav.signUp}
        </button>
      </form>
      <button
        type="button"
        onClick={() => signInWithGoogle().then(() => router.push('/practice/matematike'))}
        disabled={loading}
        className="mt-3 w-full rounded-md border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
      >
        {Sq.sq.auth.signInWithGoogle}
      </button>
      <p className="mt-6 text-sm text-[var(--color-fg-muted)]">
        {Sq.sq.auth.haveAccount}{' '}
        <Link href="/sign-in" className="underline">
          {Sq.sq.nav.signIn}
        </Link>
      </p>
    </section>
  );
}

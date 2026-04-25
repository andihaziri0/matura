'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const { loading, firebaseUser, profile, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace('/sign-in');
      return;
    }
    if (profile && profile.role !== 'OWNER') {
      router.replace('/practice/matematike');
    }
  }, [loading, firebaseUser, profile, router]);

  if (loading || !firebaseUser || (profile && profile.role !== 'OWNER')) {
    return <div className="p-10 text-center">{Sq.sq.common.loading}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link href="/admin" className="font-semibold tracking-tight">
            {Sq.sq.admin.title}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/questions" className="hover:underline">
              {Sq.sq.admin.questions.title}
            </Link>
            <Link href="/admin/metrics" className="hover:underline">
              {Sq.sq.admin.metrics.title}
            </Link>
            <Link href="/practice/matematike" className="text-[var(--color-fg-muted)] hover:underline">
              {Sq.sq.nav.practice}
            </Link>
            <button
              type="button"
              onClick={() => signOut().then(() => router.push('/'))}
              className="text-[var(--color-fg-muted)] hover:underline"
            >
              {Sq.sq.nav.signOut}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-6xl px-6 py-8 w-full">{children}</main>
    </div>
  );
}

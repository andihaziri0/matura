'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const { loading, firebaseUser, profile, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace('/sign-in');
    }
  }, [loading, firebaseUser, router]);

  if (loading) {
    return <div className="p-10 text-center">{Sq.sq.common.loading}</div>;
  }
  if (!firebaseUser) {
    return <div className="p-10 text-center">{Sq.sq.common.loading}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link href="/practice/matematike" className="font-semibold tracking-tight">
            {Sq.sq.app.name}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/practice/matematike" className="hover:underline">
              {Sq.sq.nav.practice}
            </Link>
            {profile?.role === 'OWNER' && (
              <Link href="/admin/questions" className="hover:underline">
                {Sq.sq.nav.admin}
              </Link>
            )}
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
      <main className="flex-1">{children}</main>
    </div>
  );
}

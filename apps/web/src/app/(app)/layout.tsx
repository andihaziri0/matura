'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';
import { Logo } from '@/components/logo';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { loading, firebaseUser, profile, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace('/sign-in');
    }
  }, [loading, firebaseUser, router]);

  if (loading || !firebaseUser) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/70">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="sm" href="/practice/matematike" />

          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <NavLink href="/practice/matematike">{Sq.sq.nav.practice}</NavLink>
            {profile?.role === 'OWNER' && <NavLink href="/admin/questions">{Sq.sq.nav.admin}</NavLink>}
            <button
              type="button"
              onClick={() => signOut().then(() => router.push('/'))}
              className="ml-1 px-3 py-2 rounded-md text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg)] transition-colors"
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }): React.ReactElement {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-[var(--color-fg)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] transition-colors"
    >
      {children}
    </Link>
  );
}

function FullPageLoader(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center text-[var(--color-fg-muted)]">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
        {Sq.sq.common.loading}
      </div>
    </div>
  );
}

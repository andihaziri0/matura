'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/cn';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { loading, firebaseUser, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-fg-muted)]">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
          {Sq.sq.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/70">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="sm" href="/admin" />
            <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)]">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <AdminLink href="/admin/questions" active={pathname?.startsWith('/admin/questions') ?? false}>
              {Sq.sq.admin.questions.title}
            </AdminLink>
            <AdminLink href="/admin/metrics" active={pathname === '/admin/metrics'}>
              {Sq.sq.admin.metrics.title}
            </AdminLink>
            <Link
              href="/practice/matematike"
              className="hidden sm:inline-flex px-3 py-2 rounded-md text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg)] transition-colors"
            >
              {Sq.sq.nav.practice}
            </Link>
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
      <main className="flex-1 mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 w-full">{children}</main>
    </div>
  );
}

function AdminLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-2 rounded-md transition-colors',
        active
          ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand)] font-semibold'
          : 'text-[var(--color-fg)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]',
      )}
    >
      {children}
    </Link>
  );
}

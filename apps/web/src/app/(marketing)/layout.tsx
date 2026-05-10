import React from 'react';
import Link from 'next/link';
import { Sq } from '@matura/shared';
import { Logo } from '@/components/logo';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/70">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="sm" priority />
          <nav className="flex items-center gap-1 sm:gap-3 text-sm">
            <Link
              href="/practice/matematike"
              className="hidden sm:inline-flex px-3 py-2 rounded-md text-[var(--color-fg)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] transition-colors"
            >
              {Sq.sq.nav.practice}
            </Link>
            <Link
              href="/sign-in"
              className="px-3 py-2 rounded-md text-[var(--color-fg)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] transition-colors"
            >
              {Sq.sq.nav.signIn}
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-md bg-[var(--color-brand)] px-3.5 py-2 font-medium text-[var(--color-brand-fg)] shadow-sm hover:bg-[var(--color-brand-strong)] transition-colors"
            >
              {Sq.sq.nav.signUp}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3 text-sm">
          <div className="sm:col-span-2">
            <Logo size="sm" />
            <p className="mt-3 max-w-md text-[var(--color-fg-muted)]">
              {Sq.sq.marketing.footerAbout}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/sign-in" className="text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]">
              {Sq.sq.nav.signIn}
            </Link>
            <Link href="/sign-up" className="text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]">
              {Sq.sq.nav.signUp}
            </Link>
            <Link
              href="/practice/matematike"
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]"
            >
              {Sq.sq.nav.practice}
            </Link>
          </div>
        </div>
        <div className="border-t border-[var(--color-border)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-[var(--color-fg-muted)] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} AkademiaAS</span>
            <span>{Sq.sq.marketing.footerRights}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

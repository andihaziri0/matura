import React from 'react';
import Link from 'next/link';
import { Sq } from '@matura/shared';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            {Sq.sq.app.name}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/sign-in" className="hover:underline">
              {Sq.sq.nav.signIn}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[var(--color-accent-fg)] hover:opacity-90"
            >
              {Sq.sq.nav.signUp}
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--color-border)] py-6 text-sm text-[var(--color-fg-muted)]">
        <div className="mx-auto max-w-6xl px-6">© AkademiaAS</div>
      </footer>
    </div>
  );
}

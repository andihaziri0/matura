import React from 'react';
import Link from 'next/link';
import { Sq } from '@matura/shared';

export default function HomePage(): React.ReactElement {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{Sq.sq.app.name}</h1>
      <p className="mt-4 text-lg text-[var(--color-fg-muted)]">{Sq.sq.app.tagline}</p>
      <div className="mt-10 flex items-center justify-center gap-3">
        <Link
          href="/practice/matematike"
          className="rounded-md bg-[var(--color-accent)] px-5 py-2.5 text-[var(--color-accent-fg)] hover:opacity-90"
        >
          Fillo me Matematikë
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-[var(--color-border)] px-5 py-2.5 hover:bg-[var(--color-bg-elevated)]"
        >
          {Sq.sq.nav.signIn}
        </Link>
      </div>
    </section>
  );
}

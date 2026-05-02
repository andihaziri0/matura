import React from 'react';
import Link from 'next/link';
import { Sq } from '@matura/shared';

export default function AdminHomePage(): React.ReactElement {
  return (
    <section>
      <h1 className="text-2xl font-semibold">{Sq.sq.admin.title}</h1>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/questions"
          className="rounded-lg border border-[var(--color-border)] p-5 hover:bg-[var(--color-bg-elevated)]"
        >
          <h2 className="font-medium">{Sq.sq.admin.questions.title}</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {Sq.sq.admin.questions.list}
          </p>
        </Link>
        <Link
          href="/admin/metrics"
          className="rounded-lg border border-[var(--color-border)] p-5 hover:bg-[var(--color-bg-elevated)]"
        >
          <h2 className="font-medium">{Sq.sq.admin.metrics.title}</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {Sq.sq.admin.metrics.users} • {Sq.sq.admin.metrics.questions}
          </p>
        </Link>
      </div>
    </section>
  );
}

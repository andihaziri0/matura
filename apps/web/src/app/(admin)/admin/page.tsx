import React from 'react';
import Link from 'next/link';
import { Sq } from '@matura/shared';
import { ArrowRight, BookOpen, BarChart3 } from 'lucide-react';

export default function AdminHomePage(): React.ReactElement {
  return (
    <section>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{Sq.sq.admin.title}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">
        {Sq.sq.admin.questions.list} • {Sq.sq.admin.metrics.title}
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminCard
          href="/admin/questions"
          icon={<BookOpen className="h-5 w-5" aria-hidden />}
          title={Sq.sq.admin.questions.title}
          body={Sq.sq.admin.questions.list}
        />
        <AdminCard
          href="/admin/metrics"
          icon={<BarChart3 className="h-5 w-5" aria-hidden />}
          title={Sq.sq.admin.metrics.title}
          body={`${Sq.sq.admin.metrics.users} • ${Sq.sq.admin.metrics.questions}`}
        />
      </div>
    </section>
  );
}

function AdminCard({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-brand)]/30"
    >
      <div className="flex items-start gap-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold flex items-center gap-1.5">
            {title}
            <ArrowRight className="h-4 w-4 text-[var(--color-fg-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-brand)]" aria-hidden />
          </h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{body}</p>
        </div>
      </div>
    </Link>
  );
}

import React from 'react';
import Link from 'next/link';
import { Sq } from '@matura/shared';
import { QuestionsList } from './questions-list';

export default function AdminQuestionsPage(): React.ReactElement {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {Sq.sq.admin.questions.list}
        </h1>
        <Link
          href="/admin/questions/new"
          className="inline-flex items-center justify-center rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-fg)] shadow-sm transition hover:bg-[var(--color-brand-strong)]"
        >
          {Sq.sq.admin.questions.new}
        </Link>
      </div>
      <div className="mt-6">
        <QuestionsList />
      </div>
    </section>
  );
}

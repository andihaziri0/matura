import React from 'react';
import Link from 'next/link';
import { Sq } from '@matura/shared';
import { QuestionsList } from './questions-list';

export default function AdminQuestionsPage(): React.ReactElement {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{Sq.sq.admin.questions.list}</h1>
        <Link
          href="/admin/questions/new"
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-[var(--color-accent-fg)] hover:opacity-90"
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

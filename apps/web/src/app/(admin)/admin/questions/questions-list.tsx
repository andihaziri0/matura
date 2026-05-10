'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';
import { cn } from '@/lib/cn';

interface Item {
  id: string;
  topicPath: string;
  difficulty: number;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  promptMd: string;
  updatedAt: string;
  kind: 'MCQ' | 'SHORT' | 'LONG';
}

export function QuestionsList(): React.ReactElement {
  const { getIdToken } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = await getIdToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        const res = await fetch(`${apiBase}/api/questions?limit=50`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!res.ok) {
          setError(Sq.sq.errors.unknown);
          return;
        }
        const data = (await res.json()) as { items: Item[] };
        setItems(data.items);
      } catch {
        setError(Sq.sq.errors.network);
      }
    })();
  }, [getIdToken]);

  if (error)
    return (
      <p className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
        {error}
      </p>
    );
  if (!items)
    return (
      <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
        {[0, 1, 2].map((i) => (
          <li key={i} className="p-4 animate-pulse flex items-center gap-3">
            <div className="h-3 w-1/3 rounded bg-[var(--color-border)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--color-border)]" />
          </li>
        ))}
      </ul>
    );
  if (items.length === 0)
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-[var(--color-fg-muted)]">
        {Sq.sq.practice.noQuestions}
      </p>
    );

  return (
    <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
      {items.map((q) => (
        <li
          key={q.id}
          className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-[var(--color-bg)] transition-colors"
        >
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
              {q.topicPath} • {Sq.sq.kind[q.kind]} • {Sq.sq.question.difficulty}: {q.difficulty}
            </div>
            <div className="mt-1 truncate font-medium">{q.promptMd.slice(0, 120)}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={q.status} />
            <Link
              href={`/admin/questions/${q.id}`}
              className="text-sm font-medium text-[var(--color-brand)] hover:underline"
            >
              {Sq.sq.common.edit}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: Item['status'] }): React.ReactElement {
  const styles: Record<Item['status'], string> = {
    DRAFT: 'bg-[var(--color-border)] text-[var(--color-fg-muted)]',
    REVIEW: 'bg-amber-100 text-amber-800',
    PUBLISHED: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        styles[status],
      )}
    >
      {Sq.sq.status[status]}
    </span>
  );
}

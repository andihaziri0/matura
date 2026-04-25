'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';

interface Item {
  id: string;
  topicPath: string;
  difficulty: number;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  promptMd: string;
  updatedAt: string;
  kind: 'MCQ' | 'SHORT' | 'LONG';
}

export function QuestionsList(): JSX.Element {
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

  if (error) return <p className="text-[var(--color-danger)]">{error}</p>;
  if (!items) return <p>{Sq.sq.common.loading}</p>;
  if (items.length === 0)
    return <p className="text-[var(--color-fg-muted)]">{Sq.sq.practice.noQuestions}</p>;

  return (
    <ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
      {items.map((q) => (
        <li key={q.id} className="p-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm text-[var(--color-fg-muted)]">
              {q.topicPath} • {Sq.sq.kind[q.kind]} • {Sq.sq.question.difficulty}: {q.difficulty}
            </div>
            <div className="truncate font-medium">{q.promptMd.slice(0, 120)}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase rounded-full border border-[var(--color-border)] px-2 py-0.5">
              {Sq.sq.status[q.status]}
            </span>
            <Link
              href={`/admin/questions/${q.id}`}
              className="text-sm underline"
            >
              {Sq.sq.common.edit}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

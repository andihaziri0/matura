'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';

interface Metrics {
  users: number;
  questions: { total: number; published: number; withFullQuestionImage: number };
  attempts: { total: number; last7d: number };
  newUsersLast7d: number;
}

export default function AdminMetricsPage(): React.ReactElement {
  const { getIdToken } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = await getIdToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        const res = await fetch(`${apiBase}/api/admin/metrics`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!res.ok) {
          setError(Sq.sq.errors.unknown);
          return;
        }
        setMetrics((await res.json()) as Metrics);
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
  if (!metrics)
    return (
      <section>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{Sq.sq.admin.metrics.title}</h1>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 animate-pulse h-24"
            />
          ))}
        </div>
      </section>
    );

  return (
    <section>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{Sq.sq.admin.metrics.title}</h1>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Stat label={Sq.sq.admin.metrics.users} value={metrics.users} />
        <Stat label={Sq.sq.admin.metrics.newUsersLast7d} value={metrics.newUsersLast7d} />
        <Stat
          label={Sq.sq.admin.metrics.questions}
          value={`${metrics.questions.published} / ${metrics.questions.total}`}
        />
        <Stat
          label={Sq.sq.admin.metrics.questionsFullScan}
          value={metrics.questions.withFullQuestionImage}
        />
        <Stat label={Sq.sq.admin.metrics.attemptsLast7d} value={metrics.attempts.last7d} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wide font-semibold text-[var(--color-fg-muted)]">
        {label}
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-brand)]">
        {value}
      </div>
    </div>
  );
}

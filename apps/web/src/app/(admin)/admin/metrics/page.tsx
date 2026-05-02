'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';

interface Metrics {
  users: number;
  questions: { total: number; published: number };
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

  if (error) return <p className="text-[var(--color-danger)]">{error}</p>;
  if (!metrics) return <p>{Sq.sq.common.loading}</p>;

  return (
    <section>
      <h1 className="text-2xl font-semibold">{Sq.sq.admin.metrics.title}</h1>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label={Sq.sq.admin.metrics.users} value={metrics.users} />
        <Stat
          label={Sq.sq.admin.metrics.newUsersLast7d}
          value={metrics.newUsersLast7d}
        />
        <Stat
          label={Sq.sq.admin.metrics.questions}
          value={`${metrics.questions.published} / ${metrics.questions.total}`}
        />
        <Stat
          label={Sq.sq.admin.metrics.attemptsLast7d}
          value={metrics.attempts.last7d}
        />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <div className="rounded-lg border border-[var(--color-border)] p-4">
      <div className="text-sm text-[var(--color-fg-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

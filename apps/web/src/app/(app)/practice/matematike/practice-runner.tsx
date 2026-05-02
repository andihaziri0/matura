'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Markdown } from '@matura/ui';
import { Sq } from '@matura/shared';
import { useAuth } from '@/lib/auth/auth-provider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type QuestionKind = 'MCQ' | 'SHORT' | 'LONG';

interface PracticeOption {
  id: string;
  questionId: string;
  label: string;
  order: number;
}

interface PracticeQuestion {
  id: string;
  topicPath: string;
  kind: QuestionKind;
  difficulty: number;
  promptMd: string;
  hints: string[];
  estimatedSec: number;
  options: PracticeOption[];
  images: Array<{ id: string; r2Key: string; alt: string }>;
}

interface PracticePayload {
  session: { id: string };
  questions: PracticeQuestion[];
}

interface AttemptResult {
  id: string;
  isCorrect: boolean;
  correctAnswer: string | null;
  explanationMd: string;
}

interface SessionSummary {
  sessionId: string;
  total: number;
  correct: number;
  durationMs: number;
  perTopic: Array<{ topicPath: string; total: number; correct: number }>;
}

interface AttemptRecord {
  question: PracticeQuestion;
  answer: string;
  result: AttemptResult;
}

type Phase =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'answering'; payload: PracticePayload; index: number }
  | { kind: 'feedback'; payload: PracticePayload; index: number; record: AttemptRecord }
  | { kind: 'summary'; summary: SessionSummary; records: AttemptRecord[] };

export function PracticeRunner(): React.ReactElement {
  const { getIdToken } = useAuth();
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [records, setRecords] = useState<AttemptRecord[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(() => Date.now());
  const [pendingAnswer, setPendingAnswer] = useState<string>('');

  const start = useCallback(async () => {
    setPhase({ kind: 'loading' });
    setRecords([]);
    setPendingAnswer('');
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/sessions/practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subjectSlug: 'matematike', count: 10 }),
      });
      if (!res.ok) {
        setPhase({ kind: 'error', message: Sq.sq.errors.unknown });
        return;
      }
      const payload = (await res.json()) as PracticePayload;
      if (payload.questions.length === 0) {
        setPhase({ kind: 'empty' });
        return;
      }
      setPhase({ kind: 'answering', payload, index: 0 });
      setQuestionStartedAt(Date.now());
    } catch {
      setPhase({ kind: 'error', message: Sq.sq.errors.network });
    }
  }, [getIdToken]);

  useEffect(() => {
    void start();
  }, [start]);

  const submit = useCallback(async () => {
    if (phase.kind !== 'answering') return;
    if (!pendingAnswer.trim()) return;

    const q = phase.payload.questions[phase.index];
    if (!q) return;
    const token = await getIdToken();
    const timeMs = Date.now() - questionStartedAt;
    try {
      const res = await fetch(`${API_BASE}/api/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          questionId: q.id,
          sessionId: phase.payload.session.id,
          answer: pendingAnswer,
          timeMs,
        }),
      });
      if (!res.ok) {
        setPhase({ kind: 'error', message: Sq.sq.errors.unknown });
        return;
      }
      const result = (await res.json()) as AttemptResult;
      const record: AttemptRecord = { question: q, answer: pendingAnswer, result };
      setRecords((prev) => [...prev, record]);
      setPhase({ kind: 'feedback', payload: phase.payload, index: phase.index, record });
    } catch {
      setPhase({ kind: 'error', message: Sq.sq.errors.network });
    }
  }, [phase, pendingAnswer, questionStartedAt, getIdToken]);

  const next = useCallback(async () => {
    if (phase.kind !== 'feedback') return;
    const total = phase.payload.questions.length;
    const nextIdx = phase.index + 1;
    setPendingAnswer('');

    if (nextIdx < total) {
      setPhase({ kind: 'answering', payload: phase.payload, index: nextIdx });
      setQuestionStartedAt(Date.now());
      return;
    }

    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/sessions/${phase.payload.session.id}/end`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setPhase({ kind: 'error', message: Sq.sq.errors.unknown });
        return;
      }
      const summary = (await res.json()) as SessionSummary;
      setPhase({ kind: 'summary', summary, records });
    } catch {
      setPhase({ kind: 'error', message: Sq.sq.errors.network });
    }
  }, [phase, records, getIdToken]);

  if (phase.kind === 'loading') {
    return <CenteredMessage>{Sq.sq.common.loading}</CenteredMessage>;
  }
  if (phase.kind === 'error') {
    return (
      <CenteredMessage>
        <p className="text-[var(--color-danger)]">{phase.message}</p>
        <button type="button" onClick={() => void start()} className="mt-4 underline">
          {Sq.sq.practice.repeat}
        </button>
      </CenteredMessage>
    );
  }
  if (phase.kind === 'empty') {
    return (
      <CenteredMessage>
        <p>{Sq.sq.practice.noQuestions}</p>
        <Link href="/" className="mt-4 underline">
          {Sq.sq.common.back}
        </Link>
      </CenteredMessage>
    );
  }
  if (phase.kind === 'summary') {
    return <SummaryScreen summary={phase.summary} records={phase.records} onRestart={start} />;
  }

  const total = phase.payload.questions.length;
  const q = phase.payload.questions[phase.index];
  if (!q) {
    return <CenteredMessage>{Sq.sq.common.loading}</CenteredMessage>;
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <ProgressBar current={phase.index + (phase.kind === 'feedback' ? 1 : 0)} total={total} />

      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
        <div className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
          {q.topicPath} • {Sq.sq.question.difficulty}: {q.difficulty} • {Sq.sq.kind[q.kind]}
        </div>

        <div className="prose-matura mt-3 max-w-none">
          <Markdown content={q.promptMd} />
        </div>

        {q.images.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {q.images.map((img) => (
              <ImageBlock key={img.id} r2Key={img.r2Key} alt={img.alt} />
            ))}
          </div>
        )}

        <div className="mt-6">
          {phase.kind === 'answering' ? (
            <Answering
              q={q}
              value={pendingAnswer}
              onChange={setPendingAnswer}
              onSubmit={() => void submit()}
            />
          ) : (
            <Feedback record={phase.record} q={q} onNext={() => void next()} isLast={phase.index === total - 1} />
          )}
        </div>
      </div>
    </section>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }): React.ReactElement {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-[var(--color-fg-muted)]">
        <span>
          {current} / {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-[var(--color-border)]">
        <div className="h-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Answering({
  q,
  value,
  onChange,
  onSubmit,
}: {
  q: PracticeQuestion;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}): React.ReactElement {
  if (q.kind === 'MCQ') {
    return (
      <div className="flex flex-col gap-2">
        {q.options.map((o) => (
          <label
            key={o.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${
              value === o.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-fg-muted)]'
            }`}
          >
            <input
              type="radio"
              name={`mcq-${q.id}`}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="mt-1"
            />
            <div className="prose-matura max-w-none flex-1">
              <Markdown content={o.label} />
            </div>
          </label>
        ))}
        <SubmitButton disabled={!value} onClick={onSubmit} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm text-[var(--color-fg-muted)]" htmlFor={`ans-${q.id}`}>
        {Sq.sq.practice.yourAnswer}
      </label>
      {q.kind === 'SHORT' ? (
        <input
          id={`ans-${q.id}`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2"
          autoFocus
        />
      ) : (
        <textarea
          id={`ans-${q.id}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2"
        />
      )}
      <SubmitButton disabled={!value.trim()} onClick={onSubmit} />
    </div>
  );
}

function SubmitButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-2 self-end rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-fg)] disabled:opacity-50"
    >
      {Sq.sq.practice.submit}
    </button>
  );
}

function Feedback({
  record,
  q,
  onNext,
  isLast,
}: {
  record: AttemptRecord;
  q: PracticeQuestion;
  onNext: () => void;
  isLast: boolean;
}): React.ReactElement {
  const correctOption =
    q.kind === 'MCQ' && record.result.correctAnswer
      ? q.options.find((o) => o.id === record.result.correctAnswer)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-lg border-l-4 p-4 ${
          record.result.isCorrect
            ? 'border-l-[var(--color-success)] bg-[var(--color-success-soft)]'
            : 'border-l-[var(--color-danger)] bg-[var(--color-danger-soft)]'
        }`}
      >
        <div className="font-semibold">
          {record.result.isCorrect ? Sq.sq.practice.correct : Sq.sq.practice.incorrect}
        </div>
        {!record.result.isCorrect && correctOption && (
          <div className="prose-matura mt-2 max-w-none text-sm">
            <Markdown content={correctOption.label} />
          </div>
        )}
        {!record.result.isCorrect && q.kind !== 'MCQ' && record.result.correctAnswer && (
          <div className="mt-2 text-sm">
            <span className="text-[var(--color-fg-muted)]">{Sq.sq.practice.yourAnswer}: </span>
            <code className="font-mono">{record.answer}</code>
            <div className="mt-1">
              <span className="text-[var(--color-fg-muted)]">→ </span>
              <code className="font-mono">{record.result.correctAnswer}</code>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
          {Sq.sq.practice.explanation}
        </h3>
        <div className="prose-matura mt-2 max-w-none">
          <Markdown content={record.result.explanationMd} />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="self-end rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-fg)]"
      >
        {isLast ? Sq.sq.practice.finish : Sq.sq.practice.next}
      </button>
    </div>
  );
}

function SummaryScreen({
  summary,
  records,
  onRestart,
}: {
  summary: SessionSummary;
  records: AttemptRecord[];
  onRestart: () => Promise<void> | void;
}): React.ReactElement {
  const minutes = Math.floor(summary.durationMs / 60000);
  const seconds = Math.floor((summary.durationMs % 60000) / 1000);
  const pct = summary.total === 0 ? 0 : Math.round((summary.correct / summary.total) * 100);

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">{Sq.sq.practice.summaryTitle}</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label={Sq.sq.practice.score} value={`${summary.correct} / ${summary.total}`} hint={`${pct}%`} />
        <Stat label={Sq.sq.practice.timeSpent} value={`${minutes}:${String(seconds).padStart(2, '0')}`} />
        <Stat
          label={Sq.sq.question.topic}
          value={String(summary.perTopic.length)}
          hint={summary.perTopic.length === 1 ? 'temë' : 'tema'}
        />
      </div>

      {summary.perTopic.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
            {Sq.sq.question.topic}
          </h2>
          <ul className="mt-2 divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
            {summary.perTopic.map((t) => (
              <li key={t.topicPath} className="flex items-center justify-between p-3 text-sm">
                <span className="font-mono text-xs">{t.topicPath}</span>
                <span>
                  {t.correct} / {t.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
          {Sq.sq.practice.title}
        </h2>
        <ol className="mt-2 space-y-3">
          {records.map((r, i) => (
            <li
              key={r.question.id}
              className="rounded-lg border border-[var(--color-border)] p-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                  #{i + 1} • {r.question.topicPath}
                </span>
                <span
                  className={
                    r.result.isCorrect
                      ? 'text-[var(--color-success)]'
                      : 'text-[var(--color-danger)]'
                  }
                >
                  {r.result.isCorrect ? Sq.sq.practice.correct : Sq.sq.practice.incorrect}
                </span>
              </div>
              <div className="prose-matura mt-2 max-w-none">
                <Markdown content={r.question.promptMd} />
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => void onRestart()}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-fg)]"
        >
          {Sq.sq.practice.repeat}
        </button>
        <Link
          href="/"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm"
        >
          {Sq.sq.common.back}
        </Link>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-[var(--color-border)] p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-sm text-[var(--color-fg-muted)]">{hint}</div>}
    </div>
  );
}

function ImageBlock({ r2Key, alt }: { r2Key: string; alt: string }): React.ReactElement {
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 'http://localhost:9000/matura-content';
  const src = useMemo(() => `${publicBase.replace(/\/$/, '')}/${r2Key}`, [publicBase, r2Key]);
  return (
    <img src={src} alt={alt} className="w-full rounded border border-[var(--color-border)]" />
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }): React.ReactElement {
  return <section className="mx-auto max-w-2xl px-6 py-16 text-center">{children}</section>;
}

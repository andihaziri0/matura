'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Markdown } from '@matura/ui';
import { MatematikeChapters, MathTaxonomy, Sq } from '@matura/shared';
import { useAuth } from '@/lib/auth/auth-provider';
import { maturaQuestionImageHref } from '@/lib/matura-question-image-base';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const MCQ_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function topicDisplay(path: string): string {
  return MathTaxonomy.topicLabel(path) ?? path;
}

function mcqLetter(sortIndex: number): string {
  return MCQ_LETTERS[sortIndex] ?? String(sortIndex + 1);
}

function isTextInputFocused(): boolean {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

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
  images: Array<{ id: string; r2Key: string; alt: string; role?: 'INLINE' | 'FIGURE' | 'FULL_QUESTION' }>;
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

function hasValidAnswer(q: PracticeQuestion, pending: string): boolean {
  return pending.trim().length > 0;
}

type Phase =
  | { kind: 'pick' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty'; imagesOnly?: boolean }
  | { kind: 'answering'; payload: PracticePayload; index: number }
  | { kind: 'feedback'; payload: PracticePayload; index: number; record: AttemptRecord }
  | { kind: 'summary'; summary: SessionSummary; records: AttemptRecord[] };

export function PracticeRunner(): React.ReactElement {
  const { getIdToken } = useAuth();
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });
  const [topicPathFilter, setTopicPathFilter] = useState<string | undefined>(undefined);
  const [sessionQuestionCount, setSessionQuestionCount] = useState(10);
  const [sessionExamMode, setSessionExamMode] = useState(false);
  const [sessionOnlyWithImages, setSessionOnlyWithImages] = useState(false);
  const [revealedFeedback, setRevealedFeedback] = useState<Record<number, boolean>>({});
  const [records, setRecords] = useState<AttemptRecord[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(() => Date.now());
  const [pendingAnswer, setPendingAnswer] = useState<string>('');

  const startSession = useCallback(
    async (topicPath: string | undefined) => {
      setPhase({ kind: 'loading' });
      setRecords([]);
      setPendingAnswer('');
      setRevealedFeedback({});
      try {
        const token = await getIdToken();
        const res = await fetch(`${API_BASE}/api/sessions/practice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            subjectSlug: 'matematike',
            count: sessionQuestionCount,
            ...(!sessionOnlyWithImages && topicPath ? { topicPath } : {}),
            ...(sessionOnlyWithImages ? { hasImages: true, includeReview: true } : {}),
          }),
        });
        if (!res.ok) {
          setPhase({ kind: 'error', message: Sq.sq.errors.unknown });
          return;
        }
        const payload = (await res.json()) as PracticePayload;
        if (payload.questions.length === 0) {
          setPhase({ kind: 'empty', imagesOnly: sessionOnlyWithImages });
          return;
        }
        setPhase({ kind: 'answering', payload, index: 0 });
        setQuestionStartedAt(Date.now());
      } catch {
        setPhase({ kind: 'error', message: Sq.sq.errors.network });
      }
    },
    [getIdToken, sessionQuestionCount, sessionOnlyWithImages],
  );

  const postCurrentAnswerOrSkip = useCallback(async () => {
    if (phase.kind !== 'answering') return;
    const q = phase.payload.questions[phase.index];
    if (!q) return;

    const valid = hasValidAnswer(q, pendingAnswer);
    const skipped = !valid;
    const token = await getIdToken();
    const timeMs = skipped ? 0 : Date.now() - questionStartedAt;
    const answer = valid ? pendingAnswer : '';

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
          answer,
          timeMs,
          ...(skipped ? { skipped: true } : {}),
        }),
      });
      if (!res.ok) {
        setPhase({ kind: 'error', message: Sq.sq.errors.unknown });
        return;
      }
      const result = (await res.json()) as AttemptResult;
      const record: AttemptRecord = { question: q, answer, result };
      setRecords((prev) => [...prev, record]);
      setPhase({ kind: 'feedback', payload: phase.payload, index: phase.index, record });
    } catch {
      setPhase({ kind: 'error', message: Sq.sq.errors.network });
    }
  }, [phase, pendingAnswer, questionStartedAt, getIdToken]);

  const advanceAfterFeedback = useCallback(async () => {
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

  const goPrev = useCallback(() => {
    if (phase.kind === 'answering') {
      const i = phase.index;
      if (i <= 0) return;
      const prevRecord = records[i - 1];
      if (!prevRecord) return;
      setPhase({ kind: 'feedback', payload: phase.payload, index: i - 1, record: prevRecord });
      return;
    }
    if (phase.kind === 'feedback') {
      const i = phase.index;
      if (i <= 0) return;
      const prevRecord = records[i - 1];
      if (!prevRecord) return;
      setPhase({ kind: 'feedback', payload: phase.payload, index: i - 1, record: prevRecord });
    }
  }, [phase, records]);

  const revealCurrentFeedback = useCallback(() => {
    if (phase.kind !== 'feedback') return;
    setRevealedFeedback((r) => ({ ...r, [phase.index]: true }));
  }, [phase]);

  const goNext = useCallback(async () => {
    if (phase.kind === 'answering') {
      await postCurrentAnswerOrSkip();
      return;
    }
    if (phase.kind === 'feedback') {
      if (sessionExamMode && !revealedFeedback[phase.index]) return;
      await advanceAfterFeedback();
    }
  }, [
    phase,
    postCurrentAnswerOrSkip,
    advanceAfterFeedback,
    sessionExamMode,
    revealedFeedback,
  ]);

  useEffect(() => {
    if (phase.kind !== 'answering' && phase.kind !== 'feedback') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (isTextInputFocused()) return;
      e.preventDefault();
      if (e.key === 'ArrowLeft') {
        const atFirst = phase.index <= 0;
        if (!atFirst) goPrev();
        return;
      }
      if (
        phase.kind === 'feedback' &&
        sessionExamMode &&
        !revealedFeedback[phase.index]
      ) {
        setRevealedFeedback((r) => ({ ...r, [phase.index]: true }));
        return;
      }
      void goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, goPrev, goNext, sessionExamMode, revealedFeedback]);

  if (phase.kind === 'pick') {
    return (
      <section className="relative z-1 mx-auto w-full max-w-3xl px-3 sm:px-6 py-8 sm:py-10">
          <div className="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-sm sm:p-6">
            <label className="block text-sm font-medium text-[var(--color-fg)]" htmlFor="practice-chapter">
              {Sq.sq.practice.chooseChapter}
            </label>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{Sq.sq.practice.chapterHint}</p>
            <select
              id="practice-chapter"
              className="mt-3 box-border w-full min-h-[48px] min-w-0 appearance-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 pr-9 text-base text-[var(--color-fg)] sm:min-h-0 sm:py-2.5 sm:text-sm"
              value={topicPathFilter ?? ''}
              onChange={(e) =>
                setTopicPathFilter(e.target.value === '' ? undefined : e.target.value)
              }
            >
              <option value="">{Sq.sq.practice.allChapters}</option>
              {MatematikeChapters.MATEMATIKE_PRACTICE_CHAPTERS.map((c) => (
                <option key={c.id} value={c.topicPath}>
                  {c.nameSq}
                </option>
              ))}
            </select>
            <label className="mt-4 block text-sm font-medium text-[var(--color-fg)]" htmlFor="practice-size">
              {Sq.sq.practice.sessionSize}
            </label>
            <select
              id="practice-size"
              className="mt-1 box-border w-full min-h-[48px] min-w-0 appearance-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 pr-9 text-base text-[var(--color-fg)] sm:min-h-0 sm:py-2.5 sm:text-sm"
              value={sessionQuestionCount}
              onChange={(e) => setSessionQuestionCount(Number(e.target.value))}
            >
              <option value={10}>{Sq.sq.practice.questionsCount10}</option>
              <option value={25}>{Sq.sq.practice.questionsCount25}</option>
            </select>
            <label className="mt-4 flex min-h-[48px] cursor-pointer items-center gap-3 text-sm text-[var(--color-fg)] sm:min-h-0">
              <input
                type="checkbox"
                checked={sessionOnlyWithImages}
                onChange={(e) => setSessionOnlyWithImages(e.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-[var(--color-border)]"
              />
              <span className="text-base leading-snug sm:text-sm">{Sq.sq.practice.sessionOnlyWithImages}</span>
            </label>
            <p className="mt-1 text-xs text-[var(--color-fg-muted)] sm:max-w-xl">
              {Sq.sq.practice.sessionOnlyWithImagesHint}
            </p>
            <label className="mt-4 flex min-h-[48px] cursor-pointer items-center gap-3 text-sm text-[var(--color-fg)] sm:min-h-0">
              <input
                type="checkbox"
                checked={sessionExamMode}
                onChange={(e) => setSessionExamMode(e.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-[var(--color-border)]"
              />
              <span className="text-base leading-snug sm:text-sm">{Sq.sq.practice.sessionExamMode}</span>
            </label>
            <p className="mt-1 text-xs text-[var(--color-fg-muted)] sm:max-w-xl">
              {Sq.sq.practice.examModeHintSession}
            </p>
            <button
              type="button"
              className="mt-8 w-full min-h-[56px] rounded-xl bg-[var(--color-brand)] px-5 py-4 text-lg font-bold tracking-wide text-[var(--color-brand-fg)] shadow-lg transition hover:bg-[var(--color-brand-strong)] active:scale-[0.99] sm:mt-6 sm:min-h-[52px] sm:text-base sm:font-semibold sm:tracking-normal"
              onClick={() => void startSession(topicPathFilter)}
            >
              {Sq.sq.practice.start}
            </button>
          </div>
          <p className="mt-6 text-center">
            <Link href="/" className="text-sm text-[var(--color-brand)] underline">
              {Sq.sq.common.back}
            </Link>
          </p>
        </section>
    );
  }

  if (phase.kind === 'loading') {
    return <CenteredMessage>{Sq.sq.common.loading}</CenteredMessage>;
  }
  if (phase.kind === 'error') {
    return (
        <CenteredMessage>
          <p className="text-[var(--color-danger)]">{phase.message}</p>
          <button
            type="button"
            onClick={() => void startSession(topicPathFilter)}
            className="mt-4 underline"
          >
            {Sq.sq.practice.repeat}
          </button>
        </CenteredMessage>
    );
  }
  if (phase.kind === 'empty') {
    return (
        <CenteredMessage>
          <p>{phase.imagesOnly ? Sq.sq.practice.noQuestionsWithImages : Sq.sq.practice.noQuestions}</p>
          <button
            type="button"
            onClick={() => setPhase({ kind: 'pick' })}
            className="mt-4 block w-full text-[var(--color-brand)] underline"
          >
            {Sq.sq.practice.pickChapterAgain}
          </button>
          <Link href="/" className="mt-2 inline-block underline">
            {Sq.sq.common.back}
          </Link>
        </CenteredMessage>
    );
  }
  if (phase.kind === 'summary') {
    return (
        <SummaryScreen
          summary={phase.summary}
          records={phase.records}
          onRestart={() => void startSession(topicPathFilter)}
        />
    );
  }

  const total = phase.payload.questions.length;
  const q = phase.payload.questions[phase.index];
  if (!q) {
    return <CenteredMessage>{Sq.sq.common.loading}</CenteredMessage>;
  }

  return (
      <section className="relative z-1 mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
        <SubjectPill label={Sq.sq.subjects.matematike} />
        <div className="mt-4">
          <ProgressBar current={phase.index + (phase.kind === 'feedback' ? 1 : 0)} total={total} />
        </div>

        <QuestionNavBar
          phase={phase}
          total={total}
          onPrev={goPrev}
          onNext={() => void goNext()}
          nextDisabled={
            phase.kind === 'feedback' &&
            sessionExamMode &&
            !revealedFeedback[phase.index]
          }
        />

        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
            {topicDisplay(q.topicPath)} • {Sq.sq.question.difficulty}: {q.difficulty} •{' '}
            {Sq.sq.kind[q.kind]}
          </div>

          <QuestionPracticeBody q={q} />

          <div className="mt-6">
            {phase.kind === 'answering' ? (
              <Answering
                q={q}
                value={pendingAnswer}
                onChange={setPendingAnswer}
                onSubmit={() => void postCurrentAnswerOrSkip()}
              />
            ) : sessionExamMode && !revealedFeedback[phase.index] ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100">
                <p className="text-sm">{Sq.sq.practice.examModeRevealPrompt}</p>
                <button
                  type="button"
                  onClick={revealCurrentFeedback}
                  className="mt-3 rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-fg)] shadow-sm transition hover:bg-[var(--color-brand-strong)]"
                >
                  {Sq.sq.practice.revealResult}
                </button>
              </div>
            ) : (
              <Feedback record={phase.record} q={q} />
            )}
          </div>
        </div>
      </section>
  );
}

function QuestionNavBar({
  phase,
  total,
  onPrev,
  onNext,
  nextDisabled = false,
}: {
  phase: Extract<Phase, { kind: 'answering' } | { kind: 'feedback' }>;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}): React.ReactElement {
  const atFirst = phase.index <= 0;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 shadow-sm">
      <button
        type="button"
        disabled={atFirst}
        aria-label={Sq.sq.practice.navPrevious}
        onClick={onPrev}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-fg)] transition hover:bg-[var(--color-brand-soft)] hover:border-[var(--color-brand)]/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹ {Sq.sq.practice.navPrevious}
      </button>
      <span className="text-sm font-medium tabular-nums text-[var(--color-fg-muted)]">
        {phase.index + 1} / {total}
      </span>
      <button
        type="button"
        disabled={nextDisabled}
        aria-label={Sq.sq.practice.navNext}
        onClick={onNext}
        className="rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-[var(--color-brand-fg)] shadow-sm transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {Sq.sq.practice.navNext} ›
      </button>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }): React.ReactElement {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-[var(--color-fg-muted)]">
        <span className="font-medium">
          {current} / {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-brand)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SubjectPill({ label }: { label: string }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
      {label}
    </span>
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
    const sorted = [...q.options].sort((a, b) => a.order - b.order);
    return (
      <div className="flex flex-col gap-2">
        {sorted.map((o, idx) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 transition ${
              value === o.id
                ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-bg)]'
            }`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                value === o.id
                  ? 'bg-[var(--color-brand)] text-[var(--color-brand-fg)]'
                  : 'bg-[var(--color-brand-soft)] text-[var(--color-brand)]'
              }`}
              aria-hidden
            >
              {mcqLetter(idx)}
            </span>
            <input
              type="radio"
              name={`mcq-${q.id}`}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            <div className="prose-matura min-w-0 flex-1">
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
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm transition focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
          autoFocus
        />
      ) : (
        <textarea
          id={`ans-${q.id}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm transition focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
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
      className="mt-2 self-end rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-fg)] shadow-sm transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {Sq.sq.practice.submit}
    </button>
  );
}

function Feedback({
  record,
  q,
}: {
  record: AttemptRecord;
  q: PracticeQuestion;
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
            <code className="font-mono">{record.answer || '—'}</code>
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
    <section className="relative z-1 mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">{Sq.sq.practice.summaryTitle}</h1>

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
              <li key={t.topicPath} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="min-w-0 text-[var(--color-fg)]">{topicDisplay(t.topicPath)}</span>
                <span className="shrink-0">
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
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-[var(--color-fg-muted)]">
                  #{i + 1} • {topicDisplay(r.question.topicPath)}
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
              <QuestionPracticeBody q={r.question} compactSummary />
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onRestart()}
          className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-fg)] shadow-sm transition hover:bg-[var(--color-brand-strong)]"
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

function QuestionPracticeBody({
  q,
  compactSummary = false,
}: {
  q: PracticeQuestion;
  compactSummary?: boolean;
}): React.ReactElement {
  const full = q.images.filter((i) => i.role === 'FULL_QUESTION');
  const other = q.images.filter((i) => i.role !== 'FULL_QUESTION');
  const hasScan = full.length > 0;

  if (compactSummary) {
    return (
      <div className="mt-2">
        {hasScan ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {full.map((img) => (
              <ImageBlock key={img.id} r2Key={img.r2Key} alt={img.alt} variant="thumb" />
            ))}
          </div>
        ) : (
          <div className="prose-matura max-w-none text-sm line-clamp-3">
            <Markdown content={q.promptMd} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {hasScan && (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-muted)]">
            {Sq.sq.practice.bankFullScanCaption}
          </p>
          {full.map((img) => (
            <ImageBlock key={img.id} r2Key={img.r2Key} alt={img.alt} variant="hero" />
          ))}
        </div>
      )}
      <div className="prose-matura mt-3 max-w-none">
        {hasScan ? (
          <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-fg)]">
              {Sq.sq.practice.bankTranscriptToggle}
            </summary>
            <div className="mt-2">
              <Markdown content={q.promptMd} />
            </div>
          </details>
        ) : (
          <Markdown content={q.promptMd} />
        )}
      </div>
      {other.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {other.map((img) => (
            <ImageBlock key={img.id} r2Key={img.r2Key} alt={img.alt} variant="inline" />
          ))}
        </div>
      )}
    </>
  );
}

function ImageBlock({
  r2Key,
  alt,
  variant = 'inline',
}: {
  r2Key: string;
  alt: string;
  variant?: 'hero' | 'inline' | 'thumb';
}): React.ReactElement {
  const src = useMemo(() => maturaQuestionImageHref(r2Key), [r2Key]);
  const cls =
    variant === 'hero'
      ? 'w-full rounded-lg border border-[var(--color-border)] bg-black/[0.04] object-contain max-h-[min(85vh,1400px)]'
      : variant === 'thumb'
        ? 'h-28 w-40 shrink-0 rounded border border-[var(--color-border)] object-cover object-top'
        : 'w-full rounded border border-[var(--color-border)]';
  return <img src={src} alt={alt} className={cls} />;
}

function CenteredMessage({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <section className="relative z-1 mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      {children}
    </section>
  );
}

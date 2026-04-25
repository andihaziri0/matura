'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Markdown } from '@matura/ui';
import {
  Sq,
  MathTaxonomy,
  CreateQuestionInputSchema,
  type CreateQuestionInput,
} from '@matura/shared';
import { useAuth } from '@/lib/auth/auth-provider';
import { ImageUploader } from './image-uploader';

interface Props {
  mode: 'create' | 'edit';
  id?: string;
}

const DEFAULT: CreateQuestionInput = {
  subjectSlug: 'matematike',
  topicPath: MathTaxonomy.TOPICS[0]?.path ?? 'algjeber.shprehje',
  kind: 'MCQ',
  difficulty: 2,
  tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'],
  promptMd: '',
  explanationMd: '',
  hints: [],
  tags: [],
  estimatedSec: 60,
  status: 'DRAFT',
  options: [
    { label: '', isCorrect: true, order: 1 },
    { label: '', isCorrect: false, order: 2 },
    { label: '', isCorrect: false, order: 3 },
    { label: '', isCorrect: false, order: 4 },
  ],
  images: [],
};

interface QuestionResponse {
  id: string;
  externalId: string | null;
  subjectSlug: string;
  topicPath: string;
  kind: 'MCQ' | 'SHORT' | 'LONG';
  difficulty: number;
  year: number | null;
  source: string | null;
  tracks: string[];
  promptMd: string;
  correctAnswer: string | null;
  explanationMd: string;
  hints: string[];
  tags: string[];
  estimatedSec: number;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  options: { id: string; label: string; isCorrect: boolean; order: number }[];
  images: { id: string; r2Key: string; alt: string; order: number; role: 'INLINE' | 'FIGURE' | 'FULL_QUESTION' }[];
}

export function QuestionEditor({ mode, id }: Props): JSX.Element {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const [draft, setDraft] = useState<CreateQuestionInput>(DEFAULT);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(mode === 'create');

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    void (async () => {
      const token = await getIdToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/questions/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (!res.ok) {
        setError(Sq.sq.errors.notFound);
        setLoaded(true);
        return;
      }
      const q = (await res.json()) as QuestionResponse;
      setDraft({
        subjectSlug: q.subjectSlug,
        topicPath: q.topicPath,
        kind: q.kind,
        difficulty: q.difficulty,
        ...(q.year != null && { year: q.year }),
        ...(q.source != null && { source: q.source }),
        tracks: q.tracks as CreateQuestionInput['tracks'],
        promptMd: q.promptMd,
        ...(q.correctAnswer != null && { correctAnswer: q.correctAnswer }),
        explanationMd: q.explanationMd,
        hints: q.hints,
        tags: q.tags,
        estimatedSec: q.estimatedSec,
        status: q.status,
        options: q.options.map((o) => ({
          label: o.label,
          isCorrect: o.isCorrect,
          order: o.order,
        })),
        images: q.images.map((i) => ({
          r2Key: i.r2Key,
          alt: i.alt,
          order: i.order,
          role: i.role,
        })),
        ...(q.externalId != null && { externalId: q.externalId }),
      });
      setLoaded(true);
    })();
  }, [mode, id, getIdToken]);

  const validation = useMemo(() => CreateQuestionInputSchema.safeParse(draft), [draft]);

  async function save(): Promise<void> {
    setError(null);
    if (!validation.success) {
      setError(Sq.sq.admin.questions.requiredFields);
      return;
    }
    setSaving(true);
    try {
      const token = await getIdToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const url = mode === 'create' ? `${apiBase}/api/questions` : `${apiBase}/api/questions/${id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(validation.data),
      });
      if (!res.ok) {
        setError(Sq.sq.errors.unknown);
        return;
      }
      const created = (await res.json()) as { id: string };
      router.push(`/admin/questions/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  async function publish(): Promise<void> {
    if (mode !== 'edit' || !id) return;
    const token = await getIdToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const res = await fetch(`${apiBase}/api/questions/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ status: 'PUBLISHED' }),
    });
    if (res.ok) {
      setDraft((d) => ({ ...d, status: 'PUBLISHED' }));
    }
  }

  if (!loaded) return <p>{Sq.sq.common.loading}</p>;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          {mode === 'create' ? Sq.sq.admin.questions.new : Sq.sq.admin.questions.edit}
        </h1>

        <div className="grid grid-cols-2 gap-3">
          <Field label={Sq.sq.question.topic}>
            <select
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5"
              value={draft.topicPath}
              onChange={(e) => setDraft({ ...draft, topicPath: e.target.value })}
            >
              {MathTaxonomy.TOPICS.map((t) => (
                <option key={t.path} value={t.path}>
                  {t.nameSq}
                </option>
              ))}
            </select>
          </Field>
          <Field label={Sq.sq.kind.MCQ.replace('Me opsione', 'Lloji')}>
            <select
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5"
              value={draft.kind}
              onChange={(e) =>
                setDraft({ ...draft, kind: e.target.value as CreateQuestionInput['kind'] })
              }
            >
              <option value="MCQ">{Sq.sq.kind.MCQ}</option>
              <option value="SHORT">{Sq.sq.kind.SHORT}</option>
              <option value="LONG">{Sq.sq.kind.LONG}</option>
            </select>
          </Field>
          <Field label={Sq.sq.question.difficulty}>
            <input
              type="number"
              min={1}
              max={5}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5"
              value={draft.difficulty}
              onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) })}
            />
          </Field>
          <Field label={Sq.sq.question.estimatedTime}>
            <input
              type="number"
              min={5}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5"
              value={draft.estimatedSec}
              onChange={(e) => setDraft({ ...draft, estimatedSec: Number(e.target.value) })}
            />
          </Field>
        </div>

        <Field label={Sq.sq.admin.questions.promptLabel}>
          <textarea
            rows={6}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 font-mono text-sm"
            value={draft.promptMd}
            onChange={(e) => setDraft({ ...draft, promptMd: e.target.value })}
          />
        </Field>

        {draft.kind === 'MCQ' && (
          <div className="space-y-2">
            <div className="text-sm text-[var(--color-fg-muted)]">{Sq.sq.kind.MCQ}</div>
            {draft.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={opt.isCorrect}
                  onChange={() =>
                    setDraft({
                      ...draft,
                      options: draft.options.map((o, i) => ({
                        ...o,
                        isCorrect: i === idx,
                      })),
                    })
                  }
                />
                <input
                  className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5 font-mono text-sm"
                  value={opt.label}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      options: draft.options.map((o, i) =>
                        i === idx ? { ...o, label: e.target.value } : o,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      options: draft.options.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-sm text-[var(--color-fg-muted)] hover:underline"
                >
                  {Sq.sq.admin.questions.removeOption}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-sm underline"
              onClick={() =>
                setDraft({
                  ...draft,
                  options: [
                    ...draft.options,
                    { label: '', isCorrect: false, order: draft.options.length + 1 },
                  ],
                })
              }
            >
              {Sq.sq.admin.questions.addOption}
            </button>
          </div>
        )}

        {(draft.kind === 'SHORT' || draft.kind === 'LONG') && (
          <Field label={Sq.sq.admin.questions.correctAnswerLabel}>
            <input
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 font-mono text-sm"
              value={draft.correctAnswer ?? ''}
              onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })}
            />
          </Field>
        )}

        <Field label={Sq.sq.admin.questions.explanationLabel}>
          <textarea
            rows={6}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 font-mono text-sm"
            value={draft.explanationMd}
            onChange={(e) => setDraft({ ...draft, explanationMd: e.target.value })}
          />
        </Field>

        <ImageUploader
          images={draft.images}
          onChange={(images) => setDraft({ ...draft, images })}
        />

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-[var(--color-accent-fg)] disabled:opacity-50"
          >
            {Sq.sq.admin.questions.saveDraft}
          </button>
          {mode === 'edit' && draft.status !== 'PUBLISHED' && (
            <button
              type="button"
              onClick={publish}
              className="rounded-md border border-[var(--color-border)] px-4 py-2 hover:bg-[var(--color-bg-elevated)]"
            >
              {Sq.sq.admin.questions.publish}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <h2 className="text-lg font-medium">{Sq.sq.admin.questions.preview}</h2>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
          <Markdown content={draft.promptMd || '_…_'} className="prose-matura" />
          {draft.kind === 'MCQ' && (
            <ol className="mt-4 list-[upper-alpha] pl-6 space-y-1">
              {draft.options.map((o, i) => (
                <li key={i}>
                  <Markdown content={o.label || '_…_'} />
                </li>
              ))}
            </ol>
          )}
        </div>
        <h3 className="text-sm font-medium text-[var(--color-fg-muted)]">
          {Sq.sq.practice.explanation}
        </h3>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
          <Markdown content={draft.explanationMd || '_…_'} className="prose-matura" />
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <label className="block">
      <span className="text-sm text-[var(--color-fg-muted)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

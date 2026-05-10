'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Markdown } from '@matura/ui';
import { MatematikeChapters, MathTaxonomy, Sq } from '@matura/shared';
import { PracticeMatematikeHeader } from './practice-matematike-header';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const MCQ_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function topicDisplay(path: string): string {
  return MathTaxonomy.topicLabel(path) ?? path;
}

function imagePublicUrl(r2Key: string): string {
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 'http://localhost:9000/matura-content';
  return `${publicBase.replace(/\/$/, '')}/${r2Key}`;
}

interface BankOption {
  id: string;
  label: string;
  order: number;
  isCorrect: boolean;
}

interface BankQuestion {
  id: string;
  topicPath: string;
  kind: string;
  difficulty: number;
  promptMd: string;
  correctAnswer: string | null;
  explanationMd: string;
  options: BankOption[];
  images: Array<{ id: string; r2Key: string; alt: string; order: number }>;
}

export function PracticeBank(): React.ReactElement {
  const [topicPath, setTopicPath] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<'all' | 'foto' | 'gjeneruar'>('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [examMode, setExamMode] = useState(false);
  const [items, setItems] = useState<BankQuestion[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState<BankQuestion[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchDraft.trim()), 320);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  const buildListParams = useCallback(
    (cursor: string | null, limit: number) => {
      const p = new URLSearchParams();
      p.set('subjectSlug', 'matematike');
      p.set('status', 'PUBLISHED');
      p.set('limit', String(limit));
      if (topicPath) p.set('topicPath', topicPath);
      if (source === 'foto') p.set('tag', 'source:foto');
      if (source === 'gjeneruar') p.set('tag', 'source:gjeneruar');
      if (search.length > 0) p.set('search', search);
      if (cursor) p.set('cursor', cursor);
      return p;
    },
    [topicPath, source, search],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/questions?${buildListParams(null, 20).toString()}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items: BankQuestion[]; nextCursor: string | null };
        if (cancelled) return;
        setItems(data.items);
        setNextCursor(data.nextCursor);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topicPath, source, search, buildListParams]);

  const loadMore = useCallback(() => {
    const cur = nextCursor;
    if (!cur || loading) return;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/questions?${buildListParams(cur, 20).toString()}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: BankQuestion[]; nextCursor: string | null };
        setItems((prev) => [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
      } finally {
        setLoading(false);
      }
    })();
  }, [nextCursor, loading, buildListParams]);

  useEffect(() => {
    void (async () => {
      const p = new URLSearchParams();
      p.set('subjectSlug', 'matematike');
      p.set('status', 'PUBLISHED');
      p.set('hasImages', 'true');
      p.set('limit', '40');
      const res = await fetch(`${API_BASE}/api/questions?${p.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { items: BankQuestion[] };
      setGallery(data.items);
    })();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const gallerySlides = useMemo(() => {
    const slides: Array<{ key: string; src: string; alt: string }> = [];
    for (const q of gallery) {
      const img = q.images[0];
      if (img) slides.push({ key: `${q.id}-${img.id}`, src: imagePublicUrl(img.r2Key), alt: img.alt });
    }
    return slides;
  }, [gallery]);

  return (
    <>
      <PracticeMatematikeHeader />
      <section className="relative z-1 mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <p className="text-sm text-[var(--color-fg-muted)]">{Sq.sq.practice.bankIntro}</p>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-[200px] flex-1 text-sm">
            <span className="font-medium text-[var(--color-fg)]">{Sq.sq.practice.chooseChapter}</span>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
              value={topicPath ?? ''}
              onChange={(e) => setTopicPath(e.target.value === '' ? undefined : e.target.value)}
            >
              <option value="">{Sq.sq.practice.allChapters}</option>
              {MatematikeChapters.MATEMATIKE_PRACTICE_CHAPTERS.map((c) => (
                <option key={c.id} value={c.topicPath}>
                  {c.nameSq}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-[200px] flex-1 text-sm">
            <span className="font-medium text-[var(--color-fg)]">{Sq.sq.question.source}</span>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
              value={source}
              onChange={(e) => setSource(e.target.value as 'all' | 'foto' | 'gjeneruar')}
            >
              <option value="all">{Sq.sq.practice.sourceAll}</option>
              <option value="foto">{Sq.sq.practice.sourceFoto}</option>
              <option value="gjeneruar">{Sq.sq.practice.sourceGjeneruar}</option>
            </select>
          </label>
          <label className="block min-w-[200px] flex-[2] text-sm">
            <span className="font-medium text-[var(--color-fg)]">{Sq.sq.common.search}</span>
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={Sq.sq.practice.bankSearchPlaceholder}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={examMode}
              onChange={(e) => setExamMode(e.target.checked)}
              className="rounded border-[var(--color-border)]"
            />
            <span>{Sq.sq.practice.examMode}</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-[var(--color-fg-muted)]">{Sq.sq.practice.examModeHint}</p>

        <p className="mt-4 text-sm text-[var(--color-fg-muted)]">
          {items.length} {Sq.sq.practice.bankLoadedCount}
          {loading ? ` (${Sq.sq.common.loading})` : ''}
        </p>

        <div className="mt-4 space-y-4">
          {items.length === 0 && !loading && (
            <p className="py-8 text-center text-[var(--color-fg-muted)]">{Sq.sq.practice.bankEmpty}</p>
          )}
          {items.map((q, idx) => (
            <BankCard key={q.id} q={q} index={idx + 1} examMode={examMode} />
          ))}
        </div>

        {nextCursor && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => loadMore()}
              className="rounded-lg bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-[var(--color-brand-fg)] shadow-sm transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
            >
              {Sq.sq.practice.loadMore}
            </button>
          </div>
        )}

        {gallerySlides.length > 0 && (
          <div className="mt-12 border-t border-[var(--color-border)] pt-10">
            <h2 className="text-lg font-semibold text-[var(--color-brand)]">{Sq.sq.practice.galleryTitle}</h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{Sq.sq.practice.gallerySubtitle}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {gallerySlides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setLbIndex(i)}
                  className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <img src={s.src} alt={s.alt} className="h-24 w-full object-cover sm:h-28" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {lbIndex !== null && gallerySlides.length > 0 && (
        <Lightbox
          slides={gallerySlides}
          index={lbIndex}
          onClose={() => setLbIndex(null)}
          onPrev={() => setLbIndex((i) => (i === null ? 0 : Math.max(0, i - 1)))}
          onNext={() =>
            setLbIndex((i) =>
              i === null ? 0 : Math.min(gallerySlides.length - 1, i + 1),
            )
          }
        />
      )}

      {showScrollTop && (
        <button
          type="button"
          aria-label={Sq.sq.practice.scrollTop}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--color-brand)] bg-[var(--color-bg-elevated)] text-lg font-bold text-[var(--color-brand)] shadow-lg"
        >
          ↑
        </button>
      )}
    </>
  );
}

function BankCard({
  q,
  index,
  examMode,
}: {
  q: BankQuestion;
  index: number;
  examMode: boolean;
}): React.ReactElement {
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const showResult = !examMode && picked !== null;
  const showAfterReveal = examMode && revealed;
  const sorted = useMemo(() => [...q.options].sort((a, b) => a.order - b.order), [q.options]);

  const reveal = () => setRevealed(true);

  if (q.kind !== 'MCQ') {
    return (
      <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-fg-muted)]">
          <span className="rounded bg-[var(--color-brand)] px-2 py-0.5 font-semibold text-white">
            #{index}
          </span>
          <span>{topicDisplay(q.topicPath)}</span>
        </div>
        <div className="prose-matura mt-3 max-w-none">
          <Markdown content={q.promptMd} />
        </div>
        {!revealed ? (
          <button
            type="button"
            onClick={reveal}
            className="mt-3 rounded-md border border-[var(--color-brand)] px-3 py-1.5 text-sm text-[var(--color-brand)]"
          >
            {Sq.sq.practice.showAnswer}
          </button>
        ) : (
          <div className="prose-matura mt-3 max-w-none rounded-lg border-l-4 border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm">
            {q.correctAnswer ? (
              <Markdown content={`\`${q.correctAnswer}\``} />
            ) : (
              <Markdown content={q.explanationMd} />
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-fg-muted)]">
        <span className="rounded bg-[var(--color-brand)] px-2 py-0.5 font-semibold text-white">
          #{index}
        </span>
        <span>{topicDisplay(q.topicPath)}</span>
      </div>
      <div className="prose-matura mt-3 max-w-none">
        <Markdown content={q.promptMd} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {sorted.map((o, idx) => {
          const letter = MCQ_LETTERS[idx] ?? String(idx + 1);
          let ring = 'border-[var(--color-border)]';
          if (picked === o.id && showResult) {
            ring = o.isCorrect
              ? 'border-[var(--color-success)] bg-[var(--color-success-soft)]'
              : 'border-[var(--color-danger)] bg-[var(--color-danger-soft)]';
          } else if (picked === o.id && examMode && !revealed) {
            ring = 'border-[#42a5f5] bg-[#e3f2fd]';
          } else if ((showResult || showAfterReveal) && o.isCorrect) {
            ring = 'border-[var(--color-success)] bg-[var(--color-success-soft)]';
          }
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setPicked(o.id)}
              className={`flex items-start gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition ${ring}`}
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-xs font-semibold text-[var(--color-brand)]">
                {letter}
              </span>
              <span className="prose-matura min-w-0 flex-1 text-[var(--color-fg)]">
                <Markdown content={o.label} />
              </span>
            </button>
          );
        })}
      </div>
      {examMode && picked && !revealed && (
        <button
          type="button"
          onClick={reveal}
          className="mt-3 rounded-md border border-[var(--color-brand)] px-3 py-1.5 text-sm text-[var(--color-brand)]"
        >
          {Sq.sq.practice.showAnswer}
        </button>
      )}
      {(showResult || showAfterReveal) && (
        <div className="prose-matura mt-4 max-w-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
          <Markdown content={q.explanationMd} />
        </div>
      )}
    </article>
  );
}

function Lightbox({
  slides,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  slides: Array<{ key: string; src: string; alt: string }>;
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}): React.ReactElement {
  const s = slides[index];
  if (!s) return <></>;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label={Sq.sq.practice.close}
        className="absolute inset-0 bg-[rgba(15,15,35,0.88)]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[96vh] max-w-full items-center gap-1">
        <button
          type="button"
          aria-label={Sq.sq.practice.galleryPrev}
          disabled={index <= 0}
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-xl text-white disabled:opacity-40"
        >
          ‹
        </button>
        <div className="flex min-w-0 flex-col items-center">
          <img
            src={s.src}
            alt={s.alt}
            className="max-h-[85vh] max-w-[min(100%,1100px)] rounded-lg object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          aria-label={Sq.sq.practice.galleryNext}
          disabled={index >= slides.length - 1}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-xl text-white disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}

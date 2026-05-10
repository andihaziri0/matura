'use client';

import React from 'react';
import { MatematikeChapters, Sq } from '@matura/shared';

export type PracticeBankSourceFilter = 'all' | 'foto' | 'gjeneruar';

interface PracticeBankSidebarFiltersProps {
  topicPath: string | undefined;
  onTopicPath: (path: string | undefined) => void;
  source: PracticeBankSourceFilter;
  onSource: (source: PracticeBankSourceFilter) => void;
  searchDraft: string;
  onSearchDraft: (value: string) => void;
  examMode: boolean;
  onExamMode: (value: boolean) => void;
}

/**
 * Bank filters in the left sidebar — mobile-first single column, full-width fields.
 */
export function PracticeBankSidebarFilters({
  topicPath,
  onTopicPath,
  source,
  onSource,
  searchDraft,
  onSearchDraft,
  examMode,
  onExamMode,
}: PracticeBankSidebarFiltersProps): React.ReactElement {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <label className="block w-full min-w-0 text-sm">
        <span className="font-medium text-[var(--color-fg)]">{Sq.sq.practice.chooseChapter}</span>
        <select
          className="mt-1.5 box-border w-full min-h-[48px] min-w-0 appearance-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 pr-9 text-base text-[var(--color-fg)] md:min-h-0 md:py-2.5 md:text-sm"
          value={topicPath ?? ''}
          onChange={(e) => onTopicPath(e.target.value === '' ? undefined : e.target.value)}
        >
          <option value="">{Sq.sq.practice.allChapters}</option>
          {MatematikeChapters.MATEMATIKE_PRACTICE_CHAPTERS.map((c) => (
            <option key={c.id} value={c.topicPath}>
              {c.nameSq}
            </option>
          ))}
        </select>
      </label>

      <label className="block w-full min-w-0 text-sm">
        <span className="font-medium text-[var(--color-fg)]">{Sq.sq.question.source}</span>
        <select
          className="mt-1.5 box-border w-full min-h-[48px] min-w-0 appearance-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 pr-9 text-base text-[var(--color-fg)] md:min-h-0 md:py-2.5 md:text-sm"
          value={source}
          onChange={(e) => onSource(e.target.value as PracticeBankSourceFilter)}
        >
          <option value="all">{Sq.sq.practice.sourceAll}</option>
          <option value="foto">{Sq.sq.practice.sourceFoto}</option>
          <option value="gjeneruar">{Sq.sq.practice.sourceGjeneruar}</option>
        </select>
      </label>

      <label className="block w-full min-w-0 text-sm">
        <span className="font-medium text-[var(--color-fg)]">{Sq.sq.common.search}</span>
        <input
          type="search"
          enterKeyHint="search"
          value={searchDraft}
          onChange={(e) => onSearchDraft(e.target.value)}
          placeholder={Sq.sq.practice.bankSearchPlaceholder}
          className="mt-1.5 box-border w-full min-h-[48px] min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-base text-[var(--color-fg)] md:min-h-0 md:py-2.5 md:text-sm"
        />
      </label>

      <label className="flex min-h-[48px] w-full cursor-pointer items-start gap-3 text-sm md:min-h-0">
        <input
          type="checkbox"
          checked={examMode}
          onChange={(e) => onExamMode(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[var(--color-border)]"
        />
        <span className="text-base leading-snug text-[var(--color-fg)] md:text-sm">
          {Sq.sq.practice.examMode}
        </span>
      </label>

      <p className="text-xs leading-relaxed text-[var(--color-fg-muted)]">{Sq.sq.practice.examModeHintBank}</p>
    </div>
  );
}

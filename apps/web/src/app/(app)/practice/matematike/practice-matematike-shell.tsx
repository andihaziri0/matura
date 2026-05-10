'use client';

import React, { useEffect, useState } from 'react';
import { Sq } from '@matura/shared';
import { PracticeBank } from './practice-bank';
import type { PracticeBankSourceFilter } from './practice-bank-sidebar-filters';
import { PracticeBankSidebarFilters } from './practice-bank-sidebar-filters';
import { PracticeMatematikeHeader } from './practice-matematike-header';
import { PracticeRunner } from './practice-runner';

type Tab = 'session' | 'bank';

export function PracticeMatematikeShell(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('session');

  const [bankTopicPath, setBankTopicPath] = useState<string | undefined>(undefined);
  const [bankSource, setBankSource] = useState<PracticeBankSourceFilter>('all');
  const [bankSearchDraft, setBankSearchDraft] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [bankExamMode, setBankExamMode] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setBankSearch(bankSearchDraft.trim()), 320);
    return () => window.clearTimeout(t);
  }, [bankSearchDraft]);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] w-full flex-col">
      <PracticeMatematikeHeader />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={
            'flex w-full min-w-0 shrink-0 flex-col border-[var(--color-border)] bg-[var(--color-bg-elevated)] ' +
            'border-b shadow-[0_1px_0_rgba(46,46,140,0.06)] ' +
            'md:w-72 md:border-b-0 md:border-r-2 md:shadow-[inset_-1px_0_0_rgba(46,46,140,0.12)]'
          }
        >
          <nav className="flex w-full flex-col gap-1.5 p-2 pt-3 md:p-3 md:pt-4">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-muted)]">
              {Sq.sq.practice.sidebarNavLabel}
            </p>
            <button
              type="button"
              onClick={() => setTab('session')}
              className={`min-h-[48px] w-full rounded-r-lg border-l-4 py-3 pl-3 pr-3 text-left text-base font-semibold transition md:min-h-[44px] md:py-2.5 md:text-sm ${
                tab === 'session'
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)] shadow-sm'
                  : 'border-transparent text-[var(--color-fg-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]'
              }`}
              aria-current={tab === 'session' ? 'page' : undefined}
            >
              {Sq.sq.practice.tabSession}
            </button>
            <button
              type="button"
              onClick={() => setTab('bank')}
              className={`min-h-[48px] w-full rounded-r-lg border-l-4 py-3 pl-3 pr-3 text-left text-base font-semibold transition md:min-h-[44px] md:py-2.5 md:text-sm ${
                tab === 'bank'
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)] shadow-sm'
                  : 'border-transparent text-[var(--color-fg-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]'
              }`}
              aria-current={tab === 'bank' ? 'page' : undefined}
            >
              {Sq.sq.practice.tabBank}
            </button>
          </nav>

          {tab === 'bank' && (
            <div className="min-h-0 min-w-0 border-t border-[var(--color-border)] px-2 pb-4 pt-3 md:px-3">
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-muted)]">
                {Sq.sq.practice.bankSidebarFiltersTitle}
              </p>
              <PracticeBankSidebarFilters
                topicPath={bankTopicPath}
                onTopicPath={setBankTopicPath}
                source={bankSource}
                onSource={setBankSource}
                searchDraft={bankSearchDraft}
                onSearchDraft={setBankSearchDraft}
                examMode={bankExamMode}
                onExamMode={setBankExamMode}
              />
            </div>
          )}
        </aside>
        <div className="relative min-h-0 min-w-0 flex-1 bg-[var(--color-bg)]">
          {tab === 'session' ? (
            <PracticeRunner />
          ) : (
            <PracticeBank
              topicPath={bankTopicPath}
              source={bankSource}
              search={bankSearch}
              examMode={bankExamMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

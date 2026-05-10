'use client';

import React, { useState } from 'react';
import { Sq } from '@matura/shared';
import { PracticeBank } from './practice-bank';
import { PracticeMatematikeHeader } from './practice-matematike-header';
import { PracticeRunner } from './practice-runner';

type Tab = 'session' | 'bank';

export function PracticeMatematikeShell(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('session');

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] w-full flex-col">
      <PracticeMatematikeHeader />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={
            'flex shrink-0 flex-col border-[var(--color-border)] bg-[var(--color-bg-elevated)] ' +
            'border-b shadow-[0_1px_0_rgba(46,46,140,0.06)] ' +
            'md:w-56 md:border-b-0 md:border-r-2 md:shadow-[inset_-1px_0_0_rgba(46,46,140,0.12)]'
          }
        >
          <nav className="flex w-full flex-1 flex-col gap-1.5 p-2 md:p-3 md:pt-4">
            <p className="hidden px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-muted)] md:block">
              {Sq.sq.practice.sidebarNavLabel}
            </p>
            <button
              type="button"
              onClick={() => setTab('session')}
              className={`min-h-[44px] w-full rounded-r-lg border-l-4 py-2.5 pl-3 pr-3 text-left text-sm font-semibold transition md:pl-3 ${
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
              className={`min-h-[44px] w-full rounded-r-lg border-l-4 py-2.5 pl-3 pr-3 text-left text-sm font-semibold transition md:pl-3 ${
                tab === 'bank'
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)] shadow-sm'
                  : 'border-transparent text-[var(--color-fg-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]'
              }`}
              aria-current={tab === 'bank' ? 'page' : undefined}
            >
              {Sq.sq.practice.tabBank}
            </button>
          </nav>
        </aside>
        <div className="relative min-h-0 min-w-0 flex-1 bg-[var(--color-bg)]">
          {tab === 'session' ? <PracticeRunner /> : <PracticeBank />}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Sq } from '@matura/shared';
import { PracticeBank } from './practice-bank';
import { PracticeRunner } from './practice-runner';

type Tab = 'session' | 'bank';

export function PracticeMatematikeShell(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('session');

  return (
    <div className="flex w-full min-h-[calc(100dvh-4rem)] flex-col sm:flex-row">
      <aside
        className={
          'w-full shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] ' +
          'sm:sticky sm:top-16 sm:z-10 sm:w-52 sm:self-start sm:border-b-0 sm:border-r ' +
          'sm:max-h-[calc(100dvh-4rem)] sm:overflow-y-auto'
        }
      >
        <nav className="flex flex-col gap-1 p-2 sm:p-3" aria-label="Matematikë">
          <button
            type="button"
            onClick={() => setTab('session')}
            className={`min-h-[44px] w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
              tab === 'session'
                ? 'bg-[var(--color-brand)] text-[var(--color-brand-fg)] shadow-sm'
                : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
            }`}
            aria-current={tab === 'session' ? 'page' : undefined}
          >
            {Sq.sq.practice.tabSession}
          </button>
          <button
            type="button"
            onClick={() => setTab('bank')}
            className={`min-h-[44px] w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
              tab === 'bank'
                ? 'bg-[var(--color-brand)] text-[var(--color-brand-fg)] shadow-sm'
                : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
            }`}
            aria-current={tab === 'bank' ? 'page' : undefined}
          >
            {Sq.sq.practice.tabBank}
          </button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{tab === 'session' ? <PracticeRunner /> : <PracticeBank />}</div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Sq } from '@matura/shared';
import { PracticeBank } from './practice-bank';
import { PracticeRunner } from './practice-runner';

type Tab = 'session' | 'bank';

export function PracticeMatematikeShell(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('session');

  return (
    <>
      <div className="mx-auto flex max-w-3xl gap-1 border-b border-[var(--color-border)] px-4 pb-2 pt-3 sm:gap-2">
        <button
          type="button"
          onClick={() => setTab('session')}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
            tab === 'session'
              ? 'bg-[var(--color-brand)] text-[var(--color-brand-fg)] shadow-sm'
              : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
          }`}
        >
          {Sq.sq.practice.tabSession}
        </button>
        <button
          type="button"
          onClick={() => setTab('bank')}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
            tab === 'bank'
              ? 'bg-[var(--color-brand)] text-[var(--color-brand-fg)] shadow-sm'
              : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]'
          }`}
        >
          {Sq.sq.practice.tabBank}
        </button>
      </div>
      {tab === 'session' ? <PracticeRunner /> : <PracticeBank />}
    </>
  );
}

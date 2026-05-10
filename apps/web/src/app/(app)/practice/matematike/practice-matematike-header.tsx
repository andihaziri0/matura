'use client';

import React from 'react';
import { Sq } from '@matura/shared';

export function PracticeMatematikeHeader(): React.ReactElement {
  return (
    <header className="sticky top-16 z-20 w-full shadow-[0_2px_14px_rgba(46,46,140,0.2)]">
      <div className="w-full bg-gradient-to-br from-[#2E2E8C] via-[#1e1f6e] to-[#4545b8] px-4 py-5 text-white sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-lg font-bold tracking-wide sm:text-xl">
            {Sq.sq.practice.matematikeHeaderTitle}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-white/90">{Sq.sq.practice.matematikeHeaderSubtitle}</p>
          <p className="mt-0.5 text-xs text-white/80">{Sq.sq.app.brandTagline}</p>
        </div>
      </div>
    </header>
  );
}

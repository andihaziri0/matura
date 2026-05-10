import React from 'react';
import { PracticeMatematikeShell } from './practice-matematike-shell';

export default function PracticeMatematikePage(): React.ReactElement {
  return (
    <div className="relative min-h-full isolate">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[url('/akademia-as-logo.png')] bg-center bg-no-repeat opacity-[0.045]"
        style={{ backgroundSize: 'min(90vw, 420px)' }}
      />
      <div className="relative z-10">
        <PracticeMatematikeShell />
      </div>
    </div>
  );
}

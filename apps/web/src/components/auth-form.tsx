import React from 'react';
import { Sq } from '@matura/shared';
import { Logo } from '@/components/logo';

export function AuthShell({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="lg" withWordmark={false} priority />
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--color-fg)] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)]/70 transition focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30';

export const primaryBtnCls =
  'w-full rounded-md bg-[var(--color-brand)] px-3 py-2.5 text-sm font-semibold text-[var(--color-brand-fg)] shadow-sm transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60';

export const googleBtnCls =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-sm font-medium text-[var(--color-fg)] inline-flex items-center justify-center gap-2 transition hover:border-[var(--color-fg-muted)]/40 hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60';

export function Divider(): React.ReactElement {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-fg-muted)]">
      <span className="h-px flex-1 bg-[var(--color-border)]" />
      <span>{Sq.sq.auth.orDivider}</span>
      <span className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }): React.ReactElement {
  return (
    <p className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
      {message}
    </p>
  );
}

export function GoogleIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-2 3.018v2.51h3.236c1.89-1.74 2.982-4.305 2.982-7.351z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.236-2.51c-.895.6-2.04.955-3.382.955-2.605 0-4.81-1.76-5.595-4.122H3.064v2.59A9.997 9.997 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.405 13.9A6.01 6.01 0 0 1 6.09 12c0-.66.114-1.302.314-1.9V7.51H3.064A10.003 10.003 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.504 3.823 1.495l2.868-2.868C16.96 2.99 14.695 2 12 2 8.094 2 4.722 4.246 3.064 7.51l3.341 2.59C7.19 7.737 9.395 5.977 12 5.977z"
      />
    </svg>
  );
}

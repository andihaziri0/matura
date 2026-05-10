'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

type LogoSize = 'sm' | 'md' | 'lg';

const sizes: Record<LogoSize, { px: number; cls: string }> = {
  sm: { px: 32, cls: 'h-8 w-8' },
  md: { px: 40, cls: 'h-10 w-10' },
  lg: { px: 64, cls: 'h-16 w-16' },
};

interface LogoProps {
  size?: LogoSize;
  href?: string | null;
  withWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  priority?: boolean;
}

/**
 * AkademiaAS logo. Defaults to a clickable lockup that links to "/".
 * Pass `href={null}` to render a static, non-linked logo (e.g. inside a hero
 * panel that already lives on the homepage).
 */
export function Logo({
  size = 'md',
  href = '/',
  withWordmark = true,
  className,
  wordmarkClassName,
  priority = false,
}: LogoProps): React.ReactElement {
  const { px, cls } = sizes[size];
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href || pathname !== href) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mark = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/akademia-as-logo.png"
        alt="AkademiaAS"
        width={px}
        height={px}
        priority={priority}
        className={cn('rounded-full shrink-0', cls)}
      />
      {withWordmark && (
        <span
          className={cn(
            'font-bold tracking-tight leading-none',
            size === 'sm' && 'text-base',
            size === 'md' && 'text-lg',
            size === 'lg' && 'text-2xl',
            wordmarkClassName,
          )}
        >
          Akademia<span className="text-[var(--color-brand)]">AS</span>
        </span>
      )}
    </span>
  );

  if (!href) return mark;
  return (
    <Link
      href={href}
      onClick={handleClick}
      className="inline-flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/60"
      aria-label="AkademiaAS — Ballina"
    >
      {mark}
    </Link>
  );
}

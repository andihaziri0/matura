import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sq } from '@matura/shared';
import { ArrowRight, Sparkles, MessagesSquare, Layers } from 'lucide-react';

export default function HomePage(): React.ReactElement {
  return (
    <>
      <Hero />
      <Features />
      <FinalCta />
    </>
  );
}

function Hero(): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-[var(--color-brand)] text-white">
      <DecorativeBlobs />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 lg:py-28 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide uppercase text-white/90 ring-1 ring-inset ring-white/20">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {Sq.sq.marketing.heroEyebrow}
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
            {Sq.sq.marketing.heroTitle}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto lg:mx-0">
            {Sq.sq.marketing.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              href="/practice/matematike"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand)] shadow-sm hover:bg-white/90 transition"
            >
              {Sq.sq.marketing.ctaStart}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium text-white ring-1 ring-inset ring-white/30 hover:bg-white/10 transition"
            >
              {Sq.sq.marketing.ctaSignIn}
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 -m-6 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="relative rounded-full bg-white/5 p-6 ring-1 ring-inset ring-white/15">
              <Image
                src="/akademia-as-logo.png"
                alt="AkademiaAS"
                width={280}
                height={280}
                priority
                className="rounded-full shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DecorativeBlobs(): React.ReactElement {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
}

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  body: string;
}

function Features(): React.ReactElement {
  const items: FeatureItem[] = [
    {
      icon: <Sparkles className="h-5 w-5" aria-hidden />,
      title: Sq.sq.marketing.feature1Title,
      body: Sq.sq.marketing.feature1Body,
    },
    {
      icon: <MessagesSquare className="h-5 w-5" aria-hidden />,
      title: Sq.sq.marketing.feature2Title,
      body: Sq.sq.marketing.feature2Body,
    },
    {
      icon: <Layers className="h-5 w-5" aria-hidden />,
      title: Sq.sq.marketing.feature3Title,
      body: Sq.sq.marketing.feature3Body,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {Sq.sq.marketing.featuresTitle}
        </h2>
        <p className="mt-3 text-[var(--color-fg-muted)]">{Sq.sq.marketing.featuresSubtitle}</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
              {it.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta(): React.ReactElement {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
      <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand-soft)] to-[var(--color-bg-elevated)] p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {Sq.sq.marketing.finalCtaTitle}
        </h2>
        <p className="mt-2 text-[var(--color-fg-muted)] max-w-xl mx-auto">
          {Sq.sq.marketing.finalCtaBody}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-[var(--color-brand-fg)] hover:bg-[var(--color-brand-strong)] transition"
          >
            {Sq.sq.nav.signUp}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/practice/matematike"
            className="inline-flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-3 text-sm font-medium hover:border-[var(--color-brand)]/30 transition"
          >
            {Sq.sq.marketing.ctaStart}
          </Link>
        </div>
      </div>
    </section>
  );
}

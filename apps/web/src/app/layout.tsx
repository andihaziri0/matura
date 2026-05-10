import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';

/** Open Graph / canonical URLs: set `NEXT_PUBLIC_SITE_URL` to prod (e.g. https://matura.akademiaas.com). */
function metadataBaseUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (explicit) return new URL(`${explicit}/`);
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}/`);
  return new URL('http://localhost:3000/');
}

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: Sq.sq.app.name,
  description: Sq.sq.app.tagline,
};

/** Required for mobile layout; without it Safari/Chrome use a ~980px canvas and Tailwind can look “unstyled”. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#13162e' },
    { color: '#f4f6fb' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="sq" className={jakarta.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

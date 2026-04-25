import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { Sq } from '@matura/shared';

export const metadata: Metadata = {
  title: Sq.sq.app.name,
  description: Sq.sq.app.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="sq">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

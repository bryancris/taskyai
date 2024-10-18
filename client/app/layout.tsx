import * as React from 'react';
import dynamic from 'next/dynamic';

import type { Metadata } from 'next';
import { inter } from '@/styles/fonts';
import { config } from '@/lib/config';
import '@/styles/globals.css';

import { ToastProvider } from '@/components/providers/toast-provider';

// eslint-disable-next-line prefer-destructuring
export const metadata: Metadata = config.metadata;

const ThemeProvider = dynamic(
  () => import('@/components/providers/theme-provider').then((mod) => mod.ThemeProvider),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="dark"
          attribute="class"
          enableSystem
          disableTransitionOnChange
        >
          <main>
            {children}
            <ToastProvider />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

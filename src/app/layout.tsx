import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { locales, type Locale } from '@/lib/i18n/config';
import '@/styles/tokens.css';

export const metadata: Metadata = {
  title: 'A-Lin-Ein — The Lighthouse',
  description: 'AI Career & Skills Discovery Navigator for Burmese youth.',
  applicationName: 'A-Lin-Ein',
  manifest: '/manifest.webmanifest',
  themeColor: '#d4a017',
  appleWebApp: {
    capable: true,
    title: 'A-Lin-Ein',
    statusBarStyle: 'default',
  },
};

export function generateStaticOptions() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;500;700&family=Noto+Serif+Myanmar:wght@400;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
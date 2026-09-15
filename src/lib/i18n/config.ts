export const locales = ['my', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'my';
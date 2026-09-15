import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('site');
  const tQuest = useTranslations('quest');
  const tAtlas = useTranslations('atlas');

  return (
    <main className="page">
      <header className="hero">
        <h1 className="title">{t('name')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
        <p className="tagline">{t('tagline')}</p>
        <p className="intro">{t('intro')}</p>
        <div className="cta">
          <Link href={`/${useLocale()}/quest/mm-power-at-the-monastery`} className="btn">
            {t('cta_quest')}
          </Link>
          <Link href={`/${useLocale()}/atlas`} className="btn-secondary">
            {t('cta_atlas')}
          </Link>
        </div>
      </header>

      <section className="boundaries">
        <p>{t('boundaries')}</p>
      </section>
    </main>
  );
}

// Use the route locale
import { useLocale } from 'next-intl';
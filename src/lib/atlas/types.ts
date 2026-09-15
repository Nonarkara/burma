/**
 * Atlas entry — a single verified training, scholarship, job, or apprenticeship.
 *
 * The "verified" claim must be backed by:
 *  - `source` — where the data came from (an authority, not a scraped listing)
 *  - `verifiedAt` — last manual or system check that the listing is still active
 *  - `accreditedBy` — for trainings: a recognized accreditor (TVET, depa, etc.)
 */

export type Locale = 'my' | 'en' | 'th';

export type AtlasEntry = {
  id: string;
  type: 'course' | 'scholarship' | 'job' | 'apprenticeship';
  title: Record<Locale, string>;
  provider: string;
  accreditedBy?: string | null;
  location: {
    country: 'MM' | 'TH' | 'other';
    city?: string;
    remote?: boolean;
  };
  languages: Locale[];
  cost: {
    amount: number | null;
    currency: 'THB' | 'MMK' | 'USD' | null;
    free: boolean;
  };
  durationWeeks?: number | null;
  tags: string[];
  /** Maps to dominant Trait from quest outcomes. */
  primaryTrait?: 'systems_thinking' | 'empathy' | 'analytical_grit' | 'collaboration';
  applyUrl: string;
  verifiedAt: string; // ISO date
  source: string;     // 'ilo_isco', 'depa_thailand', 'unesco_bangkok', 'asean_skills', 'manual'
};

export type AtlasQuery = {
  type?: AtlasEntry['type'];
  country?: AtlasEntry['location']['country'];
  language?: Locale;
  trait?: AtlasEntry['primaryTrait'];
  tag?: string;
  free?: boolean;
  remote?: boolean;
  limit?: number;
};
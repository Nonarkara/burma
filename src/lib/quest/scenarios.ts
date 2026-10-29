import type { Quest } from './types';
import {
  SCENARIOS as CANONICAL_SCENARIOS,
  TRAITS as CANONICAL_TRAITS,
  TRAIT_LABELS as CANONICAL_TRAIT_LABELS,
  scoreQuest as canonicalScoreQuest,
  dominantOutcome as canonicalDominantOutcome,
  scenarioById as canonicalScenarioById,
} from '../../../functions/data/quest-scenarios.js';

/**
 * Quest scenario catalogue — one source of truth.
 *
 * The data itself lives in functions/data/quest-scenarios.js, which is the
 * file the Cloudflare Pages Function serves (/api/quest/scenarios) and scores
 * against (/api/quest/<id>/submit). This module only re-exports it, so the
 * Next.js route and the deployed Pages app can never hold different
 * scenarios.
 *
 * The cast below is a typing shim, not a data copy: the canonical file is
 * plain ESM JavaScript so TypeScript infers `locale: string` where the Quest
 * type wants the `Locale` union. The runtime values are identical.
 *
 * CULTURAL NOTE: the Burmese copy is machine-drafted and still needs a
 * Burmese-native review before publication — docs/REVIEW-PACKET.md.
 */

export const SAMPLE_SCENARIOS = CANONICAL_SCENARIOS as unknown as Quest[];
export const SCENARIOS = SAMPLE_SCENARIOS;
export const TRAITS = CANONICAL_TRAITS;
export const TRAIT_LABELS = CANONICAL_TRAIT_LABELS;

export const scoreQuest = canonicalScoreQuest;
export const dominantOutcome = canonicalDominantOutcome;
export const scenarioById = canonicalScenarioById;

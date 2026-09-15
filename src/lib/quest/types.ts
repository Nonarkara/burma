/**
 * Quest data model — TKCX lineage adapted for Burmese youth context.
 *
 * Traits map loosely to Horizon 45 rubric axes but adapted for life-skill
 * problem-solving (not executive judgment). Names are kept abstract so they
 * read cleanly in Burmese translation.
 */

export type Locale = 'my' | 'en';

export type Trait =
  | 'systems_thinking'   // sees parts + whole, anticipates side-effects
  | 'empathy'            // weighs others' stakes, includes the unheard
  | 'analytical_grit'    // stays with a problem, separates signal from noise
  | 'collaboration';     // finds win-wins, builds on others' contributions

export const TRAITS: readonly Trait[] = [
  'systems_thinking',
  'empathy',
  'analytical_grit',
  'collaboration',
] as const;

export type TraitWeights = Record<Trait, number>; // each weight in [-2, +2]

export type Choice = {
  id: string;
  label: { my: string; en: string };
  rationale?: { my: string; en: string }; // optional explainer shown AFTER selection
  tradeoffs: TraitWeights;
};

export type Outcome = {
  id: string;
  trait: Trait;
  /** What we say about the player when this outcome is the strongest signal. */
  reflection: { my: string; en: string };
};

export type Quest = {
  id: string;
  version: number;
  /** Default locale. The runtime always serves the user's active locale. */
  locale: Locale;
  title: { my: string; en: string };
  /** 2-3 sentences setting the scene. Burmese-script-natural. */
  premise: { my: string; en: string };
  /** Explicit limits the player must respect. */
  constraints: { my: string[]; en: string[] };
  /** Optional persona the player speaks as. */
  role?: { my: string; en: string };
  choices: Choice[];
  outcomes: Outcome[];
  estimatedMinutes: number;
  /** Tags map to atlas entries. */
  tags: string[];
};

export type QuestSubmission = {
  questId: string;
  questVersion: number;
  /** Order of selection (only the final choice matters for scoring; order kept for analytics). */
  selectionPath: string[];
  startedAt: string; // ISO
  completedAt: string; // ISO
};

export type QuestResult = {
  submission: QuestSubmission;
  weights: TraitWeights;
  /** The strongest single trait, surfaced in the mentor chat. */
  dominantTrait: Trait;
};
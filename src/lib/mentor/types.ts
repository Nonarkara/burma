/**
 * Mentor (A-Lin-Ein conversational companion) types.
 *
 * SAFETY CONTRACT (binding):
 *  - Crisis keywords (self-harm, exploitation, trafficking, deportation fear)
 *    MUST route to `Escalation` before any model reply is returned.
 *  - The model is never the only safety layer.
 */

export type Locale = 'my' | 'en';

export type MentorMessage = {
  role: 'user' | 'mentor' | 'system';
  content: string;
  locale: Locale;
  at: string; // ISO timestamp
};

export type MentorContext = {
  userId: string;
  locale: Locale;
  /** Most recent dominant trait from the last completed quest. */
  recentTrait?: 'systems_thinking' | 'empathy' | 'analytical_grit' | 'collaboration';
  /** Atlas entries already shown to the user in this session. */
  seenAtlasIds?: string[];
};

export type EscalationReason =
  | 'self_harm'
  | 'exploitation'
  | 'trafficking'
  | 'deportation_fear'
  | 'other_crisis';

export type Escalation = {
  reason: EscalationReason;
  /** Local-language hotlines — must be in Burmese when locale='my'. */
  hotlines: Array<{ name: string; contact: string; language: Locale[] }>;
  /** Plain Burmese-language instruction for the user. */
  message: { my: string; en: string };
};

export type MentorReply =
  | { kind: 'reply'; content: { my: string; en: string } }
  | { kind: 'escalate'; escalation: Escalation };

export type MentorTurn = {
  userMessage: MentorMessage;
  reply: MentorReply;
};
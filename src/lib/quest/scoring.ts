import { TRAITS, type Quest, type QuestSubmission, type Trait, type TraitWeights, type QuestResult } from './types';

export function scoreQuest(quest: Quest, submission: QuestSubmission): QuestResult {
  const weights: TraitWeights = {
    systems_thinking: 0,
    empathy: 0,
    analytical_grit: 0,
    collaboration: 0,
  };

  // Only the final selection in the path matters for scoring; earlier selections
  // are kept for analytics (e.g., did the player change their mind?).
  const finalChoiceId = submission.selectionPath[submission.selectionPath.length - 1];
  const choice = quest.choices.find((c) => c.id === finalChoiceId);

  if (choice) {
    for (const t of TRAITS) weights[t] += choice.tradeoffs[t];
  }

  const dominantTrait: Trait = TRAITS.reduce(
    (acc, t) => (weights[t] > weights[acc] ? t : acc),
    TRAITS[0],
  );

  return {
    submission,
    weights,
    dominantTrait,
  };
}
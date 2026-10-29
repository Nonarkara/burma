// Cloudflare Pages Function — quest submission endpoint for Career Navigator.
// Receives a quest submission, scores it server-side, returns the result.
// No PII stored. No model calls. Pure scoring from the scenario data.

import { scenarioById, scoreQuest, dominantOutcome } from '../../data/quest-scenarios.js';

const SubmissionSchema = (body) => {
  if (!body || typeof body !== 'object') return null;
  const { questId, questVersion, selectionPath, startedAt, completedAt } = body;
  if (typeof questId !== 'string') return null;
  if (typeof questVersion !== 'number') return null;
  if (!Array.isArray(selectionPath) || !selectionPath.every((s) => typeof s === 'string')) return null;
  if (typeof startedAt !== 'string' || typeof completedAt !== 'string') return null;
  return { questId, questVersion, selectionPath, startedAt, completedAt };
};

export async function onRequestPost(context) {
  const { id: questId } = context.params || {};
  const quest = scenarioById(questId);
  if (!quest) {
    return new Response(JSON.stringify({ error: 'quest_not_found' }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const parsed = SubmissionSchema(body);
  if (!parsed) {
    return new Response(JSON.stringify({ error: 'invalid_submission' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const result = scoreQuest(quest, parsed.selectionPath);
  const outcome = dominantOutcome(quest, result.dominant);

  return new Response(
    JSON.stringify({
      ok: true,
      submission: {
        questId: parsed.questId,
        questVersion: parsed.questVersion,
        selectionPath: parsed.selectionPath,
        startedAt: parsed.startedAt,
        completedAt: parsed.completedAt,
      },
      weights: result.weights,
      dominantTrait: result.dominant,
      reflection: outcome.reflection,
      choiceId: result.choice ? result.choice.id : null,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}

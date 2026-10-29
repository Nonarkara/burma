// Cloudflare Pages Function — Career Navigator scenario catalogue.
//
// Serves the canonical scenario data from functions/data/quest-scenarios.js.
// The client has no second copy of this data; it fetches it from here. That
// is what stops the browser and the server from drifting apart.
//
// Public, aggregate, no PII. Cacheable for five minutes.

import { SCENARIOS, TRAITS, TRAIT_LABELS } from '../../data/quest-scenarios.js';

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      traits: TRAITS,
      traitLabels: TRAIT_LABELS,
      scenarios: SCENARIOS,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    },
  );
}

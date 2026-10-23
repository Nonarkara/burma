// Cloudflare Pages Function — honest health probe for the static surface.
// Reports what actually exists here: the three Functions and their job.
// Storage health (D1/R2/DO) lives on the chat worker — pirchchat-chat
// .workers.dev/api/health — never faked from the static side.

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      surface: 'pages-static',
      functions: ['news', 'trends', 'preview', 'health'],
      chatWorker: 'https://pirchchat-chat.drnon.workers.dev/api/health',
      ts: new Date().toISOString(),
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

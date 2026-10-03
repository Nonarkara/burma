/**
 * RateLimiterDO — persistent per-key sliding-window rate limiter.
 *
 * Module-level Maps reset per Workers isolate, so an upload flood spread
 * across isolates defeats them. All upload requests route through ONE
 * instance of this DO (idFromName('uploads')), which keeps its counters in
 * durable per-DO storage — they survive isolate restarts and hibernation.
 */

export class RateLimiterDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const key = (url.searchParams.get('key') || 'anon').slice(0, 140);
    const windowMs = Math.max(1, Math.min(Number(url.searchParams.get('window')) || 3600000, 3600000));
    const max = Math.max(1, Math.min(Math.floor(Number(url.searchParams.get('max')) || 10), 1000));
    const now = Date.now();

    const storageKey = 't:' + key;
    return this.state.storage.transaction(async (storage) => {
    let times = (await storage.get(storageKey)) || [];
    times = times.filter((t) => now - t < windowMs);
    if (times.length >= max) {
      return jsonResponse({ ok: false, remaining: 0 }, 429);
    }
    times.push(now);
    await storage.put(storageKey, times);
    if (await storage.getAlarm() === null) await storage.setAlarm(now + 3600000);
    return jsonResponse({ ok: true, remaining: max - times.length }, 200);
    });
  }

  async alarm() {
    // Bound retention of network counters; no indefinite per-IP archive.
    const now = Date.now();
    await this.state.storage.transaction(async (storage) => {
      let startAfter;
      let retained = false;
      while (true) {
        const rows = await storage.list({ prefix: 't:', limit: 128, ...(startAfter ? { startAfter } : {}) });
        if (!rows.size) break;
        for (const [key, times] of rows) {
          startAfter = key;
          if (!times.some((t) => now - t < 3600000)) await storage.delete(key);
          else retained = true;
        }
      }
      if (retained) await storage.setAlarm(now + 3600000);
    });
  }
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

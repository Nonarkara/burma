/**
 * RateLimiterDO — one SQLite object for every upload counter.
 *
 * Module-level Maps reset per Workers isolate, so an upload flood spread
 * across isolates defeats them. All upload requests route through ONE
 * instance (idFromName('uploads')). The worker sends a hash of the
 * network address; this object does not need the address itself.
 *
 * Requests are serialized so two callers cannot both take the last slot.
 * The worker maps the decision onto HTTP. This object always returns JSON.
 */

import { bangkokDay, consumeLimit, normalizeIp } from './limits.js';

export class RateLimiterDO {
  constructor(state) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request) {
    let body = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }
    if (!body || typeof body !== 'object') {
      return jsonResponse({ ok: false, reason: 'limiter_unavailable', retryAfter: 30 });
    }

    const consume = () => this.consume(body);
    let decision;
    try {
      decision = this.state.blockConcurrencyWhile
        ? await this.state.blockConcurrencyWhile(consume)
        : await consume();
    } catch {
      return jsonResponse({ ok: false, reason: 'limiter_unavailable', retryAfter: 30 });
    }

    return jsonResponse({
      ok: Boolean(decision.ok),
      reason: decision.reason || null,
      retryAfter: decision.retryAfter || 0,
    });
  }

  async consume(body) {
    const ip = normalizeIp(body.ip);
    const now = Number.isFinite(body.now) ? body.now : Date.now();
    const [storedGlobal, storedMeta, storedIp] = await Promise.all([
      this.storage.get('global'),
      this.storage.get('meta'),
      this.storage.get('ip:' + ip),
    ]);

    const state = {
      globalDay: (storedGlobal && storedGlobal.day) || '',
      globalCount: Number(storedGlobal && storedGlobal.count) || 0,
      trackedDay: (storedMeta && storedMeta.day) || '',
      tracked: Number(storedMeta && storedMeta.tracked) || 0,
      ips: storedIp ? { [ip]: storedIp } : {},
    };

    const result = consumeLimit(state, {
      ip,
      now,
      limits: body.limits,
      phase: body.phase,
      maxTrackedIps: body.maxTrackedIps,
    });

    if (result.writes) {
      const jobs = [];
      if (result.writes.ip) jobs.push(this.storage.put('ip:' + ip, result.writes.ip));
      if (result.writes.global) jobs.push(this.storage.put('global', result.writes.global));
      if (result.writes.meta) jobs.push(this.storage.put('meta', result.writes.meta));
      await Promise.all(jobs);
    }
    await this.ensureAlarm(now);
    return result;
  }

  async ensureAlarm(now) {
    if (!this.storage.getAlarm || !this.storage.setAlarm) return;
    if (await this.storage.getAlarm() == null) {
      await this.storage.setAlarm(now + 24 * 60 * 60 * 1000);
    }
  }

  async alarm() {
    const now = Date.now();
    const day = bangkokDay(now);
    const retained = await this.expirePrefix('ip:', (rec) => rec && rec.day === day);
    await this.expirePrefix('t:', () => false);
    if (retained) await this.ensureAlarm(now);
  }

  async expirePrefix(prefix, keep) {
    let startAfter;
    let retained = false;
    while (true) {
      const rows = await this.storage.list({
        prefix,
        limit: 128,
        ...(startAfter ? { startAfter } : {}),
      });
      if (!rows || !rows.size) break;
      for (const [key, value] of rows) {
        startAfter = key;
        if (keep(value)) retained = true;
        else await this.storage.delete(key);
      }
      if (rows.size < 128) break;
    }
    return retained;
  }
}

function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

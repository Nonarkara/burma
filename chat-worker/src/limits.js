// Counters for POST /api/upload.
//
// R2 will keep accepting writes with no hard account spend cap, so the
// worker refuses an upload that is off-site, over a per-connection limit,
// or over the daily cap for the whole site. The day resets at midnight
// in Asia/Bangkok, where the community is.

export const DEFAULT_LIMITS = {
  perIpPerMinute: 6,
  perIpPerDay: 20,
  globalPerDay: 100,
};

export const DEFAULT_MAX_UPLOAD_BYTES = 700 * 1024;

export const MAX_CONFIGURABLE_UPLOAD_BYTES = 2 * 1024 * 1024;

export const MULTIPART_SLACK_BYTES = 64 * 1024;

export const DEFAULT_ALLOWED_ORIGINS = [
  'https://burma.nonarkara.org',
  'https://burma-a3k.pages.dev',
];

export const MAX_TRACKED_IPS = 4096;

export const MESSAGES = {
  per_minute: 'Too many images from this connection. Please wait a minute and try again.',
  per_day: "This connection has reached today's upload limit. Please come back tomorrow.",
  global_day: "Image uploads have reached today's limit. Please come back tomorrow.",
  crowded: 'Uploads are busy right now. Please try again in a little while.',
  origin: 'Uploads are only accepted from the Pirchchat site.',
  limiter_unavailable: 'Uploads are paused for a moment. Please try again shortly.',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function emptyLimitState() {
  return { globalDay: '', globalCount: 0, trackedDay: '', tracked: 0, ips: {} };
}

export function bangkokDay(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(now));
  const pick = (type) => parts.find((part) => part.type === type).value;
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

export function secondsUntilBangkokMidnight(now) {
  const start = Date.parse(`${bangkokDay(now)}T00:00:00+07:00`);
  const next = start + DAY_MS;
  return Math.max(1, Math.ceil((next - now) / 1000));
}

function readInt(value, fallback, max = 1_000_000) {
  if (value == null || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0 || n > max) return fallback;
  return Math.floor(n);
}

export function readLimits(env = {}) {
  return {
    perIpPerMinute: readInt(env.RATE_LIMIT_PER_MINUTE, DEFAULT_LIMITS.perIpPerMinute),
    perIpPerDay: readInt(env.RATE_LIMIT_PER_DAY, DEFAULT_LIMITS.perIpPerDay),
    globalPerDay: readInt(env.GLOBAL_DAILY_CAP, DEFAULT_LIMITS.globalPerDay),
  };
}

export function readMaxUploadBytes(env = {}) {
  return readInt(env.MAX_UPLOAD_BYTES, DEFAULT_MAX_UPLOAD_BYTES, MAX_CONFIGURABLE_UPLOAD_BYTES);
}

export function uploadBodyLimit(maxFile) {
  return maxFile + MULTIPART_SLACK_BYTES;
}

export function uploadTooLargeMessage(maxFile) {
  if (maxFile >= 1024) {
    return `That image is too large. The limit is ${Math.floor(maxFile / 1024)} KB.`;
  }
  return `That image is too large. The limit is ${maxFile} bytes.`;
}

function sanitizeLimits(limits) {
  return readLimits({
    RATE_LIMIT_PER_MINUTE: limits && limits.perIpPerMinute,
    RATE_LIMIT_PER_DAY: limits && limits.perIpPerDay,
    GLOBAL_DAILY_CAP: limits && limits.globalPerDay,
  });
}

export function normalizeOrigin(value) {
  const text = String(value || '').trim();
  if (!text || text === '*' || text === 'null') return '';
  try {
    return new URL(text).origin;
  } catch {
    return '';
  }
}

export function allowedOrigins(env = {}) {
  const list = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((part) => normalizeOrigin(part))
    .filter(Boolean);
  return list.length ? [...new Set(list)] : DEFAULT_ALLOWED_ORIGINS.slice();
}

export function isAllowedSiteRequest(request, env) {
  const allowed = new Set(allowedOrigins(env));
  const origin = (request.headers.get('Origin') || '').trim();
  if (origin === 'null') return false;
  if (origin) return allowed.has(normalizeOrigin(origin));
  const referer = (request.headers.get('Referer') || '').trim();
  if (!referer) return false;
  return allowed.has(normalizeOrigin(referer));
}

export function normalizeIp(ip) {
  const value = String(ip || '').trim().slice(0, 80);
  if (/^[0-9a-fA-F:.]+$/.test(value)) return value;
  return 'unknown';
}

export function clientIp(request) {
  const cf = request.headers.get('CF-Connecting-IP');
  if (cf && cf.trim()) return normalizeIp(cf);
  return 'unknown';
}

function copyRec(rec) {
  return {
    day: rec.day,
    dayCount: rec.dayCount,
    tokens: rec.tokens,
    updatedAt: rec.updatedAt,
  };
}

function refill(rec, now, capacity) {
  const ms = 60000 / capacity;
  const elapsed = Math.max(0, now - rec.updatedAt);
  const gained = Math.floor(elapsed / ms);
  if (gained <= 0) return copyRec(rec);
  return {
    day: rec.day,
    dayCount: rec.dayCount,
    tokens: Math.min(capacity, rec.tokens + gained),
    updatedAt: rec.updatedAt + gained * ms,
  };
}

function secondsUntilToken(rec, now, capacity) {
  const ms = 60000 / capacity;
  const elapsed = Math.max(0, now - rec.updatedAt);
  const into = elapsed % ms;
  const remainMs = into === 0 ? ms : ms - into;
  return Math.max(1, Math.ceil(remainMs / 1000));
}

// phase 'admit' spends a per-connection token only when the daily cap
// still has room. phase 'commit' spends one slot of that daily cap.
// A full cap does not spend the caller's token.
export function consumeLimit(rawState, input) {
  const state = rawState || emptyLimitState();
  const limits = sanitizeLimits(input.limits);
  const ip = normalizeIp(input.ip);
  const now = Number(input.now);
  const phase = input.phase === 'commit' ? 'commit' : 'admit';
  const maxTracked = input.maxTrackedIps == null ? MAX_TRACKED_IPS : input.maxTrackedIps;
  const day = bangkokDay(now);

  const globalCount = state.globalDay === day ? state.globalCount : 0;
  const tracked = state.trackedDay === day ? state.tracked : 0;
  const storedRec = state.ips && state.ips[ip];
  const previous = storedRec && storedRec.day === day ? storedRec : null;

  const base = {
    globalDay: day,
    globalCount,
    trackedDay: day,
    tracked,
    ips: { ...(state.ips || {}) },
  };
  const deny = (reason, retryAfter) => ({
    ok: false,
    reason,
    retryAfter,
    state: base,
    writes: null,
  });

  if (!Number.isFinite(now)) return deny('limiter_unavailable', 30);

  if (phase === 'commit') {
    if (globalCount >= limits.globalPerDay) {
      return deny('global_day', secondsUntilBangkokMidnight(now));
    }
    const nextCount = globalCount + 1;
    return {
      ok: true,
      reason: null,
      retryAfter: 0,
      state: { ...base, globalCount: nextCount },
      writes: { global: { day, count: nextCount } },
    };
  }

  if (limits.perIpPerMinute <= 0) return deny('per_minute', 60);
  if (limits.perIpPerDay <= 0) return deny('per_day', secondsUntilBangkokMidnight(now));
  if (globalCount >= limits.globalPerDay) {
    return deny('global_day', secondsUntilBangkokMidnight(now));
  }

  const isNew = !previous;
  if (isNew && tracked >= maxTracked) return deny('crowded', 60);

  const capacity = limits.perIpPerMinute;
  const rec = previous
    ? refill(previous, now, capacity)
    : { day, dayCount: 0, tokens: capacity, updatedAt: now };

  if (rec.tokens < 1) return deny('per_minute', secondsUntilToken(rec, now, capacity));
  if (rec.dayCount >= limits.perIpPerDay) return deny('per_day', secondsUntilBangkokMidnight(now));

  const saved = {
    day,
    dayCount: rec.dayCount + 1,
    tokens: rec.tokens - 1,
    updatedAt: rec.updatedAt,
  };
  const nextTracked = isNew ? tracked + 1 : tracked;
  return {
    ok: true,
    reason: null,
    retryAfter: 0,
    state: {
      globalDay: day,
      globalCount,
      trackedDay: day,
      tracked: nextTracked,
      ips: { ...base.ips, [ip]: saved },
    },
    writes: {
      ip: saved,
      meta: isNew ? { day, tracked: nextTracked } : undefined,
    },
  };
}

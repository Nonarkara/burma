// Pirchchat — dashboard.js
// Modules: identity, mobile tabs, map (Esri + RainViewer + city markers),
// news (with Dr Non digest + source chips + topic tags), chat rooms (with
// topic sub-tabs + image attachments + URL preview cards), modal,
// clock. Persists identity + recent image to localStorage.

(function () {
'use strict';

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const escapeHtml = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const timeNow = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

const timeNowICT = () => {
  const d = new Date();
  return d.toLocaleString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Yangon',
  }) + ' ICT';
};

const ago = (iso) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (diff < 1) return 'just now';
  if (diff < 60) return diff + ' min ago';
  const h = Math.floor(diff / 60);
  if (h < 24) return h + ' h ago';
  return Math.floor(h / 24) + ' d ago';
};

const debounce = (fn, ms) => {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
};

// =====================================================
// IDENTITY
// =====================================================

const IDENTITY_KEY = 'pirchchat.identity';

const CITIES = [
  { name: 'Yangon',     lat: 16.8409, lng: 96.1735, country: 'MM', pop: '5.3M', note: 'Commercial capital' },
  { name: 'Mandalay',   lat: 21.9747, lng: 96.0839, country: 'MM', pop: '1.7M', note: 'Cultural capital' },
  { name: 'Naypyidaw',  lat: 19.7633, lng: 96.0785, country: 'MM', pop: '0.9M', note: 'Administrative capital' },
  { name: 'Monywa',     lat: 22.1083, lng: 95.1354, country: 'MM', pop: '0.4M', note: 'Sagaing Region' },
  { name: 'Pathein',    lat: 16.7833, lng: 94.7333, country: 'MM', pop: '0.3M', note: 'Delta capital' },
  { name: 'Bagan',      lat: 21.1717, lng: 94.8583, country: 'MM', pop: '—',    note: 'Heritage zone' },
  { name: 'Myitkyina',  lat: 25.3867, lng: 97.395,  country: 'MM', pop: '0.3M', note: 'Kachin State' },
  { name: 'Taunggyi',   lat: 20.7825, lng: 97.0367, country: 'MM', pop: '0.3M', note: 'Shan State' },
  { name: 'Tachileik',  lat: 20.4531, lng: 99.879,  country: 'MM', pop: '0.05M', note: 'Thai border' },
  { name: 'Myanaung',   lat: 21.3,    lng: 96.5,   country: 'MM', pop: '—',    note: 'Ayeyarwaddy Region' },
  { name: 'Meikhtila',  lat: 20.8667, lng: 95.8667, country: 'MM', pop: '0.2M', note: 'Mandalay Region' },
  { name: 'Mae Sot',    lat: 16.7456, lng: 98.5473, country: 'TH', pop: '0.05M', note: 'Myanmar border · west' },
  { name: 'Mae Sai',    lat: 20.4267, lng: 99.8817, country: 'TH', pop: '0.02M', note: 'Myanmar border · north' },
  { name: 'Chiang Mai', lat: 18.7883, lng: 98.9853, country: 'TH', pop: '0.13M', note: 'Northern diaspora hub' },
  { name: 'Chiang Rai', lat: 19.9105, lng: 99.8406, country: 'TH', pop: '0.07M', note: 'Northern trade gateway' },
  { name: 'Bangkok',    lat: 13.7563, lng: 100.5018, country: 'TH', pop: '10.5M', note: 'Diaspora capital' },
];

// Hand-curated Burmese TV channels. Streams largely link out to source pages
// because public embed feeds are intermittent; the marker is the catalog, not
// the playback. Sources are real, up-to-date at compile time.
const BURMESE_TV = [
  { name: 'Mizzima TV',          lat: 16.8409, lng: 96.1735, place: 'Yangon',       kind: 'news',     href: 'https://mizzimaburmese.com/', note: 'Burmese-language news · social' },
  { name: 'DVB TV',              lat: 16.8409, lng: 96.1735, place: 'Yangon',       kind: 'news',     href: 'https://www.dvb.no/',          note: 'Democratic Voice of Burma' },
  { name: 'BBC Burmese',          lat: 16.8409, lng: 96.1735, place: 'Yangon',       kind: 'news',     href: 'https://www.bbc.com/burmese',   note: 'BBC News Burmese' },
  { name: 'The Irrawaddy',       lat: 16.8409, lng: 96.1735, place: 'Yangon',       kind: 'news',     href: 'https://www.irrawaddy.com/',   note: 'Independent reporting' },
  { name: 'Khit Thit Media',     lat: 21.9747, lng: 96.0839, place: 'Mandalay',     kind: 'news',     href: 'https://www.facebook.com/khitthitmedia', note: 'Khit Thit Facebook live' },
  { name: 'Frontier Myanmar',    lat: 16.8409, lng: 96.1735, place: 'Yangon',       kind: 'news',     href: 'https://frontiermyanmar.net/', note: 'Independent Burmese reporting' },
  { name: 'DMRTV',               lat: 19.7633, lng: 96.0785, place: 'Naypyidaw',    kind: 'news',     href: 'https://www.youtube.com/@DMRTV',           note: 'YouTube channel' },
  { name: '4.5 News Channel',    lat: 16.8409, lng: 96.1735, place: 'Yangon',       kind: 'news',     href: 'https://www.youtube.com/@4dot5news',       note: 'YouTube news' },
  { name: 'People Channel',      lat: 16.8409, lng: 96.1735, place: 'Yangon',       kind: 'culture',  href: 'https://www.youtube.com/@PeopleChannel',  note: 'YouTube general' },
  { name: 'Cherry TV',           lat: 16.8409, lng: 96.1735, place: 'Yangon',       kind: 'culture',  href: 'https://akiyaresearch.com/cherryfm/', note: 'Lifestyle + music' },
];

let radioStations = [];
let radioMarkers = [];
let tvMarkers = [];

const RADIO_API = 'https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/MM';

async function loadRadioStations() {
  try {
    const r = await fetch(RADIO_API, { headers: { 'user-agent': 'Pirchchat/0.1 (+burma.nonarkara.org)' } });
    if (!r.ok) throw new Error('radio http ' + r.status);
    const data = await r.json();
    radioStations = (data || []).filter((s) => s.url_resolved || s.url).map((s) => ({
      id: s.stationuuid || s.id || ('radio-' + Math.random().toString(36).slice(2, 8)),
      name: s.name || 'Unknown',
      url: s.url_resolved || s.url,
      codec: s.codec || '',
      bitrate: s.bitrate || 0,
      geo: (s.geo_lat && s.geo_long) ? { lat: s.geo_lat, lng: s.geo_long } : null,
      country: s.countrycode || 'MM',
      tags: s.tags || '',
      homepage: s.homepage || '',
    }));
    if (state.radioLayerOn) renderRadioMarkers();
  } catch (e) {
    // surface in statusbar
    const sb = $('.dash__left .statusbar .statusbar__item');
    if (sb) sb.textContent = 'Radio fetch failed: ' + (e && e.message || e);
  }
}

function toggleRadio() {
  state.radioLayerOn = !state.radioLayerOn;
  $$('.toolbar__btn[data-layer-toggle="radio"]').forEach((b) => b.classList.toggle('is-pressed', state.radioLayerOn));
  renderRadioMarkers();
}

function renderRadioMarkers() {
  if (!map) return;
  radioMarkers.forEach((m) => { try { m.remove(); } catch (e) {} });
  radioMarkers = [];
  if (!state.radioLayerOn) return;
  radioStations.forEach((s) => {
    let lat = s.geo && s.geo.lat;
    let lng = s.geo && s.geo.lng;
    if (!lat || !lng) {
      const fromName = pickCityCoordFromName(s.name);
      if (fromName) { lat = fromName.lat; lng = fromName.lng; }
    }
    if (!lat || !lng) return;
    const el = document.createElement('div');
    el.className = 'pirch-marker pirch-marker--radio';
    el.title = s.name + (s.codec ? ' · ' + s.codec : '') + (s.bitrate ? ' · ' + s.bitrate + 'kbps' : '');
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openRadioModal(s);
    });
    const m = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    radioMarkers.push(m);
  });
}

function pickCityCoordFromName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('mandalay')) return CITIES.find((c) => c.name === 'Mandalay');
  if (n.includes('yangon')) return CITIES.find((c) => c.name === 'Yangon');
  if (n.includes('naypyidaw') || n.includes('pyinmana')) return CITIES.find((c) => c.name === 'Naypyidaw');
  if (n.includes('myitkyina')) return CITIES.find((c) => c.name === 'Myitkyina');
  if (n.includes('taunggyi')) return CITIES.find((c) => c.name === 'Taunggyi');
  return null;
}

function openRadioModal(s) {
  const audio = document.getElementById('audioEl');
  const player = document.getElementById('audioplayer');
  const name = document.getElementById('audioName');
  const meta = document.getElementById('audioMeta');
  if (!audio || !player || !name || !meta) return;
  player.hidden = false;
  name.textContent = s.name;
  meta.textContent = [s.codec, s.bitrate ? s.bitrate + 'kbps' : '', s.country, s.homepage].filter(Boolean).join(' · ');
  audio.src = s.url;
  audio.play().catch(() => {});
}

function closeAudio() {
  const player = document.getElementById('audioplayer');
  const audio = document.getElementById('audioEl');
  if (audio) { try { audio.pause(); audio.src = ''; } catch (e) {} }
  if (player) player.hidden = true;
}

function toggleTv() {
  state.tvLayerOn = !state.tvLayerOn;
  $$('.toolbar__btn[data-layer-toggle="tv"]').forEach((b) => b.classList.toggle('is-pressed', state.tvLayerOn));
  renderTvMarkers();
}

function renderTvMarkers() {
  if (!map) return;
  tvMarkers.forEach((m) => { try { m.remove(); } catch (e) {} });
  tvMarkers = [];
  if (!state.tvLayerOn) return;
  BURMESE_TV.forEach((tv) => {
    if (typeof tv.lat !== 'number') return;
    const el = document.createElement('div');
    el.className = 'pirch-marker pirch-marker--tv';
    el.title = tv.name + (tv.kind ? ' · ' + tv.kind : '');
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openTvModal(tv);
    });
    const m = new maplibregl.Marker({ element: el }).setLngLat([tv.lng, tv.lat]).addTo(map);
    tvMarkers.push(m);
  });
}

function openTvModal(tv) {
  const modal = $('#incidentModal');
  const titleEl = $('#incidentTitle');
  const bodyEl = $('#incidentBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = tv.name;
  bodyEl.innerHTML =
    '<h3>' + escapeHtml(tv.name) + '</h3>' +
    '<p><em>' + escapeHtml(tv.note) + '</em></p>' +
    '<p>Based in ' + escapeHtml(tv.place) + '.</p>' +
    '<p style="margin-top:12px"><a href="' + escapeHtml(tv.href) + '" target="_blank" rel="noopener">Open source channel ↗</a></p>' +
    '<div class="modal__meta">' +
      '<div>Kind: ' + escapeHtml(tv.kind || '') + '</div>' +
      '<div>Live embed runs in the TV panel at the bottom of the map. This modal opens the source page.</div>' +
    '</div>';
  modal.hidden = false;
}

// ===== Live TV panel — one real inline stream + honest watch-links =====
//
// What we learned Sept 2026: YouTube's /embed/live_stream endpoint needs a
// numeric channel ID (not an @handle) AND the owner must allow embedding —
// most Burmese news channels disallow it, so iframes render dead. Instead:
//   - DVB TV plays INLINE via its own public HLS (verified 200, live
//     segments: https://live-stream.dvb.no/hls/stream_src/index.m3u8).
//   - Every other channel gets a Watch card that opens its live page in a
//     new tab. YouTube search URLs always resolve; invented @handles do not.
const DVB_HLS = 'https://live-stream.dvb.no/hls/stream_src/index.m3u8';

const BURMESE_TV_LIVE = [
  { name: 'DVB TV', kind: 'hls', hls: DVB_HLS, note: 'Inline HLS · press play', fallback: 'https://burmese.dvb.no/live' },
  { name: 'Mizzima TV', kind: 'watch', q: 'Mizzima TV live', note: 'YouTube blocks embeds — Watch opens the live page' },
  { name: 'Irrawaddy', kind: 'watch', q: 'The Irrawaddy live', note: 'YouTube blocks embeds — Watch opens the live page' },
  { name: 'Khit Thit Media', kind: 'watch', q: 'Khit Thit Media live', note: 'YouTube blocks embeds — Watch opens the live page' },
  { name: 'Frontier Myanmar', kind: 'watch', q: 'Frontier Myanmar live', note: 'YouTube blocks embeds — Watch opens the live page' },
];

let dvbVideo = null;

function ytSearchURL(q) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
}

function buildTvPanel() {
  const row = document.getElementById('tvpanelRow');
  if (!row) return;
  row.innerHTML = '';
  dvbVideo = null;

  BURMESE_TV_LIVE.forEach((ch) => {
    const card = document.createElement('div');
    card.className = 'tv-card';
    if (ch.kind === 'hls') {
      card.innerHTML =
        '<header class="tv-card__bar">' +
          '<span class="dot dot--live" aria-hidden="true"></span>' +
          '<span class="tv-card__name">' + escapeHtml(ch.name) + '</span>' +
          '<span class="tv-card__tag">HLS</span>' +
        '</header>' +
        '<div class="tv-card__frame">' +
          '<video controls preload="none" playsinline style="position:absolute;inset:0;width:100%;height:100%;background:#000"></video>' +
          '<div class="tv-card__fallback">Press play — ' + escapeHtml(ch.note) + '<br><a href="' + escapeHtml(ch.fallback) + '" target="_blank" rel="noopener">dvb.no/live ↗</a></div>' +
        '</div>';
      row.appendChild(card);
      const video = card.querySelector('video');
      const fb = card.querySelector('.tv-card__fallback');
      dvbVideo = video;
      video.muted = true; // start muted so autoplay policies never block the first tap
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = ch.hls; // Safari / iOS native HLS
        video.addEventListener('playing', () => { if (fb) fb.hidden = true; }, { once: true });
      } else if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({ maxBufferLength: 20 });
        hls.loadSource(ch.hls);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => { if (fb) fb.hidden = true; });
        hls.on(window.Hls.Events.ERROR, (_, data) => {
          if (data && data.fatal && fb) { fb.hidden = false; fb.innerHTML = 'Stream hiccup — <a href="' + escapeHtml(ch.fallback) + '" target="_blank" rel="noopener">watch at dvb.no/live ↗</a>'; }
        });
      } else {
        if (fb) fb.innerHTML = 'This browser cannot play HLS — <a href="' + escapeHtml(ch.fallback) + '" target="_blank" rel="noopener">watch at dvb.no/live ↗</a>';
      }
    } else {
      const url = ytSearchURL(ch.q);
      card.innerHTML =
        '<header class="tv-card__bar">' +
          '<span class="dot dot--muted" aria-hidden="true"></span>' +
          '<span class="tv-card__name">' + escapeHtml(ch.name) + '</span>' +
        '</header>' +
        '<div class="tv-card__watch">' +
          '<p>' + escapeHtml(ch.note) + '</p>' +
          '<a class="tv-card__go" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Watch live ↗</a>' +
        '</div>';
      row.appendChild(card);
    }
  });

  const muteAll = document.getElementById('tvpanelMuteAll');
  const unmuteAll = document.getElementById('tvpanelUnmuteAll');
  const hint = document.getElementById('tvpanelHint');
  if (hint) hint.textContent = 'DVB plays inline. YouTube blocks embeds — Watch opens the live page.';
  if (muteAll) muteAll.addEventListener('click', () => { if (dvbVideo) dvbVideo.muted = true; });
  if (unmuteAll) unmuteAll.addEventListener('click', () => { if (dvbVideo) { dvbVideo.muted = false; dvbVideo.play().catch(() => {}); } });
}

// Chat status indicator — surface the WS connection state in the status bar.
let chatWSPingTimer = null;

function startChatStatusIndicator() {
  const statusBar = document.querySelector('.chat .statusbar');
  if (!statusBar) return;
  const span = document.createElement('span');
  span.className = 'statusbar__item';
  span.id = 'chatStatus';
  span.textContent = 'Chat · connecting…';
  statusBar.insertBefore(span, statusBar.firstChild);

  // Poll window.__pirchchatClient every 2s for WS state.
  setInterval(() => {
    const text = span.textContent;
    const conn = window.__pirchchatClient && window.__pirchchatClient.state;
    if (conn && conn.ws && conn.ws.readyState === 1) {
      span.textContent = 'Chat · live · ' + (conn.currentRoom || '—');
      span.style.color = 'var(--positive)';
    } else {
      span.textContent = 'Chat · reconnecting…';
      span.style.color = 'var(--ink-muted)';
    }
  }, 2000);
}

const ROOMS = {
  'monastic-youth': {
    title: '#monastic-youth',
    topic: 'Monastic education, novice monks, transitioning out, Burmese diaspora in Mae Sot and Chiang Mai. Open to anyone passing through.',
    members: [
      { nick: 'aung_myo', op: true },
      { nick: 'nilar' },
      { nick: 'kyaw_zin' },
      { nick: 'thazin', voice: true },
      { nick: 'min_thu' },
      { nick: 'phyo', away: true },
      { nick: 'htun', away: true },
    ],
    seed: [
      { ts: '14:18', nick: 'aung_myo', op: true, topic: 'learning', body_html: '<span lang="my">မင်္ဂလာပါ</span> — wellcome for new here.' },
      { ts: '14:19', nick: 'nilar', topic: 'sharing', body_html: '<span lang="my">ကျေးဇူးတင်ပါတယ်</span>. ma nyunt paw lar?' },
      { ts: '14:20', nick: 'aung_myo', op: true, topic: 'learning', body_html: '<span lang="my">မြန်မာပြည်က လာတာလား။ စာရေးတတ်လား</span>?' },
      { ts: '14:21', nick: 'nilar', topic: 'sharing', body_html: '<span lang="my">မန္တလေးကပါ။ ရွှေတောင်ကြား</span>.' },
      { ts: '14:22', nick: 'kyaw_zin', topic: 'ideas', body_html: 'does the Mae Sot monastery accept people without thamanya yet?' },
      { ts: '14:24', nick: 'aung_myo', op: true, topic: 'learning', body_html: '<span lang="my">သာမဏယာ မလိုအပ်ဘူး</span> — but you do need thadowint.' },
      { ts: '14:31', nick: 'thazin', voice: true, topic: 'housing', body_html: 'hi brothers. <span lang="my">ပျော်ရွှင်စရာ</span> — looking for roommate in Chiang Mai, can split ฿3500/month.' },
      { ts: '14:33', nick: 'kyaw_zin', topic: 'housing', body_html: 'PM sent. <span lang="my">နေရပါတယ်</span>.' },
      { ts: '14:40', nick: 'aung_myo', op: true, topic: 'sharing', body_html: 'reminder: please use Bur-Myan where you can.' },
      { type: 'mode', body_html: 'aung_myo sets +m (moderated)' },
      { ts: '14:55', nick: 'min_thu', topic: 'ideas', body_html: '<span lang="my">မင်္ဂလာပါ</span>. today bkk immigration patrol at 11. ok?' },
      { ts: '14:58', nick: 'aung_myo', op: true, topic: 'sharing', body_html: '🚨 if your visa is expiring in 30 days — DO NOT leave the channel.' },
    ],
  },
  'bkk-burmese': {
    title: '#bkk-burmese',
    topic: 'Bangkok diaspora. Housing, paperwork, food, work, school, language. Burmese-first.',
    members: [
      { nick: 'admin', op: true },
      { nick: 'yamin' },
      { nick: 'thiri' },
      { nick: 'aung_khant' },
      { nick: 'su_myat' },
    ],
    seed: [
      { ts: '09:12', nick: 'admin', op: true, topic: 'sharing', body_html: '<span lang="my">မင်္ဂလာပါ</span> — channel for BKK.' },
      { ts: '09:14', nick: 'yamin', topic: 'housing', body_html: 'clinic near Khlong Toei open late?' },
      { ts: '09:15', nick: 'thiri', topic: 'housing', body_html: 'KMUTT Bang Na — open until 21:00. walk-in ok.' },
      { ts: '09:20', nick: 'aung_khant', topic: 'sharing', body_html: '<span lang="my">ကျေးဇူးပါ</span>.' },
    ],
  },
  'cm-burmese': {
    title: '#cm-burmese',
    topic: 'Chiang Mai diaspora. Lanna, language exchange, weekend meetups.',
    members: [
      { nick: 'admin', op: true },
      { nick: 'thazin', voice: true },
      { nick: 'htun' },
      { nick: 'may' },
    ],
    seed: [
      { ts: '11:02', nick: 'thazin', voice: true, topic: 'activities', body_html: 'Saturday meetup at Tha Pae Gate 16:00. noodle walk.' },
      { ts: '11:04', nick: 'htun', topic: 'learning', body_html: 'bringing my sister, she is new to CM.' },
      { ts: '11:05', nick: 'may', topic: 'activities', body_html: 'see you there.' },
    ],
  },
  'digest-today': {
    title: '#digest-today',
    topic: 'Today\'s Burmese-language news digest. Auto-posted 06:00 ICT. Discussion welcome.',
    members: [
      { nick: 'digest-bot', op: true, status: '@bot' },
      { nick: 'aung_myo' },
      { nick: 'thiri' },
      { nick: 'min_thu' },
    ],
    seed: [
      { ts: '06:00', type: 'topic', body_html: 'Today digest: 28 items across MM / diaspora / ASEAN / world. <span lang="my">ယနေ့ သတင်းအကျဉ်းချုပ်</span>.' },
      { ts: '06:00', nick: 'digest-bot', op: true, topic: 'sharing', body_html: 'Open the news pane on the right or click any item to fly on the map.' },
    ],
  },
  'listening-club': {
    title: '#listening-club',
    topic: 'What people are saying across Burmese-language sources. Surfaced trends only.',
    members: [
      { nick: 'listening-bot', op: true, status: '@bot' },
      { nick: 'thiri' },
      { nick: 'kyaw_zin' },
    ],
    seed: [
      { ts: '08:00', type: 'topic', body_html: 'Surface 3 not yet shipping. Today is a placeholder.' },
      { ts: '08:00', nick: 'listening-bot', op: true, topic: 'sharing', body_html: 'The map on the left is the prototype. — listening-club' },
    ],
  },
};

// =====================================================
// STATE
// =====================================================

const state = {
  identity: null,
  news: [],
  newsFilterRegion: 'all',
  newsSourceFilter: null,
  newsLayerOn: true,
  citiesLayerOn: false,
  radioLayerOn: true,
  tvLayerOn: true,
  rainLayerOn: true,
  rooms: ROOMS,
  currentRoom: 'monastic-youth',
  chatTopic: 'all',
  userPins: [],
  addPinMode: false,
  activeTab: 'map',
  nasaLayerOn: false,
  quakeLayerOn: false,
  wxPick: false,
  quakeMarkers: [],
  citiesMarkers: [],
  citySourceId: null,
  rainSourceId: null,
  mapStyleKey: 'satellite',
  rainTileUrl: null,
  sourceChipsBuilt: false,
};

// =====================================================
// IDENTITY
// =====================================================

function getStoredIdentity() {
  try {
    const v = localStorage.getItem(IDENTITY_KEY);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

function saveIdentity(identity) {
  try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity)); }
  catch (e) { /* ignore */ }
}

function fakeIp() {
  // Demo only. A real deployment would record the network ID at the
  // /functions/api/identity.js endpoint and bind it to the email.
  const a = 10 + Math.floor(Math.random() * 240);
  const b = Math.floor(Math.random() * 256);
  const c = Math.floor(Math.random() * 256);
  return a + '.' + b + '.' + c + '.xx';
}

function networkId() {
  // Persistent per-browser ID. Used for the "we remember the network ID"
  // rule from the identity modal. Demo-grade.
  let id = null;
  try { id = localStorage.getItem('pirchchat.net'); } catch (e) { /* ignore */ }
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2, 10);
    try { localStorage.setItem('pirchchat.net', id); } catch (e) { /* ignore */ }
  }
  return id;
}

function showIdentityModal() {
  const modal = $('#identityModal');
  if (modal) modal.hidden = false;
  const nameInput = $('#identityName');
  if (nameInput) setTimeout(() => nameInput.focus(), 50);
}

function hideIdentityModal() {
  const modal = $('#identityModal');
  if (modal) modal.hidden = true;
}

function applyIdentity(identity) {
  state.identity = identity;
  const label = $('#chatUserLabel');
  if (label) label.textContent = identity.name + '@pirchchat · ' + identity.network;
}

// =====================================================
// MOBILE TABS
// =====================================================

function setActiveTab(name) {
  state.activeTab = name;
  document.body.setAttribute('data-tab', name);
  $$('.tabs-top__btn').forEach((b) => b.classList.toggle('tabs-top__btn--active', b.dataset.tab === name));
}

// =====================================================
// MAP
// =====================================================

// Esri's old "Canvas/Dark_Gray" tile path returns 404 from server.arcgisonline.com.
// CartoDB's "dark_all" is the open-source replacement for an unlabeled dark vector style.
// Attribution: "OpenStreetMap contributors · CARTO". Tiles load via the four
// MapLibre subdomain placeholders (a-d).
const MAP_STYLES = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  dark:      'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  light:     'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
};

const MAP_ATTRIBUTIONS = {
  satellite: 'Esri World Imagery',
  streets:   'Esri World Street Map',
  dark:      '© CARTO · © OpenStreetMap contributors',
  light:     'Esri World Topo Map',
};

let map;
let newsMarkers = [];

function initMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: { version: 8, sources: { basemap: { type: 'raster', tiles: [MAP_STYLES.satellite], tileSize: 256, attribution: 'Esri' } }, layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }] },
    center: [96.16, 21.0],
    zoom: 5,
    minZoom: 3,
    maxZoom: 14,
    attributionControl: false,
  });
  try { window.__pirchMap = map; } catch (e) {}
  map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: false }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
  map.on('move', syncMapStatus);
  map.on('zoom', syncMapStatus);
  map.on('click', (e) => {
    if (state.wxPick) {
      state.wxPick = false;
      $$('.toolbar__btn[data-action="wx"]').forEach((b) => b.classList.remove('is-pressed'));
      map.getCanvas().style.cursor = '';
      fetchWeather(e.lngLat.lat, e.lngLat.lng);
      return;
    }
    if (!state.addPinMode) return;
    state.addPinMode = false;
    map.getCanvas().style.cursor = '';
    const pin = {
      id: 'pin-' + Date.now(),
      kind: 'user-pin',
      title_en: 'Manual pin',
      body_en: 'Dropped at ' + e.lngLat.lat.toFixed(4) + ', ' + e.lngLat.lng.toFixed(4),
      location: { lat: e.lngLat.lat, lng: e.lngLat.lng, place: 'manual' },
      region: 'manual', ts: new Date().toISOString(), source: 'manual', sourceLabel: 'You',
    };
    state.userPins.push(pin);
    refreshMarkers();
  });
}

async function loadRainTiles() {
  try {
    const r = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!r.ok) throw new Error('rainviewer http ' + r.status);
    const j = await r.json();
    // Use the latest precipitation tile path
    const host = j.host;
    const path = j && j.rain && j.rain.nowcast && j.rain.nowcast[0] && j.rain.nowcast[0].path;
    if (!host || !path) throw new Error('no rain tiles');
    state.rainTileUrl = host + path + '/256/{z}/{x}/{y}/2/1_1.png';
  } catch (e) {
    state.rainTileUrl = null;
  }
}

function setMapStyle(key) {
  if (!MAP_STYLES[key]) return;
  state.mapStyleKey = key;
  const src = map.getSource('basemap');
  if (src) src.setTiles([MAP_STYLES[key]]);
  $$('.toolbar__btn[data-layer]').forEach((b) => b.classList.toggle('is-pressed', b.dataset.layer === key));
  const labels = { satellite: 'Esri imagery', streets: 'Esri streets', dark: 'CartoDB dark', light: 'Esri topo' };
  const statusEl = $('#mapStatus');
  if (statusEl) statusEl.textContent = (labels[key] || key) + ' · ' + (MAP_ATTRIBUTIONS[key] || '');
}

function toggleRain() {
  state.rainLayerOn = !state.rainLayerOn;
  $$('.toolbar__btn[data-layer-toggle="rain"]').forEach((b) => b.classList.toggle('is-pressed', state.rainLayerOn));
  refreshRain();
}

function refreshRain() {
  if (!map) return;
  if (state.rainLayerOn && state.rainTileUrl) {
    if (!map.getSource('rain')) {
      map.addSource('rain', { type: 'raster', tiles: [state.rainTileUrl], tileSize: 256, attribution: 'RainViewer' });
      map.addLayer({ id: 'rain', type: 'raster', source: 'rain', paint: { 'raster-opacity': 0.65 } });
    } else {
      map.setLayoutProperty('rain', 'visibility', 'visible');
    }
  } else {
    if (map.getLayer('rain')) map.setLayoutProperty('rain', 'visibility', 'none');
  }
}

function toggleCities() {
  state.citiesLayerOn = !state.citiesLayerOn;
  $$('.toolbar__btn[data-layer-toggle="cities"]').forEach((b) => b.classList.toggle('is-pressed', state.citiesLayerOn));
  renderCities();
}

// ---------- NASA GIBS true-color (yesterday, no key) ----------
function gibsDate() {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
}

function toggleNasa() {
  state.nasaLayerOn = !state.nasaLayerOn;
  $$('.toolbar__btn[data-layer-toggle="nasa"]').forEach((b) => b.classList.toggle('is-pressed', state.nasaLayerOn));
  if (!map) return;
  if (state.nasaLayerOn) {
    const tiles = ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/' + gibsDate() + '/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg'];
    if (!map.getSource('nasa')) {
      map.addSource('nasa', { type: 'raster', tiles, tileSize: 256, attribution: 'NASA GIBS / MODIS Terra' });
      const before = map.getLayer('rain') ? 'rain' : undefined;
      map.addLayer({ id: 'nasa', type: 'raster', source: 'nasa', paint: { 'raster-opacity': 0.95 } }, before);
    } else {
      map.getSource('nasa').setTiles(tiles);
      map.setLayoutProperty('nasa', 'visibility', 'visible');
    }
    flashStatusbar('NASA Terra true-color · ' + gibsDate() + ' · JAXA Himawari + FIRMS fires under Layers menu.');
  } else if (map.getLayer('nasa')) {
    map.setLayoutProperty('nasa', 'visibility', 'none');
  }
}

// ---------- USGS earthquakes M4.5+, last 30 days ----------
async function toggleQuakes() {
  state.quakeLayerOn = !state.quakeLayerOn;
  $$('.toolbar__btn[data-layer-toggle="quakes"]').forEach((b) => b.classList.toggle('is-pressed', state.quakeLayerOn));
  if (!map) return;
  (state.quakeMarkers || []).forEach((m) => { try { m.remove(); } catch (e) {} });
  state.quakeMarkers = [];
  if (!state.quakeLayerOn) return;
  flashStatusbar('Fetching USGS earthquakes…');
  try {
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson' +
      '&starttime=' + since + '&minmagnitude=4.5&latitude=21&longitude=96&maxradiuskm=2500&limit=100&orderby=time';
    const r = await fetch(url);
    if (!r.ok) throw new Error('usgs http ' + r.status);
    const gj = await r.json();
    (gj.features || []).forEach((f) => {
      const coords = f.geometry && f.geometry.coordinates;
      if (!coords) return;
      const mag = (f.properties && f.properties.mag) || 0;
      const el = document.createElement('div');
      el.className = 'pirch-marker pirch-marker--quake';
      const s = Math.max(10, Math.min(26, 6 + mag * 3));
      el.style.width = s + 'px';
      el.style.height = s + 'px';
      el.title = 'M' + mag.toFixed(1) + ' · ' + ((f.properties && f.properties.place) || '');
      el.addEventListener('click', (e) => { e.stopPropagation(); openQuakeModal(f); });
      state.quakeMarkers.push(new maplibregl.Marker({ element: el }).setLngLat([coords[0], coords[1]]).addTo(map));
    });
    flashStatusbar((gj.features || []).length + ' quakes (USGS, 30d, M4.5+). Click one for depth + time.');
  } catch (e) {
    flashStatusbar('Quakes failed: ' + (e && e.message || e));
  }
}

function openQuakeModal(f) {
  const p = f.properties || {};
  const coords = (f.geometry && f.geometry.coordinates) || [0, 0, 0];
  const t = p.time ? new Date(p.time).toLocaleString('en-GB', { timeZone: 'Asia/Yangon' }) + ' MMT' : '—';
  openIncidentModal({
    title_en: 'M' + (p.mag != null ? Number(p.mag).toFixed(1) : '?') + ' — ' + (p.place || 'unknown'),
    title_my: '',
    body_en: 'Depth ' + coords[2] + ' km · ' + t + ' · tsunami flag ' + (p.tsunami ? 'YES' : 'no') + ' · felt reports ' + (p.felt != null ? p.felt : 0) + '. Discuss in #listening-club: did anyone feel it?',
    body_my: '',
    digest_en: '',
    digest_my: '',
    sourceLabel: 'USGS Earthquakes',
    source: 'USGS',
    ts: p.time ? new Date(p.time).toISOString() : '',
    url: p.url || 'https://earthquake.usgs.gov/',
    location: { lat: coords[1], lng: coords[0], place: p.place || '' },
  });
}

// ---------- Click-for-weather (Open-Meteo, no key) ----------
const WMO = { 0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Icing fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle', 61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Slight showers', 81: 'Showers', 82: 'Violent showers', 95: 'Thunderstorm', 96: 'Storm + hail', 99: 'Storm + heavy hail' };

function toggleWx() {
  state.wxPick = !state.wxPick;
  $$('.toolbar__btn[data-action="wx"]').forEach((b) => b.classList.toggle('is-pressed', !!state.wxPick));
  if (map) map.getCanvas().style.cursor = state.wxPick ? 'crosshair' : '';
  if (state.wxPick) flashStatusbar('Click any point for live temperature / rain / wind. ESC cancels.');
}

async function fetchWeather(lat, lng) {
  flashStatusbar('Fetching weather for ' + lat.toFixed(2) + ', ' + lng.toFixed(2) + '…');
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(3) + '&longitude=' + lng.toFixed(3) +
      '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto';
    const r = await fetch(url);
    if (!r.ok) throw new Error('weather http ' + r.status);
    const j = await r.json();
    const c = j.current || {};
    openIncidentModal({
      title_en: 'Weather at ' + lat.toFixed(2) + ', ' + lng.toFixed(2),
      title_my: '',
      body_en: (WMO[c.weather_code] || 'Code ' + c.weather_code) + ' · ' + c.temperature_2m + '°C · humidity ' + c.relative_humidity_2m + '% · rain ' + c.precipitation + ' mm · wind ' + c.wind_speed_10m + ' km/h · observed ' + (c.time || '').replace('T', ' ') + '. Screenshot this into the room and compare with the rain overlay.',
      body_my: '',
      digest_en: '',
      digest_my: '',
      sourceLabel: 'Open-Meteo',
      source: 'open-meteo',
      ts: new Date().toISOString(),
      url: 'https://open-meteo.com/',
      location: { lat, lng, place: lat.toFixed(2) + ', ' + lng.toFixed(2) },
    });
  } catch (e) {
    flashStatusbar('Weather failed: ' + (e && e.message || e));
  }
}

function renderCities() {
  if (!map) return;
  state.citiesMarkers.forEach((m) => { try { m.remove(); } catch (e) {} });
  state.citiesMarkers = [];
  if (!state.citiesLayerOn) return;
  CITIES.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'pirch-marker pirch-marker--city';
    el.title = c.name + ' · ' + c.pop;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      map.flyTo({ center: [c.lng, c.lat], zoom: 10, essential: true });
      openCityModal(c);
    });
    const m = new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(map);
    state.citiesMarkers.push(m);
  });
}

function openCityModal(c) {
  const modal = $('#incidentModal');
  const titleEl = $('#incidentTitle');
  const bodyEl = $('#incidentBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = c.name;
  bodyEl.innerHTML =
    '<h3>' + escapeHtml(c.name) + '</h3>' +
    '<p><em>' + escapeHtml(c.note) + '</em></p>' +
    '<p>Population (metro): <strong>' + escapeHtml(c.pop) + '</strong></p>' +
    '<p>Country: ' + escapeHtml(c.country) + '</p>' +
    '<div class="modal__meta">' +
      '<div>Coordinates: ' + c.lat.toFixed(4) + ', ' + c.lng.toFixed(4) + '</div>' +
    '</div>';
  modal.hidden = false;
}

function syncMapStatus() {
  if (!map) return;
  const c = map.getCenter();
  const z = map.getZoom().toFixed(1);
  const coordEl = $('#mapCoord');
  if (coordEl) coordEl.textContent = 'lng ' + c.lng.toFixed(3) + ' · lat ' + c.lat.toFixed(3) + ' · zoom ' + z;
}

function clearNewsMarkers() {
  newsMarkers.forEach((m) => { try { m.remove(); } catch (e) {} });
  newsMarkers = [];
}

function renderNewsMarkers(items) {
  if (!map) return;
  clearNewsMarkers();
  items.forEach((it) => {
    if (!it.location || typeof it.location.lat !== 'number' || typeof it.location.lng !== 'number') return;
    const el = document.createElement('div');
    el.className = 'pirch-marker pirch-marker--news';
    el.title = it.title_en || it.title_my || it.location.place || 'Incident';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openIncidentModal(it);
    });
    const m = new maplibregl.Marker({ element: el }).setLngLat([it.location.lng, it.location.lat]).addTo(map);
    newsMarkers.push(m);
  });
}

function refreshMarkers() {
  let items = state.news;
  if (state.newsFilterRegion !== 'all') items = items.filter((x) => x.region === state.newsFilterRegion);
  if (state.newsSourceFilter) items = items.filter((x) => (x.sourceShort || x.source) === state.newsSourceFilter);
  if (state.newsLayerOn) renderNewsMarkers(items.concat(state.userPins));
  else clearNewsMarkers();
  const inc = document.getElementById('mapIncCount');
  if (inc) inc.textContent = newsMarkers.length + ' markers';
}

function fitAllMarkers() {
  if (!map) return;
  const items = state.news.filter((x) => x.location && (state.newsFilterRegion === 'all' || x.region === state.newsFilterRegion));
  const bounds = new maplibregl.LngLatBounds();
  items.forEach((it) => bounds.extend([it.location.lng, it.location.lat]));
  if (bounds.isEmpty()) return;
  map.fitBounds(bounds, { padding: 40, duration: 600, maxZoom: 9 });
}

function enableAddPin() {
  state.addPinMode = true;
  if (map) map.getCanvas().style.cursor = 'crosshair';
  flashStatusbar('Click on the map to drop a pin. ESC to cancel.');
  const esc = (e) => { if (e.key === 'Escape') { state.addPinMode = false; if (map) map.getCanvas().style.cursor = ''; document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
}

function flashStatusbar(text) {
  const sb = $('.dash__left .statusbar .statusbar__item');
  if (!sb) return;
  const orig = sb.textContent;
  sb.textContent = text;
  setTimeout(() => { sb.textContent = orig; }, 2500);
}

// =====================================================
// NEWS
// =====================================================

async function loadNews() {
  try {
    const res = await fetch('/api/news?region=' + encodeURIComponent(state.newsFilterRegion), { cache: 'no-store' });
    if (!res.ok) throw new Error('news http ' + res.status);
    const data = await res.json();
    state.news = (data.items || []).map((it) => ({ ...it, kind: 'news' }));
    buildSourceChips();
    renderNews();
    refreshMarkers();
    const agoEl = $('#newsAgo');
    if (agoEl) agoEl.textContent = 'just now';
    const lr = $('#mapLastRefresh');
    if (lr) lr.textContent = 'refreshed ' + timeNow();
  } catch (e) {
    const listEl = $('#newsList');
    if (listEl) listEl.innerHTML = '<div class="news-item" style="color:var(--negative)">news failed: ' + escapeHtml(String(e.message || e)) + '</div>';
  }
}

function buildSourceChips() {
  if (state.sourceChipsBuilt) return;
  const sources = new Map();
  state.news.forEach((it) => {
    const key = it.sourceShort || it.source || it.sourceLabel;
    if (!key) return;
    if (!sources.has(key)) sources.set(key, 0);
    sources.set(key, sources.get(key) + 1);
  });
  const wrap = $('#sourceChips');
  if (!wrap) return;
  const chips = ['<button type="button" class="chip chip--active" data-source="">All sources</button>'];
  Array.from(sources.entries()).sort((a, b) => b[1] - a[1]).forEach(([name, n]) => {
    chips.push('<button type="button" class="chip" data-source="' + escapeHtml(name) + '">' + escapeHtml(name) + ' ' + n + '</button>');
  });
  wrap.innerHTML = chips.join('');
  state.sourceChipsBuilt = true;
  $$('#sourceChips .chip').forEach((b) => {
    b.addEventListener('click', () => {
      $$('#sourceChips .chip').forEach((x) => x.classList.remove('chip--active'));
      b.classList.add('chip--active');
      state.newsSourceFilter = b.dataset.source || null;
      renderNews();
      refreshMarkers();
    });
  });
}

function renderNews() {
  const listEl = $('#newsList');
  if (!listEl) return;
  let items = state.news;
  if (state.newsFilterRegion !== 'all') items = items.filter((x) => x.region === state.newsFilterRegion);
  if (state.newsSourceFilter) items = items.filter((x) => (x.sourceShort || x.source) === state.newsSourceFilter);
  if (!items.length) {
    listEl.innerHTML = '<div class="news-item"><em>No items in this filter.</em></div>';
    const c = $('#newsCount'); if (c) c.textContent = '0 items';
    return;
  }
  listEl.innerHTML = items.map((it) => {
    const titleMy = (it.title_my && it.title_my.trim())
      ? '<div class="news-item__title news-item__title--my" lang="my">' + escapeHtml(it.title_my) + '</div>' : '';
    const titleEn = '<div class="news-item__title">' + escapeHtml(it.title_en || '') + '</div>';
    const bodyMy = (it.body_my && it.body_my.trim())
      ? '<div class="news-item__body news-item__body--my" lang="my">' + escapeHtml(it.body_my) + '</div>' : '';
    const bodyEn = '<div class="news-item__body">' + escapeHtml(it.body_en || '') + '</div>';
    const digestEn = (it.digest_en && it.digest_en.trim())
      ? '<div class="news-item__digest"><span class="news-item__digest-label">Dr Non digest</span><div class="news-item__digest-en">' + escapeHtml(it.digest_en) + '</div>' +
        ((it.digest_my && it.digest_my.trim()) ? '<div class="news-item__body news-item__body--my" lang="my">' + escapeHtml(it.digest_my) + '</div>' : '') +
        '</div>' : '';
    return (
      '<article class="news-item" data-id="' + escapeHtml(it.id) + '">' +
        '<div class="news-item__head">' +
          '<span class="news-item__ts">' + escapeHtml(ago(it.ts)) + '</span>' +
          '<span class="news-item__src">' + escapeHtml(it.sourceLabel || it.source || '') + '</span>' +
          '<span class="news-item__loc">' + escapeHtml((it.location && it.location.place) || '') + '</span>' +
        '</div>' +
        titleMy + titleEn +
        bodyMy + bodyEn +
        digestEn +
        '<div class="news-item__meta">' +
          '<a href="' + escapeHtml(it.url || '#') + '" target="_blank" rel="noopener">Open source ↗</a>' +
          (it.location ? '<span>lat ' + it.location.lat.toFixed(2) + ' lng ' + it.location.lng.toFixed(2) + '</span>' : '<span>No geo</span>') +
        '</div>' +
      '</article>'
    );
  }).join('');

  $$('.news-item').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const item = state.news.find((x) => x.id === id);
      if (item) focusOnItem(item);
    });
  });

  const c = $('#newsCount');
  if (c) c.textContent = items.length + (items.length === 1 ? ' item' : ' items');
}

function focusOnItem(item) {
  if (!map || !item.location) return;
  $$('.news-item').forEach((el) => el.classList.toggle('is-selected', el.dataset.id === item.id));
  map.flyTo({ center: [item.location.lng, item.location.lat], zoom: Math.max(map.getZoom(), 9), essential: true });
  openIncidentModal(item);
}

function openIncidentModal(item) {
  const modal = $('#incidentModal');
  const titleEl = $('#incidentTitle');
  const bodyEl = $('#incidentBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = (item.title_en || item.title_my || (item.location && item.location.place) || 'Incident').slice(0, 80);
  const titleMy = (item.title_my && item.title_my.trim())
    ? '<h3 lang="my">' + escapeHtml(item.title_my) + '</h3>' : '';
  const titleEn = '<h3>' + escapeHtml(item.title_en || '') + '</h3>';
  const bodyMy = (item.body_my && item.body_my.trim())
    ? '<p lang="my">' + escapeHtml(item.body_my) + '</p>' : '';
  const bodyEn = '<p>' + escapeHtml(item.body_en || '') + '</p>';
  const digestBlock = ((item.digest_en && item.digest_en.trim()) || (item.digest_my && item.digest_my.trim()))
    ? '<div class="modal__digest-block">' +
        '<span class="modal__digest-label">Dr Non digest</span>' +
        ((item.digest_en && item.digest_en.trim()) ? '<p style="margin:0 0 6px;font-style:italic;">' + escapeHtml(item.digest_en) + '</p>' : '') +
        ((item.digest_my && item.digest_my.trim()) ? '<p style="margin:0;font-family:var(--font-burma);font-size:14px;line-height:1.7" lang="my">' + escapeHtml(item.digest_my) + '</p>' : '') +
      '</div>' : '';
  const meta = (
    '<div class="modal__meta">' +
      '<div>' + escapeHtml(item.sourceLabel || item.source || '') + '</div>' +
      '<div>' + escapeHtml(item.ts) + '</div>' +
      (item.location ? '<div>' + escapeHtml(item.location.place) + ' (' + item.location.lat.toFixed(3) + ', ' + item.location.lng.toFixed(3) + ')</div>' : '') +
      (item.url ? '<div><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">Open source ↗</a></div>' : '') +
    '</div>'
  );
  bodyEl.innerHTML = titleMy + titleEn + bodyMy + bodyEn + digestBlock + meta;
  modal.hidden = false;
}

// =====================================================
// CHAT
// =====================================================

let currentRoom = 'monastic-youth';

function renderRoom(roomId) {
  currentRoom = roomId;
  $$('button[data-room]').forEach((b) => b.classList.toggle('menubar__item--active', b.dataset.room === roomId));
  $('#chatRoomTitle').textContent = ROOMS[roomId].title;
  renderMessages();
  renderMembers();
}

function renderMessages() {
  const room = ROOMS[currentRoom];
  const wrap = $('#messages');
  if (!wrap || !room) return;
  let msgs = room.seed;
  if (state.chatTopic !== 'all') msgs = msgs.filter((m) => (m.topic || '') === state.chatTopic);
  if (!msgs.length) {
    wrap.innerHTML = '<div class="msg msg--topic"><em>No messages with topic "' + escapeHtml(state.chatTopic) + '" in this room.</em></div>';
    wrap.scrollTop = wrap.scrollHeight;
    return;
  }
  wrap.innerHTML = msgs.map((m) => {
    if (m.type === 'topic') return '<div class="msg msg--topic">' + (m.body_html || '') + '</div>';
    if (m.type === 'mode') return '<div class="msg msg--mode">— ' + (m.body_html || '') + '</div>';
    if (m.type === 'server') return '<div class="msg msg--server">— ' + escapeHtml(m.body_text || '') + '</div>';
    const nickClass = m.op ? 'nick nick--op' : 'nick';
    const topicTag = m.topic ? '<span class="msg__topic-tag">' + escapeHtml(m.topic) + '</span>' : '';
    return '<div class="msg"><span class="ts">' + escapeHtml(m.ts || timeNow()) + '</span> <span class="' + nickClass + '">' + topicTag + escapeHtml(m.nick || '') + '</span> <span class="body">' + (m.body_html || escapeHtml(m.body_text || '')) + '</span></div>';
  }).join('');
  wrap.scrollTop = wrap.scrollHeight;
}

function renderMembers() {
  const room = ROOMS[currentRoom];
  const ul = $('#memberList');
  if (!ul || !room) return;
  ul.innerHTML = room.members.map((m) => {
    const cls = m.op ? 'members__nick members__nick--op' : (m.away ? 'members__nick members__nick--away' : 'members__nick');
    const tag = m.op ? '@op' : (m.voice ? '@voice' : (m.away ? 'away' : (m.status ? '@' + m.status : '')));
    return '<li><span class="' + cls + '">' + escapeHtml(m.nick) + '</span>' + (tag ? '<span class="members__tag">' + escapeHtml(tag) + '</span>' : '') + '</li>';
  }).join('');
}

function appendUserMessage(text, opts) {
  opts = opts || {};
  const wrap = $('#messages');
  if (!wrap) return;
  const net = state.identity ? state.identity.network : 'guest';
  const nick = state.identity ? state.identity.name : 'guest';
  const html =
    '<div class="msg"><span class="ts">' + escapeHtml(timeNow()) + '</span> <span class="nick nick--op">' + escapeHtml(nick) + ' <span style="opacity:0.5;font-size:9px">@' + escapeHtml(net) + '</span></span> <span class="body">' + escapeHtml(text) + '</span></div>';
  wrap.insertAdjacentHTML('beforeend', html);
  if (opts.imageDataUrl) {
    wrap.insertAdjacentHTML('beforeend', '<img class="msg__img" src="' + escapeHtml(opts.imageDataUrl) + '" alt="attachment">');
  }
  if (opts.preview) {
    const p = opts.preview;
    wrap.insertAdjacentHTML('beforeend',
      '<a class="preview" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' +
        '<span class="preview__title" data-preview-title>' + escapeHtml(p.title || p.url) + '</span>' +
        '<span class="preview__desc" data-preview-desc>' + escapeHtml(p.description || '') + '</span>' +
        '<span class="preview__host">' + escapeHtml(p.host || '') + '</span>' +
      '</a>'
    );
  }
  wrap.scrollTop = wrap.scrollHeight;
}

function detectFirstUrl(text) {
  const m = text.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

// =====================================================
// CLOCK
// =====================================================

function tickClock() {
  const c = $('#newsClock'); if (c) c.textContent = timeNowICT();
}

// =====================================================
// INIT
// =====================================================

document.addEventListener('DOMContentLoaded', function () {
  // Identity
  state.identity = getStoredIdentity();
  if (!state.identity || !state.identity.name) {
    showIdentityModal();
  } else {
    applyIdentity(state.identity);
  }
  $('#identitySubmit').addEventListener('click', () => {
    const nameEl = $('#identityName');
    const emailEl = $('#identityEmail');
    const name = (nameEl && nameEl.value || '').trim() || 'guest';
    const email = (emailEl && emailEl.value || '').trim();
    const id = { name: name.slice(0, 32), email: email, ip: fakeIp(), network: networkId(), since: new Date().toISOString() };
    saveIdentity(id);
    state.identity = id;
    applyIdentity(id);
    hideIdentityModal();
  });

  // Mobile tabs
  $$('.tabs-top__btn').forEach((b) => b.addEventListener('click', () => setActiveTab(b.dataset.tab)));
  setActiveTab('map');

  // Map
  initMap();
  loadRainTiles().then(() => refreshRain());
  setMapStyle('satellite');
  $$('.toolbar__btn[data-layer]').forEach((b) => b.addEventListener('click', () => setMapStyle(b.dataset.layer)));
  $$('.toolbar__btn[data-action]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.action;
    if (a === 'fit') fitAllMarkers();
    if (a === 'add') enableAddPin();
    if (a === 'wx') toggleWx();
  }));
  $$('.toolbar__btn[data-layer-toggle="nasa"]').forEach((b) => b.addEventListener('click', toggleNasa));
  $$('.toolbar__btn[data-layer-toggle="quakes"]').forEach((b) => b.addEventListener('click', toggleQuakes));
  $$('.toolbar__btn[data-layer-toggle="news"]').forEach((b) => b.addEventListener('click', () => { state.newsLayerOn = !state.newsLayerOn; b.classList.toggle('is-pressed', state.newsLayerOn); refreshMarkers(); }));
  $$('.toolbar__btn[data-layer-toggle="rain"]').forEach((b) => b.addEventListener('click', toggleRain));
  $$('.toolbar__btn[data-layer-toggle="cities"]').forEach((b) => b.addEventListener('click', toggleCities));
  $$('.toolbar__btn[data-layer-toggle="radio"]').forEach((b) => b.addEventListener('click', toggleRadio));
  $$('.toolbar__btn[data-layer-toggle="tv"]').forEach((b) => b.addEventListener('click', toggleTv));

  // Audio player close
  const audioClose = document.getElementById('audioClose');
  if (audioClose) audioClose.addEventListener('click', closeAudio);

  // Initial radio + TV render
  loadRadioStations();
  renderTvMarkers();

  // Live TV panel — always-visible Burmese YouTube embeds at the bottom of the map.
  buildTvPanel();

  // Chat status indicator
  startChatStatusIndicator();

  // News filter region
  $$('button[data-news-filter]').forEach((b) => b.addEventListener('click', () => {
    $$('button[data-news-filter]').forEach((x) => x.classList.remove('menubar__item--active'));
    b.classList.add('menubar__item--active');
    state.newsFilterRegion = b.dataset.newsFilter;
    loadNews();
  }));

  // News load + periodic refresh
  loadNews();
  setInterval(loadNews, 120000);

  // Chat (room tabs, topic chips, composer, file attach) is owned by chat-client.js.
  // Identity modal here only writes the network ID + name; chat-client.js reads it.

  // Modal close
  $('#incidentClose').addEventListener('click', () => { $('#incidentModal').hidden = true; });
  $('#incidentModal').addEventListener('click', (e) => { if (e.target.id === 'incidentModal') $('#incidentModal').hidden = true; });
  $('#identityModal').addEventListener('click', (e) => { if (e.target.id === 'identityModal') { /* do not close by click */ } });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const im = $('#incidentModal'); if (im && !im.hidden) im.hidden = true;
    }
  });

  // Clock
  tickClock();
  setInterval(tickClock, 1000);
});

})();

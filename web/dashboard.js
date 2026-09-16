// Pirchchat — dashboard.js
// Orchestrates: MapLibre map (Esri imagery + Esri streets + Esri dark + Esri light),
// news ticker (live from /api/news, geocoded), chat rooms (5 rooms, Win95 chrome),
// link preview card fetching from /api/preview, modal popup.

(function () {
'use strict';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeNowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function timeNowICT() {
  const d = new Date();
  return d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Yangon' }) + ' ICT';
}

function ago(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (diff < 1) return 'just now';
  if (diff < 60) return diff + ' min ago';
  const h = Math.floor(diff / 60);
  if (h < 24) return h + ' h ago';
  const d = Math.floor(h / 24);
  return d + ' d ago';
}

function debounce(fn, ms) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
}

// ============ MAP ============

const MAP_STYLES = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  dark:      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/Dark_Gray/MapServer/tile/{z}/{y}/{x}',
  light:     'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
};

let map;
let markers = [];
let mapStyleKey = 'satellite';
let activeFilter = 'all';
let newsState = [];

function initMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
          tiles: [MAP_STYLES[mapStyleKey]],
          tileSize: 256,
          attribution: 'Esri',
        },
      },
      layers: [
        { id: 'basemap', type: 'raster', source: 'basemap' },
      ],
    },
    center: [96.16, 21.0],
    zoom: 5,
    minZoom: 3,
    maxZoom: 12,
    attributionControl: false,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: false }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
  map.on('move', syncMapStatus);
  map.on('zoom', syncMapStatus);
}

function setMapStyle(key) {
  if (!MAP_STYLES[key]) return;
  mapStyleKey = key;
  const src = map.getSource('basemap');
  if (src) src.setTiles([MAP_STYLES[key]]);
  $$('.toolbar__btn[data-layer]').forEach((b) => {
    b.classList.toggle('is-pressed', b.dataset.layer === key);
  });
  const labels = { satellite: 'Esri imagery', streets: 'Esri streets', dark: 'Esri dark', light: 'Esri topo' };
  const statusEl = document.getElementById('mapStatus');
  if (statusEl) statusEl.textContent = 'Map: ' + (labels[key] || key);
  syncMapStatus();
}

function syncMapStatus() {
  if (!map) return;
  const c = map.getCenter();
  const z = map.getZoom().toFixed(1);
  const coordEl = document.getElementById('mapCoord');
  if (coordEl) coordEl.textContent = 'lng ' + c.lng.toFixed(3) + ' · lat ' + c.lat.toFixed(3) + ' · zoom ' + z;
}

function clearMarkers() {
  markers.forEach((m) => {
    try { m.remove(); } catch (e) {}
  });
  markers = [];
}

function addMarkers(items) {
  if (!map) return;
  clearMarkers();
  items.forEach((it) => {
    if (!it.location || typeof it.location.lat !== 'number' || typeof it.location.lng !== 'number') return;
    const el = document.createElement('div');
    el.className = 'pirch-marker pirch-marker--' + (it.source === 'chat' ? 'chat' : (it.region === 'mm' || it.region === 'diaspora' ? 'news' : 'news'));
    if (it.kind === 'user-pin') el.className = 'pirch-marker pirch-marker--you';
    if (it.region === 'mm') el.className = 'pirch-marker pirch-marker--news';
    if (it.region === 'diaspora') el.className = 'pirch-marker pirch-marker--news';
    if (it.region === 'asean') el.className = 'pirch-marker pirch-marker--news';
    if (it.region === 'world') el.className = 'pirch-marker pirch-marker--news';
    el.title = it.title_en || it.title_my || it.location.place || 'Incident';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openIncidentModal(it);
    });
    const m = new maplibregl.Marker({ element: el })
      .setLngLat([it.location.lng, it.location.lat])
      .addTo(map);
    markers.push(m);
  });
  const countEl = document.getElementById('mapIncCount');
  if (countEl) countEl.textContent = markers.length + ' incidents';
}

function fitAllMarkers() {
  if (!markers.length || !map) return;
  const bounds = new maplibregl.LngLatBounds();
  markers.forEach((m) => bounds.extend(m.getLngLat()));
  if (bounds.isEmpty()) return;
  map.fitBounds(bounds, { padding: 40, duration: 600, maxZoom: 9 });
}

function focusItem(item) {
  if (!item.location || !map) return;
  map.flyTo({ center: [item.location.lng, item.location.lat], zoom: Math.max(map.getZoom(), 10), essential: true });
  $$('.news-item').forEach((el) => el.classList.toggle('is-selected', el.dataset.id === item.id));
}

window.addEventListener('DOMContentLoaded', initMap);

// ============ NEWS ============

async function loadNews() {
  try {
    const res = await fetch('/api/news?region=' + encodeURIComponent(activeFilter), { cache: 'no-store' });
    if (!res.ok) throw new Error('news http ' + res.status);
    const data = await res.json();
    newsState = (data.items || []).map((it, i) => ({
      ...it,
      kind: 'news',
      _marker: !!it.location,
    }));
    renderNews();
    addMarkers(newsState);
  } catch (e) {
    newsState = [];
    renderNews();
    const listEl = document.getElementById('newsList');
    if (listEl) listEl.innerHTML = '<div class="news-item" style="color:var(--negative)">Failed to load news — check /api/news Function is deployed. ' + escapeHtml(String(e.message || e)) + '</div>';
  }
}

function renderNews() {
  const listEl = document.getElementById('newsList');
  if (!listEl) return;
  const items = newsState.filter((it) => activeFilter === 'all' || it.region === activeFilter);
  if (!items.length) {
    listEl.innerHTML = '<div class="news-item"><em>No items in this filter.</em></div>';
    return;
  }
  listEl.innerHTML = items.map((it) => {
    const titleHtml = (it.title_my && it.title_my.trim())
      ? '<div class="news-item__title news-item__title--my" lang="my">' + escapeHtml(it.title_my) + '</div>'
      : '';
    const titleEn = '<div class="news-item__title">' + escapeHtml(it.title_en || '') + '</div>';
    const bodyMy = (it.body_my && it.body_my.trim())
      ? '<div class="news-item__body news-item__body--my" lang="my">' + escapeHtml(it.body_my) + '</div>'
      : '';
    const bodyEn = '<div class="news-item__body">' + escapeHtml(it.body_en || '') + '</div>';
    return (
      '<article class="news-item" data-id="' + escapeHtml(it.id) + '">' +
        '<div class="news-item__head">' +
          '<span class="news-item__ts">' + escapeHtml(ago(it.ts)) + '</span>' +
          '<span class="news-item__src">' + escapeHtml(it.sourceLabel || it.source || '') + '</span>' +
          '<span class="news-item__loc">' + escapeHtml((it.location && it.location.place) || '') + '</span>' +
        '</div>' +
        titleHtml + titleEn +
        bodyMy + bodyEn +
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
      const item = newsState.find((x) => x.id === id);
      if (item) focusItem(item);
    });
  });

  const countEl = document.getElementById('newsCount');
  if (countEl) countEl.textContent = items.length + (items.length === 1 ? ' item' : ' items');
  const agoEl = document.getElementById('newsAgo');
  if (agoEl) agoEl.textContent = 'just now';
}

// Initial news load + periodic refresh every 90s
document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  setInterval(loadNews, 90000);
});

document.addEventListener('DOMContentLoaded', () => {
  $$('button[data-news-filter]').forEach((b) => {
    b.addEventListener('click', () => {
      $$('button[data-news-filter]').forEach((x) => x.classList.remove('menubar__item--active'));
      b.classList.add('menubar__item--active');
      activeFilter = b.dataset.newsFilter;
      renderNews();
      addMarkers(newsState.filter((it) => activeFilter === 'all' || it.region === activeFilter));
    });
  });
});

// ============ MODAL ============

function openIncidentModal(item) {
  const modal = document.getElementById('modal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = (item.title_en || item.title_my || item.location && item.location.place || 'Incident').slice(0, 80);
  const titleMy = (item.title_my && item.title_my.trim())
    ? '<h3 lang="my">' + escapeHtml(item.title_my) + '</h3>' : '';
  const titleEn = '<h3>' + escapeHtml(item.title_en || '') + '</h3>';
  const bodyMy = (item.body_my && item.body_my.trim())
    ? '<p lang="my">' + escapeHtml(item.body_my) + '</p>' : '';
  const bodyEn = '<p>' + escapeHtml(item.body_en || '') + '</p>';
  const meta = (
    '<div class="modal__meta">' +
      '<div>' + escapeHtml(item.sourceLabel || item.source || '') + '</div>' +
      '<div>' + escapeHtml(item.ts) + '</div>' +
      (item.location ? '<div>' + escapeHtml(item.location.place) + ' (' + item.location.lat.toFixed(3) + ', ' + item.location.lng.toFixed(3) + ')</div>' : '') +
      (item.url ? '<div><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">Open source ↗</a></div>' : '') +
    '</div>'
  );
  bodyEl.innerHTML = titleMy + titleEn + bodyMy + bodyEn + meta;
  modal.hidden = false;
}

function closeIncidentModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.hidden = true;
}

document.addEventListener('DOMContentLoaded', () => {
  $('#modalClose').addEventListener('click', closeIncidentModal);
  $('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeIncidentModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeIncidentModal();
  });
});

// ============ MAP TOOLBAR ============

document.addEventListener('DOMContentLoaded', () => {
  $$('.toolbar__btn[data-layer]').forEach((b) => {
    b.addEventListener('click', () => setMapStyle(b.dataset.layer));
  });
  $$('.toolbar__btn[data-action]').forEach((b) => {
    b.addEventListener('click', () => {
      const a = b.dataset.action;
      if (a === 'fit') fitAllMarkers();
      if (a === 'news-only') addMarkers(newsState.filter((it) => it.kind === 'news'));
      if (a === 'chat-only') {
        // Future: chat-derived pins
        addMarkers(newsState.filter((it) => it.kind === 'chat'));
      }
      if (a === 'all') addMarkers(newsState);
      if (a === 'add') enableAddPin();
    });
  });
  setMapStyle('satellite');
});

// "Add a pin manually" mode: click on map to drop a user-pin
let addPinMode = false;
let userPins = [];
function enableAddPin() {
  addPinMode = true;
  map.getCanvas().style.cursor = 'crosshair';
  flashStatus('Click on the map to drop a pin.');
}
map && map.on && map.on('click', (e) => {
  if (!addPinMode) return;
  addPinMode = false;
  map.getCanvas().style.cursor = '';
  const pin = {
    id: 'pin-' + Date.now(),
    kind: 'user-pin',
    title_en: 'Manual pin',
    body_en: 'Dropped at ' + e.lngLat.lat.toFixed(4) + ', ' + e.lngLat.lng.toFixed(4),
    location: { lat: e.lngLat.lat, lng: e.lngLat.lng, place: 'manual' },
    region: 'manual',
    ts: new Date().toISOString(),
    source: 'manual',
    sourceLabel: 'You',
  };
  userPins.push(pin);
  addMarkers(newsState.concat(userPins));
});

function flashStatus(text) {
  const sb = document.querySelector('.dash__left .statusbar .statusbar__item');
  if (!sb) return;
  const orig = sb.textContent;
  sb.textContent = text;
  setTimeout(() => { sb.textContent = orig; }, 2400);
}

// ============ CHAT ============

const ROOMS = {
  'monastic-youth': {
    title: '#monastic-youth',
    topic: 'Monastic education, novice monks, transitioning out, Burmese diaspora in Mae Sot and Chiang Mai. Open to anyone passing through.',
    members: [
      { nick: 'aung_myo', op: true, status: '' },
      { nick: 'nilar' },
      { nick: 'kyaw_zin' },
      { nick: 'thazin', voice: true },
      { nick: 'min_thu' },
      { nick: 'phyo', away: true },
      { nick: 'htun', away: true },
      { nick: 'guest' },
    ],
    seed: [
      { ts: '14:18', nick: 'aung_myo', body_html: '<span lang="my">မင်္ဂလာပါ</span> — wellcome for new here.' },
      { ts: '14:19', nick: 'nilar', body_html: '<span lang="my">ကျေးဇူးတင်ပါတယ်</span>. ma nyunt paw lar?' },
      { ts: '14:20', nick: 'aung_myo', op: true, body_html: '<span lang="my">မြန်မာပြည်က လာတာလား။ စာရေးတတ်လား</span>? literacy level?' },
      { ts: '14:21', nick: 'nilar', body_html: '<span lang="my">မန္တလေးကပါ။ ရွှေတောင်ကြား</span> — Mandalay side. reading ok.' },
      { ts: '14:22', nick: 'kyaw_zin', body_html: 'does anyone know if the Mae Sot monastery accepts people without thamanya yet?' },
      { ts: '14:24', nick: 'aung_myo', op: true, body_html: '<span lang="my">သာမဏယာ မလိုအပ်ဘူး</span> — but you do need thadowint. Mae Sot abbot says yes with phone reference.' },
      { ts: '14:31', nick: 'thazin', body_html: 'hi brothers. <span lang="my">ပျော်ရွှင်စရာ</span> — looking for roommate in Chiang Mai area, can split ฿3500/month.' },
      { ts: '14:40', nick: 'aung_myo', op: true, body_html: 'reminder: please use Bur-Myan where you can. English only if you really must.' },
      { type: 'mode', body_html: 'aung_myo sets +m (moderated)' },
      { type: 'topic', body_html: '<em>topic:</em> Monastic education, novice monks, transitioning out. Burmese diaspora in Mae Sot and Chiang Mai.' },
      { ts: '14:55', nick: 'min_thu', body_html: '<span lang="my">မင်္ဂလာပါ</span> everyone. today bkk immigration patrol at 11. anyone got paperwork to renew?' },
      { ts: '14:58', nick: 'aung_myo', op: true, body_html: '🚨 if your visa is expiring in the next 30 days — DO NOT leave the channel. message me directly. no broker. no money.' },
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
      { ts: '09:12', nick: 'admin', op: true, body_html: '<span lang="my">မင်္ဂလာပါ</span> — channel for BKK. no buy/sell here. please use #cm-burmese.' },
      { ts: '09:14', nick: 'yamin', body_html: 'anyone know a clinic near Khlong Toei open late?' },
      { ts: '09:15', nick: 'thiri', body_html: 'KMUTT Bang Na clinic — open until 21:00. walk-in ok.' },
      { ts: '09:20', nick: 'aung_khant', body_html: '<span lang="my">ကျေးဇူးပါ</span>. — saved.' },
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
      { ts: '11:02', nick: 'thazin', voice: true, body_html: 'Saturday meetup at Tha Pae Gate 16:00. noodle walk. <span lang="my">လာခဲ့နော်</span>.' },
      { ts: '11:04', nick: 'htun', body_html: 'bringing my sister, she is new to CM. english beginner.' },
      { ts: '11:05', nick: 'may', body_html: 'see you there.' },
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
      { ts: '06:00', type: 'topic', body_html: 'Today digest: 14 items. Yangon fuel queues · Mandalay monastic schools reopening · Chiang Mai bakery collective · 9 more.' },
      { ts: '06:00', nick: 'digest-bot', op: true, body_html: '<span lang="my">ယနေ့ သတင်းအကျဉ်းချုပ်</span> — 14 items across MM / diaspora / ASEAN / world. Discussion open.' },
    ],
  },
  'listening-club': {
    title: '#listening-club',
    topic: 'What people are saying across Burmese-language sources. Surfaced trends only.',
    members: [
      { nick: 'listening-bot', op: true, status: '@bot' },
      { nick: 'thiri' },
      { nick: 'kyaw_zin' },
      { nick: 'su_myat' },
    ],
    seed: [
      { ts: '08:00', type: 'topic', body_html: 'Surface 3 not yet shipping. Today is a placeholder.' },
      { ts: '08:00', nick: 'listening-bot', op: true, body_html: 'No live listener yet. The map on the left is the prototype. — listening-club' },
    ],
  },
};

let currentRoom = 'monastic-youth';
let roomMessageCount = {};

function renderRoom(roomId) {
  const room = ROOMS[roomId];
  if (!room) return;
  currentRoom = roomId;
  $$('button[data-room]').forEach((b) => b.classList.toggle('menubar__item--active', b.dataset.room === roomId));
  const titleEl = document.getElementById('chatRoomTitle');
  if (titleEl) titleEl.textContent = room.title;
  renderMessages();
  renderMembers();
}

function renderMessages() {
  const room = ROOMS[currentRoom];
  const wrap = document.getElementById('messages');
  if (!wrap || !room) return;
  const html = room.seed.map((m) => {
    if (m.type === 'topic') {
      return '<div class="msg msg--topic">' + (m.body_html || '') + '</div>';
    }
    if (m.type === 'mode') {
      return '<div class="msg msg--mode">— ' + (m.body_html || '') + '</div>';
    }
    if (m.type === 'server') {
      return '<div class="msg msg--server">— ' + escapeHtml(m.body_text || '') + '</div>';
    }
    const nickClass = m.op ? 'nick nick--op' : 'nick';
    return '<div class="msg"><span class="ts">' + escapeHtml(m.ts || timeNowHHMM()) + '</span> <span class="' + nickClass + '">' + escapeHtml(m.nick || '') + '</span> <span class="body">' + (m.body_html || escapeHtml(m.body_text || '')) + '</span></div>';
  }).join('');
  wrap.innerHTML = html;
  wrap.scrollTop = wrap.scrollHeight;
}

function renderMembers() {
  const room = ROOMS[currentRoom];
  const ul = document.getElementById('memberList');
  if (!ul || !room) return;
  ul.innerHTML = room.members.map((m) => {
    const cls = m.op ? 'members__nick members__nick--op' : (m.away ? 'members__nick members__nick--away' : 'members__nick');
    const tag = m.op ? '@op' : (m.voice ? '@voice' : (m.away ? 'away' : (m.status ? '@' + m.status : '')));
    return '<li><span class="' + cls + '">' + escapeHtml(m.nick) + '</span>' + (tag ? '<span class="members__tag">' + escapeHtml(tag) + '</span>' : '') + '</li>';
  }).join('');
}

function appendUserMessage(text, preview) {
  const wrap = document.getElementById('messages');
  if (!wrap) return;
  const html =
    '<div class="msg"><span class="ts">' + escapeHtml(timeNowHHMM()) + '</span> <span class="nick nick--op">guest</span> <span class="body">' + escapeHtml(text) + '</span></div>';
  wrap.insertAdjacentHTML('beforeend', html);
  if (preview && preview.url) {
    const pHtml =
      '<a class="preview" href="' + escapeHtml(preview.url) + '" target="_blank" rel="noopener">' +
        '<span class="preview__title" data-preview-title>' + escapeHtml(preview.title || preview.url) + '</span>' +
        '<span class="preview__desc" data-preview-desc>' + escapeHtml(preview.description || '') + '</span>' +
        '<span class="preview__host">' + escapeHtml(preview.host || '') + '</span>' +
      '</a>';
    wrap.insertAdjacentHTML('beforeend', pHtml);
  }
  wrap.scrollTop = wrap.scrollHeight;
}

function detectFirstUrl(text) {
  const m = text.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

document.addEventListener('DOMContentLoaded', () => {
  $$('button[data-room]').forEach((b) => {
    b.addEventListener('click', () => renderRoom(b.dataset.room));
  });
  renderRoom('monastic-youth');

  const form = document.getElementById('composer');
  const input = document.getElementById('input');
  if (!form || !input) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    const url = detectFirstUrl(raw);
    let preview = null;
    if (url) {
      try {
        const r = await fetch('/api/preview?url=' + encodeURIComponent(url), { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (j.ok) preview = j;
        }
      } catch (e) {
        // ignore — card will show URL as title
      }
      if (!preview) preview = { url: url, host: url.replace(/^https?:\/\//, '').split('/')[0], title: url };
    }
    appendUserMessage(raw, preview);
    input.value = '';
  });
});

// ============ CLOCK ============

document.addEventListener('DOMContentLoaded', () => {
  function tickClock() {
    const c = document.getElementById('newsClock');
    if (c) c.textContent = timeNowICT();
  }
  tickClock();
  setInterval(tickClock, 1000);
});

// ============ INITIAL RENDER ============

document.addEventListener('DOMContentLoaded', () => {
  // No-op; modules attached above.
});

})();

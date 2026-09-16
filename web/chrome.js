// Pirchchat — chrome.js
// Every button does something. Win95 dropdown menus, titlebar window
// controls, survival guide modal, phrasebook, hotlines, news export,
// chat help, crisis banner wiring, mention beep.
// Depends on: survival.js (window.PirchSurvival). Runs after dashboard.js.

(function () {
'use strict';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function flashLeft(text) {
  const sb = $('.dash__left .statusbar .statusbar__item');
  if (!sb) return;
  const orig = sb.textContent;
  sb.textContent = text;
  setTimeout(() => { sb.textContent = orig; }, 2600);
}

function download(name, text) {
  const blob = new Blob([text], { type: 'text/plain; charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

// ---------- sound (PIRCH-style beep, off by default) ----------
let soundOn = false;
try { soundOn = localStorage.getItem('pirchchat.sound') === '1'; } catch (e) {}
function beep() {
  if (!soundOn) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = beep.ctx || (beep.ctx = new Ctx());
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 880; g.gain.value = 0.04;
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.09);
  } catch (e) {}
}
window.__pirchBeep = beep;
window.__pirchSoundOn = () => soundOn;

// ---------- dropdown menus ----------
const MENUS = {
  file: [
    { label: 'Set display name…', key: 'F2', fn: openIdentityRename },
    { label: 'Export chat log (.txt)', key: '', fn: exportChat },
    { label: 'Export news list (.txt)', key: '', fn: exportNews },
    { sep: true },
    { label: 'Print this view', key: 'Ctrl+P', fn: () => window.print() },
    { label: 'Back to landing page', key: '', fn: () => { window.location = 'index.html'; } },
  ],
  view: [
    { label: 'Cycle basemap (sat/streets/dark/topo)', key: 'B', fn: cycleBasemap },
    { label: 'Fit all markers', key: 'F', fn: () => clickToolbar('[data-action="fit"]') },
    { label: 'Go to: Bangkok', key: '', fn: () => flyTo(100.5018, 13.7563, 10, 'Bangkok') },
    { label: 'Go to: Chiang Mai', key: '', fn: () => flyTo(98.9853, 18.7883, 10, 'Chiang Mai') },
    { label: 'Go to: Mae Sot', key: '', fn: () => flyTo(98.5473, 16.7456, 10, 'Mae Sot') },
    { label: 'Go to: Yangon', key: '', fn: () => flyTo(96.1735, 16.8409, 9, 'Yangon') },
  ],
  layers: [
    { label: 'Toggle: News markers', key: '', fn: () => clickToolbar('[data-layer-toggle="news"]') },
    { label: 'Toggle: Cities', key: '', fn: () => clickToolbar('[data-layer-toggle="cities"]') },
    { label: 'Toggle: Radio', key: '', fn: () => clickToolbar('[data-layer-toggle="radio"]') },
    { label: 'Toggle: TV', key: '', fn: () => clickToolbar('[data-layer-toggle="tv"]') },
    { label: 'Toggle: Rain', key: '', fn: () => clickToolbar('[data-layer-toggle="rain"]') },
    { label: 'Toggle: NASA Terra (yesterday)', key: '', fn: () => clickToolbar('[data-layer-toggle="nasa"]') },
    { label: 'Toggle: Earthquakes (USGS 30d)', key: '', fn: () => clickToolbar('[data-layer-toggle="quakes"]') },
    { label: 'Pick point weather…', key: 'W', fn: () => clickToolbar('[data-action="wx"]') },
    { sep: true },
    { label: 'Himawari-9 satellite (JMA) ↗', key: '', fn: () => window.open('https://www.jma.go.jp/en/gms/', '_blank', 'noopener') },
    { label: 'FIRMS fires (NASA) ↗', key: '', fn: () => window.open('https://firms.modaps.eosdis.nasa.gov/map/', '_blank', 'noopener') },
  ],
  tools: [
    { label: 'Survival guide…', key: 'G', fn: () => openGuide('all') },
    { label: 'Phrasebook…', key: '', fn: () => openGuide('phrases') },
    { label: 'Human hotlines…', key: '', fn: () => openGuide('hotlines') },
    { label: 'Kyat–baht calculator…', key: '', fn: () => openGuide('ideas') },
    { sep: true },
    { label: 'Toggle sound (mention beep)', key: '', fn: toggleSound },
    { label: 'Ground rules…', key: '', fn: openRules },
    { label: 'About Pirchchat…', key: '', fn: openAbout },
  ],
};

function clickToolbar(sel) {
  const b = $(sel);
  if (b) b.click();
  else flashLeft('Toolbar not ready yet.');
}

function cycleBasemap() {
  const order = ['satellite', 'streets', 'dark', 'light'];
  const cur = $('.toolbar__btn[data-layer].is-pressed');
  const curKey = cur ? cur.dataset.layer : 'satellite';
  const next = order[(order.indexOf(curKey) + 1) % order.length];
  clickToolbar('.toolbar__btn[data-layer="' + next + '"]');
  flashLeft('Basemap: ' + next);
}

function flyTo(lng, lat, zoom, name) {
  flashLeft('Flying to ' + name + '…');
  try {
    if (window.__pirchMap && window.__pirchMap.flyTo) {
      window.__pirchMap.flyTo({ center: [lng, lat], zoom: zoom || 9, essential: true });
      return;
    }
  } catch (e) {}
}

function openIdentityRename() {
  const m = $('#identityModal');
  if (m) { m.hidden = false; const n = $('#identityName'); if (n) n.focus(); }
}

function exportChat() {
  const c = window.__pirchchatClient && window.__pirchchatClient.state;
  const room = (c && c.currentRoom) || 'chat';
  const msgs = (c && c.history) || [];
  const lines = msgs.map((m) => {
    const d = new Date(m.ts || Date.now());
    const t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const body = String(m.body_html || '').replace(/<[^>]+>/g, '');
    return '[' + t + '] <' + (m.author_name || 'anon') + '> ' + body;
  });
  download('pirchchat-' + room + '.txt',
    'Pirchchat #' + room + ' — exported ' + new Date().toISOString() + '\n' +
    'Public room messages. Nicknames are unverified.\n\n' + lines.join('\n') + '\n');
  flashLeft('Chat log exported (' + lines.length + ' lines).');
}

function exportNews() {
  const items = $$('.news-item').map((el) => {
    const t = el.querySelector('.news-item__title');
    const s = el.querySelector('.news-item__src');
    const a = el.querySelector('.news-item__meta a');
    return '- ' + (t ? t.textContent.trim() : '') + ' [' + (s ? s.textContent.trim() : '') + '] ' + (a ? a.href : '');
  });
  if (!items.length) { flashLeft('No news items to export.'); return; }
  download('pirchchat-news.txt',
    'Pirchchat news — exported ' + new Date().toISOString() + '\n\n' + items.join('\n') + '\n');
  flashLeft('News exported (' + items.length + ' items).');
}

function toggleSound() {
  soundOn = !soundOn;
  try { localStorage.setItem('pirchchat.sound', soundOn ? '1' : '0'); } catch (e) {}
  flashLeft('Mention beep ' + (soundOn ? 'ON' : 'OFF') + '.');
}

function openRules() {
  openIncident('Ground rules',
    '<h3>Ground rules</h3>' +
    '<p>Be useful to the room. No spam. No politics of personal grievance.</p>' +
    '<p>Burmese first, English second. Real names or persistent handles — not throwaways.</p>' +
    '<p>We remember the network ID, not the literal IP. Switching identities will be detected.</p>' +
    '<p>No PII collected by default. Profile creation is opt-in.</p>');
}

function openAbout() {
  openIncident('About Pirchchat',
    '<h3>Pirchchat — A-Lin-Ein</h3>' +
    '<p>A Burmese-language community platform. Persistent rooms. A daily digest. Social listening. A world map. A career navigator.</p>' +
    '<p>Old-school public rooms, mid-1990s windows, the long way home.</p>' +
    '<p>Thai-side data and Burmese diaspora only. Discovery, not diagnosis. Real-human escalation for crisis.</p>');
}

function openIncident(title, html) {
  const modal = $('#incidentModal');
  if (!modal) return;
  $('#incidentTitle').textContent = title;
  $('#incidentBody').innerHTML = html;
  modal.hidden = false;
}

// ---------- guide modal ----------
let guideFilter = 'all';

function openGuide(filter) {
  guideFilter = filter || 'all';
  $$('#guideTabs .menubar__item').forEach((b) =>
    b.classList.toggle('menubar__item--active', b.dataset.guide === guideFilter));
  renderGuide();
  $('#guideModal').hidden = false;
}
window.__pirchOpenGuide = openGuide;

function renderGuide() {
  const S = window.PirchSurvival;
  const body = $('#guideBody');
  if (!body || !S) return;
  if (guideFilter === 'phrases') return renderPhrases(body, S);
  if (guideFilter === 'hotlines') return renderHotlines(body, S);
  if (guideFilter === 'jobs') return renderJobs(body, S);
  const cards = S.GUIDE.filter((g) => guideFilter === 'all' || g.topic === guideFilter);
  if (!cards.length) { body.innerHTML = '<p><em>No cards in this section.</em></p>'; return; }
  body.innerHTML = cards.map((g) => {
    const calc = g.cost === 'CALCULATOR'
      ? '<div class="calc-row"><input id="calc-' + g.id + '" inputmode="decimal" placeholder="THB e.g. 5000">' +
        '<button type="button" class="guide-card__ask" data-calc="' + g.id + '">Convert</button>' +
        '<span class="calc-out" id="calc-out-' + g.id + '"></span></div>'
      : '';
    return '<article class="guide-card">' +
      '<div class="guide-card__head"><span class="guide-card__icon">' + esc(g.icon) + '</span>' +
      '<span class="guide-card__title">' + esc(g.title_en) + '</span></div>' +
      '<div class="guide-card__body"><div class="guide-card__title-my" lang="my">' + esc(g.title_my) + '</div>' +
      '<p lang="my" class="guide-card__body--my">' + esc(g.body_my) + '</p>' +
      '<p>' + esc(g.body_en) + '</p></div>' + calc +
      '<div class="guide-card__meta"><span>Where: ' + esc(g.where) + '</span><span>Cost: ' + esc(g.cost === 'CALCULATOR' ? 'see calculator' : g.cost) + '</span></div>' +
      '<button type="button" class="guide-card__ask" data-ask="' + esc(g.ask_in) + '" data-q="' + esc(g.title_en) + '">Ask in #' + esc(g.ask_in) + '</button>' +
      '</article>';
  }).join('');

  $$('#guideBody [data-ask]').forEach((b) => b.addEventListener('click', () => {
    const room = b.dataset.ask;
    const q = b.dataset.q;
    $('#guideModal').hidden = true;
    if (window.__pirchchatSwitchRoom) window.__pirchchatSwitchRoom(room);
    setActiveTab('chat');
    const input = $('#input');
    if (input) { input.value = 'About "' + q + '" — my question: '; input.focus(); }
  }));

  $$('#guideBody [data-calc]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.calc;
    const inp = $('#calc-' + id);
    const out = $('#calc-out-' + id);
    const thb = parseFloat(inp && inp.value);
    if (!thb || thb <= 0) { if (out) out.textContent = 'Enter a THB amount.'; return; }
    // Illustrative corridor rate. Labelled as estimate, not a quote.
    const RATE = 152; // MMK per THB, estimate — check broker
    const mmk = Math.round(thb * RATE);
    if (out) out.textContent = '≈ ' + mmk.toLocaleString('en-US') + ' MMK (est. ' + RATE + '/THB — check broker)';
  }));
}

function renderPhrases(body, S) {
  body.innerHTML = '<p>Survival phrases. Tap <strong>Copy</strong>, paste into the room or show the screen.</p>' +
    '<table class="phrase-table"><thead><tr><th>Burmese</th><th>Thai</th><th>English</th><th></th></tr></thead><tbody>' +
    S.PHRASES.map((p, i) =>
      '<tr><td lang="my">' + esc(p.my) + '</td><td>' + esc(p.th) + '</td><td>' + esc(p.en) +
      '<br><em style="font-size:11px;color:var(--ink-muted)">' + esc(p.use) + '</em></td>' +
      '<td><button type="button" class="phrase-copy" data-phrase="' + i + '">Copy</button></td></tr>').join('') +
    '</tbody></table>';
  $$('#guideBody [data-phrase]').forEach((b) => b.addEventListener('click', () => {
    const p = S.PHRASES[+b.dataset.phrase];
    const text = p.my + ' / ' + p.th + ' / ' + p.en;
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    b.textContent = 'Copied';
    setTimeout(() => { b.textContent = 'Copy'; }, 1200);
  }));
}

function renderHotlines(body, S) {
  body.innerHTML = '<p>Real humans, not a model. If anyone in the room is in crisis — self-harm, exploitation, trafficking, deportation fear — point here.</p>' +
    S.HOTLINES.map((h) =>
      '<article class="guide-card"><div class="guide-card__head"><span class="guide-card__icon">＋</span>' +
      '<span class="guide-card__title">' + esc(h.name) + '</span></div>' +
      '<div class="guide-card__body"><p>' + (h.num ? '<a href="tel:' + esc(h.num) + '"><strong>' + esc(h.num) + '</strong></a> · ' : '') + esc(h.lang) + '</p><p>' + esc(h.note) + '</p>' + (h.source ? '<a href="' + esc(h.source) + '" target="_blank" rel="noopener">Official source ↗</a>' : '') + '</div></article>'
    ).join('');
}

function renderJobs(body, S) {
  const boards = (S.JOBS || []).map((j) =>
    '<article class="guide-card"><div class="guide-card__head"><span class="guide-card__icon">▤</span>' +
    '<span class="guide-card__title">' + esc(j.name) + '</span></div>' +
    '<div class="guide-card__body"><p lang="my" class="guide-card__body--my">' + esc(j.note_my) + '</p>' +
    '<p>' + esc(j.note_en) + '</p></div>' +
    '<div class="guide-card__meta"><span><a href="' + esc(j.url) + '" target="_blank" rel="noopener">' + esc(j.url_label) + ' ↗</a></span>' +
    '<span>' + esc(j.langs) + '</span></div>' +
    '<button type="button" class="guide-card__ask" data-ask="' + esc(j.ask_in) + '" data-q="Is this listing good? ' + esc(j.name) + '">Discuss in #' + esc(j.ask_in) + '</button>' +
    '</article>').join('');

  const good = (S.GOOD_JOB || []).map((g, i) =>
    '<tr><td>' + (i + 1) + '</td><td lang="my">' + esc(g.my) + '</td><td>' + esc(g.en) + '</td></tr>').join('');
  const bad = (S.RED_FLAGS || []).map((r) =>
    '<tr><td>✕</td><td lang="my">' + esc(r.my) + '</td><td>' + esc(r.en) + '</td></tr>').join('');

  body.innerHTML =
    '<p>Where to look — every link checked Sept 2026. Links move; the room keeps this list honest. Failing any checklist line? Discuss in <strong>#bkk-burmese</strong> before signing.</p>' +
    boards +
    '<h3 style="margin:14px 0 6px">Is this job good? — အလုပ်ကောင်းလား</h3>' +
    '<table class="phrase-table"><thead><tr><th>#</th><th>Burmese</th><th>English</th></tr></thead><tbody>' + good + '</tbody></table>' +
    '<h3 style="margin:14px 0 6px">Walk away — ထွက်သွားပါ</h3>' +
    '<table class="phrase-table"><thead><tr><th></th><th>Burmese</th><th>English</th></tr></thead><tbody>' + bad + '</tbody></table>';

  $$('#guideBody [data-ask]').forEach((b) => b.addEventListener('click', () => {
    const room = b.dataset.ask;
    const q = b.dataset.q;
    $('#guideModal').hidden = true;
    if (window.__pirchchatSwitchRoom) window.__pirchchatSwitchRoom(room);
    setActiveTab('chat');
    const input = $('#input');
    if (input) { input.value = q + ' — my question: '; input.focus(); }
  }));
}

function setActiveTab(name) {
  if (window.__pirchSetActiveTab) return window.__pirchSetActiveTab(name);
  document.body.setAttribute('data-tab', name);
  $$('.tabs-top__btn').forEach((b) => b.classList.toggle('tabs-top__btn--active', b.dataset.tab === name));
}

// ---------- crisis banner ----------
function showCrisis() { const b = $('#crisisBanner'); if (b) b.hidden = false; }
window.__pirchShowCrisis = showCrisis;

// ---------- wire everything ----------
document.addEventListener('DOMContentLoaded', function () {
  // Map dropdown
  const menu = $('#mapMenu');
  const menubar = menu ? menu.parentElement : null;
  $$('button[data-mapmenu]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!menu) return;
      const key = btn.dataset.mapmenu;
      const items = MENUS[key] || [];
      const r = btn.getBoundingClientRect();
      const pr = menubar.getBoundingClientRect();
      menu.style.left = (r.left - pr.left) + 'px';
      menu.style.top = (r.bottom - pr.top) + 'px';
      menu.innerHTML = items.map((it, i) => it.sep
        ? '<div class="dropdown__item--sep"></div>'
        : '<button type="button" class="dropdown__item" data-mi="' + i + '"><span>' + esc(it.label) + '</span>' +
          (it.key ? '<span class="dropdown__key">' + esc(it.key) + '</span>' : '') + '</button>').join('');
      menu.hidden = false;
      $$('.dropdown__item[data-mi]', menu).forEach((mi) => {
        mi.addEventListener('click', () => { menu.hidden = true; const it = items[+mi.dataset.mi]; if (it && it.fn) it.fn(); });
      });
    });
  });
  document.addEventListener('click', (e) => {
    if (menu && !menu.hidden && !menu.contains(e.target)) menu.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && !menu.hidden) menu.hidden = true;
  });

  // Titlebar window controls
  const left = $('.dash__left');
  const minBtn = $('#mapMin'), maxBtn = $('#mapMax'), closeBtn = $('#mapClose');
  if (minBtn) minBtn.addEventListener('click', () => {
    if (!left) return;
    left.classList.toggle('is-min');
    flashLeft(left.classList.contains('is-min') ? 'Map minimized. Click ▢ to restore.' : 'Map restored.');
  });
  if (maxBtn) maxBtn.addEventListener('click', () => {
    if (!left) return;
    left.classList.remove('is-min');
    if (window.__pirchMap) window.__pirchMap.resize();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (left.requestFullscreen) left.requestFullscreen().catch(() => flashLeft('Fullscreen blocked by browser.'));
  });
  if (closeBtn) closeBtn.addEventListener('click', () => {
    if (confirm('Close the map and go back to the landing page?')) window.location = 'index.html';
  });

  // Toolbar guide / hotlines
  $$('.toolbar__btn[data-action="guide"]').forEach((b) => b.addEventListener('click', () => openGuide('all')));
  $$('.toolbar__btn[data-action="hotlines"]').forEach((b) => b.addEventListener('click', () => openGuide('hotlines')));

  // News actions
  $$('button[data-news-action="guide"]').forEach((b) => b.addEventListener('click', () => openGuide('all')));
  $$('button[data-news-action="jobs"]').forEach((b) => b.addEventListener('click', () => openGuide('jobs')));
  $$('button[data-news-action="export"]').forEach((b) => b.addEventListener('click', exportNews));

  // Guide tabs + close
  $$('#guideTabs .menubar__item').forEach((b) => b.addEventListener('click', () => openGuide(b.dataset.guide)));
  const gc = $('#guideClose');
  if (gc) gc.addEventListener('click', () => { $('#guideModal').hidden = true; });
  const gm = $('#guideModal');
  if (gm) gm.addEventListener('click', (e) => { if (e.target.id === 'guideModal') gm.hidden = true; });

  // Chat help
  const ch = $('#chatHelp');
  if (ch) ch.addEventListener('click', () => {
    openIncident('Chat commands',
      '<h3>Chat commands</h3>' +
      '<p><strong>/nick newname</strong> — change display name · <strong>/me does things</strong> — action line</p>' +
      '<p><strong>/join room</strong> — switch room · <strong>/guide</strong> — survival guide · <strong>/hotline</strong> — human hotlines</p>' +
      '<p><strong>/export</strong> — download this room log · <strong>/clear</strong> — clear screen · <strong>/help</strong> — this card</p>' +
      '<p>Type a name once in the welcome box, then just type. URLs become preview cards. Images attach with the paperclip.</p>');
  });

  // Crisis banner buttons
  const cb = $('#crisisDismiss');
  if (cb) cb.addEventListener('click', () => { $('#crisisBanner').hidden = true; });
  const chb = $('#crisisHotlines');
  if (chb) chb.addEventListener('click', () => openGuide('hotlines'));

  // Keyboard shortcuts: g guide, b basemap, f fit
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'g' || e.key === 'G') openGuide('all');
    if (e.key === 'b' || e.key === 'B') cycleBasemap();
    if (e.key === 'f' || e.key === 'F') clickToolbar('[data-action="fit"]');
    if (e.key === 'w' || e.key === 'W') clickToolbar('[data-action="wx"]');
  });

  // Mention beep on incoming WS messages
  const origAppend = window.__pirchchatClient;
  setInterval(() => {
    try {
      const c = window.__pirchchatClient && window.__pirchchatClient.state;
      const name = c && c.identity && c.identity.name;
      if (!c || !name || !c.history || !c.history.length) return;
      const last = c.history[c.history.length - 1];
      if (!last || last._beeped) return;
      last._beeped = true;
      if (last.author_pubkey !== c.identity.network &&
          String(last.body_html || '').toLowerCase().includes(String(name).toLowerCase())) beep();
    } catch (e) {}
  }, 1500);
});

})();

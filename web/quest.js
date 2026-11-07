// Pirchchat — Career Navigator quest player (Surface 5).
//
// One panel, one owner. The scenario catalogue is fetched from the server
// (/api/quest/scenarios); there is no client-side copy of the data, and the
// server scores every submission. A trait verdict is only ever shown when
// the server returned it — the browser never scores on its own.
//
// No PII. The submit payload carries a quest id, a choice id and two
// timestamps. Nothing is stored about who asked.
//
// Burmese strings come from the server catalogue and still need native
// review — see docs/REVIEW-PACKET.md.

(function () {
'use strict';

var panel = document.getElementById('questPanel');
var toggle = document.getElementById('questToggle');
if (!panel || !toggle) return;

var catalogue = null;      // { scenarios, traits, traitLabels }
var state = { view: 'list', quest: null, result: null };
var loading = false;

function lang() {
  return window.__pirchLang === 'en' ? 'en' : 'my';
}

function text(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang()] || obj.my || obj.en || '';
}

function el(tag, cls, content) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (content !== undefined && content !== null) e.textContent = content;
  return e;
}

function clear() {
  panel.innerHTML = '';
  // Burmese script rendering is renderer-sensitive (AGENTS.md §4): the lang
  // attribute is what tells a phone to reach for Noto Sans Myanmar instead of
  // a system fallback that breaks vowel stacking.
  panel.setAttribute('lang', lang() === 'en' ? 'en' : 'my');
}

function metaLine(textContent) {
  return el('p', 'micro-panel__meta', textContent);
}

function label(en, my) {
  return lang() === 'en' ? en : my;
}

// ---------- catalogue ----------

function loadCatalogue() {
  if (catalogue || loading) return Promise.resolve(catalogue);
  loading = true;
  return fetch('/api/quest/scenarios', { headers: { accept: 'application/json' } })
    .then(function (res) {
      // Pages answers an unknown /api/* path with the app shell and HTTP 200.
      // Content type and payload shape are the only reliable checks.
      var type = res.headers.get('content-type') || '';
      if (type.indexOf('application/json') === -1) throw new Error('not_json');
      return res.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true || !Array.isArray(data.scenarios) || !data.scenarios.length) {
        throw new Error('bad_payload');
      }
      catalogue = data;
      loading = false;
      return catalogue;
    })
    .catch(function (err) {
      loading = false;
      catalogue = null;
      throw err;
    });
}

// ---------- views ----------

function renderList() {
  state.view = 'list';
  state.quest = null;
  state.result = null;
  clear();

  panel.appendChild(el('h3', '', label('Career Navigator', 'အလုပ်သိကြား')));
  panel.appendChild(el('p', 'micro-panel__intro',
    label('Pick a situation. One choice, then a reflection from the server.',
          'အခြေအနေတစ်ခုကို ရွေးပါ။ ရွေးချယ်မှုတစ်ခု ပြီးရင် ဆာဗာမှ အဖြေတစ်ခု ပေးမည်။')));

  var list = el('div', 'questlist');
  catalogue.scenarios.forEach(function (s) {
    var btn = el('button', 'questlist__item');
    btn.type = 'button';
    btn.appendChild(el('span', 'questlist__title', text(s.title)));
    btn.appendChild(el('span', 'questlist__meta',
      s.estimatedMinutes ? ('~' + s.estimatedMinutes + ' ' + label('min', 'မိနစ်')) : ''));
    btn.addEventListener('click', function () { openQuest(s); });
    list.appendChild(btn);
  });
  panel.appendChild(list);

  panel.appendChild(metaLine(label(
    'Discovery, not diagnosis. No profile is created and nothing is stored about you.',
    'ဆန်းစပ်ခြင်းသည် ရောက်မှုအတွက် အဖြေရှင်းမဟုတ်ပါ။ အကောင့်မှတ်တမ်းမလုပ်ပါ၊ သင့်အကြောင်း မည်သူများသိမှသည်ကိုလည်း မသိမ်းဆည်းပါ။')));
}

function openQuest(scenario) {
  state.view = 'play';
  state.quest = scenario;
  state.result = null;
  clear();

  panel.appendChild(el('h3', '', text(scenario.title)));
  if (scenario.role) panel.appendChild(el('p', 'micro-panel__role', text(scenario.role)));
  panel.appendChild(el('p', '', text(scenario.premise)));

  if (scenario.constraints && scenario.constraints[lang()] && scenario.constraints[lang()].length) {
    var cons = el('ul', 'questlist__cons');
    scenario.constraints[lang()].forEach(function (line) {
      cons.appendChild(el('li', '', line));
    });
    panel.appendChild(cons);
  }

  var choices = el('div', 'micro-panel__choices');
  scenario.choices.forEach(function (c) {
    var btn = el('button', 'micro-panel__choice', text(c.label));
    btn.type = 'button';
    btn.addEventListener('click', function () { submit(c.id, btn); });
    choices.appendChild(btn);
  });
  panel.appendChild(choices);

  var back = el('button', 'micro-panel__choice micro-panel__choice--ghost',
    label('← Back to the list', '← စာရင်းသို့ ပြန်'));
  back.type = 'button';
  back.addEventListener('click', function () { renderList(); });
  panel.appendChild(back);
}

function submit(choiceId, button) {
  var scenario = state.quest;
  if (!scenario) return;

  // One submission at a time. The buttons are disabled until the server answers.
  var buttons = panel.querySelectorAll('.micro-panel__choice');
  Array.prototype.forEach.call(buttons, function (b) { b.disabled = true; });
  if (button) button.textContent = label('Sending…', 'ပို့နေသည်…');

  var payload = {
    questId: scenario.id,
    questVersion: scenario.version,
    selectionPath: [choiceId],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  fetch('/api/quest/' + encodeURIComponent(scenario.id) + '/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })
    .then(function (res) {
      var type = res.headers.get('content-type') || '';
      if (type.indexOf('application/json') === -1) throw new Error('not_json');
      return res.json().then(function (data) { return { status: res.status, data: data }; });
    })
    .then(function (r) {
      if (!r.data || r.data.ok !== true) throw new Error(r.data && r.data.error ? r.data.error : 'bad_payload');
      renderResult(scenario, choiceId, r.data);
    })
    .catch(function (err) {
      renderFailure(scenario, choiceId, err && err.message);
    });
}

function renderResult(scenario, choiceId, data) {
  state.view = 'result';
  state.result = { choiceId: choiceId, data: data };
  clear();

  panel.appendChild(el('h3', '', text(scenario.title)));

  var chosen = null;
  scenario.choices.forEach(function (c) { if (c.id === choiceId) chosen = c; });
  var line = el('p', '');
  line.appendChild(el('strong', '', label('Your choice: ', 'သင့်ရွေးချယ်မှု: ')));
  line.appendChild(document.createTextNode(chosen ? text(chosen.label) : choiceId));
  panel.appendChild(line);

  var refl = el('p', 'questlist__reflection');
  refl.appendChild(el('strong', '', label('Reflection: ', 'ထပ်မံကြည့်မှု: ')));
  refl.appendChild(document.createTextNode(text(data.reflection)));
  panel.appendChild(refl);

  // The trait names a practice, not a personality. Numbers are the raw
  // trade-off weights the server computed for this choice.
  var labels = (catalogue && catalogue.traitLabels) || {};
  var weights = data.weights || {};
  var parts = [];
  Object.keys(weights).forEach(function (k) {
    var l = labels[k];
    if (!l) return;
    var v = weights[k];
    if (!v) return;
    parts.push(text(l) + ' ' + (v > 0 ? '+' : '') + v);
  });
  if (parts.length) {
    var signal = el('p', 'micro-panel__meta');
    signal.appendChild(el('strong', '', label('Practice signal: ', 'လေ့ကျင့်မှု ညွှန်းချက်: ')));
    signal.appendChild(document.createTextNode(parts.join(' · ')));
    panel.appendChild(signal);
  }

  panel.appendChild(metaLine(label(
    'A practice signal, not a diagnosis or a personality test. Nothing about you is stored.',
    'ဤသည်မှာ လေ့ကျင့်မှု ညွှန်းချက်သာ ဖြစ်ပြီး ရောက်မှု အမှတ်အတင်း မဟုတ်ပါ။ သင့်အချက်အလက် မည်သူများသိမှသည်ကိုလည်း မသိမ်းဆည်းပါ။')));

  var again = el('button', 'micro-panel__choice', label('Try another situation', 'နောက်တစ်ခု ကြည့်ရန်'));
  again.type = 'button';
  again.addEventListener('click', function () { renderList(); });
  panel.appendChild(again);
}

function renderFailure(scenario, choiceId, reason) {
  clear();
  panel.appendChild(el('h3', '', text(scenario.title)));
  var msg = el('p', 'questlist__failure');
  msg.appendChild(el('strong', '', label('No answer from the server. ', 'ဆာဗာမှ အဖြေမရသွင်းပါ။ ')));
  msg.appendChild(document.createTextNode(label(
    'The choice was not scored, so no reflection is shown. Try again in a moment.',
    'ရွေးချယ်မှုကို အမှတ်ပေးခြင်း မဖြစ်သောကြောင့် ထပ်မံကြည့်မှု မပြထားပါ။ ခဏနေ ထပ်ကြိုးစားပါ။')));
  panel.appendChild(msg);
  panel.appendChild(metaLine('reason: ' + String(reason || 'unknown')));

  var again = el('button', 'micro-panel__choice', label('Try again', 'ထပ်မံကြိုးစားရန်'));
  again.type = 'button';
  again.addEventListener('click', function () { openQuest(scenario); });
  panel.appendChild(again);
}

function renderError() {
  clear();
  panel.appendChild(el('h3', '', label('Career Navigator', 'အလုပ်သိကြား')));
  var msg = el('p', 'questlist__failure');
  msg.appendChild(el('strong', '', label('Could not load the situations. ', 'အခြေအနေများ မဖွင့်နိုင်ပါ။ ')));
  msg.appendChild(document.createTextNode(label(
    'The catalogue did not answer. Nothing is guessed here.',
    'စာရင်းက ပြန်လည်မပြန်ပါ။ အတုယူ ဖြည့်ထားခြင်း မရှိပါ။')));
  panel.appendChild(msg);

  var again = el('button', 'micro-panel__choice', label('Retry', 'ထပ်မံကြိုးစားရန်'));
  again.type = 'button';
  again.addEventListener('click', function () {
    loadCatalogue().then(renderList).catch(renderError);
  });
  panel.appendChild(again);
}

// ---------- wiring ----------

function open() {
  // One micro-panel at a time: the peer-exchange panel closes when the
  // Career Navigator opens.
  var other = document.getElementById('exchangePanel');
  if (other) other.hidden = true;
  var otherToggle = document.getElementById('exchangeToggle');
  if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');

  if (catalogue) { renderList(); return; }
  clear();
  panel.appendChild(el('h3', '', label('Career Navigator', 'အလုပ်သိကြား')));
  panel.appendChild(el('p', 'micro-panel__meta', label('Loading…', 'ဖွင့်နေသည်…')));
  loadCatalogue().then(renderList).catch(renderError);
}

toggle.addEventListener('click', function () {
  var openNow = panel.hidden;
  panel.hidden = !openNow;
  toggle.setAttribute('aria-expanded', String(openNow));
  if (openNow) open();
});

// The interface language can change while the panel is open. Re-render.
document.addEventListener('pirch:lang', function () {
  if (panel.hidden) return;
  if (state.view === 'list' && catalogue) renderList();
  else if (state.view === 'play' && state.quest) openQuest(state.quest);
  else if (state.view === 'result' && state.quest && state.result) {
    // The reflection is a server answer, so it is re-rendered from the
    // answer already in hand — not fetched again.
    renderResult(state.quest, state.result.choiceId, state.result.data);
  }
});

})();

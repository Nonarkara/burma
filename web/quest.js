// Pirchchat — Career Navigator quest player (Surface 5).
// Vanilla JS, loaded as a plain <script> after dashboard.js.
// Renders the quest scenario in #questPanel, handles choice selection,
// scores via window.PirchQuest.scoreQuest, and shows the reflection.
//
// No PII collected. No server call. Everything runs in-browser.
// Burmese strings need native review — see docs/REVIEW-PACKET.md.

(function () {
'use strict';

var questPanel = document.getElementById('questPanel');
var questToggle = document.getElementById('questToggle');
var scenario = window.PirchQuest && window.PirchQuest.SCENARIO;
var lang = 'my'; // default Burmese-first

function el(tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function t(obj) {
  // Return localized text: Burmese first, English fallback.
  if (!obj) return '';
  return obj.my || obj.en || '';
}

function renderQuest() {
  if (!scenario || !questPanel) return;
  questPanel.hidden = false;
  questPanel.innerHTML = '';

  var h3 = el('h3', '', t(scenario.title));
  questPanel.appendChild(h3);

  if (scenario.role) {
    var role = el('p', '', t(scenario.role));
    questPanel.appendChild(role);
  }

  var p = el('p', '', t(scenario.premise));
  questPanel.appendChild(p);

  if (scenario.constraints && scenario.constraints.my && scenario.constraints.my.length) {
    var cons = el('div', 'micro-panel__meta');
    cons.innerHTML = '<strong>Constraints:</strong> ' +
      scenario.constraints[lang].map(esc).join('; ');
    questPanel.appendChild(cons);
  }

  var choicesDiv = el('div', 'micro-panel__choices');
  scenario.choices.forEach(function (c) {
    var btn = el('button', 'micro-panel__choice', esc(t(c.label)));
    btn.setAttribute('data-choice', c.id);
    btn.addEventListener('click', function () { choose(c.id); });
    choicesDiv.appendChild(btn);
  });
  questPanel.appendChild(choicesDiv);

  var meta = el('div', 'micro-panel__meta');
  meta.textContent = scenario.estimatedMinutes ? ('~' + scenario.estimatedMinutes + ' minutes') : '';
  questPanel.appendChild(meta);

  questToggle.setAttribute('aria-pressed', 'true');
}

function showResult(choiceId) {
  if (!scenario || !questPanel) return;
  var scoring = window.PirchQuest.scoreQuest(scenario, [choiceId]);
  var outcome = window.PirchQuest.dominantOutcome(scenario, scoring.dominant);
  var choice = scoring.choice;

  questPanel.innerHTML = '';

  var h3 = el('h3', '', t(scenario.title));
  questPanel.appendChild(h3);

  var result = el('p', '', '');
  result.innerHTML = '<strong>Your choice:</strong> ' + esc(t(choice.label));
  questPanel.appendChild(result);

  var refl = el('p', '', '');
  refl.innerHTML = '<strong>Reflection:</strong> ' + esc(t(outcome.reflection));
  questPanel.appendChild(refl);

  var dom = el('div', 'micro-panel__meta');
  dom.innerHTML = '<strong>Strongest signal:</strong> ' + scoring.dominant +
    ' · weights: systems_thinking ' + scoring.weights.systems_thinking +
    ', empathy ' + scoring.weights.empathy +
    ', analytical_grit ' + scoring.weights.analytical_grit +
    ', collaboration ' + scoring.weights.collaboration;
  questPanel.appendChild(dom);

  var btn = el('button', 'micro-panel__choice', 'Try again');
  btn.addEventListener('click', function () { renderQuest(); });
  questPanel.appendChild(btn);

  var submitBtn = el('button', 'micro-panel__choice', 'Submit result');
  submitBtn.addEventListener('click', function () { submitResult(choiceId, scoring); });
  questPanel.appendChild(submitBtn);

  questToggle.setAttribute('aria-pressed', 'false');
}

function submitResult(choiceId, scoring) {
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
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var msg = el('div', 'micro-panel__meta');
      msg.textContent = data.ok ? 'Result submitted to server.' : 'Submit failed: ' + (data.error || 'unknown');
      questPanel.appendChild(msg);
    })
    .catch(function () {
      var msg = el('div', 'micro-panel__meta');
      msg.textContent = 'Submit failed — server unreachable.';
      questPanel.appendChild(msg);
    });
}

function choose(choiceId) {
  showResult(choiceId);
}

if (questToggle) {
  questToggle.addEventListener('click', function () {
    if (questPanel.hidden) {
      renderQuest();
    } else {
      questPanel.hidden = true;
      questToggle.setAttribute('aria-pressed', 'false');
    }
  });
}

})();

// Pirchchat — room.js
// Standalone PIRCH room (no backend): every button does something.
//   - nickname prompt (localStorage), live statusbar, /nick /me /help /clear
//   - toolbar: connect/mode/channels/favorites/popup/alarm/event/engage/filesend/chat/push
//   - menubar: file/room/tools/options/window/help dropdowns
//   - seeded lines keep the room "in motion"; input posts locally.

(function () {
  var messagesEl = document.getElementById('messages');
  var composer = document.getElementById('composer');
  var input = document.getElementById('input');
  if (!messagesEl || !composer || !input) return;

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function timeNow() {
    var d = new Date();
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ---------- identity ---------- */
  var nick = 'guest';
  try { nick = localStorage.getItem('pirchchat.room.nick') || 'guest'; } catch (e) {}
  if (nick === 'guest') {
    var proposed = '';
    try { proposed = window.prompt('Pirchchat — pick a nickname for #monastic-youth:', '') || ''; } catch (e) {}
    proposed = proposed.trim().slice(0, 24);
    if (proposed) {
      nick = proposed;
      try { localStorage.setItem('pirchchat.room.nick', nick); } catch (e) {}
    }
  }

  var connected = true;
  var moderated = true;
  var showTs = true;
  var alarmOn = false;
  var events = [];

  function logEvent(text) {
    events.push(timeNow() + ' ' + text);
    if (events.length > 60) events = events.slice(-60);
  }

  function statusbar() {
    var bars = document.querySelectorAll('.statusbar__item');
    return bars;
  }

  function setStatus(text) {
    var bars = statusbar();
    if (bars && bars[0]) bars[0].textContent = text;
  }

  function appendUserMessage(who, body) {
    var msg = document.createElement('div');
    msg.className = 'msg';
    msg.innerHTML =
      '<span class="ts"' + (showTs ? '' : ' hidden') + '>' + escapeHtml(timeNow()) + '</span> ' +
      '<span class="nick">' + escapeHtml(who) + '</span> ' +
      '<span class="body">' + escapeHtml(body) + '</span>';
    messagesEl.appendChild(msg);
    scrollToBottom();
    if (alarmOn && body.toLowerCase().indexOf(nick.toLowerCase()) !== -1) beep();
  }

  function appendAction(who, body) {
    var msg = document.createElement('div');
    msg.className = 'msg msg--mode';
    msg.textContent = '∗ ' + who + ' ' + body;
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  function appendServerMessage(text, cls) {
    cls = cls || 'msg--server';
    var msg = document.createElement('div');
    msg.className = 'msg ' + cls;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = beep.ctx || (beep.ctx = new Ctx());
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 880; g.gain.value = 0.04;
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  }

  /* ---------- composer with /commands ---------- */
  composer.addEventListener('submit', function (event) {
    event.preventDefault();
    var raw = input.value.trim();
    if (!raw) return;
    if (!connected) { appendServerMessage('Not connected. Press Connect first.'); return; }
    if (raw.charAt(0) === '/') {
      var sp = raw.slice(1).split(/\s+/);
      var cmd = (sp[0] || '').toLowerCase();
      var arg = raw.slice(1 + sp[0].length).trim();
      if (cmd === 'nick' && arg) {
        nick = arg.slice(0, 24);
        try { localStorage.setItem('pirchchat.room.nick', nick); } catch (e) {}
        appendServerMessage('You are now known as ' + nick + '.');
        setStatus('Connected as ' + nick);
      } else if (cmd === 'me' && arg) {
        appendAction(nick, arg);
      } else if (cmd === 'clear') {
        messagesEl.innerHTML = '';
      } else if (cmd === 'help' || cmd === '?') {
        appendServerMessage('Commands: /nick name · /me does things · /clear · /help · /channels');
      } else if (cmd === 'channels') {
        listChannels();
      } else {
        appendServerMessage('Unknown command "/' + cmd + '". Try /help.');
      }
      input.value = '';
      return;
    }
    appendUserMessage(nick, raw);
    logEvent(nick + ' said: ' + raw.slice(0, 80));
    input.value = '';
  });

  /* ---------- toolbar ---------- */
  var CHANNELS = ['#monastic-youth', '#bkk-burmese', '#cm-burmese', '#digest-today', '#listening-club'];

  function listChannels() {
    appendServerMessage('Channels: ' + CHANNELS.join(' · ') + ' — open dashboard.html for the live multi-room view.');
  }

  function wireToolbar() {
    var btns = document.querySelectorAll('.toolbar__btn[data-act]');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-act');
        if (act === 'connect') {
          connected = !connected;
          b.classList.toggle('is-pressed', connected);
          setStatus(connected ? 'Connected as ' + nick : 'Disconnected');
          appendServerMessage(connected ? '— ' + nick + ' has joined #monastic-youth' : '— disconnected. Press Connect to rejoin.');
          logEvent(connected ? 'join' : 'leave');
        } else if (act === 'mode') {
          moderated = !moderated;
          appendServerMessage('— ' + nick + ' sets ' + (moderated ? '+m (moderated)' : '-m (open)'));
          logEvent('mode ' + (moderated ? '+m' : '-m'));
        } else if (act === 'channels') {
          listChannels();
        } else if (act === 'favorites') {
          var favs = [];
          try { favs = JSON.parse(localStorage.getItem('pirchchat.room.favs') || '[]'); } catch (e) {}
          var i = favs.indexOf('#monastic-youth');
          if (i === -1) { favs.push('#monastic-youth'); appendServerMessage('★ #monastic-youth added to favorites.'); }
          else { favs.splice(i, 1); appendServerMessage('☆ #monastic-youth removed from favorites.'); }
          try { localStorage.setItem('pirchchat.room.favs', JSON.stringify(favs)); } catch (e) {}
        } else if (act === 'popup') {
          showTs = !showTs;
          var tss = messagesEl.querySelectorAll('.ts');
          Array.prototype.forEach.call(tss, function (t) { if (showTs) t.removeAttribute('hidden'); else t.setAttribute('hidden', ''); });
          appendServerMessage('Timestamps ' + (showTs ? 'ON' : 'OFF') + '.');
        } else if (act === 'alarm') {
          alarmOn = !alarmOn;
          b.classList.toggle('is-pressed', alarmOn);
          appendServerMessage('Mention beep ' + (alarmOn ? 'ON — you will hear 880Hz when your name appears.' : 'OFF.'));
          if (alarmOn) beep();
        } else if (act === 'event') {
          appendServerMessage(events.length ? 'Recent events: ' + events.slice(-5).join(' | ') : 'No events yet this session.');
        } else if (act === 'engage') {
          input.value = 'မင်္ဂလာပါ everyone — I am new here. ';
          input.focus();
        } else if (act === 'filesend') {
          appendServerMessage('Images attach in the dashboard (paperclip button). Opening dashboard…');
          setTimeout(function () { window.location = 'dashboard.html'; }, 900);
        } else if (act === 'chat') {
          window.location = 'dashboard.html';
        } else if (act === 'push') {
          var url = window.location.href;
          if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
          appendServerMessage('Room link copied: ' + url);
        }
      });
    });
  }

  /* ---------- menubar dropdowns ---------- */
  var MENUS = {
    file: [
      ['Set nickname…', function () {
        var v = window.prompt('Nickname:', nick) || '';
        v = v.trim().slice(0, 24);
        if (v) { nick = v; try { localStorage.setItem('pirchchat.room.nick', nick); } catch (e) {} setStatus('Connected as ' + nick); appendServerMessage('You are now known as ' + nick + '.'); }
      }],
      ['Export log (.txt)', function () {
        var lines = Array.prototype.map.call(messagesEl.querySelectorAll('.msg'), function (m) { return m.textContent; });
        var blob = new Blob(['Pirchchat #monastic-youth — ' + new Date().toISOString() + '\n\n' + lines.join('\n') + '\n'], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'pirchchat-monastic-youth.txt';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      }],
      ['Back to landing', function () { window.location = 'index.html'; }],
    ],
    room: [
      ['List channels', listChannels],
      ['Toggle moderated (+m)', function () { document.querySelector('.toolbar__btn[data-act="mode"]').click(); }],
      ['Open dashboard rooms', function () { window.location = 'dashboard.html'; }],
    ],
    tools: [
      ['Survival guide (dashboard)', function () { window.location = 'dashboard.html'; }],
      ['Insert greeting', function () { document.querySelector('.toolbar__btn[data-act="engage"]').click(); }],
      ['Copy room link', function () { document.querySelector('.toolbar__btn[data-act="push"]').click(); }],
    ],
    options: [
      ['Toggle timestamps', function () { document.querySelector('.toolbar__btn[data-act="popup"]').click(); }],
      ['Toggle mention beep', function () { document.querySelector('.toolbar__btn[data-act="alarm"]').click(); }],
      ['Toggle connect', function () { document.querySelector('.toolbar__btn[data-act="connect"]').click(); }],
    ],
    window: [
      ['Fullscreen room', function () {
        var w = document.getElementById('monastic-youth');
        if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
        else if (w && w.requestFullscreen) w.requestFullscreen().catch(function () {});
      }],
      ['Back to landing', function () { window.location = 'index.html'; }],
    ],
    help: [
      ['Commands (/help)', function () { appendServerMessage('Commands: /nick name · /me does things · /clear · /help · /channels'); }],
      ['Ground rules', function () { appendServerMessage('Be useful. No spam. Burmese first. No PII. Small trusted circle — invite by trust.'); }],
      ['About', function () { appendServerMessage('Pirchchat #monastic-youth — standalone demo. Live multi-room chat is in dashboard.html.'); }],
    ],
  };

  function wireMenus() {
    var menu = document.getElementById('roomMenu');
    if (!menu) return;
    var bar = menu.parentElement;
    bar.style.position = 'relative';
    Array.prototype.forEach.call(document.querySelectorAll('.menubar__item[data-menu]'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var key = btn.getAttribute('data-menu');
        var items = MENUS[key] || [];
        var r = btn.getBoundingClientRect();
        var pr = bar.getBoundingClientRect();
        menu.style.left = (r.left - pr.left) + 'px';
        menu.style.top = (r.bottom - pr.top) + 'px';
        menu.innerHTML = '';
        items.forEach(function (it) {
          var mi = document.createElement('button');
          mi.type = 'button';
          mi.className = 'dropdown__item';
          mi.textContent = it[0];
          mi.addEventListener('click', function () { menu.hidden = true; it[1](); });
          menu.appendChild(mi);
        });
        menu.hidden = false;
      });
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target)) menu.hidden = true;
    });
  }

  /* ---------- seeds: room in motion ---------- */
  var seeds = [
    ['min_thu', 'anyone going to Mae Sot this weekend? need a ride share.'],
    ['thazin', 'i can drive. 7am saturday from Wat Phra Singh ok?'],
    ['htun', 'count me in.'],
    ['kyaw_zin', 'also joining.'],
    ['aung_myo', 'saturday 7am at Wat Phra Singh — four confirmed. safe travels.'],
    ['nilar', 'ကျေးဇူးပါ — see you all there.'],
    ['phyo', '(returning) — sorry got pulled away for a moment.'],
  ];
  var seedIndex = 0;
  function seedTick() {
    if (seedIndex >= seeds.length) return;
    if (connected) {
      var s = seeds[seedIndex++];
      appendUserMessage(s[0], s[1]);
    }
    if (seedIndex < seeds.length) {
      setTimeout(seedTick, 12000 + Math.random() * 14000);
    }
  }
  setTimeout(seedTick, 8000);

  wireToolbar();
  wireMenus();
  setStatus('Connected as ' + nick);
  logEvent('room opened');
  scrollToBottom();
})();

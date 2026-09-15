// Pirchchat — room.js
// Lets the message panel behave like an active IRC room:
//   - seeded messages render into the scrollback at boot
//   - newlines append every 12-30 seconds (visitors will see "the room is alive")
//   - the input box posts messages back into the same scrollback
// Server is not real (Surface 1 is a Hetzner deploy, not built yet).
// This is an honest demo: every message is local to the browser.

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

  function appendUserMessage(nick, body) {
    var msg = document.createElement('div');
    msg.className = 'msg';
    msg.innerHTML =
      '<span class="ts">' + escapeHtml(timeNow()) + '</span>' +
      '<span class="nick">' + escapeHtml(nick) + '</span>' +
      '<span class="body">' + escapeHtml(body) + '</span>';
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

  /* Compose: form submit appends the user's line. */
  composer.addEventListener('submit', function (event) {
    event.preventDefault();
    var raw = input.value.trim();
    if (!raw) return;
    appendUserMessage('guest', raw);
    input.value = '';
  });

  /* Seeding a few extra lines so visitors see the room "in motion". */
  var seeds = [
    ['min_thu', 'anyone going to Mae Sot this weekend? need a ride share.'],
    ['thazin', 'i can drive. 7am saturday from Wat Phra Singh ok?'],
    ['htun', 'count me in.'],
    ['kyaw_zin', 'also joining.'],
    ['aung_myo', 'saturday 7am at Wat Phra Singh — four confirmed. safe travels.'],
    ['nilar', '<span lang="my">ကျေးဇူးပါ</span>. — see you all there.'],
    ['phyo', '(returning) — sorry got pulled away for a moment.'],
  ];
  var seedIndex = 0;
  function seedTick() {
    if (seedIndex >= seeds.length) return;
    var s = seeds[seedIndex++];
    appendUserMessage(s[0], s[1]);
    if (seedIndex < seeds.length) {
      setTimeout(seedTick, 12000 + Math.random() * 14000);
    }
  }
  setTimeout(seedTick, 8000);

  scrollToBottom();
})();

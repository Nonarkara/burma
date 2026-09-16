// Pirchchat — real-time chat client.
// Connects to the Worker WebSocket, posts via REST, loads history on room switch.

(function () {
'use strict';

const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8797' : 'https://pirchchat-chat.drnon.workers.dev';

const KNOWN_ROOMS = ['monastic-youth', 'bkk-burmese', 'cm-burmese', 'digest-today', 'listening-club'];

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function timeNow() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function tsToHHMM(ts) {
  const d = new Date(ts);
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function getStoredIdentity() {
  try { return JSON.parse(localStorage.getItem('pirchchat.identity') || 'null'); }
  catch (e) { return null; }
}

function saveIdentity(id) {
  try { localStorage.setItem('pirchchat.identity', JSON.stringify(id)); } catch (e) {}
}

function ensureIdentity() {
  let id = getStoredIdentity();
  if (id && id.name && id.network) return id;
  id = id || {};
  id.network = id.network || ('user_' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 12) : Math.random().toString(36).slice(2, 10)));
  // name left to UI for first-time setup
  return id;
}

const state = {
  identity: ensureIdentity(),
  currentRoom: null,
  ws: null,
  wsRetry: 0,
  reconnectTimer: null,
  roomVersion: 0,
  sending: false,
  history: [],               // array of full messages, oldest first
  members: [],                // array of {nick, role}
  topicFilter: 'all',
  seenMessageIds: new Set(),
};

window.__pirchchatClient = {
  setIdentity(name) {
    state.identity.name = (name || 'guest').slice(0, 32);
    // Keep only the nickname and random browser ID; old email/IP fields are obsolete.
    state.identity = { name: state.identity.name, network: state.identity.network };
    saveIdentity(state.identity);
    const label = document.getElementById('chatUserLabel');
    if (label) label.textContent = state.identity.name + ' · unverified nickname';
    if (state.currentRoom) connectWS(state.currentRoom);
    return state.identity;
  },
  get identity() { return state.identity; },
  get state() { return state; },
};

// ===== API calls =====

async function api(path, init) {
  init = init || {};
  const headers = Object.assign({ 'Content-Type': 'application/json' }, init.headers || {});
  headers['X-Pirchchat-Identity'] = state.identity.network;
  const res = await fetch(API_BASE + path, Object.assign({ signal: AbortSignal.timeout(15000) }, init, { headers }));
  let body = null;
  try { body = await res.json(); } catch (e) {}
  if (!res.ok) {
    if (body && body.error) throw new Error(body.error);
    throw new Error('http ' + res.status);
  }
  return body;
}

async function loadRooms() {
  try {
    const data = await api('/api/rooms');
    return data.rooms || [];
  } catch (e) {
    return KNOWN_ROOMS.map((id) => ({ id, title: '#' + id, members: [] }));
  }
}

async function loadHistory(roomId, limit) {
  try {
    const data = await api('/api/rooms/' + encodeURIComponent(roomId) + '/history?limit=' + (limit || 50));
    return data.messages || [];
  } catch (e) {
    throw new Error('History unavailable: ' + (e.message || e));
  }
}

async function postMessage(roomId, payload) {
  payload.author_name = state.identity.name || 'guest';
  payload.author_pubkey = state.identity.network;
  return api('/api/rooms/' + encodeURIComponent(roomId) + '/message', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function resolveImageUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value), API_BASE);
    // Attachments must come from our image bucket, never tracking/data/script URLs.
    return url.origin === new URL(API_BASE).origin && url.pathname.startsWith('/cdn/') ? url.href : '';
  } catch (e) { return ''; }
}

function safeLink(value) {
  try { const u = new URL(String(value)); return /^https?:$/.test(u.protocol) ? u.href : ''; }
  catch (e) { return ''; }
}

function safeMessageBody(value) {
  // Existing archives contain escaped text plus occasional span/br formatting.
  // Strip only that historical formatting; escape everything else, including tags.
  return String(value || '').replace(/<\/?span(?:\s[^>]*)?>/gi, '').replace(/<br\s*\/?>/gi, '\n')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('pubkey', state.identity.network);
  const res = await fetch(API_BASE + '/api/upload', {
    method: 'POST',
    headers: { 'X-Pirchchat-Identity': state.identity.network },
    body: fd,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'upload failed');
  return resolveImageUrl(data.url);
}

async function deleteMessageViaSweep(roomId) {
  // No DELETE endpoint yet — sweep helper for dev clearing.
  // Intentionally a no-op server-side.
}

// ===== WebSocket =====

function disconnectWS() {
  clearTimeout(state.reconnectTimer);
  state.reconnectTimer = null;
  const old = state.ws;
  state.ws = null;
  if (old) { try { old.close(1000, 'Room changed'); } catch (e) {} }
}

function connectWS(roomId) {
  disconnectWS();
  if (!roomId || roomId !== state.currentRoom) return;
  const wsOrigin = API_BASE.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  const url = wsOrigin + '/api/rooms/' + encodeURIComponent(roomId) + '?nick=' + encodeURIComponent(state.identity.name || 'guest');
  const retry = () => {
    state.wsRetry++;
    state.reconnectTimer = setTimeout(() => {
      if (state.currentRoom === roomId) connectWS(roomId);
    }, Math.min(800 * Math.pow(2, state.wsRetry), 8000));
  };
  try {
    const ws = new WebSocket(url);
    state.ws = ws;
    ws.addEventListener('open', () => {
      if (state.ws !== ws || roomId !== state.currentRoom) return;
      state.wsRetry = 0;
      flashNet('connected · ' + roomId);
    });
    ws.addEventListener('message', (event) => {
      if (state.ws !== ws || roomId !== state.currentRoom) return;
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      handleWsMessage(roomId, data);
    });
    ws.addEventListener('close', () => {
      if (state.ws !== ws || state.currentRoom !== roomId) return;
      state.ws = null;
      flashNet('Disconnected · retrying');
      retry();
    });
    ws.addEventListener('error', () => { /* close schedules one retry */ });
  } catch (e) { retry(); }
}

function handleWsMessage(roomId, data) {
  if (!data || roomId !== state.currentRoom) return;
  if (data.type === 'presence') {
    state.members = data.members || [];
    renderMembers();
    return;
  }
  if (data.type === 'history') {
    const merged = new Map((data.messages || []).map((m) => [m.id, m]));
    state.history.forEach((m) => merged.set(m.id, m));
    state.history = [...merged.values()].sort((a, b) => a.ts - b.ts).slice(-200);
    state.seenMessageIds = new Set(state.history.map((m) => m.id));
    renderMessages();
    return;
  }
  if (data.type === 'message') {
    if (!data.message || state.seenMessageIds.has(data.message.id)) return;
    state.seenMessageIds.add(data.message.id);
    maybeCrisis(data.message.body_html);
    state.history.push(data.message);
    if (state.history.length > 200) state.history = state.history.slice(-200);
    appendMessageDom(data.message);
    return;
  }
  if (data.type === 'event') {
    if (data.event === 'join' || data.event === 'leave') {
      appendSystemMessage((data.identity || 'anon') + ' has ' + (data.event === 'join' ? 'joined' : 'left') + ' #' + roomId);
    }
    return;
  }
}

function appendSystemMessage(text) {
  const wrap = document.getElementById('messages');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = 'msg msg--server';
  div.textContent = '— ' + text;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

// ===== Rendering =====

function renderRoomTitle(room) {
  const t = document.getElementById('chatRoomTitle');
  if (t) t.textContent = room.title || ('#' + room.id);

}

function renderMembers() {
  const ul = document.getElementById('memberList');
  if (!ul) return;
  ul.innerHTML = state.members.map((m) => {
    const cls = m.role === 'op' ? 'members__nick members__nick--op' : (m.role === 'away' ? 'members__nick members__nick--away' : 'members__nick');
    const tag = m.role === 'op' ? '@op' : (m.role === 'voice' ? '@voice' : (m.role === 'away' ? 'away' : ''));
    return '<li><span class="' + cls + '">' + escapeHtml(m.nick) + '</span>' + (tag ? '<span class="members__tag">' + escapeHtml(tag) + '</span>' : '') + '</li>';
  }).join('');
}

function renderMessages() {
  const wrap = document.getElementById('messages');
  if (!wrap) return;
  let msgs = state.history;
  if (state.topicFilter !== 'all') msgs = msgs.filter((m) => (m.topics || '') === state.topicFilter);
  wrap.innerHTML = msgs.map(renderMessageHtml).join('');
  wrap.scrollTop = wrap.scrollHeight;
}

function renderMessageHtml(m) {
  if (m.body_html && m.body_html.startsWith('[server]')) {
    return '<div class="msg msg--server">— ' + escapeHtml(m.body_html.slice(7)) + '</div>';
  }
  if (m.body_html && m.body_html.startsWith('[action] ')) {
    return '<div class="msg msg--action">∗ ' + escapeHtml((m.author_name || 'anon') + ' ' + m.body_html.slice(9)) + '</div>';
  }
  const topicTag = m.topics ? '<span class="msg__topic-tag">' + escapeHtml(m.topics) + '</span>' : '';
  const bodyText = safeMessageBody(m.body_html);
  const imageUrl = resolveImageUrl(m.image_url);
  const imgHtml = imageUrl ? '<img class="msg__img" src="' + escapeHtml(imageUrl) + '" alt="attachment" loading="lazy">' : '';
  let previewHtml = '';
  if (m.link_preview_json) {
    try {
      const p = JSON.parse(m.link_preview_json);
      const previewUrl = safeLink(p.url);
      if (!previewUrl) throw new Error('unsafe preview URL');
      previewHtml = '<a class="preview" href="' + escapeHtml(previewUrl) + '" target="_blank" rel="noopener">' +
        '<span class="preview__title">' + escapeHtml(p.title || p.url) + '</span>' +
        '<span class="preview__desc">' + escapeHtml(p.description || '') + '</span>' +
        '<span class="preview__host">' + escapeHtml(p.host || '') + '</span>' +
      '</a>';
    } catch (e) {}
  }
  const nickClass = m.author_name === 'guest' || m.author_pubkey === state.identity.network ? 'nick nick--op' : 'nick';
  return '<div class="msg"><span class="ts">' + escapeHtml(tsToHHMM(m.ts)) + '</span> <span class="' + nickClass + '">' + topicTag + escapeHtml(m.author_name || 'anon') + '</span> <span class="body">' + bodyText + '</span>' + imgHtml + previewHtml + '</div>';
}

function appendMessageDom(m) {
  const wrap = document.getElementById('messages');
  if (!wrap) return;
  if (state.topicFilter !== 'all' && (m.topics || '') !== state.topicFilter) {
    return;
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = renderMessageHtml(m);
  wrap.appendChild(tmp.firstChild);
  wrap.scrollTop = wrap.scrollHeight;
}

// ===== Room switching =====

async function switchRoom(roomId) {
  if (!KNOWN_ROOMS.includes(roomId)) return;
  const version = ++state.roomVersion;
  disconnectWS();
  state.currentRoom = roomId;
  state.wsRetry = 0;
  state.history = [];
  state.members = [];
  state.seenMessageIds = new Set();
  renderMessages(); renderMembers();
  renderRoomTitle({id:roomId, title:'#' + roomId});
  document.querySelectorAll('button[data-room]').forEach((b) => {
    b.classList.toggle('menubar__item--active', b.dataset.room === roomId);
  });
  const rooms = await loadRooms();
  if (version !== state.roomVersion) return;
  const room = rooms.find((r) => r.id === roomId);
  if (room) renderRoomTitle(room);
  try {
    const hist = await loadHistory(roomId, 50);
    if (version !== state.roomVersion) return;
    state.history = hist;
    state.seenMessageIds = new Set(hist.map((m) => m.id));
    renderMessages();
  } catch (e) {
    if (version !== state.roomVersion) return;
    appendSystemMessage(e.message);
  }
  connectWS(roomId);
}

// ===== Composer =====

function detectFirstUrl(text) {
  const m = text.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

async function tryPreview(url) {
  try {
    const r = await fetch('/api/preview?url=' + encodeURIComponent(url));
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.ok) return null;
    return j;
  } catch (e) { return null; }
}

function maybeCrisis(text) {
  try {
    const plain = String(text || '').replace(/<[^>]+>/g, ' ');
    if (window.PirchSurvival && window.PirchSurvival.checkCrisis(plain)) {
      if (window.__pirchShowCrisis) window.__pirchShowCrisis();
    }
  } catch (e) {}
}

async function handleCommand(raw) {
  const parts = raw.slice(1).split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();
  const arg = raw.slice(1 + parts[0].length).trim();
  if (cmd === 'nick' && arg) {
    const name = arg.slice(0, 32);
    window.__pirchchatClient.setIdentity(name);
    const label = document.getElementById('chatUserLabel');
    if (label) label.textContent = name + ' @ ' + state.identity.network;
    appendSystemMessage('You are now known as ' + name + '.');
    return true;
  }
  if (cmd === 'me' && arg) {
    try {
      const room = state.currentRoom;
      const result = await postMessage(room, { body_html: '[action] ' + escapeHtml(arg) });
      if (result.message) handleWsMessage(room, { type: 'message', message: result.message });
    } catch (e) { appendSystemMessage('post failed: ' + (e && e.message || e)); }
    return true;
  }
  if ((cmd === 'join' || cmd === 'j') && arg) {
    const id = arg.replace(/^#/, '').trim();
    if (KNOWN_ROOMS.includes(id)) { switchRoom(id); }
    else appendSystemMessage('Unknown room "' + id + '". Rooms: ' + KNOWN_ROOMS.join(', '));
    return true;
  }
  if (cmd === 'guide') {
    if (window.__pirchOpenGuide) window.__pirchOpenGuide(arg || 'all');
    else appendSystemMessage('Guide is loading — try again in a second.');
    return true;
  }
  if (cmd === 'hotline' || cmd === 'hotlines') {
    if (window.__pirchOpenGuide) window.__pirchOpenGuide('hotlines');
    else appendSystemMessage('Hotlines: Thailand 1300 (24h) · Burmese health hotline (Bangkok) · Mae Tao Clinic Mae Sot.');
    return true;
  }
  if (cmd === 'export') {
    const lines = state.history.map((m) => {
      const d = new Date(m.ts || Date.now());
      const t = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      return '[' + t + '] <' + (m.author_name || 'anon') + '> ' + String(m.body_html || '').replace(/<[^>]+>/g, '');
    });
    const blob = new Blob(['Pirchchat #' + state.currentRoom + ' — ' + new Date().toISOString() + '\n\n' + lines.join('\n') + '\n'], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pirchchat-' + state.currentRoom + '.txt';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    appendSystemMessage('Log exported (' + lines.length + ' lines).');
    return true;
  }
  if (cmd === 'clear') {
    const wrap = document.getElementById('messages');
    if (wrap) wrap.innerHTML = '';
    return true;
  }
  if (cmd === 'help' || cmd === '?') {
    const h = document.getElementById('chatHelp');
    if (h) h.click();
    else appendSystemMessage('/nick /me /join /guide /hotline /export /clear /help');
    return true;
  }
  appendSystemMessage('Unknown command "/' + cmd + '". Try /help.');
  return true;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!state.currentRoom || state.sending) return;
  const roomId = state.currentRoom;
  const input = document.getElementById('input');
  const raw = (input && input.value || '').trim();
  const attachment = window.__pendingAttachment;
  if (!raw && !attachment) return;
  if (raw.startsWith('/') && !attachment) {
    if (input) input.value = '';
    await handleCommand(raw);
    return;
  }
  maybeCrisis(raw);
  state.sending = true;
  const send = document.querySelector('.composer__send');
  if (send) send.disabled = true;
  try {
    const payload = { body_html: escapeHtml(raw), topics: state.topicFilter === 'all' ? '' : state.topicFilter };
    const url = detectFirstUrl(raw);
    if (url) {
      const preview = await tryPreview(url);
      if (preview) payload.link_preview = preview;
    }
    if (attachment) payload.image_url = await uploadImage(attachment);
    const result = await postMessage(roomId, payload);
    if (result && result.message) handleWsMessage(roomId, { type: 'message', message: result.message });
    // Do not erase edits made while upload/preview/post was in flight.
    if (input && input.value.trim() === raw) input.value = '';
    if (window.__pendingAttachment === attachment) {
      window.__pendingAttachment = null;
      const fi = document.getElementById('fileInput');
      if (fi) fi.value = '';
      if (input) input.placeholder = 'Type a Burmese or English message…  URLs become preview cards';
    }
  } catch (e) {
    appendSystemMessage('Not sent to #' + roomId + ': ' + (e.message || e) + '. Your draft is still here.');
  } finally {
    state.sending = false;
    if (send) send.disabled = false;
  }
}

function handleFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
    alert('Choose a PNG, JPEG, GIF or WebP image.');
    event.target.value = '';
    return;
  }
  if (file.size > 1024 * 700) {
    alert('Image is over 700KB. Resize and try again.');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    window.__pendingAttachment = file;     // pass the File itself, upload at submit time
    const ph = document.getElementById('input');
    if (ph) ph.placeholder = 'Image attached (' + Math.round(file.size / 1024) + 'KB). Type a caption or send.';
  };
  reader.readAsDataURL(file);
}

function flashNet(text) {
  const el = document.getElementById('chatUserLabel');
  if (!el) return;
  el.textContent = (state.identity.name || 'guest') + ' · ' + text;
}

// ===== Wiring =====

function wire() {
  // Room tabs
  document.querySelectorAll('button[data-room]').forEach((b) => {
    b.addEventListener('click', () => switchRoom(b.dataset.room));
  });

  // Composer
  const form = document.getElementById('composer');
  if (form) form.addEventListener('submit', handleSubmit);
  const fi = document.getElementById('fileInput');
  if (fi) fi.addEventListener('change', handleFile);

  // Topic chips
  document.querySelectorAll('#topicChips .chip').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#topicChips .chip').forEach((x) => x.classList.remove('chip--active'));
      b.classList.add('chip--active');
      state.topicFilter = b.dataset.topic;
      renderMessages();
    });
  });

  // Identity — set titlebar from network id
  const label = document.getElementById('chatUserLabel');
  if (label) label.textContent = (state.identity.name || 'guest') + ' @ ' + state.identity.network;

  // Source chips still exist in DOM. Wire them via existing handler module (dashboard.js body).

  // Default to first room.
  const firstRoom = document.querySelector('button[data-room]');
  switchRoom(firstRoom ? firstRoom.dataset.room : 'monastic-youth');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wire);
} else {
  wire();
}

// Expose for tests/manual trigger
window.__pirchchatSwitchRoom = switchRoom;
window.__pirchchatClient.forceRefresh = async function () {
  if (!state.currentRoom) return;
  const version = state.roomVersion;
  const hist = await loadHistory(state.currentRoom, 50);
  if (version !== state.roomVersion) return;
  state.history = hist;
  state.seenMessageIds = new Set(hist.map((m) => m.id));
  renderMessages();
};

})();

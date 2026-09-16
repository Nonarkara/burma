// Pirchchat — real-time chat client.
// Connects to the Worker WebSocket, posts via REST, loads history on room switch.

(function () {
'use strict';

const API_BASE = 'https://pirchchat-chat.drnon.workers.dev';

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
  saveIdentity(id);
  return id;
}

const state = {
  identity: ensureIdentity(),
  currentRoom: null,
  ws: null,
  wsRetry: 0,
  history: [],               // array of full messages, oldest first
  members: [],                // array of {nick, role}
  topicFilter: 'all',
  seenMessageIds: new Set(),
};

window.__pirchchatClient = {
  setIdentity(name) {
    state.identity.name = (name || 'guest').slice(0, 32);
    saveIdentity(state.identity);
    return state.identity;
  },
  get identity() { return state.identity; },
};

// ===== API calls =====

async function api(path, init) {
  init = init || {};
  const headers = Object.assign({ 'Content-Type': 'application/json' }, init.headers || {});
  headers['X-Pirchchat-Identity'] = state.identity.network;
  const res = await fetch(API_BASE + path, Object.assign({}, init, { headers }));
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
    return [];
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
  return data.url;
}

async function deleteMessageViaSweep(roomId) {
  // No DELETE endpoint yet — sweep helper for dev clearing.
  // Intentionally a no-op server-side.
}

// ===== WebSocket =====

function connectWS(roomId) {
  if (state.ws) {
    try { state.ws.close(); } catch (e) {}
    state.ws = null;
  }
  if (!roomId) return;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsOrigin = API_BASE.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  const url = wsOrigin + '/api/rooms/' + encodeURIComponent(roomId);
  const headers = { 'X-Pirchchat-Identity': state.identity.network };
  const opts = {};
  // Some browsers (browser env) don't allow custom WS headers via the standard constructor.
  // To stay simple, we omit custom headers from WS and rely on network_id from URL params if needed.
  try {
    const ws = new WebSocket(url);
    state.ws = ws;
    ws.addEventListener('open', () => {
      state.wsRetry = 0;
      flashNet('connected · ' + roomId);
    });
    ws.addEventListener('message', (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      handleWsMessage(roomId, data);
    });
    ws.addEventListener('close', () => {
      flashNet('reconnecting…');
      state.wsRetry++;
      const delay = Math.min(800 * Math.pow(2, state.wsRetry), 8000);
      setTimeout(() => connectWS(state.currentRoom), delay);
    });
    ws.addEventListener('error', () => { /* close handler will retry */ });
  } catch (e) {
    setTimeout(() => connectWS(state.currentRoom), 2000);
  }
}

function handleWsMessage(roomId, data) {
  if (!data) return;
  if (data.type === 'history') {
    state.history = data.messages || [];
    state.seenMessageIds = new Set(state.history.map((m) => m.id));
    renderMessages();
    return;
  }
  if (data.type === 'message') {
    if (state.seenMessageIds.has(data.message.id)) return;
    state.seenMessageIds.add(data.message.id);
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
  const m = document.querySelector('.chat .titlebar__title');
  if (m) m.textContent = 'Chat — ' + (room.title || ('#' + room.id));
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
  const topicTag = m.topics ? '<span class="msg__topic-tag">' + escapeHtml(m.topics) + '</span>' : '';
  const bodyText = m.body_html ? m.body_html : '';
  const imgHtml = m.image_url ? '<img class="msg__img" src="' + escapeHtml(m.image_url) + '" alt="attachment">' : '';
  let previewHtml = '';
  if (m.link_preview_json) {
    try {
      const p = JSON.parse(m.link_preview_json);
      previewHtml = '<a class="preview" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' +
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
    // still log timestamp + system indicator above topic filter;
    // but for v1, just append and accept that filter reorders later
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = renderMessageHtml(m);
  wrap.appendChild(tmp.firstChild);
  wrap.scrollTop = wrap.scrollHeight;
}

// ===== Room switching =====

async function switchRoom(roomId) {
  document.querySelectorAll('button[data-room]').forEach((b) => {
    b.classList.toggle('menubar__item--active', b.dataset.room === roomId);
  });
  state.currentRoom = roomId;
  const rooms = await loadRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    renderRoomTitle(room);
    state.members = room.members || [];
  } else {
    renderRoomTitle({ id: roomId, title: '#' + roomId });
    state.members = [];
  }
  renderMembers();
  state.history = [];
  state.seenMessageIds = new Set();
  const hist = await loadHistory(roomId, 50);
  state.history = hist;
  state.seenMessageIds = new Set(hist.map((m) => m.id));
  renderMessages();
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

async function handleSubmit(event) {
  event.preventDefault();
  if (!state.currentRoom) return;
  const input = document.getElementById('input');
  const raw = (input && input.value || '').trim();
  const attachment = window.__pendingAttachment;
  if (!raw && !attachment) return;
  const payload = { body_html: '' };
  if (raw) {
    payload.body_html = escapeHtml(raw);
    const url = detectFirstUrl(raw);
    if (url) {
      const preview = await tryPreview(url);
      if (preview) payload.link_preview = preview;
    }
  }
  if (attachment) {
    try {
      payload.image_url = await uploadImage(attachment);
    } catch (e) {
      payload.body_html = '[upload failed: ' + (e && e.message || e) + '] ' + (raw || '');
    }
  }
  try {
    await postMessage(state.currentRoom, payload);
  } catch (e) {
    appendSystemMessage('post failed: ' + (e && e.message || e));
  }
  if (input) input.value = '';
  window.__pendingAttachment = null;
  const ph = document.getElementById('input');
  if (ph) ph.placeholder = 'Type a Burmese or English message…  URLs become preview cards';
}

function handleFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
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
  const orig = el.textContent;
  el.textContent = text;
  setTimeout(() => { el.textContent = orig; }, 2200);
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
  const hist = await loadHistory(state.currentRoom, 50);
  state.history = hist;
  state.seenMessageIds = new Set(hist.map((m) => m.id));
  renderMessages();
};

})();

// MSH audit — measure the real interface at 390 / 1024 / 1440.
//
// This is an instrument, not a screenshot viewer. It drives headless Chrome
// over CDP, captures each viewport, and measures the things the MSH law asks
// about: chrome cost (top and bottom band height and its share of the
// viewport), task visibility, geometry failures (overflow, clipping,
// offscreen elements), hierarchy, and preservation.
//
// A PASS is only evidence if the surface audited is the surface reached, so
// the report records the URL and a marker from the live DOM.
//
// Usage: node scripts/msh-audit.mjs [url] [outDir]

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const URL_UNDER_TEST = process.argv[2] || 'https://burma.nonarkara.org/dashboard';
const OUT_DIR = process.argv[3] || 'tmp/msh';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

const VIEWPORTS = [
  { name: '390', width: 390, height: 844, mobile: true },
  { name: '1024', width: 1024, height: 768, mobile: false },
  { name: '1440', width: 1440, height: 900, mobile: false },
];

// Runs inside the page. Returns measurements, not opinions.
const MEASURE = `(() => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const out = { viewport: { vw, vh }, url: location.href, marks: {} };

  const rect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      sel, x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0,
      inViewport: r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw,
      overflowX: cs.overflowX, position: cs.position, z: cs.zIndex,
    };
  };

  // Chrome bands: the fixed furniture above and below the working area.
  const band = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return { sel, h: 0, share: 0, hidden: true };
    const r = el.getBoundingClientRect();
    return { sel, h: Math.round(r.height), share: +(r.height / vh).toFixed(3) };
  };

  const bands = [];
  for (const sel of ['.titlebar', '.menubar', '.statusbar', '.tabs-top', '.toolbar', '.linkbar']) {
    const b = band(sel);
    if (b) bands.push(b);
  }
  const visibleBands = bands.filter((b) => !b.hidden);
  const topBand = visibleBands
    .filter((b) => { const el = document.querySelector(b.sel); return el.getBoundingClientRect().top < vh * 0.5; })
    .reduce((sum, b) => sum + b.h, 0);
  const bottomBand = visibleBands
    .filter((b) => { const el = document.querySelector(b.sel); return el.getBoundingClientRect().top >= vh * 0.5; })
    .reduce((sum, b) => sum + b.h, 0);
  out.bands = bands;
  out.chromeCost = { top: topBand, bottom: bottomBand, share: +(((topBand + bottomBand) / vh)).toFixed(3) };

  // The surfaces the reader came for.
  const surfaces = ['#map', '.mediapanel', '#newsPane', '#messages', '#questPanel', '#memberList'];
  out.surfaces = surfaces.map((s) => ({ s, ...(rect(s) || { missing: true }) }));

  // Geometry failures: horizontal overflow, clipped text, tiny tap targets.
  const failures = [];
  const inlineLinks = [];
  const docW = document.documentElement.scrollWidth;
  if (docW > vw + 1) failures.push({ kind: 'page-overflow-x', detail: 'scrollWidth ' + docW + ' > ' + vw });

  const inScroller = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return true;
      p = p.parentElement;
    }
    return false;
  };

  document.querySelectorAll('button, a[href], input, select, [role="button"]').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    // A control inside a horizontal scroller is reachable by scrolling, so
    // it is not an overflow defect.
    if (r.right > vw + 1 && !inScroller(el)) {
      failures.push({ kind: 'offscreen-right', el: el.id || el.className || el.tagName, right: Math.round(r.right) });
    }
    // WCAG 2.2 target size floor (24x24 CSS px), house law.
    // A leaf text link (no element children) is a text link in a line of
    // text: 2.5.8 exempts those, because the target size is constrained by
    // the line height of the surrounding text. They are recorded, not
    // hidden — an inline link that is really a control is not a leaf.
    const leafTextLink = el.tagName === 'A' && el.children.length === 0 && el.textContent.trim().length > 0;
    if (leafTextLink) {
      if (r.height < 24) inlineLinks.push({ el: el.id || el.className || 'a', w: Math.round(r.width), h: Math.round(r.height), text: el.textContent.trim().slice(0, 30) });
      return;
    }
    if (r.height < 24 || r.width < 24) {
      failures.push({ kind: 'tap-target-under-24', el: el.id || el.className || el.tagName, w: Math.round(r.width), h: Math.round(r.height) });
    }
  });

  document.querySelectorAll('*').forEach((el) => {
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'hidden') {
      const cs = getComputedStyle(el);
      if (cs.textOverflow !== 'ellipsis' && el.children.length === 0) {
        failures.push({ kind: 'clipped-text', el: el.id || el.className || el.tagName, scrollW: el.scrollWidth, clientW: el.clientWidth });
      }
    }
  });

  out.failures = failures;
  out.failureCount = failures.length;
  out.inlineTextLinks = inlineLinks;

  // Hierarchy: is there exactly one h1/heading for the surface, and are the
  // primary actions reachable?
  out.hierarchy = {
    h1: document.querySelectorAll('h1').length,
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).map((h) => h.textContent.trim().slice(0, 40)),
    primaryActions: Array.from(document.querySelectorAll('button[data-action], .toolbar__btn')).length,
  };

  // Preservation: is the content the reader came for actually on screen?
  out.marks = {
    title: document.title,
    hasMap: !!document.querySelector('#map canvas'),
    newsItems: document.querySelectorAll('.news-item').length,
    mediaPanel: !!document.querySelector('.mediapanel'),
    radioRows: document.querySelectorAll('.radio__row').length,
    tvCards: document.querySelectorAll('.tv-card').length,
    questToggle: !!document.querySelector('#questToggle'),
    identityModalHidden: (document.querySelector('#identityModal') || {}).hidden !== false,
    chatUserLabel: (document.querySelector('#chatUserLabel') || {}).textContent || '',
  };
  return JSON.stringify(out);
})()`;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'msh-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--hide-scrollbars', '--force-device-scale-factor=1',
    'about:blank',
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    await sleep(250);
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      wsUrl = j.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
  }
  if (!wsUrl) { chrome.kill(); throw new Error('headless chrome did not start'); }

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });

  // Attach to a fresh target.
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);

  const report = { url: URL_UNDER_TEST, capturedAt: new Date().toISOString(), viewports: [] };

  for (const vp of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width, height: vp.height, deviceScaleFactor: 1,
      mobile: vp.mobile, screenWidth: vp.width, screenHeight: vp.height,
    }, sessionId);
    await send('Page.navigate', { url: URL_UNDER_TEST }, sessionId);
    await sleep(3500); // let the map, feeds and sockets settle

    // The identity gate is an overlay. Measuring through it would report the
    // gate, not the dashboard — the same mistake as auditing a login page and
    // calling it a panel audit. Dismiss it, and record that we did.
    const gate = await send('Runtime.evaluate', {
      expression: `(() => {
        const m = document.querySelector('#identityModal');
        const wasOpen = m && !m.hidden;
        const skip = document.querySelector('#identitySkip');
        if (skip) skip.click();
        return JSON.stringify({ wasOpen: !!wasOpen, dismissed: !!skip });
      })()`,
      returnByValue: true,
    }, sessionId);
    await sleep(800);

    const { result } = await send('Runtime.evaluate', {
      expression: MEASURE, returnByValue: true, awaitPromise: false,
    }, sessionId);
    const measured = JSON.parse(result.value);
    measured.identityGate = JSON.parse(gate.result.value);
    measured.identityGate.stillVisible = !!(await send('Runtime.evaluate', {
      expression: `(() => { const m = document.querySelector('#identityModal'); return m ? !m.hidden : false; })()`,
      returnByValue: true,
    }, sessionId)).result.value;

    const shot = await send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
    }, sessionId);
    const file = path.join(OUT_DIR, `msh-${vp.name}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    measured.screenshot = file;

    report.viewports.push(measured);
    console.log(`\n=== ${vp.width}x${vp.height} ===`);
    console.log('chrome cost:', JSON.stringify(measured.chromeCost));
    console.log('marks:', JSON.stringify(measured.marks));
    console.log('failures:', measured.failureCount);
    for (const f of measured.failures.slice(0, 12)) console.log('   -', JSON.stringify(f));
  }

  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  ws.close();
  chrome.kill();
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) {}
  console.log('\nreport:', path.join(OUT_DIR, 'report.json'));
}

main().catch((e) => { console.error(e); process.exit(1); });

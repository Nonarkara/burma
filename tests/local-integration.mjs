// Writes only to the isolated local Worker, never public rooms.
import assert from 'node:assert/strict';
import WebSocket from 'ws';
const base='http://127.0.0.1:8797';
const room='listening-club';
const url=base+'/api/rooms/'+room;
async function subscriber(nick) {
  const received=[];
  const ws=new WebSocket(url.replace('http:','ws:')+'?nick='+nick);
  ws.addEventListener('message', e=>received.push(JSON.parse(e.data)));
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  return {ws,received};
}
async function until(fn){for(let i=0;i<50;i++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out waiting for WebSocket delivery');}
const a=await subscriber('local-one'),b=await subscriber('local-two');
try {
  const body={author_name:'local-one',author_pubkey:'local-test',body_html:'Local integration '+Date.now(),topics:'learning'};
  const res=await fetch(url+'/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal(res.status,200);const ack=await res.json();assert.ok(ack.message.id);
  await until(()=>[a,b].every(c=>c.received.some(e=>e.type==='message'&&e.message.id===ack.id)));
  const history=await (await fetch(url+'/history?limit=1')).json();assert.equal(history.messages.length,1);assert.equal(history.messages[0].id,ack.id);
  const other=await (await fetch(base+'/api/rooms/digest-today/history')).json();assert.ok(!other.messages.some(m=>m.id===ack.id));
  const empty=await fetch(url+'/message',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(empty.status,400);
  const fd=new FormData();fd.append('file',new Blob(['<svg onload="alert(1)"></svg>'],{type:'image/svg+xml'}),'bad.svg');
  assert.equal((await fetch(base+'/api/upload',{method:'POST',body:fd})).status,415);
  const image=new FormData();image.append('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'local.png');
  const uploaded=await (await fetch(base+'/api/upload',{method:'POST',body:image})).json();assert.ok(uploaded.url.startsWith(base+'/cdn/'));
  const imageRes=await fetch(uploaded.url);assert.equal(imageRes.status,200);assert.equal(imageRes.headers.get('content-type'),'image/png');
  console.log('PASS: two-client fan-out, persistent reload, room isolation, limit forwarding, empty-message rejection, SVG rejection, R2 upload/CDN');
} finally {a.ws.close(1000, 'Test complete');b.ws.close(1000, 'Test complete');}
await until(()=>a.ws.readyState === WebSocket.CLOSED && b.ws.readyState === WebSocket.CLOSED);
console.log('PASS: clean WebSocket close handshake');
// Every assertion and socket close has completed; do not wait for Node's HTTP pool.
process.exit(0);

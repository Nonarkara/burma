import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

function client(fetchImpl = async () => ({ok:true,json:async()=>({rooms:[],messages:[]})})) {
  const elements = new Map();
  const el = (id) => {
    if (!elements.has(id)) elements.set(id,{value:'',textContent:'',innerHTML:'',placeholder:'',children:[],appendChild(n){this.children.push(n);},classList:{toggle(){},add(){},remove(){}}});
    return elements.get(id);
  };
  const timers = new Map(); let timerId=0;
  class Socket {
    static all=[];
    constructor(url){this.url=url;this.listeners={};Socket.all.push(this);}
    addEventListener(event,fn){this.listeners[event]=fn;}
    close(){this.listeners.close?.();}
    emit(event,data){this.listeners[event]?.(data);}
  }
  const context = {window:{},document:{readyState:'loading',addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;},getElementById:el,createElement(){return {firstChild:{},set innerHTML(v){this.firstChild={html:v};}};}},
    localStorage:{getItem(){return null;},setItem(){}},crypto:webcrypto,URL,location:{protocol:'https:'},WebSocket:Socket,fetch:fetchImpl,console,
    setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},AbortSignal,FormData,Blob};
  const source=fs.readFileSync('web/chat-client.js','utf8').replace(/\}\)\(\);\s*$/, 'window.testApi={state,connectWS,handleWsMessage,switchRoom,handleSubmit,renderMessageHtml,appendMessageDom};})();');
  vm.runInNewContext(source,context);
  return {...context.window.testApi,window:context.window,el,timers,Socket};
}

test('retired socket cannot reconnect or mix messages into the new room',()=>{
  const c=client(); c.state.currentRoom='monastic-youth';c.connectWS('monastic-youth');
  const old=c.Socket.all[0];c.state.currentRoom='bkk-burmese';c.connectWS('bkk-burmese');
  old.emit('message',{data:JSON.stringify({type:'message',message:{id:'old',body_html:'old room'}})});
  assert.equal(c.timers.size,0);assert.equal(c.state.history.length,0);
});

test('out-of-order room fetch cannot replace the newest room',async()=>{
  const waiting=[];
  const c=client(()=>new Promise(resolve=>waiting.push(resolve)));
  const a=c.switchRoom('monastic-youth');const b=c.switchRoom('bkk-burmese');
  const response=(body)=>({ok:true,json:async()=>body});
  waiting[1](response({rooms:[]}));await new Promise(setImmediate);
  waiting[2](response({messages:[{id:'new',body_html:'new room'}]}));await b;
  waiting[0](response({rooms:[]}));await new Promise(setImmediate);
  if(waiting[3]) waiting[3](response({messages:[{id:'old',body_html:'old room'}]}));
  await a;assert.equal(c.state.currentRoom,'bkk-burmese');assert.equal(c.state.history[0].id,'new');
  assert.equal(c.Socket.all.length,1);
});

test('failed send retains the draft',async()=>{
  const c=client(async()=>({ok:false,status:503,json:async()=>({error:'storage unavailable'})}));
  c.state.currentRoom='bkk-burmese';c.el('input').value='Keep this draft';
  await c.handleSubmit({preventDefault(){}});assert.equal(c.el('input').value,'Keep this draft');
});

test('REST acknowledgement displays a message without socket echo and is deduplicated',async()=>{
  const message={id:'ack',body_html:'hello',author_name:'test',ts:Date.now()};
  const c=client(async()=>({ok:true,json:async()=>({ok:true,message})}));
  c.state.currentRoom='bkk-burmese';c.el('input').value='hello';
  await c.handleSubmit({preventDefault(){}});
  assert.equal(c.state.history.length,1);
  c.handleWsMessage('bkk-burmese',{type:'message',message});assert.equal(c.state.history.length,1);
});

test('untrusted HTML and javascript preview URLs cannot become executable markup',()=>{
  const c=client();const html=c.renderMessageHtml({body_html:'<img src=x onerror=alert(1)>',link_preview_json:JSON.stringify({url:'javascript:alert(1)',title:'click'}),ts:Date.now()});
  assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('href="javascript:'));
});

test('topic filter applies to incoming messages',()=>{
  const c=client();c.state.topicFilter='jobs';c.appendMessageDom({topics:'housing',body_html:'other topic'});
  assert.equal(c.el('messages').children.length,0);
});

const workerSource=fs.readFileSync('chat-worker/src/chat-room-do.js','utf8');
const roomUrl='data:text/javascript;base64,'+Buffer.from(workerSource).toString('base64');
const indexSource=fs.readFileSync('chat-worker/src/index.js','utf8').replace("from './chat-room-do.js'", `from '${roomUrl}'`);
const {default:worker,ChatRoomDO,MAX_ROOM_SESSIONS,MAX_SESSIONS_PER_IP,RATE_LIMIT_PER_MIN}=await import('data:text/javascript;base64,'+Buffer.from(indexSource).toString('base64'));

function memoryDb(){
  const queries=[];
  return {queries,prepare(sql){return {bind(...args){return {
    async run(){queries.push({sql,args,op:'run'});return {success:true};},
    async all(){queries.push({sql,args,op:'all'});return {results:[]};},
  };}};}};
}
function memoryCtx(id='do-id'){
  const sockets=[];
  const storage=new Map();
  return {
    id:{toString:()=>id},
    storageMap:storage,
    storage:{
      async get(key){return storage.has(key)?storage.get(key):undefined;},
      async put(key,value){storage.set(key,value);},
    },
    acceptWebSocket(ws){ws.hibernated=true;sockets.push(ws);},
    getWebSockets(){return sockets.filter((ws)=>!ws.closed);},
  };
}
class FakeSocket{
  constructor(){this.sent=[];this.attachment=null;this.closed=false;this.hibernated=false;}
  accept(){throw new Error('server.accept() pins the Durable Object and bills duration');}
  addEventListener(){throw new Error('socket listeners do not survive hibernation');}
  send(data){this.sent.push(String(data));}
  close(){this.closed=true;}
  serializeAttachment(value){this.attachment=value;}
  deserializeAttachment(){return this.attachment;}
}
function installWorkersGlobals(){
  const previous={Response:globalThis.Response,WebSocketPair:globalThis.WebSocketPair};
  globalThis.WebSocketPair=class WebSocketPair{
    constructor(){this[0]={role:'client'};this[1]=new FakeSocket();}
  };
  globalThis.Response=class WorkersResponse{
    constructor(body,init={}){
      this.body=body;
      this.status=init.status===undefined?200:init.status;
      this.webSocket=init.webSocket||null;
      this.headers=new Headers(init.headers||{});
      this.ok=this.status>=200&&this.status<300;
    }
    async json(){return JSON.parse(typeof this.body==='string'?this.body:'{}');}
    async text(){return typeof this.body==='string'?this.body:'';}
  };
  return ()=>{globalThis.Response=previous.Response;globalThis.WebSocketPair=previous.WebSocketPair;};
}
function roomInserts(db){
  return db.queries.filter((q)=>q.sql.includes('INSERT OR IGNORE INTO rooms'));
}
function connectRequest(ip,nick='aung'){
  return new Request('https://do.internal/?nick='+encodeURIComponent(nick),{headers:{
    upgrade:'websocket','cf-connecting-ip':ip,'x-pirchchat-room':'bkk-burmese',
  }});
}

test('failed persistence must never acknowledge or broadcast a message',async()=>{
  const room=new ChatRoomDO({id:{toString:()=> 'isolated-test'}},{DB:{prepare(){return {bind(){return {run(){throw Error('D1 unavailable');}};}};}}});
  let broadcasts=0;room.broadcast=()=>broadcasts++;
  await assert.rejects(room.handlePost({author_name:'test',body_html:'must persist'}));
  assert.equal(broadcasts,0);assert.equal(room.history.length,0);
});

test('hibernation handlers accept sockets without server.accept()',async()=>{
  assert.equal(workerSource.includes('server.accept()'),false);
  assert.equal(workerSource.includes('this.ctx.acceptWebSocket(server)'),true);
  assert.equal(workerSource.includes('async webSocketMessage('),true);
  assert.equal(workerSource.includes('async webSocketClose('),true);
  assert.equal(workerSource.includes('async webSocketError('),true);
  const restore=installWorkersGlobals();
  try {
    const ctx=memoryCtx();
    const db=memoryDb();
    const room=new ChatRoomDO(ctx,{DB:db});
    const res=await room.fetch(connectRequest('203.0.113.10','thiri'));
    assert.equal(res.status,101);
    assert.equal(res.webSocket.role,'client');
    const server=ctx.getWebSockets()[0];
    assert.equal(server.hibernated,true);
    assert.equal(server.attachment.identity,'thiri');
    assert.equal(server.attachment.rateKey,'203.0.113.10');
    assert.ok(server.sent.some((line)=>JSON.parse(line).type==='history'));
    await room.webSocketMessage(server,JSON.stringify({type:'message',body_html:'after wake'}));
    assert.ok(server.sent.some((line)=>{const data=JSON.parse(line);return data.type==='message'&&data.message.body_html==='after wake';}));
    const woken=new ChatRoomDO(ctx,{DB:db});
    await woken.webSocketMessage(server,JSON.stringify({type:'message',body_html:'still attached'}));
    assert.ok(server.sent.some((line)=>{const data=JSON.parse(line);return data.type==='message'&&data.message.body_html==='still attached';}));
    await woken.webSocketClose(server,1000,'Test complete',true);
    assert.equal(server.closed,true);
    assert.equal(ctx.getWebSockets().length,0);
  } finally { restore(); }
});

test('a capped connect does not read message history',async()=>{
  const restore=installWorkersGlobals();
  try {
    const ctx=memoryCtx();
    for (let i=0;i<MAX_SESSIONS_PER_IP;i++) {
      const ws=new FakeSocket();
      ws.serializeAttachment({rateKey:'198.51.100.7',identity:'nilar'});
      ctx.acceptWebSocket(ws);
    }
    const db=memoryDb();
    const room=new ChatRoomDO(ctx,{DB:db});
    const res=await room.fetch(connectRequest('198.51.100.7','nilar'));
    assert.equal(res.status,429);
    assert.equal((await res.json()).error,'ip_session_cap');
    assert.equal(db.queries.filter((q)=>q.sql.includes('FROM messages')).length,0);
    assert.equal(roomInserts(db).length,1);
  } finally { restore(); }
});

test('session caps are 200 per room and 5 per IP',async()=>{
  const restore=installWorkersGlobals();
  try {
    const ctx=memoryCtx();
    const room=new ChatRoomDO(ctx,{DB:memoryDb()});
    for (let i=0;i<MAX_SESSIONS_PER_IP;i++) {
      const res=await room.fetch(connectRequest('198.51.100.7','nilar'));
      assert.equal(res.status,101);
    }
    const sixth=await room.fetch(connectRequest('198.51.100.7','nilar'));
    assert.equal(sixth.status,429);
    assert.equal((await sixth.json()).error,'ip_session_cap');
    const other=await room.fetch(connectRequest('198.51.100.8','min_thu'));
    assert.equal(other.status,101);
    let host=1;
    while (ctx.getWebSockets().length<MAX_ROOM_SESSIONS) {
      const res=await room.fetch(connectRequest('203.0.113.'+(host%250), 'guest-'+host));
      assert.equal(res.status,101);
      host++;
    }
    const full=await room.fetch(connectRequest('198.51.100.9','htun'));
    assert.equal(full.status,429);
    assert.equal((await full.json()).error,'room_full');
    assert.equal(ctx.getWebSockets().length,MAX_ROOM_SESSIONS);
  } finally { restore(); }
});

test('room row insert is cached in durable object storage across wakes',async()=>{
  const restore=installWorkersGlobals();
  try {
    const ctx=memoryCtx();
    const db=memoryDb();
    const env={DB:db};
    const room=new ChatRoomDO(ctx,env);
    const history=()=>room.fetch(new Request('https://do.internal/history?limit=1',{headers:{'x-pirchchat-room':'bkk-burmese'}}));
    assert.equal((await history()).status,200);
    assert.equal((await history()).status,200);
    assert.equal(roomInserts(db).length,1);
    assert.deepEqual(roomInserts(db)[0].args,['bkk-burmese','#bkk-burmese']);
    const woken=new ChatRoomDO(ctx,env);
    assert.equal((await woken.fetch(new Request('https://do.internal/history',{headers:{'x-pirchchat-room':'bkk-burmese'}}))).status,200);
    assert.equal(roomInserts(db).length,1);
    assert.equal(ctx.storageMap.get('ensured_room'),'bkk-burmese');
  } finally { restore(); }
});

test('message rate window survives hibernation',async()=>{
  const restore=installWorkersGlobals();
  try {
    const ctx=memoryCtx();
    const db=memoryDb();
    const env={DB:db};
    const room=new ChatRoomDO(ctx,env);
    const res=await room.fetch(connectRequest('203.0.113.20','kyaw'));
    assert.equal(res.status,101);
    const server=ctx.getWebSockets()[0];
    for (let i=0;i<RATE_LIMIT_PER_MIN;i++) {
      await room.webSocketMessage(server,JSON.stringify({type:'message',body_html:'m'+i}));
    }
    await room.webSocketMessage(server,JSON.stringify({type:'message',body_html:'over'}));
    const errors=()=>server.sent.filter((line)=>JSON.parse(line).error==='rate_limited').length;
    assert.equal(errors(),1);
    const woken=new ChatRoomDO(ctx,env);
    await woken.webSocketMessage(server,JSON.stringify({type:'message',body_html:'still over'}));
    assert.equal(errors(),2);
  } finally { restore(); }
});

test('worker connect path does not insert the room row itself',async()=>{
  const restore=installWorkersGlobals();
  try {
    const ctx=memoryCtx('forwarded-do');
    const db=memoryDb();
    const room=new ChatRoomDO(ctx,{DB:db});
    const env={
      DB:db,
      CHAT_ROOM:{
        idFromName(name){assert.equal(name,'bkk-burmese');return {toString:()=>'forwarded-do'};},
        get(){return {fetch:(req)=>room.fetch(req)};},
      },
    };
    const hit=()=>worker.fetch(new Request('https://chat.example/api/rooms/bkk-burmese/history?limit=1'),env);
    const first=await hit();
    assert.equal(first.status,200);
    assert.equal((await first.json()).ok,true);
    await hit();
    assert.equal(roomInserts(db).length,1);
    const ws=await worker.fetch(new Request('https://chat.example/api/rooms/bkk-burmese?nick=yamin',{headers:{upgrade:'websocket','cf-connecting-ip':'203.0.113.30'}}),env);
    assert.equal(ws.status,101);
    assert.equal(roomInserts(db).length,1);
    const indexText=fs.readFileSync('chat-worker/src/index.js','utf8');
    assert.equal(indexText.split('await ensureRoom(env, roomId)').length-1,1);
    assert.equal(indexText.includes("fwdHeaders.set('x-pirchchat-room', roomId)"),true);
  } finally { restore(); }
});

test('wrangler config does not delete a deployed durable object class',()=>{
  const toml=fs.readFileSync('chat-worker/wrangler.toml','utf8');
  assert.equal(toml.includes('deleted_classes'),false);
  assert.match(toml,/tag = "v1"/);
  assert.match(toml,/new_sqlite_classes = \["ChatRoomDO"\]/);
  assert.equal(toml.includes('class_name = "RateLimiterDO"'),false);
});

test('link preview rejects local URLs before fetching',async()=>{
  const source=fs.readFileSync('functions/api/preview.js','utf8');
  const {onRequestGet}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  for (const target of ['http://localhost/','http://127.0.0.1/','http://10.0.0.1/','http://169.254.169.254/','http://[::1]/','javascript:alert(1)']) {
    const result=await onRequestGet({request:new Request('https://site.test/api/preview?url='+encodeURIComponent(target))});
    assert.equal(result.status,400,target);
  }
});

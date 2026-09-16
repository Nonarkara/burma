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
const {ChatRoomDO}=await import('data:text/javascript;base64,'+Buffer.from(workerSource).toString('base64'));
test('failed persistence must never acknowledge or broadcast a message',async()=>{
  const room=new ChatRoomDO({id:{toString:()=> 'isolated-test'}},{DB:{prepare(){return {bind(){return {run(){throw Error('D1 unavailable');}};}};}}});
  let broadcasts=0;room.broadcast=()=>broadcasts++;
  await assert.rejects(room.handlePost({author_name:'test',body_html:'must persist'}));
  assert.equal(broadcasts,0);assert.equal(room.history.length,0);
});

test('link preview rejects local URLs before fetching',async()=>{
  const source=fs.readFileSync('functions/api/preview.js','utf8');
  const {onRequestGet}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  for (const target of ['http://localhost/','http://127.0.0.1/','http://10.0.0.1/','http://169.254.169.254/','http://[::1]/','javascript:alert(1)']) {
    const result=await onRequestGet({request:new Request('https://site.test/api/preview?url='+encodeURIComponent(target))});
    assert.equal(result.status,400,target);
  }
});

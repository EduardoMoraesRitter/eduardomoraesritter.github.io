import test from 'node:test';
import assert from 'node:assert/strict';
import {Notebook, validNote, readSignal, LIMIT} from '../public/papel/model.mjs';
import {webcrypto} from 'node:crypto';
import {newSecret,roomKeys,seal,open,namedSecret,normalizeRoom} from '../public/papel/crypto.mjs';
import {Relay} from '../public/papel/relay.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
test('nomes curtos convergem; senha errada e sala pública geram chaves diferentes',async()=>{
 assert.equal(normalizeRoom(' Mesa1 '),'mesa1');assert.throws(()=>normalizeRoom('x'));assert.throws(()=>normalizeRoom('<script>'));
 const publicKey=await namedSecret('mesa1');assert.equal(publicKey,await namedSecret(' MESA1 '));
 const password='Uma senha longa 123';const protectedKey=await namedSecret('mesa1',password);
 assert.equal(protectedKey,await namedSecret('mesa1',password));assert.notEqual(publicKey,protectedKey);
 assert.notEqual(protectedKey,await namedSecret('mesa1','Outra senha longa 456'));await assert.rejects(namedSecret('mesa1','curta'));
});
test('AES-GCM oculta o texto, usa IV novo e rejeita adulteração e outra chave',async()=>{
 const secret=newSecret(),{key,topic}=await roomKeys(secret),other=await roomKeys(newSecret());
 const message={note:'segredo de teste 🌎'};
 const a=await seal(key,message),b=await seal(key,message);
 assert.notEqual(a.iv,b.iv);assert.ok(!JSON.stringify(a).includes(message.note));
 assert.ok(!topic.includes(secret));assert.deepEqual(await open(key,a),message);
 await assert.rejects(open(other.key,a));
 await assert.rejects(open(key,{...a,data:(a.data[0]==='A'?'B':'A')+a.data.slice(1)}));
 await assert.rejects(open(key,{...a,iv:'AAAA'}));
 await assert.rejects(roomKeys('curto'));
});
test('relay rejeita repetição, envelope inválido e outra sala',async()=>{
 let callback,subscriber;const sent=[],received=[];
 const channel={on(type,event,fn){callback=fn;return this;},subscribe(fn){subscriber=fn;return this;},async send(m){sent.push(m);return 'ok';}};
 const client={channel(){return channel;},async removeAllChannels(){},realtime:{disconnect(){}}};
 const relay=new Relay(()=>client,n=>{if(n)received.push(n);},()=>{});
 try{
  const secret=newSecret();await relay.connect({url:'test',key:'test'},secret);subscriber('SUBSCRIBED');
  const {key}=await roomKeys(secret),note={room:1,text:'não aparece na rede',clock:1,author:'peer'};
  const message={v:1,type:'note',note,from:'peer',seq:1,time:Date.now()};
  const payload=await seal(key,message);callback({payload});await relay.inbox;
  callback({payload});await relay.inbox;assert.equal(received.length,1);
  callback({payload:await seal((await roomKeys(newSecret())).key,{...message,seq:2})});await relay.inbox;assert.equal(received.length,1);
  await relay.send('note',note);assert.ok(sent.length);assert.ok(!JSON.stringify(sent).includes(note.text));
  const last=sent.at(-1);assert.equal((await open(key,last.payload)).note.text,note.text);
  relay.close();assert.equal(await relay.send('note',note),false);
 }finally{relay.close();}
});
test('três folhas independentes e recuperação local',()=>{const a=new Notebook('a');a.edit(1,'Olá 🌎');a.edit(3,'Outra folha');const b=new Notebook('b',JSON.parse(JSON.stringify(a.notes)));assert.equal(b.notes[0].text,'Olá 🌎');assert.equal(b.notes[1].text,'');assert.equal(b.notes[2].text,'Outra folha');});
test('sincronização bidirecional e mensagens fora de ordem',()=>{const a=new Notebook('a'),b=new Notebook('b');const old=a.edit(1,'primeiro');b.receive(old);b.edit(1,'segundo');a.receive(b.notes[0]);assert.equal(a.receive(old),false);assert.deepEqual(a.notes,b.notes);});
test('edições simultâneas convergem independentemente da ordem',()=>{const a=new Notebook('a'),b=new Notebook('b');const x=a.edit(2,'A'),y=b.edit(2,'B');a.receive(y);b.receive(x);assert.deepEqual(a.notes,b.notes);assert.equal(a.notes[1].text,'B');});
test('mensagens inválidas não alteram folhas',()=>{const a=new Notebook('a');for(const value of [null,{}, {room:4,text:'x',clock:1,author:'b'},{room:1,text:'x',clock:Infinity,author:'b'},{room:1,text:'x'.repeat(LIMIT+1),clock:1,author:'b'}]){assert.equal(Boolean(validNote(value)),false);assert.equal(a.receive(value),false);}assert.equal(a.notes[0].text,'');assert.throws(()=>a.edit(1,'x'.repeat(LIMIT+1)));});
test('convite e resposta têm tipos distintos e validação',()=>{const offer=JSON.stringify({v:1,type:'offer',sdp:'v=0\r\n'});assert.equal(readSignal(offer,'offer').type,'offer');assert.throws(()=>readSignal(offer,'answer'));assert.throws(()=>readSignal('código quebrado','offer'));assert.throws(()=>readSignal(JSON.stringify({v:1,type:'offer',sdp:'bad'}),'offer'));});

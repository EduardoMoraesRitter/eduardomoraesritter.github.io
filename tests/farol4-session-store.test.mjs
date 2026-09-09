import test from 'node:test';
import assert from 'node:assert/strict';
import {validSession,readSession,writeSession,SESSION_TTL} from '../public/farol4/session-store.mjs';
const now=Date.now(),base={v:1,role:'send',url:'https://example.supabase.co',code:'a'.repeat(64),file:'b'.repeat(64)+':400',name:'file.bin',cursor:12,savedAt:now,pause:{revision:3,author:'sender',paused:true}};
test('session validates identifiers, block sizes, expiry and pause order',()=>{
 assert.equal(validSession(base,now).bs,400);
 assert.equal(validSession({...base,savedAt:now-SESSION_TTL-1},now),null);
 for(const patch of [{file:'bad'},{url:'https://elsewhere.test'},{code:'short'},{file:'b'.repeat(64)+':401'},{pause:{...base.pause,revision:Infinity}}])assert.equal(validSession({...base,...patch},now),null);
});
test('roles persist independently, invalid sessions are removed and unavailable storage is tolerated',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 assert.ok(writeSession(storage,base));assert.ok(writeSession(storage,{...base,role:'receive',code:'c'.repeat(64)}));
 assert.equal(readSession(storage,'send').code,base.code);assert.equal(readSession(storage,'receive').code,'c'.repeat(64));
 values.set('farol4-session-send','{}');assert.equal(readSession(storage,'send'),null);assert.equal(values.has('farol4-session-send'),false);
 assert.equal(writeSession({setItem(){throw Error('blocked');}},base),false);
 assert.equal(readSession({getItem(){throw Error('blocked');}},'send'),null);
});

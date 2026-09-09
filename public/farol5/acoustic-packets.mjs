import {b64,unb64} from './protocol.mjs?v=5-1';
const u24=(b,p,n)=>{b[p]=n>>>16;b[p+1]=n>>>8;b[p+2]=n;};
const n24=(b,p)=>(b[p]<<16)|(b[p+1]<<8)|b[p+2];
export class AcousticPackets {
 constructor(key,room){this.key=key;this.room=room;this.id=crypto.getRandomValues(new Uint32Array(1))[0];this.seq=0;this.seen=new Map();}
 static async create(secret){
  if(!/^[a-f0-9]{64}$/.test(secret))throw Error('Segredo de sessão inválido');
  const bytes=Uint8Array.from(secret.match(/../g),h=>parseInt(h,16));
  const key=await crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const room=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)).slice(0,6);return new AcousticPackets(key,room);
 }
 async encode({type,count=0,indices=[]},now=Date.now()){
  if(![1,2,3,4].includes(type)||!Number.isInteger(count)||count<0||count>131072||indices.length>16||!indices.every(i=>Number.isInteger(i)&&i>=0&&i<131072))throw Error('Retorno inválido');
  const data=new Uint8Array(24+indices.length*3);data[0]=0xf5;data[1]=type;data.set(this.room,2);const view=new DataView(data.buffer);
  view.setUint32(8,this.id);view.setUint32(12,++this.seq);view.setUint32(16,Math.floor(now/1000));u24(data,20,count);data[23]=indices.length;indices.forEach((n,i)=>u24(data,24+i*3,n));
  const tag=new Uint8Array(await crypto.subtle.sign('HMAC',this.key,data)).slice(0,8),all=new Uint8Array(data.length+8);all.set(data);all.set(tag,data.length);return b64(all);
 }
 async decode(text,now=Date.now()){
  try{
   if(typeof text!=='string'||text.length>120)return null;const all=unb64(text),data=all.slice(0,-8),tag=all.slice(-8);
   if(data.length<24||data[0]!==0xf5||![1,2,3,4].includes(data[1])||data[23]>16||data.length!==24+data[23]*3||!this.room.every((n,i)=>data[i+2]===n))return null;
   const expected=new Uint8Array(await crypto.subtle.sign('HMAC',this.key,data));let diff=0;for(let i=0;i<8;i++)diff|=tag[i]^expected[i];if(diff)return null;
   const v=new DataView(data.buffer),id=v.getUint32(8),seq=v.getUint32(12),time=v.getUint32(16)*1000;
   if(Math.abs(now-time)>60000||seq<1||seq<=(this.seen.get(id)||0)||(this.seen.size>=16&&!this.seen.has(id)))return null;
   const count=n24(data,20),indices=Array.from({length:data[23]},(_,i)=>n24(data,24+3*i));if(count>131072||indices.some(i=>i>=131072))return null;
   this.seen.set(id,seq);return {type:data[1],count,indices};
  }catch{return null;}
 }
}

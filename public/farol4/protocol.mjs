// Farol 4: numbered RGB blocks. No file contents are sent through Realtime.
export const MAX_BYTES = 32 * 1024 * 1024;
export const MAX_BLOCKS = 131072;
export const BATCH = 512;
const enc = new TextEncoder();
export function b64(bytes) {
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function unb64(s) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw Error('Base64 inválido');
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
export async function digest(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
export function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) { c ^= b; for (let i=0;i<8;i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ((c ^ 0xffffffff) >>> 0).toString(16).padStart(8,'0');
}
export function validMeta(m) {
  return !!m && m.v===4 && /^[a-f0-9]{64}$/.test(m.hash) &&
    m.id === `${m.hash}:${m.bs}` && typeof m.name==='string' && m.name.length<=180 &&
    Number.isInteger(m.size) && m.size>=0 && m.size<=MAX_BYTES &&
    Number.isInteger(m.bs) && m.bs>=256 && m.bs<=600 &&
    m.total===Math.max(1,Math.ceil(m.size/m.bs)) && m.total<=MAX_BLOCKS;
}
export class Sender {
  static async create(bytes,name,bs=400) {
    if (!(bytes instanceof Uint8Array) || bytes.length>MAX_BYTES) throw Error('Limite: 32 MiB por arquivo.');
    const hash=await digest(bytes);
    const meta={v:4,id:`${hash}:${bs}`,hash,name:name.slice(0,180),size:bytes.length,bs,total:Math.max(1,Math.ceil(bytes.length/bs))};
    if(!validMeta(meta)) throw Error('Configuração de blocos inválida.');
    return new Sender(bytes,meta);
  }
  constructor(bytes,meta) { this.bytes=bytes; this.meta=meta; this.cursor=0; this.repairs=[]; this.sent=0; this.remotePlan=false; }
  metadata() { return 'F4|M|'+b64(enc.encode(JSON.stringify(this.meta))); }
  packet(i) {
    if (!Number.isInteger(i)||i<0||i>=this.meta.total) throw Error('Bloco inválido');
    const data=this.bytes.subarray(i*this.meta.bs,Math.min((i+1)*this.meta.bs,this.bytes.length));
    return `F4|B|${this.meta.id}|${i}|${crc32(data)}|${b64(data)}`;
  }
  request(indices,remote=false) {
    if(!Array.isArray(indices)||indices.length>BATCH||!indices.every(i=>Number.isInteger(i)&&i>=0&&i<this.meta.total)) return false;
    // Keep unsent requested blocks ahead of retries so frequent reports cannot starve the tail.
    const requested=new Set(indices);
    const pending=remote&&this.remotePlan?this.repairs.filter(i=>requested.has(i)):[];
    this.repairs=[...new Set([...pending,...requested])];
    this.remotePlan=remote; return true;
  }
  next() {
    if(this.remotePlan&&!this.repairs.length)return null;
    const i=this.repairs.length?this.repairs.shift():this.cursor++%this.meta.total;
    this.sent++; return this.packet(i);
  }
}
export class Receiver {
  constructor(meta) {
    if(!validMeta(meta)) throw Error('Metadados inválidos');
    this.meta=meta; this.bytes=new Uint8Array(meta.size); this.flags=new Uint8Array(meta.total);
    this.count=0; this.duplicates=0; this.corrupt=0; this.verified=false;
  }
  accept(packet) {
    if(typeof packet!=='string'||packet.length>1600) return false;
    const p=packet.split('|');
    if(p.length!==6||p[0]!=='F4'||p[1]!=='B'||p[2]!==this.meta.id||!/^\d+$/.test(p[3])) return false;
    const i=Number(p[3]); if(i>=this.meta.total) return false;
    let data; try {data=unb64(p[5]);} catch {this.corrupt++;return false;}
    const size=Math.max(0,Math.min(this.meta.bs,this.meta.size-i*this.meta.bs));
    if(data.length!==size||crc32(data)!==p[4]) {this.corrupt++;return false;}
    if(this.flags[i]) {this.duplicates++;return false;}
    this.bytes.set(data,i*this.meta.bs); this.flags[i]=1; this.count++; return true;
  }
  missing(limit=BATCH) {
    const result=[]; for(let i=0;i<this.flags.length && result.length<limit;i++) if(!this.flags[i]) result.push(i);
    return result;
  }
  async verify() { this.verified=this.count===this.meta.total && await digest(this.bytes)===this.meta.hash; return this.verified; }
  snapshot() { return {meta:this.meta,bytes:this.bytes.slice(),flags:this.flags.slice()}; }
  static restore(s) {
    const r=new Receiver(s.meta);
    if(!(s.bytes instanceof Uint8Array)||s.bytes.length!==r.bytes.length||!(s.flags instanceof Uint8Array)||s.flags.length!==r.flags.length||s.flags.some(x=>x!==0&&x!==1)) throw Error('Sessão salva inválida');
    r.bytes=s.bytes; r.flags=s.flags; r.count=r.flags.reduce((a,b)=>a+b,0); return r;
  }
}
export function readMeta(packet) {
  if(typeof packet!=='string'||!packet.startsWith('F4|M|')||packet.length>1600) return null;
  try {const m=JSON.parse(new TextDecoder().decode(unb64(packet.slice(5))));return validMeta(m)?m:null;} catch{return null;}
}
export function ranges(indices) {
  const parts=[]; let i=0;
  while(i<indices.length) {const start=indices[i]+1;let end=start;while(i+1<indices.length&&indices[i+1]===indices[i]+1){i++;end=indices[i]+1;}parts.push(start===end?String(start):`${start}-${end}`);i++;}
  return parts.join(', ');
}
export function parseRanges(text,total) {
  const result=new Set();
  if(!text.trim()||text.length>8000) throw Error('Cole os números dos blocos faltantes.');
  for(const part of text.trim().split(/[,;\s]+/)) {
    if(!/^\d+(?:-\d+)?$/.test(part)) throw Error('Use números ou intervalos, como 12, 45, 800-820.');
    const [a,b=a]=part.split('-').map(Number);
    if(a<1||b<a||b>total||b-a>=BATCH) throw Error(`Use blocos de 1 a ${total}, até ${BATCH} por lote.`);
    for(let n=a;n<=b;n++){result.add(n-1);if(result.size>BATCH)throw Error(`Máximo de ${BATCH} blocos por lote.`);}
  }
  return [...result];
}
export function newPairCode() {return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function controlKey(code) {
  if(!/^[a-f0-9]{64}$/.test(code)) throw Error('Código de pareamento inválido.');
  const bytes=Uint8Array.from(code.match(/../g),h=>parseInt(h,16));
  return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);
}
export async function seal(key,message) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(message)));
  return {iv:b64(iv),data:b64(new Uint8Array(data))};
}
export async function open(key,envelope) {
  if(!envelope||typeof envelope.data!=='string'||envelope.data.length>24000||typeof envelope.iv!=='string'||envelope.iv.length!==16) throw Error('Mensagem inválida');
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(envelope.iv)},key,unb64(envelope.data))));
}

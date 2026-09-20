import {Sender,Receiver,validMeta,MAX_BYTES,b64,unb64,crc32} from './protocol.mjs?v=20260920-1';
export const READ_SIZE=1024*1024;
export const PART_SIZE=8*1024*1024;
async function hasher(){if(!globalThis.hashwasm?.createSHA256)throw Error('Verificador indisponível. Recarregue a página.');return globalThis.hashwasm.createSHA256();}
export async function hashFile(file,onProgress=()=>{}){
 const h=await hasher();h.init();
 for(let at=0;at<file.size;at+=READ_SIZE){h.update(new Uint8Array(await file.slice(at,at+READ_SIZE).arrayBuffer()));onProgress(Math.min(file.size,at+READ_SIZE),file.size);await new Promise(r=>setTimeout(r,0));}
 return h.digest('hex');
}
export class FileSender extends Sender{
 static async create(file,name,bs=400,onProgress){
  if(file.size>MAX_BYTES)throw Error('Limite: 100 MB por arquivo.');
  const hash=await hashFile(file,onProgress),meta={v:4,id:`${hash}:${bs}`,hash,name:name.slice(0,180),size:file.size,bs,total:Math.max(1,Math.ceil(file.size/bs))};
  if(!validMeta(meta))throw Error('Arquivo ou tamanho de bloco inválido.');return new FileSender(file,meta);
 }
 constructor(file,meta){super(null,meta);this.file=file;}
 async packet(i){
  if(!Number.isInteger(i)||i<0||i>=this.meta.total)throw Error('Bloco inválido');
  const data=new Uint8Array(await this.file.slice(i*this.meta.bs,(i+1)*this.meta.bs).arrayBuffer());
  return `F4|B|${this.meta.id}|${i}|${crc32(data)}|${b64(data)}`;
 }
}
const request=q=>new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
const completed=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Gravação interrompida'));});
export class PartReceiver{
 constructor(meta,db,saved){
  if(!validMeta(meta)||!db?.objectStoreNames.contains('parts'))throw Error('Armazenamento local indisponível. Feche outras abas do Farol e recarregue.');
  this.meta=meta;this.db=db;this.flags=saved?.flags||new Uint8Array(meta.total);
  if(!(this.flags instanceof Uint8Array)||this.flags.length!==meta.total||this.flags.some(x=>x!==0&&x!==1))throw Error('Mapa de blocos inválido.');
  this.count=this.flags.reduce((a,b)=>a+b,0);this.duplicates=0;this.corrupt=0;this.verified=false;
  this.blocksPerChunk=Math.floor(READ_SIZE/meta.bs);this.cache=new Map();this.changed=new Set();this.pending=Promise.resolve();this.closed=false;this.timing=saved?.timing;
 }
 run(fn){const task=this.pending.then(()=>{if(this.closed)throw Error('Recepção encerrada');return fn();});this.pending=task.catch(()=>{});return task;}
 async dispose(){this.closed=true;await this.pending;this.cache.clear();}
 missing(limit=512){return Receiver.prototype.missing.call(this,limit);}
 snapshot(){return {storage:'parts-v1',meta:this.meta,flags:this.flags.slice(),timing:this.timing};}
 async chunk(index){
  if(this.cache.has(index))return this.cache.get(index);
  if(this.cache.size>=2){await this.flushNow();this.cache.clear();}
  const stored=await request(this.db.transaction('parts').objectStore('parts').get([this.meta.id,index]));
  const length=Math.max(0,Math.min(this.blocksPerChunk*this.meta.bs,this.meta.size-index*this.blocksPerChunk*this.meta.bs));
  const bytes=stored?new Uint8Array(await stored.arrayBuffer()):new Uint8Array(length);
  if(bytes.length!==length)throw Error('Parte salva inválida.');this.cache.set(index,bytes);return bytes;
 }
 accept(packet){return this.run(async()=>{
  if(typeof packet!=='string'||packet.length>1600)return false;
  const p=packet.split('|');if(p.length!==6||p[0]!=='F4'||p[1]!=='B'||p[2]!==this.meta.id||!/^\d+$/.test(p[3]))return false;
  const i=Number(p[3]);if(i>=this.meta.total)return false;let data;
  try{data=unb64(p[5]);}catch{this.corrupt++;return false;}
  if(data.length!==Math.max(0,Math.min(this.meta.bs,this.meta.size-i*this.meta.bs))||crc32(data)!==p[4]){this.corrupt++;return false;}
  if(this.flags[i]){this.duplicates++;return false;}
  const part=Math.floor(i/this.blocksPerChunk),bytes=await this.chunk(part);bytes.set(data,(i%this.blocksPerChunk)*this.meta.bs);
  this.flags[i]=1;this.count++;this.changed.add(part);return true;
 });}
 flush(timing){return this.run(()=>this.flushNow(timing));}
 async flushNow(timing){
  if(timing)this.timing=timing;
  const tx=this.db.transaction(['sessions','parts'],'readwrite'),done=completed(tx);
  for(const i of this.changed)tx.objectStore('parts').put(new Blob([this.cache.get(i)]),[this.meta.id,i]);
  tx.objectStore('sessions').put(this.snapshot(),'current');await done;this.changed.clear();
 }
 verify(){return this.run(async()=>{
  if(this.count!==this.meta.total)return false;await this.flushNow();const h=await hasher();h.init();
  const total=Math.ceil(this.meta.size/(this.blocksPerChunk*this.meta.bs));
  for(let i=0;i<total;i++){const blob=await request(this.db.transaction('parts').objectStore('parts').get([this.meta.id,i]));if(!blob)throw Error('Parte ausente no armazenamento');h.update(new Uint8Array(await blob.arrayBuffer()));}
  this.verified=h.digest('hex')===this.meta.hash;return this.verified;
 });}
 fileBlob(){return this.run(async()=>{
  if(!this.verified)throw Error('Arquivo ainda não verificado');await this.flushNow();const blobs=[];
  for(let i=0;i<Math.ceil(this.meta.size/(this.blocksPerChunk*this.meta.bs));i++){const b=await request(this.db.transaction('parts').objectStore('parts').get([this.meta.id,i]));if(!b)throw Error('Parte ausente');blobs.push(b);}
  return new Blob(blobs,{type:/\.mp4$/i.test(this.meta.name)?'video/mp4':'application/octet-stream'});
 });}
}

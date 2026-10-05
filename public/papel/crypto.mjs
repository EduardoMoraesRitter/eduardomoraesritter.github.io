const encoder=new TextEncoder(), decoder=new TextDecoder();
const aad=encoder.encode('papel-relay-v1');
export const validSecret=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function newSecret(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');}
export function normalizeRoom(value){
  if(typeof value!=='string')throw Error('Informe o nome da sala.');
  const name=value.trim().toLowerCase();
  if(!/^[a-z0-9][a-z0-9-]{1,23}$/.test(name))throw Error('Use de 2 a 24 letras sem acentos, números ou hífen.');
  return name;
}
export async function namedSecret(name,password=null){
  name=normalizeRoom(name);
  const salt=encoder.encode('papel-named-v1:'+name+':'+(password===null?'public':'password'));
  let bytes;
  if(password===null)bytes=await crypto.subtle.digest('SHA-256',salt);
  else{
    if(typeof password!=='string'||password.length<12||password.length>256)throw Error('Use uma senha de 12 a 256 caracteres.');
    const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
    bytes=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,256);
  }
  return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function roomKeys(secret){
  if(!validSecret(secret))throw Error('Link da sala inválido.');
  const raw=Uint8Array.from(secret.match(/../g),v=>parseInt(v,16));
  const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
  const hash=await crypto.subtle.digest('SHA-256',encoder.encode('papel-room-v1:'+secret));
  const topic='papel:'+Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
  return {key,topic};
}
function encode(bytes){return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));}
function decode(value){if(typeof value!=='string'||value.length>100000||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw Error('Envelope inválido.');return Uint8Array.from(atob(value),v=>v.charCodeAt(0));}
export async function seal(key,message){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const body=encoder.encode(JSON.stringify(message));
  if(body.length>65000)throw Error('Mensagem muito grande.');
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,body);
  return {v:1,iv:encode(iv),data:encode(new Uint8Array(data))};
}
export async function open(key,envelope){
  if(!envelope||envelope.v!==1)throw Error('Envelope inválido.');
  const iv=decode(envelope.iv),data=decode(envelope.data);
  if(iv.length!==12||data.length<16||data.length>65016)throw Error('Envelope inválido.');
  return JSON.parse(decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad},key,data)));
}

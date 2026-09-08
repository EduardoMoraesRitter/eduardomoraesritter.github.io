import {b64,unb64} from './protocol.mjs';
export function pairPacket({url,key,code,file}){
  return 'F4|P|'+b64(new TextEncoder().encode(JSON.stringify({url,key,code,file})));
}
export function readPair(packet){
  if(typeof packet!=='string'||!packet.startsWith('F4|P|')||packet.length>3000)return null;
  try{
    const p=JSON.parse(new TextDecoder().decode(unb64(packet.slice(5))));
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(p.url)||typeof p.key!=='string'||p.key.length>1000||
      !/^[a-f0-9]{64}$/.test(p.code)||!/^[a-f0-9]{64}:(256|400|600)$/.test(p.file))return null;
    return p;
  }catch{return null;}
}

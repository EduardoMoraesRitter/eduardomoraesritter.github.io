// The room secret stays on this browser, never in a URL or a server-side table.
export const SESSION_TTL=7*24*60*60*1000;
export function validSession(value,now=Date.now()){
  if(!value||value.v!==1||!['send','receive'].includes(value.role)||
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(value.url)||
    !/^[a-f0-9]{64}$/.test(value.code)||! /^[a-f0-9]{64}:(256|400|600)$/.test(value.file)||
    !Number.isFinite(value.savedAt)||value.savedAt>now+60000||now-value.savedAt>SESSION_TTL)return null;
  const bs=Number(value.file.split(':')[1]);
  const pause=value.pause;
  if(!pause||!Number.isSafeInteger(pause.revision)||pause.revision<0||typeof pause.paused!=='boolean'||
    typeof pause.author!=='string'||pause.author.length>64||(pause.revision>0&&!pause.author))return null;
  return {v:1,role:value.role,url:value.url,code:value.code,file:value.file,bs,
    name:typeof value.name==='string'?value.name.slice(0,180):'',
    cursor:Number.isSafeInteger(value.cursor)&&value.cursor>=0?value.cursor:0,
    savedAt:value.savedAt,pause:{revision:pause.revision,author:pause.author,paused:pause.paused}};
}
export function readSession(storage,role,now=Date.now()){
  try{const key='farol4-staging-session-'+role,value=validSession(JSON.parse(storage.getItem(key)),now);
    if(!value||value.role!==role){storage.removeItem(key);return null;}return value;
  }catch{return null;}
}
export function writeSession(storage,value){
  const safe=validSession({...value,v:1,savedAt:Date.now()});if(!safe)return false;
  try{storage.setItem('farol4-staging-session-'+safe.role,JSON.stringify(safe));return true;}catch{return false;}
}

// Measured throughput in everyday units: events per second over a short sliding window.
export class EventRate {
  constructor(windowMs=5000){this.windowMs=windowMs;this.reset();}
  reset(){this.events=[];this.since=null;}
  add(now,count=1){if(this.since===null)this.since=now;if(count>0)this.events.push({now,count});this.trim(now);}
  trim(now){while(this.events.length&&this.events[0].now<=now-this.windowMs)this.events.shift();}
  perSecond(now){
    if(this.since===null)return 0;
    this.trim(now);
    const span=Math.min(this.windowMs,Math.max(1000,now-this.since));
    return this.events.reduce((sum,e)=>sum+e.count,0)/(span/1000);
  }
}
const one=value=>value>=10?String(Math.round(value)):value.toFixed(1);
export function perMinute(bytesPerSecond){const b=bytesPerSecond*60;return b>=1000000?`${(b/1000000).toFixed(2)} MB/min`:b>=1000?`${Math.round(b/1000)} kB/min`:`${Math.round(b)} B/min`;}
// Sender: what the screen really shows, and what the receiver confirmed.
export function screenDetail({frames,codes,bs}){
  return frames>0?`Na tela: ${one(frames)} quadros/s · ${one(codes)} QR/s · ${perMinute(codes*bs)}`:'';
}
export function confirmedDetail({rate,bs}){
  return rate>0?`No receptor: ${one(rate/bs)} blocos/s · ${perMinute(rate)}`:'';
}
// Receiver: how many QR codes the camera reads, and how many of them are new data.
export function readDetail({reads,rate,bs}){
  if(!(reads>0))return '';
  return `Leitura: ${one(reads)} QR/s`+(rate>0?` · ${one(rate/bs)} blocos novos/s · ${perMinute(rate)}`:' · nenhum bloco novo');
}

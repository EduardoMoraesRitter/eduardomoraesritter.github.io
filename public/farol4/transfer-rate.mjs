// Only newly accepted bytes count. A restored session establishes a new baseline.
export class TransferRate {
  constructor(){this.samples=[];this.lastChange=null;}
  observe(bytes,now){
    const last=this.samples.at(-1);
    if(last&&bytes<last.bytes){this.samples=[];this.lastChange=null;}
    if(last&&bytes>last.bytes)this.lastChange=now;
    this.samples.push({bytes,now});
    while(this.samples.length>2&&this.samples[1].now<=now-20000)this.samples.shift();
    const first=this.samples[0],elapsed=(now-first.now)/1000;
    const stalled=this.lastChange!==null&&now-this.lastChange>=8000;
    const rate=elapsed>=3&&!stalled?(bytes-first.bytes)/elapsed:0;
    return {rate,stalled};
  }
}
export function duration(seconds){
  if(seconds<60)return `~${Math.max(1,Math.ceil(seconds))} s`;
  if(seconds<3600)return `~${Math.ceil(seconds/60)} min`;
  return `~${Math.floor(seconds/3600)} h ${Math.ceil(seconds%3600/60)} min`;
}

export function needsRecovery({active,paused,complete,lastDecoded,progressSince,now}) {
  return active&&!paused&&!complete&&lastDecoded>0&&now-lastDecoded<3000&&now-progressSince>=8000;
}

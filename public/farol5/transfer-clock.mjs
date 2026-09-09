export class TransferClock {
 constructor(saved=null,now=Date.now()){
  this.startedAt=Number.isFinite(saved?.startedAt)&&saved.startedAt>0&&saved.startedAt<=now?saved.startedAt:null;
  this.completedAt=this.startedAt&&Number.isFinite(saved?.completedAt)&&saved.completedAt>=this.startedAt&&saved.completedAt<=now?saved.completedAt:null;
  this.activeMs=this.startedAt&&Number.isFinite(saved?.activeMs)?Math.max(0,Math.min(saved.activeMs,(this.completedAt||now)-this.startedAt)):0;
  this.partial=!!saved?.partial;this.last=now;this.running=false;
 }
 update(now,running,started=false){
  if(!this.startedAt&&started)this.startedAt=now;
  if(this.startedAt&&!this.completedAt&&this.running)this.activeMs+=Math.max(0,now-this.last);
  this.last=now;this.running=!!running&&!this.completedAt&&!!this.startedAt;
 }
 finish(now){this.update(now,false);if(this.startedAt&&!this.completedAt)this.completedAt=now;}
 summary(now=Date.now()){const totalMs=this.startedAt?Math.max(0,(this.completedAt||now)-this.startedAt):0;return {totalMs,activeMs:Math.min(this.activeMs,totalMs),pausedMs:Math.max(0,totalMs-this.activeMs)};}
 snapshot(){return {startedAt:this.startedAt,completedAt:this.completedAt,activeMs:this.activeMs,partial:this.partial};}
}
export function elapsed(ms){const seconds=Math.floor(ms/1000);return seconds<60?`${seconds} s`:seconds<3600?`${Math.floor(seconds/60)} min ${seconds%60} s`:`${Math.floor(seconds/3600)} h ${Math.floor(seconds%3600/60)} min`;}
export function dataSize(bytes){return bytes>=1000000?`${(bytes/1000000).toFixed(2)} MB`:bytes>=1000?`${(bytes/1000).toFixed(1)} kB`:`${bytes} B`;}

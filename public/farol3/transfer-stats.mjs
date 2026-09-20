// Measure newly reconstructed bytes, never emitted or repeated droplets.
export class TransferStats {
 constructor(){this.reset();}
 reset(){this.id='';this.started=null;this.last=0;this.active=0;this.elapsed=0;this.wasActive=false;this.samples=[];this.count=0;this.changed=0;this.finished=false;}
 update({id,count,total,bs,size,active,done},now){
  if(id!==this.id){this.reset();this.id=id;this.count=count;}
  if(this.started===null){if(!active&&!done)return null;this.started=now;this.last=now;this.changed=now;this.samples=[{t:0,count}];}
  if(!this.finished){
   const dt=Math.max(0,now-this.last);this.elapsed+=dt;
   if(this.wasActive)this.active+=dt;
   if(count>this.count)this.changed=now;
   if(active!==this.wasActive)this.samples=[{t:this.active,count:this.count}];
   if(this.samples.at(-1)?.t===this.active)this.samples[this.samples.length-1]={t:this.active,count};
   else this.samples.push({t:this.active,count});
   while(this.samples.length>1&&this.samples[1].t<this.active-30000)this.samples.shift();
   this.count=count;this.last=now;this.wasActive=active;this.finished=done;
  }
  const first=this.samples[0],seconds=(this.active-first.t)/1000;
  const stalled=active&&!done&&now-this.changed>=12000;
  const rate=active&&!stalled&&seconds>=3?Math.max(0,(count-first.count)*bs/seconds):0;
  const bytes=Math.min(size,count*bs),eta=rate>0?(size-bytes)/rate:null;
  return {bytes,size,rate,eta,elapsed:this.elapsed/1000,active:this.active/1000,done:!!done,paused:!active&&!done,stalled};
 }
}
export function validStats(m){return m&&['bytes','size','rate','elapsed','active'].every(k=>Number.isFinite(m[k])&&m[k]>=0)&&m.size<=100000000&&m.bytes<=m.size&&(m.eta===null||Number.isFinite(m.eta)&&m.eta>=0)&&['done','paused','stalled'].every(k=>typeof m[k]==='boolean');}
const duration=s=>{s=Math.ceil(s);return s>=3600?`${Math.floor(s/3600)} h ${Math.floor(s%3600/60)} min`:s>=60?`${Math.floor(s/60)} min ${s%60} s`:`${s} s`;};
export function statsText(m){
 const progress=`${(m.bytes/1000000).toFixed(2)} / ${(m.size/1000000).toFixed(2)} MB recuperados`;
 const timing=`${duration(m.elapsed)} decorridos · ${duration(m.active)} em atividade`;
 if(m.done)return `${progress} · Concluído · ${timing}`;
 const prediction=m.paused?'Pausado':m.stalled?'Sem avanço suficiente para estimar':m.eta===null?'Calculando velocidade…':`Restante: ~${duration(m.eta)}`;
 return `${progress} · ${(m.rate/1000).toFixed(1)} KB/s úteis · ${prediction} · ${timing}`;
}

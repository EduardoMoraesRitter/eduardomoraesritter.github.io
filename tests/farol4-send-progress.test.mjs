import test from 'node:test';import assert from 'node:assert/strict';
import {sendProgress,BLOCKS_PER_FRAME} from '../public/farol4/send-progress.mjs';
import {Sender} from '../public/farol4/protocol.mjs';
const base={total:100,size:40000,bs:400};
test('receiver confirmations drive percent, remaining time and speed',()=>{
 const v=sendProgress({...base,confirmed:25,covered:90,running:true,rate:4000});
 assert.equal(v.percent,25);assert.equal(v.countLabel,'25 / 100 blocos confirmados');
 assert.equal(v.remaining,'~8 s');assert.equal(v.speed,'3.9 KiB/s');
 assert.equal(sendProgress({...base,confirmed:25,running:true,rate:0}).remaining,'Calculando…');
 assert.equal(sendProgress({...base,confirmed:25,running:true,stalled:true}).remaining,'Sem novos blocos no receptor');
 assert.equal(sendProgress({...base,confirmed:100,running:true}).remaining,'Verificando arquivo');
});
test('without a return channel the sender shows its own first pass',()=>{
 const v=sendProgress({...base,covered:40,running:true,fps:4});
 assert.equal(v.percent,40);assert.equal(v.countLabel,'40 / 100 blocos transmitidos');
 assert.equal(v.remaining,`~${Math.ceil(60/(4*BLOCKS_PER_FRAME))} s (1ª volta)`);assert.match(v.speed,/KiB\/s na tela$/);
 assert.equal(sendProgress({...base,covered:100,running:true,fps:4}).remaining,'1ª volta completa · repetindo');
});
test('states: idle, paused, stopped, done',()=>{
 assert.equal(sendProgress(base).remaining,'Aguardando transmissão');assert.equal(sendProgress(base).percent,0);
 assert.equal(sendProgress({...base,covered:10,running:true,paused:true}).remaining,'Pausado');
 assert.equal(sendProgress({...base,covered:10}).remaining,'Transmissão parada');
 const done=sendProgress({...base,confirmed:80,done:true});assert.equal(done.percent,100);assert.equal(done.remaining,'Concluído');
});
test('sender coverage ignores repetitions',async()=>{
 const s=await Sender.create(new Uint8Array(1000),'a.bin',400);
 for(let i=0;i<5;i++)s.next();
 assert.equal(s.sent,5);assert.equal(s.covered,3);
 s.resetCoverage();assert.equal(s.covered,0);
});

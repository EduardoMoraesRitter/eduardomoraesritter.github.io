import test from 'node:test';import assert from 'node:assert/strict';
import {EventRate,perMinute,screenDetail,confirmedDetail,readDetail} from '../public/farol4/speed-meter.mjs';
import {overlayQuad,overlayState} from '../public/farol4/qr-overlay.mjs';
test('event rate uses a sliding window and a 1 s minimum span',()=>{
 const r=new EventRate(5000);assert.equal(r.perSecond(0),0);
 r.add(1000,3);assert.equal(r.perSecond(1200),3);
 for(let t=2000;t<=6000;t+=1000)r.add(t,3);
 assert.equal(r.perSecond(6000),3);
 assert.equal(r.perSecond(20000),0);
 r.reset();assert.equal(r.perSecond(20000),0);
});
test('speed texts use QR per second and data per minute',()=>{
 assert.equal(perMinute(4400),'264 kB/min');assert.equal(perMinute(20000),'1.20 MB/min');assert.equal(perMinute(5),'300 B/min');
 assert.equal(screenDetail({frames:4,codes:11,bs:400}),'Na tela: 4.0 quadros/s · 11 QR/s · 264 kB/min');
 assert.equal(screenDetail({frames:0,codes:0,bs:400}),'');
 assert.equal(confirmedDetail({rate:3800,bs:400}),'No receptor: 9.5 blocos/s · 228 kB/min');
 assert.equal(confirmedDetail({rate:0,bs:400}),'');
 assert.equal(readDetail({reads:12,rate:3800,bs:400}),'Leitura: 12 QR/s · 9.5 blocos novos/s · 228 kB/min');
 assert.equal(readDetail({reads:6,rate:0,bs:400}),'Leitura: 6.0 QR/s · nenhum bloco novo');
 assert.equal(readDetail({reads:0,rate:0,bs:400}),'');
});
test('QR corners map onto the letterboxed camera preview',()=>{
 const location={topLeftCorner:{x:100,y:100},topRightCorner:{x:300,y:100},bottomRightCorner:{x:300,y:300},bottomLeftCorner:{x:100,y:300}};
 // 400×400 scan inside an 800×1000 box: scale 2, 100 px bars above and below.
 assert.deepEqual(overlayQuad(location,400,400,800,1000),[{x:200,y:300},{x:600,y:300},{x:600,y:700},{x:200,y:700}]);
 // Wide box: bars on the sides.
 assert.deepEqual(overlayQuad(location,400,400,1000,400)[0],{x:400,y:100});
 assert.equal(overlayQuad(null,400,400,800,1000),null);assert.equal(overlayQuad(location,0,400,800,1000),null);
});
test('overlay colour follows framing guidance',()=>{
 assert.equal(overlayState({coverage:.6,centered:true}),'good');
 assert.equal(overlayState({coverage:.6,centered:false}),'adjust');
 assert.equal(overlayState({coverage:.3,centered:true}),'adjust');
 assert.equal(overlayState({coverage:.9,centered:true}),'adjust');
 assert.equal(overlayState(null),'adjust');
});

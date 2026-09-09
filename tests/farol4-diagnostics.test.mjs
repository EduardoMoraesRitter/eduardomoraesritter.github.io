import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseTransfer as diagnose} from '../public/farol4/diagnostics.mjs';

const receiving={mode:'receive',online:true,connectionState:'SUBSCRIBED',peerAgeMs:2000,cameraActive:true,cameraAgeMs:10000,qrAgeMs:100,progressAgeMs:100,hasFile:true};
test('connection evidence distinguishes offline, failure, connecting and missing peer',()=>{
  assert.equal(diagnose({...receiving,online:false}).code,'offline');
  for(const connectionState of ['ERROR','CHANNEL_ERROR','TIMED_OUT'])assert.equal(diagnose({...receiving,connectionState}).code,'connection-error');
  assert.equal(diagnose({...receiving,connectionState:'CONNECTING'}).code,'connecting');
  assert.equal(diagnose({...receiving,peerAgeMs:12000}).code,'peer-missing');
  assert.equal(diagnose({...receiving,peerAgeMs:null}).code,'peer-missing');
});
test('camera, no decoded QR and no new blocks are different observations',()=>{
  assert.equal(diagnose({...receiving,cameraActive:false}).code,'camera-off');
  assert.equal(diagnose({...receiving,qrAgeMs:8000}).code,'no-qr');
  assert.equal(diagnose({...receiving,qrAgeMs:null}).code,'no-qr');
  assert.equal(diagnose({...receiving,progressAgeMs:8000}).code,'no-new-blocks');
  assert.equal(diagnose({...receiving,qrAgeMs:null,cameraAgeMs:100}).code,'camera-ready');
  assert.equal(diagnose({...receiving,progressAgeMs:10000,hasFile:false}).code,'receiving');
});
test('verifying does not suggest stalled transfer, completed data wins over connectivity',()=>{
  assert.equal(diagnose({...receiving,progressAgeMs:10000,verifying:true}).code,'verifying');
  assert.equal(diagnose({...receiving,complete:true,online:false}).code,'complete');
});
test('paused transfer never claims both peers without live confirmation',()=>{
  assert.equal(diagnose({...receiving,paused:true,pauseConfirmed:true}).code,'paused');
  for(const extra of [{online:false},{peerAgeMs:12000},{connectionState:'CLOSED'},{pauseConfirmed:false}])
    assert.equal(diagnose({...receiving,paused:true,pauseConfirmed:true,...extra}).code,'pause-pending');
  assert.equal(diagnose({...receiving,paused:true,qrAgeMs:100000,progressAgeMs:100000}).code,'pause-pending');
});
test('idle sender and intentional disconnect have actionable messages',()=>{
  assert.equal(diagnose({mode:'send'}).code,'ready');
  assert.equal(diagnose({mode:'send',transmitting:true}).code,'transmitting');
  assert.equal(diagnose({...receiving,sameRole:true}).code,'same-role');
  assert.equal(diagnose({...receiving,hasRoom:true,connectionState:'CLOSED'}).code,'connection-closed');
  assert.match(diagnose({...receiving,connectionState:'CHANNEL_ERROR'}).action,/reconectar/);
});

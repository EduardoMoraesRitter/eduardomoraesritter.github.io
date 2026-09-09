import test from 'node:test';
import assert from 'node:assert/strict';
import {calibrationRun,CalibrationSample,readCalibration} from '../public/farol4/calibration.mjs';

test('calibration measures all unique RGB channels, not repeated camera scans',()=>{
  const run=calibrationRun(6,400),sample=new CalibrationSample();
  for(let i=0;i<run.total;i++)for(const packet of run.frame(i)){
    assert.equal(sample.accept(packet),true);
    for(let repeat=0;repeat<5;repeat++)assert.equal(sample.accept(packet),false);
  }
  assert.deepEqual(sample.result(),{expected:144,received:144,ratio:1,enough:true,fps:6,bs:400,suggestedFps:6});
});
test('dropped frames and channels reduce recommendation, late starts do not hide loss',()=>{
  const run=calibrationRun(8,600),sample=new CalibrationSample();
  for(let i=run.total/2;i<run.total;i++)for(const packet of run.frame(i).slice(0,2))sample.accept(packet);
  assert.equal(sample.result().ratio,1/3);
  assert.equal(sample.result().suggestedFps,2);
});
test('a still QR cannot yield an unsupported speed recommendation',()=>{
  const run=calibrationRun(6,256),sample=new CalibrationSample();
  for(let i=0;i<100;i++)for(const packet of run.frame(0))sample.accept(packet);
  assert.equal(sample.result().received,3);assert.equal(sample.result().suggestedFps,null);
});
test('rejects corrupt payload, foreign runs and inconsistent parameters',()=>{
  const run=calibrationRun(),sample=new CalibrationSample(),packet=run.frame(0)[0];
  assert.equal(sample.accept(packet),true);
  assert.equal(sample.accept(calibrationRun().frame(1)[0]),false);
  assert.equal(readCalibration(packet.slice(0,-5)+'aaaa='),null);
  assert.equal(readCalibration(packet.replace('|6|400|48|','|12|400|48|')),null);
  assert.equal(sample.accept('F4|B|file|1|crc|bytes'),false);
});

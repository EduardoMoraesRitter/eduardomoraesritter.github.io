import test from 'node:test';
import assert from 'node:assert/strict';
import {similarFrames} from '../public/farol4/frame-similarity.mjs';
test('first frame, exact repeats, noise, and localized changes',()=>{
 const a=new Uint8ClampedArray(128*128*4).fill(100);
 assert.equal(similarFrames(null,a,128,128),false);
 assert.equal(similarFrames(a,a,128,128),true);
 const noise=a.map((v,i)=>i%8===0?v+1:v);
 assert.equal(similarFrames(a,noise,128,128),true);
 const text=a.slice();for(let y=30;y<34;y++)for(let x=30;x<42;x++)for(let c=0;c<3;c++)text[(y*128+x)*4+c]=255;
 assert.equal(similarFrames(a,text,128,128),false);
 const scene=new Uint8ClampedArray(a.length).fill(200);
 assert.equal(similarFrames(a,scene,128,128,'strong'),false);
});

import test from 'node:test';import assert from 'node:assert/strict';
import {channelImage,toLocation,packetsFrom} from '../public/farol4/scan-decode.mjs';
test('a colour channel becomes a greyscale RGBA image',()=>{
 const src=new Uint8ClampedArray([10,20,30,255, 40,50,60,255]);
 assert.deepEqual([...channelImage(src,0)],[10,10,10,255, 40,40,40,255]);
 assert.deepEqual([...channelImage(src,2)],[30,30,30,255, 60,60,60,255]);
 const out=new Uint8ClampedArray(8);assert.equal(channelImage(src,1,out),out);assert.deepEqual([...out],[20,20,20,255, 50,50,50,255]);
});
test('zxing corners map to the outline names used by the app',()=>{
 const p={topLeft:{x:1,y:2},topRight:{x:3,y:4},bottomLeft:{x:5,y:6},bottomRight:{x:7,y:8}};
 assert.deepEqual(toLocation(p),{topLeftCorner:p.topLeft,topRightCorner:p.topRight,bottomLeftCorner:p.bottomLeft,bottomRightCorner:p.bottomRight});
 assert.equal(toLocation(null),null);
});
test('only Farol 4 packets are kept, with their outline',()=>{
 const position={topLeft:{x:0,y:0},topRight:{x:1,y:0},bottomLeft:{x:0,y:1},bottomRight:{x:1,y:1}};
 const packets=packetsFrom([{text:'F4|B|abc|1|2|x',position},{text:'hello',position},{text:42},null]);
 assert.equal(packets.length,1);assert.equal(packets[0].data,'F4|B|abc|1|2|x');assert.equal(packets[0].location.bottomRightCorner.x,1);
});
test('a timed-out channel (null) contributes nothing',()=>{
 assert.deepEqual(packetsFrom(null),[]);assert.deepEqual(packetsFrom(undefined),[]);
});
import {splitChannels} from '../public/farol4/scan-decode.mjs';
test('one pass splits all three channels, same as channelImage',()=>{
 const src=new Uint8ClampedArray([10,20,30,255, 40,50,60,255, 7,8,9,255]);
 const [r,g,b]=splitChannels(src);
 for(let ch=0;ch<3;ch++)assert.deepEqual([...[r,g,b][ch]],[...channelImage(src,ch)]);
 const out=[new Uint8ClampedArray(12),new Uint8ClampedArray(12),new Uint8ClampedArray(12)];
 assert.equal(splitChannels(src,out)[1],out[1]);
});

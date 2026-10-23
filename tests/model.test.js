import test from 'node:test';
import assert from 'node:assert/strict';
import {atmosphereDensity,hazeOpacity} from '../app/atmosphere-field.js';
test('cloud fields stay continuous across former tile edges without repeating every 512 px',()=>{
  for(const material of ['fog','mist','smoke','darkness']){
    let difference=0;
    for(let y=0;y<2048;y+=19)for(const x of [511.99,1023.99,1535.99]){
      const a=atmosphereDensity(x,y,material),b=atmosphereDensity(x+.02,y,material);
      assert.ok(Math.abs(a-b)<.002);assert.ok(a>=0&&a<=1);
      difference+=Math.abs(a-atmosphereDensity(x+512,y,material));
      assert.equal(a,atmosphereDensity(x,y,material));
    }
    assert.ok(difference>1,`${material} must not repeat at 512 px`);
  }
});
test('global haze clears or scales painted clouds while particle and darkness opacity remains independent',()=>{
  for(const material of ['fog','mist','smoke']){
    const stroke={material,opacity:35};
    assert.equal(hazeOpacity(stroke,{fog:0}),0);assert.equal(hazeOpacity(stroke,{fog:40}),.35);assert.equal(hazeOpacity(stroke,{fog:80}),.7);
  }
  for(const material of ['rain','snowfall','embers','darkness'])assert.equal(hazeOpacity({material,opacity:35},{fog:0}),.35);
  assert.equal(hazeOpacity({material:'fog',opacity:100},{fog:80}),1);
});
import {createDocument,validateDocument,snapPoint,constrainedEnd,segmentDistance,History} from '../app/model.js';
test('sample and empty projects survive lossless project-file round trips',()=>{for(const blank of [false,true]){const doc=createDocument(blank);assert.deepEqual(validateDocument(JSON.stringify(doc)),doc);}});
test('snap handles negative, disabled, and custom-size grids',()=>{assert.deepEqual(snapPoint({x:93,y:133},64),{x:64,y:128});assert.deepEqual(snapPoint({x:61,y:-43},24),{x:72,y:-48});assert.deepEqual(snapPoint({x:61,y:43},24,false),{x:61,y:43});});
test('constrained wall angles remain at multiples of 45 degrees',()=>{for(const p of [{x:100,y:20},{x:30,y:90},{x:70,y:69}]){const q=constrainedEnd({x:0,y:0},p);const step=Math.atan2(q.y,q.x)/(Math.PI/4);assert.ok(Math.abs(step-Math.round(step))<1e-9);}});
test('eraser distance clamps to wall endpoints and handles zero-length segments',()=>{assert.equal(segmentDistance({x:15,y:0},{x:0,y:0},{x:10,y:0}),5);assert.equal(segmentDistance({x:3,y:4},{x:0,y:0},{x:0,y:0}),5);});
test('undo/redo preserves full documents and branches after a new edit',()=>{const h=new History(createDocument(true));h.checkpoint();h.doc.name='A';h.checkpoint();h.doc.name='B';assert.equal(h.undo(),true);assert.equal(h.doc.name,'A');assert.equal(h.redo(),true);assert.equal(h.doc.name,'B');h.undo();h.checkpoint();h.doc.name='C';assert.equal(h.redo(),false);assert.equal(h.doc.name,'C');});
test('history retains only the latest 60 edits',()=>{const h=new History(createDocument());for(let i=0;i<80;i++){h.checkpoint();h.doc.name=String(i);}assert.equal(h.past.length,60);});
test('malformed geometry, nonfinite numbers, unknown assets, and invalid settings are rejected',()=>{const cases=[d=>d.version=99,d=>d.name={},d=>d.grid=0,d=>d.ambient=NaN,d=>d.rooms[0].w=-5,d=>d.walls[0].a.x=Infinity,d=>d.objects[0].type='unknown',d=>d.lights[0].radius=10000,d=>d.terrain[0].points=[null],d=>d.visibility=null];for(const edit of cases){const d=createDocument();edit(d);assert.throws(()=>validateDocument(d));}});
test('import returns a deep copy isolated from external mutation',()=>{const d=createDocument();const imported=validateDocument(d);d.walls[0].a.x=999;assert.notEqual(imported.walls[0].a.x,999);});

import {roomBoundary,pointInRoom,resampleStroke,createOutdoorDocument,MATERIALS,ASSET_COUNT} from '../app/model.js';
import {validatePreferences} from '../app/preferences.js';
test('legacy v1 maps migrate without changing their existing geometry or source',()=>{const legacy=createDocument();legacy.version=1;delete legacy.floors;delete legacy.markers;delete legacy.visibility.terrain;delete legacy.visibility.markers;const before=structuredClone(legacy);const upgraded=validateDocument(legacy);assert.equal(upgraded.version,3);assert.deepEqual(upgraded.walls,legacy.walls);assert.deepEqual(upgraded.rooms,legacy.rooms);assert.deepEqual(upgraded.floors,[]);assert.equal(upgraded.visibility.terrain,true);assert.deepEqual(legacy,before);});
test('new project fields cannot be omitted or replaced with malformed strokes',()=>{for(const change of [d=>delete d.floors,d=>d.floors=[{material:'wood',points:[],size:32}],d=>d.terrain[0].noise=101,d=>d.terrain[0].opacity=0,d=>d.rooms[0].shape='unknown',d=>d.markers=[{id:'m',x:1,y:2,label:42,number:1}]]){const d=createDocument();change(d);assert.throws(()=>validateDocument(d));}});
test('room boundary and hit testing agree for rectangular, round, and cavern rooms',()=>{for(const shape of ['rectangle','ellipse','cavern']){const room={x:100,y:100,w:300,h:200,shape};const points=roomBoundary(room);assert.ok(points.length>=4);assert.ok(points.every(p=>p.x>=100&&p.x<=400&&p.y>=100&&p.y<=300));assert.equal(pointInRoom({x:250,y:200},room),true);assert.equal(pointInRoom({x:99,y:200},room),false);if(shape!=='rectangle')assert.equal(pointInRoom({x:101,y:101},room),false);assert.deepEqual(points,roomBoundary(room));}});
test('stroke resampling fills fast pointer gaps and preserves final endpoints',()=>{const samples=resampleStroke([{x:0,y:0},{x:100,y:0},{x:100,y:100}],10);assert.equal(samples.length,21);for(let i=1;i<samples.length;i++)assert.ok(Math.hypot(samples[i].x-samples[i-1].x,samples[i].y-samples[i-1].y)<=10.00001);assert.deepEqual(samples.at(-1),{x:100,y:100});assert.deepEqual(resampleStroke([{x:1,y:1},{x:1,y:1}],10),[{x:1,y:1}]);});
test('outdoor example is deterministic and round-trips with markers and new materials',()=>{const d=createOutdoorDocument();assert.deepEqual(d,createOutdoorDocument());assert.deepEqual(validateDocument(JSON.stringify(d)),d);assert.equal(d.markers.length,3);assert.ok(d.terrain.some(t=>t.material==='grass'));assert.ok(d.terrain.some(t=>t.material==='mud'));});
test('Expanded assets include twelve wall, floor, and terrain materials',()=>{assert.equal(ASSET_COUNT,61);for(const type of ['wall','floor','terrain']){assert.equal(MATERIALS[type].length,12);assert.equal(new Set(MATERIALS[type].map(m=>m.id)).size,12);}assert.equal(MATERIALS.room,MATERIALS.floor);});
test('VTT 70 and 140 px grids round-trip',()=>{for(const grid of [70,140,256]){const d=createDocument();d.grid=grid;assert.equal(validateDocument(d).grid,grid);}});
test('marker validation rejects duplicate IDs and malformed names and numbers',()=>{for(const edit of [d=>d.markers.push({...d.markers[0]}),d=>d.markers[0].label='x'.repeat(61),d=>d.markers[0].number=1.5,d=>d.markers[0].x=Infinity]){const d=createOutdoorDocument();edit(d);assert.throws(()=>validateDocument(d));}});
test('editor preferences sanitize settings and keep UI theme separate from map atmosphere',()=>{assert.equal(validatePreferences({},true).uiTheme,'dark');assert.equal(validatePreferences({uiTheme:'light'},true).uiTheme,'light');const p=validatePreferences({uiTheme:'unknown',terrain:{opacity:0,noise:101,density:40},room:{shape:'ellipse',withWalls:false}});assert.equal(p.terrain.opacity,90);assert.equal(p.terrain.noise,65);assert.equal(p.terrain.density,40);assert.equal(p.room.shape,'ellipse');assert.equal(p.room.withWalls,false);});
test('terrain ground/overlay placement survives files and invalid placement is rejected',()=>{const d=createOutdoorDocument();assert.ok(validateDocument(d).terrain.every(t=>t.placement==='under'));d.terrain[0].placement='over';assert.equal(validateDocument(d).terrain[0].placement,'over');d.terrain[0].placement='unexpected';assert.throws(()=>validateDocument(d));});

import {resizeMap,duplicateMapState,switchMapState,deleteMapState,nextPaintOrder} from '../app/model.js';
test('map dimensions and aspect can change without destroying clipped artwork',()=>{const d=createDocument();const walls=structuredClone(d.walls);resizeMap(d,512,1024);assert.equal(d.width,512);assert.equal(d.height,1024);assert.deepEqual(d.walls,walls);assert.deepEqual(validateDocument(d),d);resizeMap(d,2048,1152);assert.equal(d.width/d.height,16/9);assert.throws(()=>resizeMap(d,8192,8192));});
test('scaling a map transforms geometry, props, lights and painted strokes',()=>{const d=createDocument();const wall=structuredClone(d.walls[0]),light=structuredClone(d.lights[0]);resizeMap(d,3072,2560,true);assert.equal(d.walls[0].a.x,wall.a.x*2);assert.equal(d.lights[0].radius,light.radius*2);assert.equal(d.terrain[0].size,144);assert.deepEqual(validateDocument(d),d);});
test('map states switch without losing unsaved edits and remain independent',()=>{const d=createDocument();const original=d.ambient;duplicateMapState(d,'Flooded','flooded');d.ambient=18;d.terrain.push({material:'water',points:[{x:200,y:200}],size:80,order:nextPaintOrder(d)});switchMapState(d,'base');assert.equal(d.ambient,original);assert.equal(d.terrain.length,3);d.name='Campaign map';switchMapState(d,'flooded');assert.equal(d.ambient,18);assert.equal(d.terrain.length,4);assert.equal(d.name,'Campaign map');const copy=validateDocument(JSON.stringify(d));switchMapState(copy,'base');assert.equal(copy.ambient,original);});
test('state deletion, last-state protection and malformed snapshots are validated',()=>{const d=createDocument();assert.throws(()=>deleteMapState(d,'base'));duplicateMapState(d,'Night','night');deleteMapState(d,'night');assert.equal(d.activeStateId,'base');assert.equal(d.states.length,1);duplicateMapState(d,'Rain','rain');d.states[0].scene.states=[];assert.throws(()=>validateDocument(d));});
test('textured partial erasers, atmosphere and alpha references round-trip',()=>{const d=createDocument();d.atmosphere.push({material:'fog',points:[{x:90,y:100}],size:200,alpha:'cloud',opacity:35,spacing:25,scatter:15,angle:50,jitter:70,order:nextPaintOrder(d)});d.erasers.push({target:'atmosphere',points:[{x:100,y:100}],size:70,alpha:'speckle',opacity:80,order:nextPaintOrder(d)});assert.deepEqual(validateDocument(d),d);d.erasers[0].alpha='unknown';assert.throws(()=>validateDocument(d));});
test('grading, spot lights, and named alpha assets enforce bounds',()=>{const d=createDocument();d.grading.vibrance=145;d.lights.push({x:100,y:100,type:'spotlight',radius:800,intensity:160,color:'#0a84ff',angle:90,cone:65,bloom:20,falloff:80,shadows:true});assert.deepEqual(validateDocument(d),d);d.lights.at(-1).color='red';assert.throws(()=>validateDocument(d));d.lights.at(-1).color='#0a84ff';d.grading.exposure=201;assert.throws(()=>validateDocument(d));});

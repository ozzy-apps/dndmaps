import {MATERIALS} from './materials.js';
export {MATERIALS, ASSET_COUNT} from './materials.js';
export const WORLD = {width: 1536, height: 1280};
export const TOOLS = ['wall', 'floor', 'room', 'terrain', 'atmosphere', 'object', 'light', 'marker', 'erase', 'hand'];
export function snapPoint(point, size, enabled = true) {
  return enabled ? {x: Math.round(point.x / size) * size, y: Math.round(point.y / size) * size} : {...point};
}
export function constrainedEnd(start, point) {
  const dx = point.x-start.x, dy = point.y-start.y;
  const angle = Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);
  const distance = Math.hypot(dx,dy);
  return {x: start.x+Math.cos(angle)*distance, y:start.y+Math.sin(angle)*distance};
}
export function segmentDistance(p, a, b) {
  const dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export function createDocument(blank=false) {
  const doc = {version:3,name: blank ? 'Untitled map' : 'The Hollow Sanctum',width:WORLD.width,height:WORLD.height,grid:64,feet:5,gridVisible:true,snap:true,ambient:62,fog:40,theme:'torchlit',rooms:[],walls:[],floors:[],terrain:[],objects:[],lights:[],markers:[],atmosphere:[],erasers:[],paintSequence:1,grading:{exposure:0,vibrance:100,saturation:100,contrast:100,shadows:0,temperature:0,vignette:35},alphaAssets:[],activeStateId:'base',states:[{id:'base',name:'Base map',scene:null}],visibility:{floor:true,terrain:true,walls:true,objects:true,lighting:true,markers:true,atmosphere:true}};
  if(blank) return doc;
  // All geometry is editable. The starter dungeon uses a 64 px tactical grid.
  doc.rooms=[
    {x:448,y:448,w:640,h:448,material:'flagstone'},
    {x:576,y:128,w:384,h:256,material:'marble'},
    {x:704,y:384,w:128,h:64,material:'flagstone'},
    {x:128,y:512,w:256,h:320,material:'cobble'},
    {x:384,y:640,w:64,h:128,material:'flagstone'},
    {x:1152,y:448,w:256,h:384,material:'wood'},
    {x:1088,y:576,w:64,h:128,material:'flagstone'},
    {x:640,y:960,w:256,h:192,material:'flagstone'},
    {x:704,y:896,w:128,h:64,material:'flagstone'},
  ];
  const wall=(ax,ay,bx,by)=>doc.walls.push({a:{x:ax,y:ay},b:{x:bx,y:by},material:'stone',width:20});
  [ [448,448,704,448],[832,448,1088,448],[1088,448,1088,576],[1088,704,1088,896],[448,896,704,896],[832,896,1088,896],[448,448,448,640],[448,768,448,896],
    [576,128,960,128],[576,128,576,384],[960,128,960,384],[576,384,704,384],[832,384,960,384],[704,384,704,448],[832,384,832,448],
    [128,512,384,512],[128,512,128,832],[128,832,384,832],[384,512,384,640],[384,768,384,832],[384,640,448,640],[384,768,448,768],
    [1152,448,1408,448],[1408,448,1408,832],[1152,832,1408,832],[1152,448,1152,576],[1152,704,1152,832],[1088,576,1152,576],[1088,704,1152,704],
    [640,960,704,960],[832,960,896,960],[640,960,640,1152],[896,960,896,1152],[640,1152,896,1152],[704,896,704,960],[832,896,832,960]
  ].forEach(s=>wall(...s));
  const obj=(type,x,y,rotation=0,scale=1)=>doc.objects.push({type,x,y,rotation,scale});
  [[510,512],[1024,512],[510,832],[1024,832]].forEach(([x,y])=>obj('pillar',x,y));
  obj('rug',768,672,0,1.6);
  obj('table',768,666,90,1.15);
  obj('brazier',640,512);obj('brazier',896,512);
  obj('sarcophagus',768,238,0,1.3);
  obj('pillar',624,176);obj('pillar',912,176);
  obj('bones',856,322);obj('bones',560,760);
  obj('bookshelf',1200,485,0,1.15);obj('bookshelf',1320,485,0,1.15);
  obj('bookshelf',1364,600,90,1.15);obj('bookshelf',1364,728,90,1.15);
  obj('table',1242,660,0,.8);obj('rug',1260,744,0,.65);
  obj('barrel',1185,792);obj('barrel',1230,797);obj('chest',1320,795);
  obj('sarcophagus',180,580,90,.8);obj('sarcophagus',180,767,90,.8);
  obj('bones',313,783);obj('brazier',324,552);
  obj('crate',686,1005);obj('crate',681,1063);obj('barrel',855,1095);obj('barrel',853,1048);
  doc.terrain=[{material:'water',points:[{x:265,y:643},{x:280,y:700},{x:250,y:739},{x:307,y:711}],size:72},
    {material:'moss',points:[{x:470,y:840},{x:500,y:870},{x:620,y:870}],size:32},
    {material:'moss',points:[{x:890,y:350},{x:920,y:320}],size:28}];
  [[615,330],[920,330],[475,610],[1060,775],[660,873],[855,980],[1320,520],[320,560],[640,512],[896,512]].forEach(([x,y])=>doc.lights.push({x,y,type:'torch',radius:150,intensity:85}));
  doc.lights.push({x:275,y:688,type:'arcane',radius:180,intensity:75});
  return doc;
}
export class History {
  constructor(doc) { this.doc=doc; this.past=[]; this.future=[]; }
  recordSnapshot(snapshot){this.past.push(snapshot);let bytes=this.past.reduce((sum,s)=>sum+s.length*2,0);while(this.past.length>1&&(this.past.length>60||bytes>32*1024*1024))bytes-=this.past.shift().length*2;this.future=[];}
  checkpoint(){this.recordSnapshot(JSON.stringify(this.doc));}
  undo() {if(!this.past.length)return false;this.future.push(JSON.stringify(this.doc));this.doc=JSON.parse(this.past.pop());return true;}
  redo() {if(!this.future.length)return false;this.past.push(JSON.stringify(this.doc));this.doc=JSON.parse(this.future.pop());return true;}
}
export function roomBoundary(room) {
  const {x,y,w,h,shape='rectangle'}=room;
  if(shape==='rectangle')return [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
  const count=shape==='cavern'?24:40,points=[];
  for(let i=0;i<count;i++){
    const angle=i/count*Math.PI*2;
    const radius=shape==='cavern'?.86+.07*Math.sin(i*2.3+x*.03)+.06*Math.cos(i*1.7+y*.02):1;
    points.push({x:x+w/2+Math.cos(angle)*w/2*radius,y:y+h/2+Math.sin(angle)*h/2*radius});
  }
  return points;
}
export function pointInRoom(p,room) {
  if(p.x<room.x||p.x>room.x+room.w||p.y<room.y||p.y>room.y+room.h)return false;
  const pts=roomBoundary(room);let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const a=pts[i],b=pts[j];
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function resampleStroke(points,spacing) {
  if(!points.length)return [];
  const output=[{...points[0]}];let remaining=spacing;
  for(let i=1;i<points.length;i++){
    let a={...points[i-1]},b=points[i],distance=Math.hypot(b.x-a.x,b.y-a.y);
    while(distance>=remaining&&distance>0){const t=remaining/distance;a={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};output.push({...a});distance=Math.hypot(b.x-a.x,b.y-a.y);remaining=spacing;}
    remaining-=distance;
  }
  const last=points.at(-1);if(Math.hypot(last.x-output.at(-1).x,last.y-output.at(-1).y)>1)output.push({...last});
  return output;
}
export function createOutdoorDocument() {
  const d=createDocument(true);d.name='Briarwood Crossing';d.ambient=92;d.fog=40;d.theme='daylight';
  const field=[];for(let y=80;y<=1280;y+=180){if(Math.round(y/180)%2)for(let x=0;x<=1536;x+=100)field.push({x,y});else for(let x=1536;x>=0;x-=100)field.push({x,y});}
  d.terrain.push({material:'grass',points:field,size:180,opacity:100,softness:35,noise:65,density:75});
  d.terrain.push({material:'leaves',points:[{x:150,y:220},{x:250,y:300},{x:190,y:450},{x:300,y:520}],size:130,opacity:90,softness:70,noise:75,density:70});
  d.terrain.push({material:'dirt',points:resampleStroke([{x:100,y:1150},{x:450,y:900},{x:830,y:790},{x:1130,y:520},{x:1440,y:220}],22),size:85,opacity:90,softness:70,noise:55,density:70});
  d.terrain.push({material:'mud',points:resampleStroke([{x:490,y:905},{x:590,y:855},{x:730,y:830}],12),size:80,opacity:95,softness:65,noise:85,density:80});
  d.terrain.push({material:'water',points:resampleStroke([{x:110,y:90},{x:350,y:160},{x:600,y:210},{x:980,y:120},{x:1450,y:210}],20),size:92,opacity:100,softness:40,noise:35,density:80});
  d.rooms.push({id:'cottage',x:960,y:640,w:320,h:256,material:'parquet',shape:'rectangle'});
  const addBoundary=(room,material,width)=>{const points=roomBoundary(room);points.forEach((a,i)=>d.walls.push({a,b:points[(i+1)%points.length],material,width,roomId:room.id}));};
  addBoundary(d.rooms[0],'timber',20);
  d.walls.splice(2,1,{a:{x:1280,y:896},b:{x:1152,y:896},width:20,material:'timber',roomId:'cottage'},{a:{x:1088,y:896},b:{x:960,y:896},width:20,material:'timber',roomId:'cottage'});
  d.rooms.push({id:'ruin',x:290,y:340,w:384,h:320,material:'carved',shape:'ellipse'});addBoundary(d.rooms[1],'ruined',18);
  // Entry gaps are editable, independent wall segments.
  d.walls=d.walls.filter((wall,i)=>wall.roomId!=='ruin'||![7,8,9].includes(i-5));
  [[160,790,430,790],[730,1050,1120,1050],[1120,1050,1250,960]].forEach(([ax,ay,bx,by])=>d.walls.push({a:{x:ax,y:ay},b:{x:bx,y:by},width:16,material:'drystone'}));
  const obj=(type,x,y,rotation=0,scale=1)=>d.objects.push({type,x,y,rotation,scale});
  obj('table',1110,760,90,.9);obj('bookshelf',1110,670,0,1.6);obj('chest',1230,850);obj('barrel',1005,850);obj('barrel',1045,850);obj('crate',1240,690);
  [[400,410],[560,410],[400,590],[560,590]].forEach(([x,y])=>obj('pillar',x,y,0,.85));obj('sarcophagus',475,500,0,.8);obj('bones',550,540);
  obj('brazier',780,990,0,1.4);obj('crate',670,1060);obj('barrel',700,1090);obj('bones',1200,440);
  d.lights.push({x:780,y:990,type:'ember',radius:200,intensity:85});
  d.terrain.forEach(stroke=>stroke.placement='under');
  d.markers=[{id:'m1',x:480,y:365,label:'Old shrine',number:1},{id:'m2',x:1110,y:605,label:'Ranger’s lodge',number:2},{id:'m3',x:610,y:950,label:'Muddy crossing',number:3}];
  return d;
}
export const MAP_LIMIT=4096;
export const ALPHA_TIPS=['round','soft','speckle','grunge','streaks','cloud','leaves'];
export const SCENE_KEYS=['width','height','grid','feet','gridVisible','snap','ambient','fog','theme','rooms','walls','floors','terrain','objects','lights','markers','atmosphere','erasers','paintSequence','grading','visibility'];
export function captureScene(d){return Object.fromEntries(SCENE_KEYS.map(k=>[k,structuredClone(d[k])]));}
export function switchMapState(d,id){
  if(id===d.activeStateId)return;
  const target=d.states.find(s=>s.id===id),current=d.states.find(s=>s.id===d.activeStateId);
  if(!target||!target.scene)throw new Error('Map state not found.');
  const next=structuredClone(target.scene);current.scene=captureScene(d);
  for(const key of SCENE_KEYS)d[key]=next[key];target.scene=null;d.activeStateId=id;
}
export function duplicateMapState(d,name,id){
  if(d.states.length>=12)throw new Error('A project supports up to 12 map states.');
  if(d.states.some(s=>s.id===id))throw new Error('Map state ID already exists.');
  const label=String(name).trim().slice(0,50);if(!label)throw new Error('Enter a state name.');
  d.states.find(s=>s.id===d.activeStateId).scene=captureScene(d);
  d.states.push({id,name:label,scene:null});d.activeStateId=id;
}
export function deleteMapState(d,id){
  if(d.states.length<=1)throw new Error('Keep at least one map state.');
  if(!d.states.some(s=>s.id===id))throw new Error('Map state not found.');
  if(d.activeStateId===id)switchMapState(d,d.states.find(s=>s.id!==id).id);
  d.states=d.states.filter(s=>s.id!==id);
}
export function resizeMap(d,width,height,scale=false){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<256||height<256||width>MAP_LIMIT||height>MAP_LIMIT)throw new Error('Map dimensions must be 256–4096 pixels.');
  if(scale){const sx=width/d.width,sy=height/d.height,factor=Math.sqrt(sx*sy);const point=p=>{p.x*=sx;p.y*=sy;};
    for(const r of d.rooms){point(r);r.w*=sx;r.h*=sy;}
    for(const w of d.walls){point(w.a);point(w.b);w.width=Math.max(4,Math.min(64,w.width*factor));}
    for(const key of ['terrain','floors','atmosphere','erasers'])for(const stroke of d[key]){stroke.points.forEach(point);stroke.size=Math.max(4,Math.min(512,stroke.size*factor));}
    for(const o of d.objects){point(o);o.scale=Math.max(.1,Math.min(5,o.scale*factor));}
    for(const l of d.lights){point(l);l.radius=Math.max(20,Math.min(1600,l.radius*factor));}
    d.markers.forEach(point);
  }
  d.width=width;d.height=height;
}
export function nextPaintOrder(d){return d.paintSequence++;}
export function validateDocument(input){
  const raw=typeof input==='string'?JSON.parse(input):input;
  const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  if(!raw||![1,2,3].includes(raw.version)||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>100)throw new Error('Unsupported Fable map.');
  const d=structuredClone(raw);
  if(d.version===1){d.floors=[];d.markers=[];if(d.visibility){d.visibility.terrain=true;d.visibility.markers=true;}}
  if(d.version<3){
    d.atmosphere=[];d.erasers=[];d.paintSequence=1;d.grading={exposure:0,vibrance:100,saturation:100,contrast:100,shadows:0,temperature:0,vignette:35};d.alphaAssets=[];d.activeStateId='base';d.states=[{id:'base',name:'Base map',scene:null}];
    if(d.visibility)d.visibility.atmosphere=true;
    for(const key of ['terrain','floors'])for(const stroke of d[key]||[])stroke.order=d.paintSequence++;
    d.version=3;
  }
  if(!Array.isArray(d.alphaAssets)||d.alphaAssets.length>12)throw new Error('Invalid alpha library.');
  const alphaIds=new Set(ALPHA_TIPS);
  for(const a of d.alphaAssets){if(!a||typeof a.id!=='string'||a.id.length>100||alphaIds.has(a.id)||typeof a.name!=='string'||a.name.length>60||typeof a.data!=='string'||a.data.length>500000||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(a.data))throw new Error('Invalid custom alpha.');const header=atob(a.data.slice(22,86));const integer=offset=>header.charCodeAt(offset)*16777216+header.charCodeAt(offset+1)*65536+header.charCodeAt(offset+2)*256+header.charCodeAt(offset+3);if(header.slice(1,4)!=='PNG'||!finite(integer(16),1,1024)||!finite(integer(20),1,1024))throw new Error('Invalid alpha image dimensions.');alphaIds.add(a.id);}
  const point=p=>p&&finite(p.x,-MAP_LIMIT*2,MAP_LIMIT*4)&&finite(p.y,-MAP_LIMIT*2,MAP_LIMIT*4);
  const material=(k,id)=>MATERIALS[k].some(m=>m.id===id);
  const optional=(v,min,max)=>v===undefined||finite(v,min,max);
  let pointsTotal=0;
  const scene=doc=>{
    if(!Number.isInteger(doc.width)||!Number.isInteger(doc.height)||!finite(doc.width,256,MAP_LIMIT)||!finite(doc.height,256,MAP_LIMIT))throw new Error('Invalid map dimensions.');
    for(const key of ['rooms','walls','floors','terrain','objects','lights','markers','atmosphere','erasers'])if(!Array.isArray(doc[key])||doc[key].length>10000)throw new Error('Invalid map geometry.');
    if(!finite(doc.grid,16,256)||!finite(doc.feet,1,30)||!finite(doc.ambient,0,100)||!finite(doc.fog,0,80)||!['torchlit','moonlit','daylight'].includes(doc.theme)||!Number.isInteger(doc.paintSequence)||!finite(doc.paintSequence,1,1e9))throw new Error('Invalid map settings.');
    if(!doc.visibility||['floor','terrain','walls','objects','lighting','markers','atmosphere'].some(k=>typeof doc.visibility[k]!=='boolean')||typeof doc.snap!=='boolean'||typeof doc.gridVisible!=='boolean')throw new Error('Invalid map visibility.');
    if(doc.rooms.some(r=>!point(r)||!finite(r.w,1,MAP_LIMIT*4)||!finite(r.h,1,MAP_LIMIT*4)||!material('room',r.material)||(r.shape!==undefined&&!['rectangle','ellipse','cavern'].includes(r.shape))))throw new Error('Invalid room.');
    if(doc.walls.some(w=>!point(w.a)||!point(w.b)||!finite(w.width,4,64)||!material('wall',w.material)))throw new Error('Invalid wall.');
    if(doc.objects.some(o=>!point(o)||!finite(o.rotation,-3600,3600)||!finite(o.scale,.1,5)||!material('object',o.type)))throw new Error('Invalid object.');
    const color=c=>c===undefined||/^#[0-9a-f]{6}$/i.test(c);
    if(doc.lights.some(l=>!point(l)||!finite(l.radius,20,1600)||!finite(l.intensity,0,200)||!material('light',l.type)||!color(l.color)||!optional(l.falloff,0,100)||!optional(l.bloom,0,100)||!optional(l.angle,0,360)||!optional(l.cone,10,360)||(l.shadows!==undefined&&typeof l.shadows!=='boolean')))throw new Error('Invalid light.');
    for(const [key,kind] of [['terrain','terrain'],['floors','floor'],['atmosphere','atmosphere'],['erasers',null]])for(const t of doc[key]){
      pointsTotal+=t.points?.length||0;
      if((kind&&!material(kind,t.material))||!finite(t.size,4,512)||!Array.isArray(t.points)||!t.points.length||t.points.length>20000||t.points.some(p=>!point(p))||!optional(t.opacity,1,100)||!optional(t.softness,0,100)||!optional(t.noise,0,100)||!optional(t.density,0,100)||!optional(t.spacing,5,100)||!optional(t.scatter,0,100)||!optional(t.angle,0,360)||!optional(t.jitter,0,100)||!optional(t.seed,0,2**32)||!optional(t.order,0,1e9)||(t.alpha!==undefined&&!alphaIds.has(t.alpha))||!color(t.color)||(t.placement!==undefined&&!['under','over'].includes(t.placement))||(t.shape!==undefined&&!['round','square'].includes(t.shape))||(key==='erasers'&&!['paint','terrain','floor','atmosphere'].includes(t.target)))throw new Error('Invalid brush stroke.');
    }
    const ids=new Set();
    if(doc.markers.some(m=>{if(typeof m.id!=='string'||m.id.length>100||ids.has(m.id))return true;ids.add(m.id);return !point(m)||typeof m.label!=='string'||m.label.length>60||!Number.isInteger(m.number)||!finite(m.number,1,9999);} ))throw new Error('Invalid map marker.');
    if(!doc.grading||Object.entries({exposure:[-200,200],vibrance:[0,200],saturation:[0,200],contrast:[0,200],shadows:[0,100],temperature:[-100,100],vignette:[0,100]}).some(([k,[min,max]])=>!finite(doc.grading[k],min,max)))throw new Error('Invalid color grading.');
  };
  scene(d);
  if(!Array.isArray(d.states)||!d.states.length||d.states.length>12||typeof d.activeStateId!=='string')throw new Error('Invalid map states.');
  const stateIds=new Set();let active=0;
  for(const state of d.states){if(!state||typeof state.id!=='string'||state.id.length>100||stateIds.has(state.id)||typeof state.name!=='string'||!state.name.trim()||state.name.length>50)throw new Error('Invalid map state.');stateIds.add(state.id);if(state.id===d.activeStateId){active++;if(state.scene!==null)throw new Error('Invalid active map state.');}else{if(!state.scene||typeof state.scene!=='object'||state.scene.states!==undefined)throw new Error('Invalid saved map state.');scene(state.scene);}}
  if(active!==1||pointsTotal>300000)throw new Error('Invalid or oversized project.');
  return d;
}

export function createStatesDocument(){
  const d=createOutdoorDocument();d.states[0].name='Daylight';
  duplicateMapState(d,'Nightfall','nightfall');d.ambient=22;d.fog=40;d.theme='moonlit';d.grading={exposure:8,vibrance:128,saturation:105,contrast:110,shadows:5,temperature:-12,vignette:45};
  d.lights.push({x:480,y:480,type:'faerie',radius:260,intensity:120,color:'#759bff',falloff:70,bloom:25,cone:360,angle:0,shadows:true});
  d.lights.push({x:1110,y:760,type:'lantern',radius:230,intensity:130,color:'#ffc17b',falloff:60,bloom:28,cone:360,angle:0,shadows:true});
  d.lights.push({x:1110,y:940,type:'torch',radius:200,intensity:105,color:'#ffae58',falloff:60,bloom:35,cone:360,angle:0,shadows:false});
  d.atmosphere.push({material:'mist',color:'#8baacb',points:resampleStroke([{x:80,y:340},{x:400,y:300},{x:800,y:350},{x:1300,y:320}],25),size:105,alpha:'cloud',opacity:45,softness:90,spacing:15,scatter:12,jitter:45,seed:591,order:nextPaintOrder(d)});
  d.atmosphere.push({material:'fog',color:'#adc1d9',points:resampleStroke([{x:200,y:1010},{x:600,y:950},{x:980,y:1060}],25),size:90,alpha:'cloud',opacity:28,softness:90,spacing:15,scatter:10,jitter:50,seed:235,order:nextPaintOrder(d)});
  return d;
}

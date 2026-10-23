import {WORLD,roomBoundary} from './model.js';
import {paintTerrain,paintedStroke,extraFloorTile,extraWall} from './procedural.js';
import {prepareAlphas} from './alphas.js';
import {drawLighting,drawLight,lightAtmosphere,gradeScene,LIGHT_COLORS} from './lighting.js';
import {paintAtmosphere,paintEraser} from './atmosphere.js';
export function seeded(seed=1) { return () => {seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;}; }
const TAU=Math.PI*2;
const groundCaches=new Map();let stoneGrain=null;
function getStoneGrain(c) {
  if(!stoneGrain){const tile=document.createElement('canvas');tile.width=128;tile.height=128;const tc=tile.getContext('2d'),data=tc.createImageData(128,128),r=seeded(471);for(let i=0;i<data.data.length;i+=4){const n=Math.floor(r()*255);data.data[i]=n;data.data[i+1]=n;data.data[i+2]=n*.86;data.data[i+3]=32+Math.floor(r()*30);}tc.putImageData(data,0,0);stoneGrain=tile;}
  return c.createPattern(stoneGrain,'repeat');
}
function polygon(c,points,fill,stroke) {c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function circle(c,x,y,r,fill,stroke) {c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function line(c,ax,ay,bx,by,color,width=1) {c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
const palettes={stone:['#777b64','#666d57','#858771','#6f745d','#8a8b73'],sandstone:['#b89d6e','#a88c5e','#c5ac7a','#9b865e'],brick:['#8c6551','#9e745b','#785d4b','#a07c60'],timber:['#725437','#8d6b43','#97754d','#6e5033'],ruined:['#626f54','#7d8265','#888a6d','#6a7356'],marble:['#64706c','#768079','#53645f','#7f8980'],basalt:['#394747','#495454','#344344','#59605a'],limestone:['#b7b397','#cec6a5','#aaa68a','#c0b99a'],redbrick:['#96503d','#b06346','#854b3c','#aa634b']};
export function floorTile(c,x,y,size=64,material='flagstone',seed=0) {
  if(extraFloorTile(c,x,y,size,material))return;
  const r=seeded(seed+Math.floor(x)*3+Math.floor(y)*877+11);
  if(material==='wood') {
    c.fillStyle='#292d22';c.fillRect(x,y,size,size);
    for(let i=0;i<4;i++){const py=y+i*size/4;c.fillStyle=['#6a573b','#625238','#776047','#594b35'][Math.floor(r()*4)];c.fillRect(x+1,py+1,size-2,size/4-2);line(c,x+2,py+2,x+size-2,py+2,'#b29a6833');for(let a=0;a<4;a++){const ly=py+4+r()*(size/4-7);line(c,x+4,ly,x+size-5,ly+(r()-.5)*2,'#251d162b',.7);}circle(c,x+4,py+size/8,1,'#302b20');circle(c,x+size-4,py+size/8,1,'#302b20');}
    return;
  }
  const tones=material==='marble'?['#6c7163','#727766','#626a5c','#7a7b67']:material==='cobble'?['#6c725b','#7a7b61','#686f56','#818167']:['#7d806a','#747962','#868872','#6e755d','#7b7e67'];
  c.fillStyle='#30372c';c.fillRect(x,y,size,size);
  const rows=material==='cobble'?3:2,cols=material==='cobble'?3:1;
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
    const px=x+j*size/cols,py=y+i*size/rows,w=size/cols,h=size/rows,b=1.4;
    const pts=[[px+b+2,py+b],[px+w-b-3,py+b+r()*1.8],[px+w-b,py+4],[px+w-b,py+h-b-3],[px+w-b-4,py+h-b],[px+b+2,py+h-b],[px+b,py+h-5],[px+b,py+4]];
    c.lineWidth=1;polygon(c,pts,tones[Math.floor(r()*tones.length)],'#333c2c');
    const weather=c.createLinearGradient(px,py,px+w*.6,py+h);weather.addColorStop(0,'#d9d3b21b');weather.addColorStop(.45,'#a6a48400');weather.addColorStop(1,'#14231d37');c.fillStyle=weather;c.fillRect(px+3,py+3,w-6,h-6);
    line(c,px+4,py+2,px+w-5,py+2,'#c5c4a132',1.2);line(c,px+w-2,py+4,px+w-2,py+h-3,'#1a221c66',1.5);
    for(let a=0;a<35;a++){c.fillStyle=r()>.5?'#d4d1ac18':'#171e1826';const d=r()*1.7+.4;c.fillRect(px+3+r()*(w-6),py+3+r()*(h-6),d,d);}
    if(r()>.62){const xx=px+w*(.25+r()*.5),yy=py+r()*h;line(c,xx,yy,xx+5,yy+6,'#323a2d70',.7);line(c,xx+5,yy+6,xx+3,yy+11,'#323a2d70',.7);}
  }
  c.save();c.globalCompositeOperation='soft-light';c.fillStyle=getStoneGrain(c);c.fillRect(x,y,size,size);c.restore();
  if(material==='marble'){c.strokeStyle='#aba98b30';c.lineWidth=1;c.beginPath();c.moveTo(x+size*.2,y+3);c.bezierCurveTo(x+size*.1,y+size*.4,x+size*.8,y+size*.6,x+size*.7,y+size-3);c.stroke();}
}
export function drawWall(c,wall,pass='all') {
  if(extraWall(c,wall,pass))return;
  const {a,b,material='stone',width=20}=wall,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  if(len<1)return;
  const angle=Math.atan2(dy,dx),r=seeded(Math.floor(a.x*13+a.y*7+b.x));
  c.save();c.translate(a.x,a.y);c.rotate(angle);
  c.lineCap='square';
  if(pass!=='surface'){line(c,1,10,len+1,10,'#0d171180',width+14);line(c,0,0,len,0,'#1b251c',width+12);line(c,0,0,len,0,'#434c38',width+5);}
  if(pass==='shadow'){c.restore();return;}
  const n=Math.max(1,Math.ceil(len/(material==='redbrick'?19:material==='basalt'?43:33))),bw=len/n,pal=palettes[material]||palettes.stone;
  for(let i=0;i<n;i++){
    const x=i*bw,half=width/2+1;
    polygon(c,[[x+.8,-half+2],[x+3,-half],[x+bw-3,-half],[x+bw-1,-half+2],[x+bw-1,half-1],[x+2,half]],pal[Math.floor(r()*pal.length)],'#283122');
    line(c,x+3,-half+2,x+bw-3,-half+2,'#dad4ac4a',1.5);
    line(c,x+bw-2,-half+4,x+bw-2,half-2,'#202c2190',2);
    for(let s=0;s<8;s++){c.fillStyle=r()>.5?'#e5dfaf16':'#17231922';c.fillRect(x+r()*bw,-half+r()*width,1+r()*2,1+r()*2);}
    if(material==='timber')for(let g=0;g<4;g++)line(c,x+3,-half+4+g*4,x+bw-3,-half+4+g*4,'#211d1744',.8);
    if(r()>.67){for(let m=0;m<5;m++)circle(c,x+r()*bw,-half-1+r()*5,1+r()*2,'#65714688');}
  }
  c.restore();
}
export function drawObject(c,o,thumb=false) {
  const {type,x,y,rotation=0,scale=1}=o;
  c.save();c.translate(x,y);c.rotate(rotation*Math.PI/180);c.scale(scale,scale);
  c.shadowColor='#0e1711bf';c.shadowBlur=8;c.shadowOffsetY=5;
  if(type==='rug') {
    c.fillStyle='#613e32';c.fillRect(-72,-106,144,212);c.shadowColor='transparent';c.strokeStyle='#a588515b';c.lineWidth=2;c.strokeRect(-66,-100,132,200);c.strokeRect(-61,-95,122,190);
    for(let i=-56;i<=56;i+=8){line(c,i,-110,i,-106,'#b99a6a99',1);line(c,i,106,i,110,'#b99a6a99',1);}
    polygon(c,[[0,-78],[46,0],[0,78],[-46,0]],'#8b6b3b33','#b5945755');polygon(c,[[0,-48],[28,0],[0,48],[-28,0]],null,'#b5945755');
    for(let i=-80;i<90;i+=6)line(c,-58,i,58,i,'#dbc0890d',.6);
  } else if(type==='barrel') {
    circle(c,0,0,21,'#392b1d','#211e17');c.shadowColor='transparent';circle(c,0,0,18,'#836342','#a18551');
    for(let i=-12;i<=12;i+=6)line(c,i,-Math.sqrt(300-i*i),i,Math.sqrt(300-i*i),'#3d30217a',1.5);
    c.lineWidth=3;circle(c,0,0,16,null,'#383d32');c.lineWidth=1;circle(c,0,0,13,null,'#b28c4a6b');circle(c,5,-4,2,'#423a29');
  } else if(type==='crate') {
    c.fillStyle='#735638';c.fillRect(-25,-25,50,50);c.shadowColor='transparent';c.strokeStyle='#392b1d';c.lineWidth=4;c.strokeRect(-24,-24,48,48);
    for(let i=-14;i<23;i+=8)line(c,i,-22,i,22,'#352c2099',2);
    c.lineWidth=5;line(c,-21,-21,21,21,'#aa8754',6);line(c,-21,21,21,-21,'#917447',6);c.strokeStyle='#bea06c';c.lineWidth=2;c.strokeRect(-21,-21,42,42);
    [[-19,-19],[-19,19],[19,-19],[19,19]].forEach(p=>circle(c,...p,1.5,'#332d22'));
  } else if(type==='table') {
    [[-53,-31],[-53,31],[53,-31],[53,31]].forEach(([sx,sy])=>{c.fillStyle='#3b3022';c.fillRect(sx-9,sy-11,18,22);c.fillStyle='#80613c';c.fillRect(sx-7,sy-9,14,18);line(c,sx-6,sy-7,sx+6,sy-7,'#b1915c',1);});
    c.fillStyle='#322a1e';c.fillRect(-42,-66,84,132);c.fillStyle='#79603d';c.fillRect(-38,-63,76,126);c.shadowColor='transparent';
    for(let i=-36;i<38;i+=15){c.fillStyle=['#806641','#8a6d46','#735c3c'][Math.abs(i)%3];c.fillRect(i,-60,14,120);line(c,i,-60,i,60,'#30291d90',1);for(let k=0;k<5;k++)line(c,i+3+k*2,-55,i+3+k*2+(k%2),54,'#b799661f',.5);}
    c.strokeStyle='#b3965c88';c.lineWidth=1;c.strokeRect(-37,-62,74,124);
    [[-21,-42],[22,-22],[-20,13],[22,42]].forEach(([px,py])=>{circle(c,px,py,8,'#a2a48b','#555f4b');circle(c,px,py,5,null,'#777e69');circle(c,px+11,py-5,3,'#55432b','#9f804c');});
    c.save();c.rotate(-.2);c.fillStyle='#bdad7a';c.fillRect(-7,-15,20,26);line(c,-4,-10,9,-10,'#6e624050');line(c,-4,-5,9,-5,'#6e624050');c.restore();
  } else if(type==='sarcophagus') {
    const shape=[[-26,-57],[26,-57],[33,-39],[27,55],[-27,55],[-33,-39]];
    polygon(c,shape,'#404b40','#1c2b23');c.shadowColor='transparent';c.lineWidth=3;polygon(c,[[-23,-52],[23,-52],[28,-36],[23,49],[-23,49],[-28,-36]],'#8c8d77','#b6b295');
    c.lineWidth=2;polygon(c,[[-17,-45],[17,-45],[21,-33],[17,42],[-17,42],[-21,-33]],'#747d68','#525f4e');
    circle(c,0,-23,9,'#90937a','#58634f');polygon(c,[[-7,-11],[7,-11],[12,22],[5,34],[-5,34],[-12,22]],'#8e9178','#535f4d');line(c,-13,4,13,4,'#b4af8899',3);line(c,0,-4,0,30,'#b4af8899',3);
    line(c,-24,-46,24,-46,'#d4c9a16b',2);
  } else if(type==='bookshelf') {
    c.fillStyle='#302a20';c.fillRect(-49,-19,98,38);c.fillStyle='#695136';c.fillRect(-46,-16,92,32);c.shadowColor='transparent';
    const r=seeded(72);for(let xx=-42;xx<43;){const w=3+r()*5;c.fillStyle=['#596047','#8e7950','#784a3d','#55696a','#ada282','#8f6543'][Math.floor(r()*6)];const hh=18+r()*8;c.fillRect(xx,-hh/2,w-1,hh);line(c,xx+1,-hh/2+3,xx+w-2,-hh/2+3,'#e1c38e65',1);xx+=w;}
    c.lineWidth=3;c.strokeStyle='#8b714b';c.strokeRect(-46,-16,92,32);line(c,-46,17,46,17,'#211e17',3);
  } else if(type==='pillar') {
    c.fillStyle='#404a3b';c.fillRect(-26,-26,52,52);c.shadowColor='transparent';c.strokeStyle='#9c9e7f';c.lineWidth=1;c.strokeRect(-24,-24,48,48);c.fillStyle='#7b826b';c.fillRect(-20,-20,40,40);circle(c,0,0,18,'#8c9177','#4a5947');c.lineWidth=3;circle(c,0,0,13,null,'#63745b');line(c,-17,-17,17,-17,'#b0b098',2);line(c,-17,-16,-17,17,'#a2a88b',1.5);
  } else if(type==='bones') {
    c.shadowBlur=3;c.shadowOffsetY=2;const r=seeded(97);for(let i=0;i<9;i++){c.save();c.translate((r()-.5)*50,(r()-.5)*40);c.rotate(r()*TAU);line(c,-7,0,7,0,'#b8b494',2.5);circle(c,-7,0,2,'#a3a88b');circle(c,7,0,2,'#b8b494');c.restore();}circle(c,9,-9,7,'#bfc0a0','#777e64');circle(c,7,-11,1.6,'#424d3a');circle(c,12,-11,1.6,'#424d3a');line(c,6,-3,12,-3,'#4c553e');
  } else if(type==='brazier') {
    circle(c,0,0,19,'#4f5441','#262f24');c.shadowColor='transparent';circle(c,0,0,14,'#2e3425','#9c8353');circle(c,0,0,10,'#bd6f27');circle(c,-2,-2,7,'#e6a43e');for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);line(c,-15,0,15,0,'#4b4b32',3);c.restore();}circle(c,0,0,3,'#f9d781');
  } else if(type==='chest') {
    c.fillStyle='#493720';c.fillRect(-27,-17,54,34);c.shadowColor='transparent';c.fillStyle='#8a6236';c.fillRect(-25,-15,50,30);line(c,-24,-13,24,-13,'#bb9451',2);[-17,17].forEach(xx=>{c.fillStyle='#ad9558';c.fillRect(xx-2,-15,4,30);});line(c,-24,5,24,5,'#342d20',2);c.fillStyle='#c4b073';c.fillRect(-4,1,8,8);circle(c,0,4,1,'#342d20');
  }
  c.restore();
}
function drawGround(c,world=WORLD) {
  const key=world.width+'x'+world.height;if(groundCaches.has(key)){c.drawImage(groundCaches.get(key),0,0);return;}
  const r=seeded(809),{width:w,height:h}=world;
  c.fillStyle='#343b2d';c.fillRect(0,0,w,h);
  for(let i=0;i<800;i++){const x=r()*w,y=r()*h,rad=15+r()*70;const patch=c.createRadialGradient(x,y,0,x,y,rad);patch.addColorStop(0,['#71874c1f','#152c1b40','#87744e22','#5366402f'][Math.floor(r()*4)]);patch.addColorStop(1,'#47592b00');c.fillStyle=patch;c.fillRect(x-rad,y-rad,rad*2,rad*2);}
  for(let i=0;i<20000;i++){c.globalAlpha=.15+r()*.2;const x=r()*w,y=r()*h;c.fillStyle=['#79815c','#1b2c1e','#a4966a','#5b7241'][Math.floor(r()*4)];c.fillRect(x,y,.5+r()*2,.5+r()*2);}
  c.globalAlpha=1;
  for(let i=0;i<850;i++){const x=r()*w,y=r()*h,rr=2+r()*9;c.save();c.translate(x,y);c.rotate(r()*6);c.lineWidth=1;polygon(c,[[-rr,-rr*.5],[-rr*.3,-rr],[rr*.7,-rr*.6],[rr,rr*.2],[rr*.4,rr*.7],[-rr*.6,rr*.6]],['#616950','#535e45','#6d7256','#47573d'][Math.floor(r()*4)],'#1b2a1c88');line(c,-rr*.7,-rr*.4,rr*.5,-rr*.5,'#a7aa7b35');c.restore();}
  // Tangled roots and low foliage outside the built footprint.
  for(let i=0;i<75;i++){const x=r()*w,y=r()*h;c.strokeStyle='#232e20';c.lineWidth=1+r()*4;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+30,y-10,x-20,y+40,x+50,y+65);c.stroke();for(let l=0;l<10;l++){const xx=x+r()*60,yy=y+r()*70;c.save();c.translate(xx,yy);c.rotate(r()*6);c.fillStyle=['#576b3e','#667b46','#425c36','#78834b'][Math.floor(r()*4)];c.beginPath();c.ellipse(0,0,3+r()*4,1.5+r()*2,0,0,TAU);c.fill();c.restore();}}
  const groundCache=document.createElement('canvas');groundCache.width=w;groundCache.height=h;groundCache.getContext('2d').drawImage(c.canvas,0,0);groundCaches.set(key,groundCache);if(groundCaches.size>2)groundCaches.delete(groundCaches.keys().next().value);
}
function drawRoom(c,room) {
  c.save();c.shadowColor='#0b1710';c.shadowBlur=20;c.fillStyle='#1d2a1e';traceRoom(c,room);c.fill();c.shadowColor='transparent';
  traceRoom(c,room);c.clip();
  for(let y=Math.floor(room.y/64)*64;y<room.y+room.h;y+=64)for(let x=Math.floor(room.x/64)*64;x<room.x+room.w;x+=64)floorTile(c,x,y,64,room.material);
  // Scattered debris, weathering, and mineral stains.
  const r=seeded(room.x+room.y*7);
  for(let i=0;i<room.w*room.h/1300;i++){const x=room.x+r()*room.w,y=room.y+r()*room.h;circle(c,x,y,.5+r()*2,'#2d39257a');if(r()>.7){line(c,x,y,x+5,y+1,'#aaa98744',1);}}
  // Splinters of stone and creeping moss gather near corners rather than in walking paths.
  for(let corner=0;corner<4;corner++){const xx=corner%2?room.x+room.w:room.x,yy=corner>1?room.y+room.h:room.y,signX=corner%2?-1:1,signY=corner>1?-1:1;
    for(let i=0;i<25;i++){const x=xx+signX*(8+r()*55),y=yy+signY*(8+r()*55),rr=1+r()*3;c.lineWidth=.6;polygon(c,[[x-rr,y-rr*.5],[x+rr*.4,y-rr],[x+rr,y+rr*.3],[x-rr*.2,y+rr]],['#9b9e7b','#4d5e40','#798367'][Math.floor(r()*3)],'#33432b66');}
    for(let i=0;i<16;i++){const x=xx+signX*(3+r()*45),y=yy+signY*(3+r()*45);circle(c,x,y,1+r()*3,'#61783a55');}
  }
  const gradient=c.createLinearGradient(room.x,room.y,room.x,room.y+room.h);gradient.addColorStop(0,'#13231766');gradient.addColorStop(.09,'#13231700');gradient.addColorStop(.90,'#0f201500');gradient.addColorStop(1,'#12221866');c.fillStyle=gradient;c.fillRect(room.x,room.y,room.w,room.h);
  c.restore();
}
export const drawTerrain=paintTerrain;
const floorTextures=new Map();
function floorTexture(material){if(floorTextures.has(material))return floorTextures.get(material);const tile=document.createElement('canvas');tile.width=tile.height=128;const ctx=tile.getContext('2d');for(let y=0;y<128;y+=64)for(let x=0;x<128;x+=64)floorTile(ctx,x,y,64,material);floorTextures.set(material,tile);return tile;}
function drawFloorStroke(c,stroke,world=WORLD){const painted=paintedStroke(stroke,floorTexture(stroke.material),'floor',world);c.save();c.globalAlpha=(stroke.opacity??100)/100;c.drawImage(painted.canvas,painted.left,painted.top);c.restore();}
function traceRoom(c,room){const points=roomBoundary(room);c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
export function drawMarkers(c,markers,mode='named',zoom=1){c.save();for(const m of markers){const radius=13/Math.sqrt(zoom),y=m.y;c.shadowColor='#0a1d1699';c.shadowBlur=5;c.fillStyle='#e5dbad';c.strokeStyle='#3d5038';c.lineWidth=1.5/zoom;circle(c,m.x,y,radius,'#e5dbad','#3d5038');c.shadowColor='transparent';c.font=`600 ${11/Math.sqrt(zoom)}px Inter`;c.fillStyle='#304c39';c.textAlign='center';c.textBaseline='middle';c.fillText(String(m.number),m.x,y+.5);if(mode==='named'&&m.label){c.font=`${10/Math.sqrt(zoom)}px Inter`;const tw=c.measureText(m.label).width+18/zoom;c.fillStyle='#23362dea';c.fillRect(m.x-tw/2,y+radius+5/zoom,tw,21/zoom);c.fillStyle='#f1eedb';c.fillText(m.label,m.x,y+radius+15.5/zoom);}}c.restore();}
const lightColors=Object.fromEntries(Object.entries(LIGHT_COLORS).map(([k,color])=>[k,[1,3,5].map(i=>parseInt(color.slice(i,i+2),16))]));
export class MapRenderer {
  constructor(canvas,viewport) {
    this.canvas=canvas;this.viewport=viewport;this.ctx=canvas.getContext('2d');this.scene=document.createElement('canvas');this.scene.width=WORLD.width;this.scene.height=WORLD.height;this.layer=document.createElement('canvas');
    this.zoom=1;this.pan={x:0,y:0};this.cursor=null;this.preview=null;this.lightingView=false;this.tool='wall';this.brushSize=20;this.dpr=window.devicePixelRatio||1;
    this.observer=new ResizeObserver(()=>{this.resize();if(!this.hasFit)this.fit();else this.draw();});this.observer.observe(viewport);
  }
  resize(){const {width,height}=this.viewport.getBoundingClientRect();this.width=width;this.height=height;this.canvas.width=Math.round(width*this.dpr);this.canvas.height=Math.round(height*this.dpr);}
  fit(){if(!this.width||!this.doc)return;this.zoom=Math.min((this.width-38)/this.doc.width,(this.height-80)/this.doc.height);this.pan={x:(this.width-this.doc.width*this.zoom)/2,y:(this.height-this.doc.height*this.zoom)/2-10};this.hasFit=true;this.draw();this.onZoom?.();}
  setZoom(zoom,anchor={x:this.width/2,y:this.height/2}){const world=this.toWorld(anchor);this.zoom=Math.max(.06,Math.min(4,zoom));this.pan={x:anchor.x-world.x*this.zoom,y:anchor.y-world.y*this.zoom};this.draw();this.onZoom?.();}
  toWorld(p){return {x:(p.x-this.pan.x)/this.zoom,y:(p.y-this.pan.y)/this.zoom};}
  rebuild(doc){
    this.doc=doc;prepareAlphas(doc.alphaAssets,()=>{if(this.doc===doc)this.rebuild(doc);});
    if(this.scene.width!==doc.width||this.scene.height!==doc.height){this.scene.width=doc.width;this.scene.height=doc.height;}
    if(this.layer.width!==doc.width||this.layer.height!==doc.height){this.layer.width=doc.width;this.layer.height=doc.height;}const c=this.scene.getContext('2d');c.clearRect(0,0,doc.width,doc.height);drawGround(c,doc);
    const layer=(strokes,target,paint,base=null,finish=null)=>{if(!base&&!strokes.length)return;const lc=this.layer.getContext('2d');lc.clearRect(0,0,doc.width,doc.height);if(base)base(lc);const ops=[...strokes.map(s=>({s,erase:false})),...doc.erasers.filter(s=>s.target==='paint'||s.target===target).map(s=>({s,erase:true}))].sort((a,b)=>(a.s.order??0)-(b.s.order??0));for(const op of ops)op.erase?paintEraser(lc,op.s,doc):paint(lc,op.s,doc);if(finish)finish(lc);c.drawImage(this.layer,0,0);};
    if(doc.visibility.terrain)layer(doc.terrain.filter(s=>s.placement==='under'),'terrain',drawTerrain);
    if(doc.visibility.floor)layer(doc.floors,'floor',drawFloorStroke,lc=>doc.rooms.forEach(r=>drawRoom(lc,r)));
    if(doc.visibility.terrain)layer(doc.terrain.filter(s=>s.placement!=='under'),'terrain',drawTerrain);
    if(doc.visibility.objects)doc.objects.filter(o=>o.type==='rug').forEach(o=>drawObject(c,o));
    if(doc.visibility.walls){doc.walls.forEach(w=>drawWall(c,w,'shadow'));doc.walls.forEach(w=>drawWall(c,w,'surface'));}
    if(doc.visibility.objects)doc.objects.filter(o=>o.type!=='rug').forEach(o=>drawObject(c,o));
    if(doc.visibility.lighting)drawLighting(c,doc);
    if(doc.visibility.atmosphere)layer(doc.atmosphere,'atmosphere',paintAtmosphere,null,lc=>lightAtmosphere(lc,doc));
    gradeScene(c,doc);this.draw();
  }
  drawGrid(c,grid,alpha=.14){c.save();c.lineWidth=.6/this.zoom;c.strokeStyle=`rgba(205,212,223,${alpha})`;c.beginPath();for(let x=0;x<=this.doc.width;x+=grid){c.moveTo(x,0);c.lineTo(x,this.doc.height);}for(let y=0;y<=this.doc.height;y+=grid){c.moveTo(0,y);c.lineTo(this.doc.width,y);}c.stroke();c.restore();}
  draw(){if(!this.doc||!this.width)return;const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);c.fillStyle='#202022';c.fillRect(0,0,this.width,this.height);
    // Dotted infinite workspace around the map.
    c.fillStyle='#bbbbc416';const space=24;for(let x=((this.pan.x%space)+space)%space;x<this.width;x+=space)for(let y=((this.pan.y%space)+space)%space;y<this.height;y+=space)c.fillRect(x,y,1,1);
    c.save();c.translate(this.pan.x,this.pan.y);c.scale(this.zoom,this.zoom);c.shadowColor='#0b140b88';c.shadowBlur=28;c.drawImage(this.scene,0,0);c.shadowColor='transparent';
    if(this.lightingView){c.save();c.fillStyle='#080a1280';c.fillRect(0,0,this.doc.width,this.doc.height);c.globalCompositeOperation='screen';this.doc.lights.forEach(l=>drawLight(c,l,this.doc,true));c.restore();this.doc.lights.forEach(l=>{c.lineWidth=1/this.zoom;circle(c,l.x,l.y,l.radius,null,'#69b8ff80');circle(c,l.x,l.y,6,l.color||LIGHT_COLORS[l.type],'#1a2634');});}
    if(this.doc.gridVisible)this.drawGrid(c,this.doc.grid);
    if(this.doc.visibility.markers)drawMarkers(c,this.doc.markers.map(m=>this.markerPreview?.id===m.id?{...m,x:this.markerPreview.x,y:this.markerPreview.y}:m),this.markerDisplay||'named',this.zoom);
    c.strokeStyle='#b0b5c033';c.lineWidth=1/this.zoom;c.strokeRect(0,0,this.doc.width,this.doc.height);
    if(this.preview){const p=this.preview;c.save();if(p.kind==='wall'){c.globalAlpha=.7;drawWall(c,p.wall);c.globalAlpha=1;line(c,p.wall.a.x,p.wall.a.y,p.wall.b.x,p.wall.b.y,'#66b0ff',2/this.zoom);[p.wall.a,p.wall.b].forEach(v=>circle(c,v.x,v.y,4/this.zoom,'#8cc5ff','#163759'));const len=Math.hypot(p.wall.b.x-p.wall.a.x,p.wall.b.y-p.wall.a.y)/this.doc.grid*this.doc.feet;c.font=`${10/this.zoom}px Inter`;c.textAlign='center';c.fillStyle='#eff8d9';c.fillText(`${Math.round(len)} ft`,(p.wall.a.x+p.wall.b.x)/2,(p.wall.a.y+p.wall.b.y)/2-16/this.zoom);}else if(p.kind==='room'){c.fillStyle='#0a84ff44';traceRoom(c,p);c.fill();c.strokeStyle='#81bdff';c.lineWidth=1.5/this.zoom;c.setLineDash([6/this.zoom,3/this.zoom]);traceRoom(c,p);c.stroke();}else if(p.kind==='terrain'){c.globalAlpha=.8;drawTerrain(c,p.stroke,this.doc);}else if(p.kind==='floor'){c.globalAlpha=.85;drawFloorStroke(c,p.stroke,this.doc);}else if(p.kind==='atmosphere'){paintAtmosphere(c,p.stroke,this.doc,true);}else if(p.kind==='erase'){c.globalAlpha=.35;const tip=paintedStroke(p.stroke,null,'erase',this.doc);c.drawImage(tip.canvas,tip.left,tip.top);}c.restore();}
    if(this.cursor&&this.cursor.x>=0&&this.cursor.y>=0&&this.cursor.x<=this.doc.width&&this.cursor.y<=this.doc.height){c.save();const {x,y}=this.cursor;c.strokeStyle='#91c6ffbb';c.lineWidth=1/this.zoom;if(this.tool==='object'&&this.objectType){c.globalAlpha=.65;drawObject(c,{type:this.objectType,x,y,rotation:this.rotation||0,scale:this.objectScale||1});}else if(this.tool==='terrain'||this.tool==='floor'||this.tool==='atmosphere'||this.tool==='erase'||this.tool==='light'){c.setLineDash([4/this.zoom,3/this.zoom]);if(this.tool==='floor'&&this.floorShape==='square')c.strokeRect(x-this.brushSize,y-this.brushSize,this.brushSize*2,this.brushSize*2);else circle(c,x,y,this.tool==='light'?this.brushSize:this.brushSize,null,this.tool==='erase'?'#edbca8bb':'#91c6ffbb');}else if(this.tool!=='hand'){line(c,x-9/this.zoom,y,x+9/this.zoom,y,'#91c6ffaa',1/this.zoom);line(c,x,y-9/this.zoom,x,y+9/this.zoom,'#91c6ffaa',1/this.zoom);circle(c,x,y,3/this.zoom,'#b8dcff');}c.restore();}
    c.restore();
  }
  export(scale=1,grid=true,markers='visible'){if(![1,2].includes(scale)||this.doc.width*this.doc.height*scale*scale>33554432)throw new Error('Choose 1× resolution for maps above 8 megapixels.');const out=document.createElement('canvas');out.width=this.doc.width*scale;out.height=this.doc.height*scale;const c=out.getContext('2d');c.scale(scale,scale);c.drawImage(this.scene,0,0);if(grid){const z=this.zoom;this.zoom=1;this.drawGrid(c,this.doc.grid,.16);this.zoom=z;}if(markers!=='none'&&(markers!=='visible'||this.doc.visibility.markers))drawMarkers(c,this.doc.markers,markers==='visible'?(this.markerDisplay||'named'):markers,1);return out.toDataURL('image/png');}
}
export function renderThumbnail(canvas,tool,id){const c=canvas.getContext('2d');const w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.save();c.scale(w/120,h/100);
  c.fillStyle='#dfe3d5';c.fillRect(0,0,120,100);
  if(tool==='wall'){
    for(let y=0;y<100;y+=32)for(let x=0;x<120;x+=64)floorTile(c,x,y,64,'flagstone',2);
    c.fillStyle='#21311b25';c.fillRect(0,0,120,100);drawWall(c,{a:{x:-12,y:72},b:{x:130,y:24},width:30,material:id});
  }else if(tool==='room'||tool==='floor'){for(let y=0;y<128;y+=64)for(let x=0;x<128;x+=64)floorTile(c,x,y,64,id,3);}
  else if(tool==='terrain'){c.fillStyle='#596548';c.fillRect(0,0,120,100);drawTerrain(c,{material:id,points:[{x:60,y:50}],size:70});}
  else if(tool==='atmosphere'){c.fillStyle='#25282e';c.fillRect(0,0,120,100);paintAtmosphere(c,{material:id,points:[{x:60,y:50}],size:65,opacity:100},WORLD);}
  else if(tool==='object'){c.fillStyle='#dfe3d5';c.fillRect(0,0,120,100);c.strokeStyle='#9fab8b22';c.lineWidth=.6;for(let i=0;i<120;i+=20){line(c,i,0,i,100,'#9fab8b22');line(c,0,i,120,i,'#9fab8b22');}const scales={rug:.35,table:.46,sarcophagus:.57,bookshelf:.76,bones:1.4};drawObject(c,{type:id,x:60,y:50,scale:scales[id]||1.15,rotation:id==='sarcophagus'?25:0},true);}
  else if(tool==='light'){c.fillStyle='#293a2c';c.fillRect(0,0,120,100);const col=lightColors[id]||lightColors.torch,g=c.createRadialGradient(60,50,0,60,50,48);g.addColorStop(0,`rgba(${col},.95)`);g.addColorStop(.2,`rgba(${col},.5)`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(0,0,120,100);circle(c,60,50,3,'#fff5d4');}
  c.restore();
}

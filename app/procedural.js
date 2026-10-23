import {WORLD,resampleStroke} from './model.js';
import {brushTip,alphaRevision} from './alphas.js';
export function seeded(seed=1){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};}
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function hash(x,y,seed){let h=Math.imul(x^seed,374761393)+Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function noise(x,y,scale,seed){const ix=Math.floor(x/scale),iy=Math.floor(y/scale),period=512/scale;let fx=x/scale-ix,fy=y/scale-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const a=hash(ix%period,iy%period,seed),b=hash((ix+1)%period,iy%period,seed),c=hash(ix%period,(iy+1)%period,seed),d=hash((ix+1)%period,(iy+1)%period,seed);return(a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;}
const terrainColors={grass:[[48,76,35],[106,128,57]],drygrass:[[102,91,46],[179,157,83]],mud:[[48,39,29],[112,88,57]],moss:[[36,62,29],[101,124,57]],water:[[18,54,57],[55,102,95]],dirt:[[76,57,37],[142,114,73]],gravel:[[73,80,72],[151,153,127]],swamp:[[30,56,39],[91,109,54]],sand:[[150,126,77],[213,191,133]],snow:[[150,175,183],[232,239,224]],ash:[[45,46,45],[112,110,98]],leaves:[[57,59,29],[142,114,45]]};
const textureCache=new Map();
export function terrainTexture(material,variation=65,density=65){
  const key=`${material}:${variation}:${density}`;if(textureCache.has(key))return textureCache.get(key);
  const out=document.createElement('canvas');out.width=out.height=512;const c=out.getContext('2d'),pixels=c.createImageData(512,512),colors=terrainColors[material]||terrainColors.dirt;
  const seed=[...material].reduce((a,ch)=>a*3+ch.charCodeAt(0),17)|0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const broad=noise(x,y,128,seed),medium=noise(x,y,32,seed+7),fine=noise(x,y,8,seed+31),grain=hash(x,y,seed+70);
    const n=clamp(.35+(broad-.5)*.8+(medium-.5)*.5+(fine-.5)*.3+(grain-.5)*.18);
    const i=(y*512+x)*4;for(let k=0;k<3;k++)pixels.data[i+k]=colors[0][k]+(colors[1][k]-colors[0][k])*n*1.4;
    pixels.data[i+3]=255*(1-variation/100*clamp((.46-broad)*2.1+(medium-.5)*.3));
  }
  c.putImageData(pixels,0,0);const r=seeded(seed),detail=Math.floor(450+density*22);
  const grassy=['grass','drygrass','moss','swamp'].includes(material),watery=['water','mud','swamp'].includes(material);
  if(grassy)for(let i=0;i<detail;i++){
    const x=r()*512,y=r()*512,len=(material==='moss'?2:4)+r()*7,angle=(r()-.5)*1.4;
    c.lineWidth=.5+r()*.8;c.strokeStyle=material==='drygrass'?['#d0bd6a77','#97834399','#e6cf8077'][i%3]:['#a6b26077','#476e3699','#90a751aa','#253f2399'][i%4];
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+angle*len*.25,y-len*.7,x+angle*len,y-len);c.stroke();
    if(i%5===0){c.fillStyle=material==='drygrass'?'#e3d89899':'#cfca6b88';c.fillRect(x,y-len,1.6,1.6);}
  }
  if(watery)for(let i=0;i<Math.floor(detail/16);i++){
    const x=r()*512,y=r()*512,rx=3+r()*(material==='water'?32:15),ry=rx*(.25+r()*.3);
    c.fillStyle=material==='water'?'#72a99a0d':material==='mud'?'#1a2f2a45':'#173f3244';c.beginPath();c.ellipse(x,y,rx,ry,r()*.4,0,Math.PI*2);c.fill();
    c.strokeStyle=material==='water'?'#9bc5ae44':'#a1aea03a';c.lineWidth=.6;c.beginPath();c.ellipse(x,y,rx*.85,ry*.85,0,Math.PI*1.05,Math.PI*1.9);c.stroke();
  }
  if(['gravel','ash','sand','snow','dirt','mud'].includes(material))for(let i=0;i<detail;i++){
    const x=r()*512,y=r()*512,rr=material==='gravel'?1+r()*4:r()*1.7+.3;
    c.fillStyle=material==='snow'?['#eff3e955','#587b8b25'][i%2]:['#dbce9c33','#17221d55','#e5d9b544'][i%3];c.beginPath();c.ellipse(x,y,rr,rr*.7,r()*6,0,Math.PI*2);c.fill();
    if(material==='gravel'){c.strokeStyle='#20291d55';c.lineWidth=.5;c.stroke();}
  }
  if(material==='sand')for(let y=0;y<512;y+=13){c.strokeStyle='#e9d7a82b';c.lineWidth=1;c.beginPath();for(let x=0;x<=512;x+=8){const yy=y+Math.sin(x/512*Math.PI*4+y)*4;x?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();}
  if(material==='leaves')for(let i=0;i<detail*.55;i++){
    const x=r()*512,y=r()*512,len=2+r()*7;c.save();c.translate(x,y);c.rotate(r()*6);c.fillStyle=['#a58e3da0','#786735bb','#b59b4b80','#526238aa','#96753daa'][i%5];c.beginPath();c.moveTo(-len,0);c.quadraticCurveTo(0,-len*.6,len,0);c.quadraticCurveTo(0,len*.6,-len,0);c.fill();c.strokeStyle='#443c1f99';c.lineWidth=.5;c.beginPath();c.moveTo(-len,0);c.lineTo(len,0);c.stroke();c.restore();
  }
  textureCache.set(key,out);if(textureCache.size>28)textureCache.delete(textureCache.keys().next().value);return out;
}
const strokeCache=new WeakMap();
export function paintedStroke(stroke,texture,kind='terrain',world=WORLD){
  const last=stroke.points.at(-1),signature=`${kind}:${stroke.material}:${stroke.size}:${stroke.points.length}:${last.x}:${last.y}:${stroke.opacity}:${stroke.softness}:${stroke.noise}:${stroke.density}:${stroke.shape}:${stroke.alpha}:${stroke.spacing}:${stroke.scatter}:${stroke.angle}:${stroke.jitter}:${stroke.seed}:${world.width}:${world.height}:${stroke.color}:${alphaRevision()}`;
  const cached=strokeCache.get(stroke);if(cached?.signature===signature)return cached;
  const rad=stroke.size,points=stroke.points,padding=rad*(1.5+(stroke.scatter??0)/100);
  const left=Math.max(0,Math.floor(Math.min(...points.map(p=>p.x))-padding-2)),top=Math.max(0,Math.floor(Math.min(...points.map(p=>p.y))-padding-2));
  const right=Math.min(world.width,Math.ceil(Math.max(...points.map(p=>p.x))+padding+2)),bottom=Math.min(world.height,Math.ceil(Math.max(...points.map(p=>p.y))+padding+2));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,right-left);canvas.height=Math.max(1,bottom-top);const c=canvas.getContext('2d');
  const stamps=resampleStroke(points,Math.max(2,rad*2*(stroke.spacing??8.5)/100)),tip=brushTip({...stroke,softness:stroke.softness??(kind==='floor'?0:65)}),r=seeded(stroke.seed??90);
  for(const p of stamps){const scatter=(stroke.scatter??0)/100*rad;c.save();c.translate(p.x-left+(r()-.5)*scatter*2,p.y-top+(r()-.5)*scatter*2);c.rotate(((stroke.angle??0)+(r()-.5)*(stroke.jitter??0)*3.6)*Math.PI/180);c.drawImage(tip,-rad,-rad,rad*2,rad*2);c.restore();}
  if(texture){c.globalCompositeOperation='source-in';c.save();c.translate(-left,-top);if(texture.worldSpace)c.drawImage(texture,0,0,world.width,world.height);else{c.fillStyle=c.createPattern(texture,'repeat');c.fillRect(left,top,canvas.width,canvas.height);}c.restore();}
  const result={canvas,left,top,signature};strokeCache.set(stroke,result);return result;
}
export function paintTerrain(c,stroke,world=WORLD){if(!stroke.points.length)return;const texture=terrainTexture(stroke.material,stroke.noise??55,stroke.density??65),painted=paintedStroke(stroke,texture,'terrain',world);c.save();c.globalAlpha=(stroke.opacity??100)/100;c.drawImage(painted.canvas,painted.left,painted.top);c.restore();}
export function extraFloorTile(c,x,y,size,material){
  if(!['slate','terracotta','parquet','brickfloor','carved','mosaic','earth','ice'].includes(material))return false;
  c.save();c.beginPath();c.rect(x,y,size,size);c.clip();c.fillStyle='#31372b';c.fillRect(x,y,size,size);
  const r=seeded(Math.floor(x*17+y*31));
  if(material==='earth'||material==='ice'){
    c.save();c.translate(x,y);c.fillStyle=c.createPattern(terrainTexture(material==='ice'?'snow':'dirt',20,45),'repeat');c.fillRect(0,0,size,size);c.restore();
    if(material==='ice'){c.fillStyle='#699ca466';c.fillRect(x,y,size,size);c.strokeStyle='#d9f0e188';c.lineWidth=.7;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+r()*size,y);c.lineTo(x+r()*size,y+size*.4);c.lineTo(x+r()*size,y+size);c.stroke();}}
  }else if(material==='parquet'){
    c.translate(x+size/2,y+size/2);c.rotate(Math.PI/4);const unit=size/6;
    const plank=(xx,yy,vertical)=>{const w=vertical?unit:unit*3,h=vertical?unit*3:unit;c.fillStyle=['#83623e','#967447','#765a37','#a17d4b'][Math.floor(r()*4)];c.fillRect(xx+.7,yy+.7,w-1.4,h-1.4);c.strokeStyle='#d7b37944';c.lineWidth=.6;c.strokeRect(xx+1.5,yy+1.5,w-3,h-3);c.strokeStyle='#251d1833';for(let g=3;g<unit;g+=3){c.beginPath();if(vertical){c.moveTo(xx+g,yy+2);c.lineTo(xx+g,yy+h-2);}else{c.moveTo(xx+2,yy+g);c.lineTo(xx+w-2,yy+g);}c.stroke();}};
    for(let row=-14;row<15;row++)for(let k=-5;k<6;k++)plank((row+k*6)*unit,row*unit,false);
    for(let col=-14;col<15;col++)for(let k=-5;k<6;k++)plank(col*unit,(col-5+k*6)*unit,true);
  }else if(material==='mosaic'){
    const n=8,b=size/n;
    for(let row=0;row<n;row++)for(let col=0;col<n;col++){const border=row===0||col===0||row===n-1||col===n-1,diamond=Math.abs(row-3.5)+Math.abs(col-3.5)<3;c.fillStyle=border?'#aa9b65':diamond?'#577d73':(row+col)%2?'#b2ae8b':'#9fa084';c.fillRect(x+col*b+1,y+row*b+1,b-1.5,b-1.5);}
  }else{
    const cols=material==='carved'?1:2,rows=material==='brickfloor'?4:2,bw=size/cols,bh=size/rows;
    const tones={slate:['#596b72','#617880','#6d7d83','#50626a'],terracotta:['#a66e4f','#b67e55','#935c44','#bf8b61'],brickfloor:['#8e6b50','#a47a56','#7c614a','#b08760'],carved:['#b2a073','#a69365','#bdad7d','#a89970']}[material];
    for(let row=0;row<rows;row++)for(let col=-1;col<cols+1;col++){
      const xx=x+col*bw+(row%2&&material==='brickfloor'?bw/2:0),yy=y+row*bh;c.fillStyle=tones[Math.floor(r()*tones.length)];c.fillRect(xx+1.5,yy+1.5,bw-3,bh-3);c.strokeStyle='#e6d6b033';c.lineWidth=.8;c.strokeRect(xx+3,yy+3,bw-6,bh-6);
      for(let i=0;i<20;i++){c.fillStyle=r()>.5?'#eee0b51a':'#17241d26';c.fillRect(xx+3+r()*(bw-6),yy+3+r()*(bh-6),.8+r(),.8+r());}
      if(material==='carved'){c.strokeStyle='#6c674355';c.lineWidth=1.1;c.strokeRect(xx+8,yy+7,bw-16,bh-14);c.beginPath();c.moveTo(xx+bw/2-7,yy+bh/2);c.lineTo(xx+bw/2,yy+bh/2-6);c.lineTo(xx+bw/2+7,yy+bh/2);c.lineTo(xx+bw/2,yy+bh/2+6);c.closePath();c.stroke();}
    }
  }
  c.restore();return true;
}
export function extraWall(c,wall,pass='all'){
  if(!['palisade','hedge','drystone'].includes(wall.material))return false;
  const {a,b,width}=wall,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1)return true;
  c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx));const r=seeded(Math.floor(a.x*3+a.y*11));
  if(pass!=='surface'){c.strokeStyle='#0c2015a0';c.lineWidth=width+12;c.beginPath();c.moveTo(0,7);c.lineTo(len,7);c.stroke();}
  if(pass==='shadow'){c.restore();return true;}
  const step=wall.material==='hedge'?10:wall.material==='palisade'?12:22;
  for(let xx=0;xx<=len;xx+=step){
    if(wall.material==='hedge'){for(let j=0;j<7;j++){const x=xx+(r()-.5)*16,y=(r()-.5)*width*1.8;c.fillStyle=['#314e29','#4d6e36','#70854a','#5c7a3d'][Math.floor(r()*4)];c.beginPath();c.ellipse(x,y,3+r()*6,2+r()*4,r()*6,0,Math.PI*2);c.fill();}}
    else if(wall.material==='palisade'){const rr=5+r()*2;c.fillStyle='#382a1b';c.beginPath();c.arc(xx,0,rr+1,0,Math.PI*2);c.fill();c.fillStyle=['#957242','#a2804b','#7b5f38'][Math.floor(r()*3)];c.beginPath();c.arc(xx,-1,rr,0,Math.PI*2);c.fill();c.strokeStyle='#c1a06a99';c.lineWidth=.7;c.beginPath();c.arc(xx,-1,rr*.55,0,Math.PI*2);c.stroke();c.strokeStyle='#30291d66';c.beginPath();c.moveTo(xx-rr*.5,-1);c.lineTo(xx+rr*.5,-1);c.stroke();}
    else for(let row=0;row<2;row++){const x=xx+row*10,y=(row-.5)*width*.55,w=9+r()*6,h=width*.3;c.beginPath();c.moveTo(x-w,y-h);c.lineTo(x+w*.5,y-h-2);c.lineTo(x+w,y+h*.3);c.lineTo(x+w*.5,y+h);c.lineTo(x-w*.8,y+h);c.closePath();c.fillStyle=['#7f8569','#96977b','#6b785d','#a5a185'][Math.floor(r()*4)];c.fill();c.strokeStyle='#33412c';c.lineWidth=1.3;c.stroke();}
  }
  c.restore();return true;
}

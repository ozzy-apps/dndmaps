export const LIGHT_COLORS={torch:'#ffae45',arcane:'#5bcdae',moon:'#8fb8ea',ember:'#ff6327',candle:'#ffcf87',lantern:'#ffbc64',spotlight:'#ddeaff',faerie:'#b78aff'};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function visibilityPolygon(light,walls){
  const {x,y,radius}=light,near=walls.filter(w=>Math.min(Math.hypot(w.a.x-x,w.a.y-y),Math.hypot(w.b.x-x,w.b.y-y))<radius*2.5).slice(0,650),angles=[];
  for(let i=0;i<64;i++)angles.push(i/64*Math.PI*2);
  for(const w of near)for(const p of [w.a,w.b]){const angle=Math.atan2(p.y-y,p.x-x);angles.push(angle-.0001,angle,angle+.0001);}
  const points=angles.map(a=>(a+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b).map(angle=>{const dx=Math.cos(angle),dy=Math.sin(angle);let distance=radius;
    for(const w of near){const sx=w.b.x-w.a.x,sy=w.b.y-w.a.y,denom=dx*sy-dy*sx;if(Math.abs(denom)<1e-8)continue;const ax=w.a.x-x,ay=w.a.y-y,t=(ax*sy-ay*sx)/denom,u=(ax*dy-ay*dx)/denom;if(t>.8&&t<distance&&u>=0&&u<=1)distance=t;}
    return {x:x+dx*distance,y:y+dy*distance};
  });return points;
}
export function drawLight(c,light,doc,debug=false){
  if((light.intensity??85)<=0)return;
  const {x,y,radius}=light,color=light.color||LIGHT_COLORS[light.type]||LIGHT_COLORS.torch,col=rgb(color),power=(light.intensity??85)/100,falloff=(light.falloff??55)/100;
  c.save();
  if(light.shadows&&doc.visibility.walls){const pts=visibilityPolygon(light,doc.walls);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();}
  if((light.cone??360)<360){const angle=(light.angle??0)*Math.PI/180,half=(light.cone??90)*Math.PI/360;c.beginPath();c.moveTo(x,y);c.arc(x,y,radius,angle-half,angle+half);c.closePath();c.clip();}
  const g=c.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,`rgba(${col},${Math.min(.95,power*.58)})`);g.addColorStop(.15+falloff*.55,`rgba(${col},${Math.min(.85,power*.23)})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(x-radius,y-radius,radius*2,radius*2);
  const bloom=(light.bloom??(['torch','ember','candle'].includes(light.type)?45:12))/100;
  if(bloom>0){const size=3+bloom*38,core=c.createRadialGradient(x,y,0,x,y,size);core.addColorStop(0,`rgba(255,245,225,${Math.min(1,power)})`);core.addColorStop(.15,`rgba(${col},${Math.min(.86,power*.86)})`);core.addColorStop(1,color+'00');c.fillStyle=core;c.fillRect(x-size,y-size,size*2,size*2);}
  c.restore();
}
function ambientShade(doc){
  const dark=(100-doc.ambient)/100*.88;
  return doc.theme==='moonlit'?`rgba(8,17,30,${Math.min(.96,dark+.04)})`:doc.theme==='daylight'?`rgba(15,21,22,${dark*.72})`:`rgba(10,12,17,${dark})`;
}
export function lightAtmosphere(c,doc){
  if(!doc.visibility?.lighting)return;
  // Source-atop changes fog color without adding opacity outside its painted mask.
  c.save();c.globalCompositeOperation='source-atop';c.fillStyle=ambientShade(doc);c.fillRect(0,0,doc.width,doc.height);
  doc.lights.forEach(l=>drawLight(c,l,doc));c.restore();
}
export function drawLighting(c,doc){
  c.fillStyle=ambientShade(doc);c.fillRect(0,0,doc.width,doc.height);
  c.save();c.globalCompositeOperation='screen';doc.lights.forEach(l=>drawLight(c,l,doc));c.restore();
}
export function gradeScene(c,doc){
  const g=doc.grading;if(!g)return;
  if(g.exposure!==0||g.vibrance!==100||g.saturation!==100||g.contrast!==100||g.shadows!==0||g.temperature!==0){
    const image=c.getImageData(0,0,doc.width,doc.height),p=image.data,gain=2**(g.exposure/100),contrast=g.contrast/100,saturation=g.saturation/100,vibrance=(g.vibrance-100)/100,warm=g.temperature/100,lift=g.shadows/100*.23;
    for(let i=0;i<p.length;i+=4){let r=p[i]/255,green=p[i+1]/255,b=p[i+2]/255;const lum=r*.2126+green*.7152+b*.0722,spread=Math.max(r,green,b)-Math.min(r,green,b),sat=saturation*(1+vibrance*(1-spread));r=lum+(r-lum)*sat;green=lum+(green-lum)*sat;b=lum+(b-lum)*sat;const shadow=lift*(1-lum)**2;r=(r*gain-.5)*contrast+.5+shadow+warm*.065;green=(green*gain-.5)*contrast+.5+shadow;b=(b*gain-.5)*contrast+.5+shadow-warm*.065;p[i]=Math.max(0,Math.min(255,r*255));p[i+1]=Math.max(0,Math.min(255,green*255));p[i+2]=Math.max(0,Math.min(255,b*255));}c.putImageData(image,0,0);
  }
  if(g.vignette>0){const rad=Math.hypot(doc.width,doc.height)/2,v=c.createRadialGradient(doc.width/2,doc.height/2,rad*.35,doc.width/2,doc.height/2,rad);v.addColorStop(0,'#080b1000');v.addColorStop(1,`rgba(8,11,16,${g.vignette/100*.8})`);c.fillStyle=v;c.fillRect(0,0,doc.width,doc.height);}
}

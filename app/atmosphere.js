import {WORLD} from './model.js';
import {paintedStroke,seeded} from './procedural.js';
import {atmosphereDensity,hazeOpacity} from './atmosphere-field.js';
import {lightAtmosphere} from './lighting.js';
const cache=new Map();
export const ATMOSPHERE_COLORS={fog:'#c7d7e8',mist:'#a9c3c8',smoke:'#716b70',darkness:'#080b14',rain:'#b5d4e7',snowfall:'#eef5ff',embers:'#ffa04d'};
export function atmosphereTexture(stroke,world=WORLD){
  const color=stroke.color||ATMOSPHERE_COLORS[stroke.material]||'#ccd7e8',density=stroke.density??65;
  const key=`${stroke.material}:${color}:${density}:${world.width}:${world.height}`;
  if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas'),particles=['rain','snowfall','embers'].includes(stroke.material);
  // Clouds are smooth fields sampled every four world pixels. Particles retain full resolution.
  canvas.width=particles?world.width:Math.ceil(world.width/4);
  canvas.height=particles?world.height:Math.ceil(world.height/4);
  canvas.worldSpace=true;
  const c=canvas.getContext('2d');
  if(particles){
    const r=seeded(351),count=Math.ceil((100+density*5)*world.width*world.height/(512*512));
    for(let i=0;i<count;i++){
      const x=r()*world.width,y=r()*world.height;c.globalAlpha=.2+r()*.75;c.fillStyle=color;c.strokeStyle=color;
      if(stroke.material==='rain'){c.lineWidth=.6+r();c.beginPath();c.moveTo(x,y);c.lineTo(x-3-r()*4,y+8+r()*16);c.stroke();}
      else{const rad=stroke.material==='embers'?1+r()*2:.6+r()*2.4;c.shadowColor=color;c.shadowBlur=stroke.material==='embers'?7:0;c.beginPath();c.arc(x,y,rad,0,Math.PI*2);c.fill();}
    }
  }else{
    const data=c.createImageData(canvas.width,canvas.height),rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      const i=(y*canvas.width+x)*4;
      data.data[i]=rgb[0];data.data[i+1]=rgb[1];data.data[i+2]=rgb[2];
      data.data[i+3]=Math.round(atmosphereDensity((x+.5)*world.width/canvas.width,(y+.5)*world.height/canvas.height,stroke.material,density)*255);
    }
    c.putImageData(data,0,0);
  }
  cache.set(key,canvas);if(cache.size>6)cache.delete(cache.keys().next().value);return canvas;
}
export function paintAtmosphere(c,stroke,world,illuminate=false){
  const opacity=hazeOpacity(stroke,world);if(opacity<=0)return;
  const painted=paintedStroke(stroke,atmosphereTexture(stroke,world),'atmosphere',world);
  c.save();
  if(illuminate&&world.visibility?.lighting){
    const canvas=document.createElement('canvas');canvas.width=painted.canvas.width;canvas.height=painted.canvas.height;
    const lc=canvas.getContext('2d');lc.globalAlpha=opacity;lc.drawImage(painted.canvas,0,0);lc.globalAlpha=1;
    lc.translate(-painted.left,-painted.top);lightAtmosphere(lc,world);
    c.drawImage(canvas,painted.left,painted.top);
  }else{c.globalAlpha=opacity;c.drawImage(painted.canvas,painted.left,painted.top);}
  c.restore();
}
export function paintEraser(c,stroke,world){const painted=paintedStroke(stroke,null,'erase',world);c.save();c.globalCompositeOperation='destination-out';c.globalAlpha=(stroke.opacity??100)/100;c.drawImage(painted.canvas,painted.left,painted.top);c.restore();}

import {ALPHA_TIPS} from './model.js';
let revision=0;
export const alphaRevision=()=>revision;
const baseCache=new Map(),tipCache=new Map(),customCache=new Map();
const random=(seed=91)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
export function prepareAlphas(assets,onReady){
  const pending=[];
  for(const asset of assets){const existing=customCache.get(asset.id);if(existing?.data===asset.data){if(!existing.canvas&&!existing.failed&&existing.promise){pending.push(existing.promise);if(onReady)existing.promise.then(onReady);}continue;}
    const entry={data:asset.data,canvas:null,promise:null};customCache.set(asset.id,entry);
    entry.promise=new Promise(resolve=>{const img=new Image();img.onload=()=>{if(img.width<=1024&&img.height<=1024){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;canvas.getContext('2d').drawImage(img,0,0,256,256);entry.canvas=canvas;revision++;tipCache.clear();}else entry.failed=true;resolve();onReady?.();};img.onerror=()=>{entry.failed=true;resolve();};img.src=asset.data;});pending.push(entry.promise);
  }
  return Promise.all(pending);
}
export function baseAlpha(id='round'){
  if(customCache.get(id)?.canvas)return customCache.get(id).canvas;
  if(baseCache.has(id))return baseCache.get(id);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d'),r=random(137),mid=128;
  c.fillStyle='#fff';
  if(id==='round'||id==='soft'||!ALPHA_TIPS.includes(id)){c.beginPath();c.arc(mid,mid,126,0,Math.PI*2);c.fill();}
  else if(id==='speckle'){for(let i=0;i<700;i++){const angle=r()*Math.PI*2,rr=Math.sqrt(r())*122;c.globalAlpha=.2+r()*.8;c.beginPath();c.arc(mid+Math.cos(angle)*rr,mid+Math.sin(angle)*rr,1+r()*4,0,Math.PI*2);c.fill();}}
  else if(id==='streaks'){for(let i=0;i<100;i++){const x=28+r()*200,y=16+r()*220;c.globalAlpha=.1+r()*.7;c.fillRect(x,y,1+r()*4,8+r()*55);}}
  else if(id==='leaves'){for(let i=0;i<95;i++){const angle=r()*Math.PI*2,rr=Math.sqrt(r())*115;c.save();c.translate(mid+Math.cos(angle)*rr,mid+Math.sin(angle)*rr);c.rotate(r()*6);c.globalAlpha=.3+r()*.7;c.beginPath();c.ellipse(0,0,3+r()*10,2+r()*3,0,0,Math.PI*2);c.fill();c.restore();}}
  else {const image=c.createImageData(256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const d=Math.hypot(x-mid,y-mid)/127;const waves=(Math.sin(x*.065+Math.sin(y*.04)*2)+Math.cos(y*.08+x*.015)+Math.sin((x+y)*.11))/6+.5;const grain=r(),n=id==='cloud'?Math.max(0,waves*.9+.15):Math.max(0,waves*.6+grain*.7-.15);const i=(y*256+x)*4;image.data[i]=image.data[i+1]=image.data[i+2]=255;image.data[i+3]=255*n*Math.max(0,1-d*d);}c.putImageData(image,0,0);}
  c.globalAlpha=1;baseCache.set(id,canvas);return canvas;
}
export function brushTip(stroke){
  const alpha=stroke.alpha||'round',softness=stroke.softness??(alpha==='soft'?90:45),square=stroke.shape==='square';
  const key=`${alpha}:${softness}:${square}`;if(tipCache.has(key))return tipCache.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
  if(square&&alpha==='round'){c.fillStyle='#fff';c.fillRect(0,0,256,256);}else c.drawImage(baseAlpha(alpha),0,0,256,256);
  if(!square&&softness>0){c.globalCompositeOperation='destination-in';const inner=Math.min(.99,1-softness/100*.98);const gradient=c.createRadialGradient(128,128,128*inner,128,128,128);gradient.addColorStop(0,'#fff');gradient.addColorStop(1,'#fff0');c.fillStyle=gradient;c.fillRect(0,0,256,256);}
  tipCache.set(key,canvas);if(tipCache.size>80)tipCache.delete(tipCache.keys().next().value);return canvas;
}
export function renderAlphaPreview(canvas,id,softness=45){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#252527';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(brushTip({alpha:id,softness}),4,4,canvas.width-8,canvas.height-8);}
export async function importAlphaFile(file){
  if(file.size>4*1024*1024)throw new Error('Choose an alpha image smaller than 4 MB.');
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG, or WebP alpha.');
  const url=URL.createObjectURL(file);
  try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Could not read this image.'));image.src=url;});if(image.width>4096||image.height>4096)throw new Error('Alpha images can be up to 4096 × 4096 pixels.');
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');const scale=Math.min(256/image.width,256/image.height),w=image.width*scale,h=image.height*scale;c.drawImage(image,(256-w)/2,(256-h)/2,w,h);const pixels=c.getImageData(0,0,256,256);let transparent=false;
    // Use source transparency when present; opaque grayscale images use luminance.
    for(let py=Math.ceil((256-h)/2)+1;py<Math.floor((256+h)/2)-1&&!transparent;py++)for(let px=Math.ceil((256-w)/2)+1;px<Math.floor((256+w)/2)-1;px++)if(pixels.data[(py*256+px)*4+3]<250){transparent=true;break;}
    for(let i=0;i<pixels.data.length;i+=4){const a=transparent?pixels.data[i+3]:.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2];pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=a;}c.putImageData(pixels,0,0);
    return {id:'alpha-'+crypto.randomUUID(),name:file.name.replace(/\.[^.]+$/,'').slice(0,60)||'Imported alpha',data:canvas.toDataURL('image/png')};
  }finally{URL.revokeObjectURL(url);}
}

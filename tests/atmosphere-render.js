import {paintAtmosphere,paintEraser,atmosphereTexture} from '../app/atmosphere.js';
import {lightAtmosphere} from '../app/lighting.js';
import {createDocument} from '../app/model.js';

export function runAtmosphereChecks(check){
  const doc=createDocument(true);doc.width=1536;doc.height=1024;doc.ambient=100;doc.fog=40;doc.grading.vignette=0;
  const stroke={material:'fog',points:[{x:180,y:512},{x:1350,y:512}],size:260,opacity:35,softness:60,alpha:'round',density:65,order:1};
  const surface=()=>{const canvas=document.createElement('canvas');canvas.width=doc.width;canvas.height=doc.height;return canvas;};
  const render=(lit=false,preview=false)=>{const canvas=surface(),c=canvas.getContext('2d');paintAtmosphere(c,stroke,doc,preview);if(lit)lightAtmosphere(c,doc);return canvas;};
  const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  const alphaSum=p=>{let sum=0;for(let i=3;i<p.length;i+=4)sum+=p[i];return sum;};
  const raw=render(),rawPixels=pixels(raw),neutral=alphaSum(rawPixels);
  const texture=surface();texture.getContext('2d').drawImage(atmosphereTexture(stroke,doc),0,0,doc.width,doc.height);
  const tp=pixels(texture),alpha=(x,y)=>tp[(y*doc.width+x)*4+3];
  let seam=0,difference=0;
  for(let y=50;y<950;y+=7){for(const x of [512,1024])seam=Math.max(seam,Math.abs(alpha(x,y)-alpha(x-1,y)));difference+=Math.abs(alpha(200,y)-alpha(712,y));}
  check('Large cloud field has no hard edges at former 512 px tile boundaries',seam<=3);
  check('Rendered fog texture does not repeat every 512 px',difference>500);
  doc.fog=0;check('Zero global haze removes painted fog pixels',alphaSum(pixels(render()))===0);
  doc.fog=80;check('Higher global haze increases painted fog density',alphaSum(pixels(render()))>neutral*1.85);
  doc.fog=40;doc.ambient=5;
  const dark=render(true),darkPixels=pixels(dark);
  const pixel=(p,x,y)=>Array.from(p.slice((y*doc.width+x)*4,(y*doc.width+x)*4+4));
  check('Ambient darkness shades the fog itself',pixel(darkPixels,700,512)[0]<pixel(rawPixels,700,512)[0]*.4);
  doc.lights=[{x:700,y:512,radius:300,intensity:180,type:'spotlight',color:'#0a84ff',falloff:70,bloom:0,cone:360,shadows:false}];
  const lit=render(true),litPixels=pixels(lit),center=pixel(litPixels,700,512),unlit=pixel(darkPixels,700,512);
  check('Colored lights illuminate and tint the fog itself',center[2]>unlit[2]+50&&center[2]>center[0]+40);
  check('Lighting preserves every fog alpha pixel',rawPixels.every((v,i)=>i%4!==3||v===litPixels[i]));
  check('Lighting leaves unpainted space transparent',pixel(litPixels,700,30)[3]===0);
  check('Lit brush preview matches committed atmosphere pixels',render(false,true).toDataURL()===lit.toDataURL());
  doc.lights[0].cone=70;doc.lights[0].angle=0;
  const coned=pixels(render(true));
  check('Spotlight cones also restrict fog illumination',pixel(coned,830,512)[2]>pixel(coned,570,512)[2]+20);
  doc.walls=[{a:{x:800,y:0},b:{x:800,y:1024},material:'stone',width:16}];doc.lights[0].shadows=true;
  const shadowed=pixels(render(true));
  check('Wall shadows block illumination of fog behind walls',pixel(shadowed,830,512)[2]<pixel(coned,830,512)[2]-20);
  doc.lights[0].intensity=0;
  check('Zero-intensity lights leave fog illumination unchanged',render(true).toDataURL()===dark.toDataURL());
  const erased=render(),ec=erased.getContext('2d');
  paintEraser(ec,{points:[{x:700,y:512}],size:90,alpha:'round',softness:0,opacity:100},doc);lightAtmosphere(ec,doc);
  check('Atmosphere eraser stays transparent after lighting',pixel(pixels(erased),700,512)[3]===0);
  doc.lights=[];doc.walls=[];doc.ambient=100;
  check('Fog field remains deterministic after a stroke round trip',(()=>{const c=surface();paintAtmosphere(c.getContext('2d'),JSON.parse(JSON.stringify(stroke)),doc);return c.toDataURL()===raw.toDataURL();})());
}

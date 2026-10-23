// Absolute world coordinates: no wrapped lattice or repeated cloud tiles.
function hash(x,y,seed){
  let n=Math.imul(x,374761393)^Math.imul(y,668265263)^seed;
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967296;
}
function noise(x,y,scale,seed){
  x/=scale;y/=scale;
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const a=hash(ix,iy,seed),b=hash(ix+1,iy,seed),c=hash(ix,iy+1,seed),d=hash(ix+1,iy+1,seed);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
export function atmosphereDensity(x,y,material='fog',density=65){
  const wx=x+(noise(x,y,270,731)-.5)*150,wy=y+(noise(x,y,310,1193)-.5)*150;
  const cloud=noise(wx,wy,190,351)*.53+noise(wx,wy,79,1823)*.32+noise(wx,wy,29,9203)*.15;
  const detail=.4+density/100*.7;
  if(material==='darkness')return Math.min(.98,.8+cloud*.18);
  if(material==='mist')return Math.min(.92,(.1+cloud*.73)*detail);
  if(material==='smoke')return Math.min(.95,(.08+cloud*cloud*1.35)*detail);
  return Math.min(.95,(.12+cloud*.86)*detail);
}
export function hazeOpacity(stroke,world){
  const haze=['fog','mist','smoke'].includes(stroke.material)?(world.fog??40)/40:1;
  return Math.min(1,(stroke.opacity??35)/100*haze);
}

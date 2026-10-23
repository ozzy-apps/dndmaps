export const DEFAULT_PREFERENCES={uiTheme:'dark',terrain:{opacity:90,softness:65,noise:65,density:65,placement:'under'},room:{shape:'rectangle',wallMaterial:'stone',withWalls:true},brush:{alpha:'round',spacing:15,scatter:0,angle:0,jitter:0},paint:{floor:{opacity:100,softness:0},atmosphere:{opacity:35,softness:90},erase:{opacity:100,softness:65}},eraserTarget:'paint',lighting:{color:'#ffae45',intensity:85,falloff:55,bloom:45,angle:0,cone:360,shadows:false},atmosphereColor:'#c7d7e8',floorShape:'round',markerDisplay:'named'};
export function validatePreferences(input={},systemDark=false) {
  const defaults=structuredClone(DEFAULT_PREFERENCES);defaults.uiTheme=systemDark?'dark':'light';
  if(!input||typeof input!=='object')return defaults;
  if(['light','dark'].includes(input.uiTheme))defaults.uiTheme=input.uiTheme;
  for(const key of ['opacity','softness','noise','density']){const n=input.terrain?.[key];if(Number.isFinite(n)&&n>=(key==='opacity'?1:0)&&n<=100)defaults.terrain[key]=n;}
  if(['under','over'].includes(input.terrain?.placement))defaults.terrain.placement=input.terrain.placement;
  if(['rectangle','ellipse','cavern'].includes(input.room?.shape))defaults.room.shape=input.room.shape;
  if(typeof input.room?.wallMaterial==='string')defaults.room.wallMaterial=input.room.wallMaterial;
  if(typeof input.room?.withWalls==='boolean')defaults.room.withWalls=input.room.withWalls;
  if(['round','square'].includes(input.floorShape))defaults.floorShape=input.floorShape;
  if(['named','numbered'].includes(input.markerDisplay))defaults.markerDisplay=input.markerDisplay;
  for(const [key,min,max] of [['spacing',5,100],['scatter',0,100],['angle',0,360],['jitter',0,100]])if(Number.isFinite(input.brush?.[key])&&input.brush[key]>=min&&input.brush[key]<=max)defaults.brush[key]=input.brush[key];
  if(typeof input.brush?.alpha==='string')defaults.brush.alpha=input.brush.alpha;
  for(const tool of ['floor','atmosphere','erase'])for(const key of ['opacity','softness']){const n=input.paint?.[tool]?.[key];if(Number.isFinite(n)&&n>=(key==='opacity'?1:0)&&n<=100)defaults.paint[tool][key]=n;}
  if(['paint','terrain','floor','atmosphere','geometry'].includes(input.eraserTarget))defaults.eraserTarget=input.eraserTarget;
  for(const [key,min,max] of [['intensity',0,200],['falloff',0,100],['bloom',0,100],['angle',0,360],['cone',10,360]]){const n=input.lighting?.[key];if(Number.isFinite(n)&&n>=min&&n<=max)defaults.lighting[key]=n;}
  if(/^#[0-9a-f]{6}$/i.test(input.lighting?.color))defaults.lighting.color=input.lighting.color;
  if(typeof input.lighting?.shadows==='boolean')defaults.lighting.shadows=input.lighting.shadows;
  if(/^#[0-9a-f]{6}$/i.test(input.atmosphereColor))defaults.atmosphereColor=input.atmosphereColor;
  return defaults;
}

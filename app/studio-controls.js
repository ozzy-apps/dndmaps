import {ALPHA_TIPS,resizeMap,switchMapState,duplicateMapState,deleteMapState} from './model.js';
import {renderAlphaPreview,importAlphaFile,prepareAlphas} from './alphas.js';
import {LIGHT_COLORS} from './lighting.js';
import {ATMOSPHERE_COLORS} from './atmosphere.js';
const names={round:'Round',soft:'Soft round',speckle:'Speckled',grunge:'Grunge',streaks:'Dry streaks',cloud:'Cloud',leaves:'Leaf scatter'};
export function setupStudioControls({$,doc,mutate,refresh,renderer,preferences,savePreferences,toast,cancelGesture,updateRangeTracks}){
  let activeTool='wall',lastLight='',lastAtmosphere='';
  const paintTools=['terrain','floor','atmosphere','erase'];
  function paintSettings(){return activeTool==='terrain'?preferences.terrain:preferences.paint[activeTool]||preferences.paint.floor;}
  function previewAlpha(){renderAlphaPreview($('alpha-preview'),preferences.brush.alpha,paintSettings().softness);}
  function alphaOptions(){const assets=doc().alphaAssets,ids=[...ALPHA_TIPS,...assets.map(a=>a.id)];if(!ids.includes(preferences.brush.alpha))preferences.brush.alpha='round';$('brush-alpha').replaceChildren(...ALPHA_TIPS.map(id=>new Option(names[id],id)),...assets.map(a=>new Option(a.name,a.id)));$('brush-alpha').value=preferences.brush.alpha;previewAlpha();}
  $('brush-alpha').onchange=e=>{preferences.brush.alpha=e.target.value;savePreferences();previewAlpha();};
  $('import-alpha').onclick=()=>{if(doc().alphaAssets.length>=12){toast('A project supports 12 imported alphas.');return;}$('alpha-file').click();};
  $('alpha-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const alpha=await importAlphaFile(file);mutate(d=>d.alphaAssets.push(alpha));preferences.brush.alpha=alpha.id;savePreferences();prepareAlphas(doc().alphaAssets,()=>{alphaOptions();renderer.rebuild(doc());});alphaOptions();toast('Alpha texture imported into this project');}catch(error){toast(error.message);}e.target.value='';};
  for(const key of ['opacity','softness'])$('brush-'+key).oninput=e=>{paintSettings()[key]=+e.target.value;$('brush-'+key+'-value').value=e.target.value+'%';previewAlpha();updateRangeTracks();};
  for(const key of ['opacity','softness'])$('brush-'+key).onchange=savePreferences;
  for(const key of ['spacing','scatter','angle','jitter']){const input=$('brush-'+key);input.value=preferences.brush[key];$('brush-'+key+'-value').value=input.value+(key==='angle'?'°':'%');input.oninput=()=>{preferences.brush[key]=+input.value;$('brush-'+key+'-value').value=input.value+(key==='angle'?'°':'%');updateRangeTracks();};input.onchange=savePreferences;}
  $('eraser-target').value=preferences.eraserTarget;$('eraser-target').onchange=e=>{preferences.eraserTarget=e.target.value;savePreferences();$('paint-properties').hidden=activeTool==='erase'&&e.target.value==='geometry';};
  $('atmosphere-color').value=preferences.atmosphereColor;$('atmosphere-color').oninput=e=>{preferences.atmosphereColor=e.target.value;savePreferences();};
  $('light-color').value=preferences.lighting.color;$('light-color').oninput=e=>{preferences.lighting.color=e.target.value;savePreferences();};
  for(const key of ['intensity','falloff','bloom','angle','cone']){const input=$('light-'+key);input.value=preferences.lighting[key];$('light-'+key+'-value').value=input.value+(['angle','cone'].includes(key)?'°':'%');input.oninput=()=>{preferences.lighting[key]=+input.value;$('light-'+key+'-value').value=input.value+(['angle','cone'].includes(key)?'°':'%');updateRangeTracks();};input.onchange=savePreferences;}
  $('light-shadows').checked=preferences.lighting.shadows;$('light-shadows').onchange=e=>{preferences.lighting.shadows=e.target.checked;savePreferences();};
  for(const key of ['exposure','vibrance','saturation','contrast','shadows','temperature','vignette']){let editing=false;const start=()=>{if(!editing){mutateCheckpoint();editing=true;}};const input=$('grade-'+key);input.onpointerdown=start;input.oninput=()=>{start();doc().grading[key]=+input.value;$('grade-'+key+'-value').value=key==='exposure'?(+input.value/100).toFixed(2)+' EV':input.value;renderer.rebuild(doc());updateRangeTracks();};input.onchange=()=>{editing=false;refresh();};}
  // Host supplies the history checkpoint without forcing a render for each slider gesture.
  function mutateCheckpoint(){mutate(()=>{},false);}
  $('reset-grading').onclick=()=>mutate(d=>d.grading={exposure:0,vibrance:100,saturation:100,contrast:100,shadows:0,temperature:0,vignette:35});
  const ratio=()=>Number($('map-aspect').value)||0;
  function constrainSize(from='width'){const r=ratio();if(!r)return;let w=+$('map-width').value,h=+$('map-height').value;if((from==='width'?w:h)<256)return;if(from==='height')w=Math.round(h*r);else h=Math.round(w/r);if(w>4096){w=4096;h=Math.round(w/r);}if(h>4096){h=4096;w=Math.round(h*r);}if(w<256){w=256;h=Math.round(w/r);}if(h<256){h=256;w=Math.round(h*r);}$('map-width').value=w;$('map-height').value=h;}
  function openSize(){$('project-menu').hidden=true;$('map-width').value=doc().width;$('map-height').value=doc().height;$('map-aspect').value='custom';$('map-resize-mode').value='canvas';$('size-dialog').showModal();}
  $('map-size-button').onclick=openSize;$('map-size-menu').onclick=openSize;$('map-aspect').onchange=()=>constrainSize();
  for(const dimension of ['width','height']){const input=$('map-'+dimension);input.oninput=()=>constrainSize(dimension);input.onchange=()=>constrainSize(dimension);}
  $('size-dialog').addEventListener('close',()=>{const action=$('size-dialog').returnValue;$('size-dialog').returnValue='';if(action!=='apply')return;try{cancelGesture();const width=+$('map-width').value,height=+$('map-height').value;if(!Number.isInteger(width)||!Number.isInteger(height)||width<256||height<256||width>4096||height>4096)throw new Error('Choose whole dimensions from 256 to 4096 pixels.');mutate(d=>resizeMap(d,width,height,$('map-resize-mode').value==='scale'));renderer.fit();toast('Map size updated');}catch(error){toast(error.message);}});
  function switchState(id){cancelGesture();mutate(d=>switchMapState(d,id));renderer.fit();}
  $('map-state').onchange=e=>switchState(e.target.value);
  function newState(){$('project-menu').hidden=true;if(doc().states.length>=12){toast('A project supports up to 12 map states.');return;}const current=doc().states.find(s=>s.id===doc().activeStateId);$('new-state-name').value=current.name+' copy';$('new-state-dialog').showModal();}
  $('duplicate-state').onclick=newState;$('state-dialog-duplicate').onclick=()=>{$('state-dialog').close('cancel');newState();};
  $('new-state-dialog').addEventListener('close',()=>{const action=$('new-state-dialog').returnValue;$('new-state-dialog').returnValue='';if(action!=='create')return;const name=$('new-state-name').value.trim();if(!name)return;try{cancelGesture();mutate(d=>duplicateMapState(d,name,crypto.randomUUID()));toast('Independent map state created');}catch(error){toast(error.message);}});
  function stateList(){const current=doc().states.find(s=>s.id===doc().activeStateId);$('state-name').value=current.name;$('delete-state').disabled=doc().states.length===1;$('state-list').replaceChildren(...doc().states.map(state=>{const button=document.createElement('button');button.type='button';button.textContent=state.name;button.classList.toggle('active',state.id===doc().activeStateId);button.onclick=()=>{switchState(state.id);stateList();};return button;}));}
  function manageStates(){$('project-menu').hidden=true;stateList();$('state-dialog').showModal();}
  $('manage-states').onclick=manageStates;$('map-states-menu').onclick=manageStates;
  $('state-dialog').addEventListener('close',()=>{const action=$('state-dialog').returnValue;$('state-dialog').returnValue='';if(action==='rename'){const name=$('state-name').value.trim();if(name)mutate(d=>d.states.find(s=>s.id===d.activeStateId).name=name.slice(0,50));}});
  $('delete-state').onclick=()=>{if(doc().states.length<=1)return;mutate(d=>deleteMapState(d,d.activeStateId));renderer.fit();stateList();toast('State deleted · Undo restores it');};
  function sync(){
    $('canvas-size').textContent=doc().width+' × '+doc().height;
    $('map-state').replaceChildren(...doc().states.map(s=>new Option(s.name,s.id)));$('map-state').value=doc().activeStateId;
    for(const key of ['exposure','vibrance','saturation','contrast','shadows','temperature','vignette']){$('grade-'+key).value=doc().grading[key];$('grade-'+key+'-value').value=key==='exposure'?(doc().grading[key]/100).toFixed(2)+' EV':doc().grading[key];}
    const options=$('export-scale').options;options[0].textContent=doc().width+' × '+doc().height+' px';options[1].textContent=doc().width*2+' × '+doc().height*2+' px';options[1].disabled=doc().width*doc().height>8388608;if(options[1].disabled)$('export-scale').value='1';
    alphaOptions();updateRangeTracks();
  }
  function setTool(tool){activeTool=tool;$('paint-properties').hidden=!paintTools.includes(tool)||(tool==='erase'&&preferences.eraserTarget==='geometry');$('eraser-properties').hidden=tool!=='erase';$('light-properties').hidden=tool!=='light';$('paint-atmosphere-properties').hidden=tool!=='atmosphere';
    if(paintTools.includes(tool)){for(const key of ['opacity','softness']){$('brush-'+key).value=paintSettings()[key];$('brush-'+key+'-value').value=paintSettings()[key]+'%';}previewAlpha();}updateRangeTracks();
  }
  function selectMaterial(tool,id){if(tool==='light'&&lastLight!==id){lastLight=id;preferences.lighting.color=LIGHT_COLORS[id]||'#ffae45';preferences.lighting.cone=id==='spotlight'?75:360;$('light-color').value=preferences.lighting.color;$('light-cone').value=preferences.lighting.cone;$('light-cone-value').value=preferences.lighting.cone+'°';}if(tool==='atmosphere'&&lastAtmosphere!==id){lastAtmosphere=id;preferences.atmosphereColor=ATMOSPHERE_COLORS[id];$('atmosphere-color').value=preferences.atmosphereColor;}}
  function brushOptions(tool){return {...preferences.brush,...(tool==='terrain'?preferences.terrain:preferences.paint[tool]||{}),...(tool==='atmosphere'?{color:preferences.atmosphereColor,density:preferences.terrain.density}:{})};}
  sync();return {sync,setTool,selectMaterial,brushOptions};
}

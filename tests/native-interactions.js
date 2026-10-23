(() => {
  const results=[];
  const check=(name,condition)=>{results.push({name,passed:!!condition});if(!condition)throw Error(name);};
  try {
    check('Native editor initialized',!!window.Fable);
    const original=Fable.document,originalText=JSON.stringify(original),$=id=>document.getElementById(id);
    check('Furnished sample loaded',original.walls.length>30&&original.objects.length>20);
    check('All ten tools available',document.querySelectorAll('[data-tool]').length===10);
    const map=$('map'),rect=map.getBoundingClientRect(),v=Fable.view;
    function pointer(type,x,y,options={}){const view=Fable.view;map.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,clientX:rect.left+view.pan.x+x*view.zoom,clientY:rect.top+view.pan.y+y*view.zoom,button:0,...options}));}
    function closeDialog(id,value){$(id).close(value);$(id).dispatchEvent(new Event('close'));}
    function tool(id){document.querySelector(`[data-tool="${id}"]`).click();}
    tool('wall');pointer('pointerdown',960,1024);pointer('pointermove',1152,1024);pointer('pointerup',1152,1024);
    check('Wall drag creates a snapped editable segment',Fable.document.walls.length===original.walls.length+1&&Fable.document.walls.at(-1).b.x===1152);
    $('undo').click();check('Undo removes a wall',Fable.document.walls.length===original.walls.length);
    $('redo').click();check('Redo restores a wall',Fable.document.walls.length===original.walls.length+1);
    tool('room');pointer('pointerdown',1024,960);pointer('pointermove',1216,1088);pointer('pointerup',1216,1088);
    check('Room drag adds a floor and four walls',Fable.document.rooms.length===original.rooms.length+1&&Fable.document.walls.length===original.walls.length+5);
    tool('terrain');pointer('pointerdown',1000,1000);pointer('pointermove',1100,1050);pointer('pointerup',1100,1050);
    check('Terrain brush records a textured stroke',Fable.document.terrain.length===original.terrain.length+1);
    tool('object');pointer('pointerdown',1000,1000);pointer('pointerup',1000,1000);
    check('Object stamp snaps to cell center',Fable.document.objects.length===original.objects.length+1&&Fable.document.objects.at(-1).x===992);
    tool('light');pointer('pointerdown',1100,1000);pointer('pointerup',1100,1000);
    check('Light brush adds an editable light',Fable.document.lights.length===original.lights.length+1);
    tool('erase');$('eraser-target').value='geometry';$('eraser-target').dispatchEvent(new Event('change'));pointer('pointerdown',992,992);pointer('pointerup',992,992);
    check('Eraser removes placed objects',Fable.document.objects.length===original.objects.length);
    $('grid-size').value=48;$('grid-size').dispatchEvent(new Event('change'));
    check('Grid size is configurable',Fable.document.grid===48);
    $('toggle-grid').click();check('Grid visibility toggles',Fable.document.gridVisible===false);
    $('toggle-snap').click();check('Snapping toggles',Fable.document.snap===false);
    document.querySelector('[data-theme="moonlit"]').click();check('Atmosphere preset changes light',Fable.document.theme==='moonlit'&&Fable.document.ambient===42);
    document.querySelector('[data-layer="objects"]').click();check('Layer visibility toggles',Fable.document.visibility.objects===false);
    $('view-lighting').click();check('Lighting view opens',$('view-lighting').classList.contains('active'));$('view-map').click();
    $('export').click();check('PNG export options open',$('export-dialog').open);$('export-dialog').close();
    $('help').click();check('Keyboard shortcuts open',$('help-dialog').open);$('help-dialog').close();
    check('Invalid imports are rejected',Fable.importProject('{"version":99}')===false);
    // Brush catalog and preferences.
    tool('wall');check('Twelve wall materials available',document.querySelectorAll('[data-material]').length===12);
    document.querySelector('[data-material="hedge"]').click();pointer('pointerdown',960,1088);pointer('pointermove',1216,1088);pointer('pointerup',1216,1088);
    check('Living hedge is an editable wall material',Fable.document.walls.at(-1).material==='hedge');
    tool('floor');check('Twelve floor materials available',document.querySelectorAll('[data-material]').length===12);
    document.querySelector('[data-material="mosaic"]').click();$('floor-shape').value='square';$('floor-shape').dispatchEvent(new Event('change'));
    pointer('pointerdown',960,960);pointer('pointermove',1216,960);pointer('pointerup',1216,960);
    check('Independent floor painting stores material and brush shape',Fable.document.floors.at(-1).material==='mosaic'&&Fable.document.floors.at(-1).shape==='square');
    $('undo').click();check('Floor painting is undoable',Fable.document.floors.length===0);$('redo').click();
    tool('terrain');check('Twelve terrain brushes available',document.querySelectorAll('[data-material]').length===12);
    document.querySelector('[data-material="mud"]').click();
    for(const [name,value] of [['opacity',55],['softness',80],['noise',90],['density',40]]){$('brush-'+name).value=value;$('brush-'+name).dispatchEvent(new Event('input'));}
    pointer('pointerdown',100,1000);pointer('pointermove',500,1100);pointer('pointerup',500,1100);
    const stroke=Fable.document.terrain.at(-1);check('Mud strokes preserve noise and blend settings',stroke.material==='mud'&&stroke.opacity===55&&stroke.softness===80&&stroke.noise===90&&stroke.density===40);
    check('Terrain brush preferences are remembered in editor state',Fable.preferences.terrain.noise===90);
    tool('room');document.querySelector('[data-room-shape="ellipse"]').click();$('room-wall-material').value='limestone';$('room-wall-material').dispatchEvent(new Event('change'));
    pointer('pointerdown',64,64);pointer('pointermove',320,320);pointer('pointerup',320,320);
    check('Round rooms create a matching closed perimeter',Fable.document.rooms.at(-1).shape==='ellipse'&&Fable.document.walls.at(-1).material==='limestone');
    document.querySelector('[data-room-shape="cavern"]').click();$('room-walls').checked=false;$('room-walls').dispatchEvent(new Event('change'));const wallCount=Fable.document.walls.length;
    pointer('pointerdown',1088,128);pointer('pointermove',1344,320);pointer('pointerup',1344,320);
    check('Cavern floor can be drawn without perimeter walls',Fable.document.rooms.at(-1).shape==='cavern'&&Fable.document.walls.length===wallCount);
    document.querySelector('[data-grid-size="140"]').click();check('140 px VTT preset is applied',Fable.document.grid===140);
    document.querySelector('[data-grid-size="70"]').click();check('70 px VTT preset is applied',Fable.document.grid===70);
    tool('marker');pointer('pointerdown',600,1000);$('marker-label').value='Hidden gate';$('marker-number').value=4;$('marker-dialog').close('save');$('marker-dialog').dispatchEvent(new Event('close'));
    check('DM marker stores its name and number',Fable.document.markers.at(-1).label==='Hidden gate'&&Fable.document.markers.at(-1).number===4);
    pointer('pointerdown',600,1000);pointer('pointermove',800,1050);pointer('pointerup',800,1050);
    check('Existing markers can be moved by dragging',Math.abs(Fable.document.markers.at(-1).x-800)<1);
    const beforeTheme=JSON.stringify(Fable.document),pngBeforeTheme=Fable.exportPNG(1,false,'none');$('ui-dark').click();
    check('Dark interface is selected',document.documentElement.dataset.uiTheme==='dark'&&$('ui-dark').getAttribute('aria-pressed')==='true');
    check('UI theme does not alter map data or exported pixels',JSON.stringify(Fable.document)===beforeTheme&&Fable.exportPNG(1,false,'none')===pngBeforeTheme);
    $('ui-light').click();check('Light interface can be restored',document.documentElement.dataset.uiTheme==='light');
    const player=Fable.exportPNG(1,false,'none'),dm=Fable.exportPNG(1,false,'named');check('DM labels appear only in DM exports',player!==dm);
    $('export').click();$('export-variant').value='player-gridless';$('export-variant').dispatchEvent(new Event('change'));check('Gridless player preset locks grid off',$('export-grid').disabled&&!$('export-grid').checked);$('export-variant').value='dm-numbered';$('export-variant').dispatchEvent(new Event('change'));check('Numbered DM preset includes the grid',$('export-grid').disabled&&$('export-grid').checked);$('export-dialog').close();
    // Render-level checks: noise settings affect pixels, strokes are stable after reload,
    // and terrain layering preserves legacy overlays such as the sample crypt pool.
    const brushMap=structuredClone(original);for(const name of ['walls','rooms','objects','lights','markers','floors'])brushMap[name]=[];
    brushMap.terrain=[{material:'grass',points:[{x:200,y:250},{x:600,y:250}],size:90,opacity:100,softness:60,noise:0,density:65,placement:'under'}];
    Fable.importProject(brushMap);const smooth=Fable.exportPNG(1,false,'none');brushMap.terrain[0].noise=95;Fable.importProject(brushMap);const noisy=Fable.exportPNG(1,false,'none');
    check('Noise variation changes actual terrain pixels',smooth!==noisy);Fable.importProject(brushMap);check('Procedural terrain stays identical after reload',noisy===Fable.exportPNG(1,false,'none'));
    brushMap.terrain[0].opacity=25;Fable.importProject(brushMap);check('Brush opacity changes actual painted pixels',noisy!==Fable.exportPNG(1,false,'none'));
    brushMap.terrain[0].opacity=100;brushMap.rooms=[{x:128,y:128,w:512,h:256,material:'wood'}];Fable.importProject(brushMap);const under=Fable.exportPNG(1,false,'none');brushMap.terrain[0].placement='over';Fable.importProject(brushMap);check('Ground and overlay terrain respect floor ordering',under!==Fable.exportPNG(1,false,'none'));
    const legacy=structuredClone(original);legacy.version=1;delete legacy.floors;delete legacy.markers;delete legacy.visibility.terrain;delete legacy.visibility.markers;
    check('Legacy v1 project imports into schema v3',Fable.importProject(legacy)&&Fable.document.version===3&&Fable.document.walls.length===original.walls.length);
    // 0.3: map dimensions, actual Shift resizing, alpha paint and erasing, light grading, saved states.
    Fable.importProject(originalText);tool('terrain');const countBeforeResize=Fable.document.terrain.length,sizeBefore=+$('brush-size').value;
    pointer('pointerdown',100,100,{shiftKey:true});pointer('pointermove',320,100,{shiftKey:true});pointer('pointerup',320,100,{shiftKey:true});
    check('Shift drag resizes the brush without painting',+$('brush-size').value>sizeBefore&&Fable.document.terrain.length===countBeforeResize&&$('brush-resize-hud').hidden);
    $('map-size-button').click();$('map-width').value=1600;$('map-aspect').value='1.7777777778';$('map-aspect').dispatchEvent(new Event('change'));
    check('Aspect presets derive matching dimensions',+$('map-height').value===900);closeDialog('size-dialog','apply');
    check('Map size updates real document and viewport',Fable.document.width===1600&&Fable.document.height===900);
    let dimensionPNG=atob(Fable.exportPNG(1,false,'none').split(',')[1]);const read32=(str,n)=>str.charCodeAt(n)*16777216+str.charCodeAt(n+1)*65536+str.charCodeAt(n+2)*256+str.charCodeAt(n+3);
    check('PNG dimensions follow resized map',read32(dimensionPNG,16)===1600&&read32(dimensionPNG,20)===900);
    $('undo').click();check('Map resizing is undoable',Fable.document.width===1536&&Fable.document.height===1280);
    Fable.importProject(originalText);$('duplicate-state').click();$('new-state-name').value='Flooded';closeDialog('new-state-dialog','create');const alternate=Fable.document.activeStateId;
    check('Map state duplicates artwork independently',Fable.document.states.length===2&&Fable.document.walls.length===original.walls.length);
    $('ambient').value=20;$('ambient').dispatchEvent(new Event('input'));$('ambient').dispatchEvent(new Event('change'));
    $('map-state').value='base';$('map-state').dispatchEvent(new Event('change'));check('Switching restores the base state',Fable.document.ambient===original.ambient);
    $('map-state').value=alternate;$('map-state').dispatchEvent(new Event('change'));check('State edits survive switching',Fable.document.ambient===20);
    const stateFile=JSON.stringify(Fable.document);Fable.importProject(stateFile);check('All states survive project round trip',Fable.document.states.length===2&&Fable.document.activeStateId===alternate&&Fable.document.ambient===20);
    $('manage-states').click();$('state-name').value='After the storm';closeDialog('state-dialog','rename');check('Map states can be renamed',Fable.document.states.find(s=>s.id===alternate).name==='After the storm');
    $('manage-states').click();$('delete-state').click();$('state-dialog').close('cancel');check('Active state deletion switches safely',Fable.document.states.length===1&&Fable.document.activeStateId==='base');$('undo').click();check('Deleted states can be restored with undo',Fable.document.states.length===2);
    // Use a small scene for pixel comparisons so the checks remain fast.
    const paintDoc=structuredClone(original);paintDoc.width=768;paintDoc.height=512;paintDoc.rooms=[];paintDoc.walls=[];paintDoc.floors=[];paintDoc.terrain=[];paintDoc.objects=[];paintDoc.lights=[];paintDoc.markers=[];paintDoc.atmosphere=[];paintDoc.erasers=[];paintDoc.paintSequence=1;paintDoc.fog=40;paintDoc.ambient=100;paintDoc.grading.vignette=0;
    paintDoc.fog=0;Fable.importProject(paintDoc);const noHaze=Fable.exportPNG(1,false,'none');paintDoc.fog=80;Fable.importProject(paintDoc);check('Unpainted maps stay fog-free at every haze setting',Fable.exportPNG(1,false,'none')===noHaze);paintDoc.fog=40;
    Fable.importProject(paintDoc);tool('terrain');document.querySelector('[data-material="sand"]').click();$('brush-size').value=90;$('brush-size').dispatchEvent(new Event('input'));$('brush-alpha').value='grunge';$('brush-alpha').dispatchEvent(new Event('change'));$('brush-scatter').value=20;$('brush-scatter').dispatchEvent(new Event('input'));
    pointer('pointerdown',150,250);pointer('pointermove',600,250);pointer('pointerup',600,250);check('Alpha and scatter are stored in painted strokes',Fable.document.terrain.at(-1).alpha==='grunge'&&Fable.document.terrain.at(-1).scatter===20);
    const painted=Fable.exportPNG(1,false,'none');tool('erase');$('eraser-target').value='terrain';$('eraser-target').dispatchEvent(new Event('change'));$('brush-alpha').value='speckle';$('brush-alpha').dispatchEvent(new Event('change'));pointer('pointerdown',350,250);pointer('pointermove',400,250);pointer('pointerup',400,250);
    check('Alpha eraser removes pixels without deleting the source stroke',Fable.document.terrain.length===1&&Fable.document.erasers.length===1&&Fable.exportPNG(1,false,'none')!==painted);
    $('undo').click();check('Textured partial erasing is exactly undoable',Fable.exportPNG(1,false,'none')===painted);$('redo').click();
    tool('terrain');pointer('pointerdown',350,250);pointer('pointermove',400,250);pointer('pointerup',400,250);check('Painting can refill erased areas in order',Fable.document.terrain.at(-1).order>Fable.document.erasers.at(-1).order);
    tool('atmosphere');document.querySelector('[data-material="fog"]').click();$('brush-alpha').value='cloud';$('brush-alpha').dispatchEvent(new Event('change'));const beforeFog=Fable.exportPNG(1,false,'none');pointer('pointerdown',170,180);pointer('pointermove',620,180);pointer('pointerup',620,180);
    check('Fog is painted on a separate atmosphere layer',Fable.document.atmosphere.length===1&&Fable.exportPNG(1,false,'none')!==beforeFog);document.querySelector('[data-layer="atmosphere"]').click();check('Atmosphere visibility restores underlying map pixels',Fable.exportPNG(1,false,'none')===beforeFog);document.querySelector('[data-layer="atmosphere"]').click();
    const fogPainted=Fable.exportPNG(1,false,'none');$('fog').value=0;$('fog').dispatchEvent(new Event('input'));$('fog').dispatchEvent(new Event('change'));check('Global haze slider clears painted fog without deleting strokes',Fable.exportPNG(1,false,'none')===beforeFog&&Fable.document.atmosphere.length===1);$('fog').value=80;$('fog').dispatchEvent(new Event('input'));$('fog').dispatchEvent(new Event('change'));check('Global haze slider changes actual painted fog density',Fable.exportPNG(1,false,'none')!==fogPainted);$('fog').value=40;$('fog').dispatchEvent(new Event('input'));$('fog').dispatchEvent(new Event('change'));check('Returning global haze restores exact painted pixels',Fable.exportPNG(1,false,'none')===fogPainted);
    tool('light');document.querySelector('[data-material="spotlight"]').click();$('light-color').value='#0a84ff';$('light-color').dispatchEvent(new Event('input'));$('light-intensity').value=155;$('light-intensity').dispatchEvent(new Event('input'));$('light-shadows').checked=true;$('light-shadows').dispatchEvent(new Event('change'));pointer('pointerdown',300,300);
    check('Spot lights store color, intensity, cone and wall shadow settings',Fable.document.lights.at(-1).color==='#0a84ff'&&Fable.document.lights.at(-1).intensity===155&&Fable.document.lights.at(-1).cone===75&&Fable.document.lights.at(-1).shadows===true);
    const beforeGrade=Fable.exportPNG(1,false,'none');$('grade-exposure').value=70;$('grade-exposure').dispatchEvent(new Event('input'));$('grade-exposure').dispatchEvent(new Event('change'));check('Exposure changes actual map pixels',Fable.exportPNG(1,false,'none')!==beforeGrade);$('undo').click();check('Color grading is undoable',Fable.exportPNG(1,false,'none')===beforeGrade);
    $('grade-vibrance').value=160;$('grade-vibrance').dispatchEvent(new Event('input'));$('grade-vibrance').dispatchEvent(new Event('change'));check('Vibrance changes actual map pixels',Fable.exportPNG(1,false,'none')!==beforeGrade);$('reset-grading').click();
    const shadowDoc=structuredClone(paintDoc);shadowDoc.ambient=10;shadowDoc.walls=[{a:{x:384,y:0},b:{x:384,y:512},material:'stone',width:16}];shadowDoc.lights=[{x:270,y:256,type:'spotlight',radius:350,intensity:150,color:'#7caaff',falloff:80,bloom:15,angle:0,cone:120,shadows:false}];Fable.importProject(shadowDoc);const unblocked=Fable.exportPNG(1,false,'none');shadowDoc.lights[0].shadows=true;Fable.importProject(shadowDoc);const blocked=Fable.exportPNG(1,false,'none');check('Wall shadows change rendered light visibility',blocked!==unblocked);shadowDoc.lights[0].cone=30;Fable.importProject(shadowDoc);check('Spotlight cone shapes change exported lighting',Fable.exportPNG(1,false,'none')!==blocked);
    shadowDoc.lights[0].intensity=0;Fable.importProject(shadowDoc);const lightOff=Fable.exportPNG(1,false,'none');shadowDoc.lights=[];Fable.importProject(shadowDoc);check('Zero intensity fully disables the light and bloom',Fable.exportPNG(1,false,'none')===lightOff);
    $('ui-dark').click();const css=getComputedStyle(document.documentElement);check('Neutral dark surface and requested blue accent are applied',css.getPropertyValue('--surface').trim()==='#18181a'&&css.getPropertyValue('--primary').trim()==='#0a84ff');
    check('Project round trip restores geometry',Fable.importProject(originalText)&&JSON.stringify(Fable.document)===originalText);
    tool('wall');$('toast').hidden=true;map.dispatchEvent(new PointerEvent('pointerleave',{bubbles:true}));
    const png=Fable.exportPNG(2,false);
    check('2× PNG export produces a real image',png.startsWith('data:image/png;base64,')&&png.length>100000);
    const bytes=atob(png.split(',')[1]);
    const dimension=offset=>(bytes.charCodeAt(offset)*16777216+bytes.charCodeAt(offset+1)*65536+bytes.charCodeAt(offset+2)*256+bytes.charCodeAt(offset+3));
    check('PNG dimensions match 3072 × 2560',dimension(16)===3072&&dimension(20)===2560);
    const capture=window.__FABLE_CAPTURE__;
    if(capture?.scene==='outdoor'){$('load-outdoor').click();$('replace-dialog').close('replace');$('replace-dialog').dispatchEvent(new Event('close'));check('Woodland example opens with outdoor textures and named locations',Fable.document.name==='Briarwood Crossing'&&Fable.document.markers.length===3);}
    if(capture?.scene==='states'){$('load-states').click();$('replace-dialog').close('replace');$('replace-dialog').dispatchEvent(new Event('close'));check('Day/night example contains independent lighting and painted mist',Fable.document.states.length===2&&Fable.document.activeStateId==='nightfall'&&Fable.document.atmosphere.length===2);}
    if(capture?.scene==='fog'){
      $('load-outdoor').click();closeDialog('replace-dialog','replace');const fogDoc=structuredClone(Fable.document);fogDoc.name='Fog rendering check';fogDoc.ambient=30;fogDoc.fog=65;
      const points=[];for(let row=0;row<5;row++){const y=180+row*230;points.push({x:row%2?1450:80,y},{x:row%2?80:1450,y});}
      fogDoc.atmosphere=[{material:'fog',points,size:250,opacity:65,alpha:'cloud',softness:85,spacing:12,scatter:10,jitter:70,seed:191,order:fogDoc.paintSequence++}];
      fogDoc.lights=[{x:450,y:500,type:'faerie',radius:380,intensity:155,color:'#6699ff',falloff:70,bloom:15},{x:1100,y:850,type:'lantern',radius:350,intensity:160,color:'#ffc17b',falloff:65,bloom:20}];Fable.importProject(fogDoc);
      check('Large-area fog capture covers multiple former texture tiles',Fable.document.atmosphere[0].points.length===10);
    }
    if(capture?.theme)$('ui-'+capture.theme).click();
    if(capture?.tool){tool(capture.tool);if(capture.tool==='terrain')document.querySelector('[data-material="grass"]').click();if(capture.tool==='wall')document.querySelector('[data-material="stone"]').click();}
    $('toast').hidden=true;
    return JSON.stringify({passed:true,checks:results,exportedPNG:Fable.exportPNG(2,false,'none').split(',')[1]});
  } catch(error) {return JSON.stringify({passed:false,error:error.message,checks:results});}
})();

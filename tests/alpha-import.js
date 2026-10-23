(async()=>{
  const checks=[],original=Fable.document;
  const check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
  try{
    const {runAtmosphereChecks}=await import('../tests/atmosphere-render.js');runAtmosphereChecks(check);
    const {importAlphaFile,prepareAlphas,baseAlpha}=await import('./alphas.js');
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle='#000';c.fillRect(0,0,128,64);c.fillStyle='#fff';c.fillRect(0,0,64,64);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));const alpha=await importAlphaFile(new File([blob],'Half mask.png',{type:'image/png'}));
    check('Opaque non-square alpha images normalize into portable PNG assets',alpha.data.startsWith('data:image/png;base64,')&&alpha.name==='Half mask');
    await prepareAlphas([alpha]);const tip=baseAlpha(alpha.id),pixels=tip.getContext('2d').getImageData(0,0,256,256).data;
    check('Imported alpha uses white as paint and black as transparency',pixels[(128*256+64)*4+3]>240&&pixels[(128*256+192)*4+3]<10);
    const doc=structuredClone(original);doc.alphaAssets.push(alpha);doc.terrain.push({material:'snow',points:[{x:220,y:220}],size:100,alpha:alpha.id,opacity:100,softness:0,order:doc.paintSequence++});check('Imported alpha brushes survive project validation',Fable.importProject(JSON.stringify(doc)));await prepareAlphas(doc.alphaAssets);const importedPNG=Fable.exportPNG(1,false,'none');check('Imported alpha remains in the portable project',Fable.document.alphaAssets.some(a=>a.id===alpha.id));
    doc.terrain.at(-1).alpha='round';Fable.importProject(doc);check('Imported alpha changes actual painted pixels',Fable.exportPNG(1,false,'none')!==importedPNG);
    let rejected=false;try{await importAlphaFile(new File(['no'],'bad.svg',{type:'image/svg+xml'}));}catch{rejected=true;}check('Unsupported alpha file formats are rejected',rejected);
    Fable.importProject(original);document.getElementById('map').dispatchEvent(new PointerEvent('pointerleave'));document.getElementById('toast').hidden=true;
    window.webkit.messageHandlers.native.postMessage(JSON.stringify({type:'alpha-test-result',passed:true,checks}));
  }catch(error){Fable.importProject(original);window.webkit.messageHandlers.native.postMessage(JSON.stringify({type:'alpha-test-result',passed:false,error:error.message,checks}));}
})();

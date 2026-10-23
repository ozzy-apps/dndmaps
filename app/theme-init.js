// Apply the editor preference before CSS paints. Map lighting is independent.
(() => {
  let value=window.__FABLE_PREFERENCES__;
  try {value=value||JSON.parse(localStorage.getItem('fable-preferences-v1')||'null');}catch{}
  const theme=window.__FABLE_SMOKE__?'light':value?.uiTheme||'dark';
  document.documentElement.dataset.uiTheme=theme==='dark'?'dark':'light';
})();

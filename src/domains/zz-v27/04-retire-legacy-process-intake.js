/* MouldMaster legacy process-intake retirement boundary — 2026.09.08.27 */
(function(){
'use strict';
const VERSION='2026.09.08.27';
const D=window.MM_PROCESS_DATA_DIAGNOSTICS;
const STRICT=window.MM_PROCESS_DATA_LOCAL_INTAKE;
if(!D||STRICT?.version!==VERSION)throw new Error('retire-legacy-process-intake-v27 requires the strict v27 intake layer');
function retire(){document.querySelectorAll('[data-pdi-launch],[data-pdi-root]').forEach(el=>el.remove())}
const baseOpen=typeof D.open==='function'?D.open.bind(D):null;
if(baseOpen&&!D.open.__mmV27LegacyRetirement){
  const wrapped=function(){const r=baseOpen();requestAnimationFrame(retire);return r};
  wrapped.__mmV27LegacyRetirement=true;
  D.open=wrapped;
}
retire();
const host=document.getElementById('processDataLabs');
if(host&&typeof MutationObserver==='function'){
  const observer=new MutationObserver(()=>retire());
  observer.observe(host,{subtree:true,childList:true});
  window.__MM_V27_PROCESS_INTAKE_RETIRE_OBSERVER=observer;
}
window.MM_PROCESS_DATA_LEGACY_INTAKE_RETIRED=Object.freeze({version:VERSION,selectors:'[data-pdi-launch],[data-pdi-root]',status:'retired'});
})();

/* MouldMaster canonical product areas — 2026.09.03 */
(function(){
'use strict';
if(window.MM_PRODUCT_AREAS)return;
const VERSION='2026.09.03.1';
const AREAS=Object.freeze([
  {id:'learn',label:'Learn',description:'Lessons, specialist learning, practice and assessment.',icon:'◫'},
  {id:'materials',label:'Materials',description:'Material families now; exact commercial-grade evidence as the catalogue is published.',icon:'⬡'},
  {id:'diagnose',label:'Diagnose',description:'Build an evidence-led Mould Master troubleshooting case.',icon:'⌕'},
  {id:'analyse',label:'Analyse',description:'Prepare and interpret local machine, cavity and quality process data.',icon:'⌁'},
  {id:'evidence',label:'Evidence',description:'Inspect references, source provenance and evidence maturity.',icon:'≡'}
]);

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function coreView(id){try{if(typeof switchView==='function')switchView(id)}catch(err){console.warn('[MouldMaster product areas]',err)}}
function open(id){
  if(id==='learn'){coreView('path');return}
  if(id==='materials'){coreView('materials');return}
  if(id==='diagnose'){window.MM_MOULD_MASTER_WORKSPACE?.open?.();return}
  if(id==='analyse'){window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.();return}
  if(id==='evidence'){
    if(window.MM_REFERENCE_BROWSER?.open)window.MM_REFERENCE_BROWSER.open();
    else if(window.MM_REFERENCE_DATA?.open)window.MM_REFERENCE_DATA.open();
    else coreView('standards');
  }
}
function install(){
  // Product-area routing remains available through MM_PRODUCT_AREAS.open(), but
  // the canonical Home registry owns learner-facing composition.
  return true;
}
window.MM_PRODUCT_AREAS=Object.freeze({version:VERSION,areas:AREAS,open,install});
})();

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
function render(slot){
  slot.innerHTML=`<section class="card mm-product-areas" aria-label="MouldMaster product areas"><div class="mm-product-areas-head"><div><span class="eyebrow">One platform · five jobs</span><h2>What do you need to do?</h2><p>Start from the engineering task rather than the internal module structure.</p></div></div><div class="mm-product-area-grid">${AREAS.map(a=>`<button type="button" class="mm-product-area" data-mm-product-area="${esc(a.id)}"><span class="icon" aria-hidden="true">${esc(a.icon)}</span><b>${esc(a.label)}</b><small>${esc(a.description)}</small></button>`).join('')}</div><div class="mm-product-boundary">Materials distinguishes family-level learning from published exact-grade evidence. Diagnose and Analyse remain evidence-organising tools, not universal production recipes.</div></section>`;
  slot.querySelectorAll('[data-mm-product-area]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.mmProductArea)));
}
function install(){
  const shell=window.MM_APP_SHELL;
  if(shell?.dashboard?.register){
    shell.dashboard.register({id:'product-areas-v1',zone:'before',order:8,render});
    return true;
  }
  return false;
}
if(!install())window.addEventListener('mm:domains-ready',install,{once:true});
window.MM_PRODUCT_AREAS=Object.freeze({version:VERSION,areas:AREAS,open,install});
})();

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
function style(){if(document.getElementById('mm-product-areas-style'))return;const s=document.createElement('style');s.id='mm-product-areas-style';s.textContent=`
.mm-product-areas{padding:18px}.mm-product-areas-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:12px}.mm-product-areas-head h2{margin:3px 0 0}.mm-product-areas-head p{margin:5px 0 0;color:var(--muted);max-width:760px}.mm-product-area-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.mm-product-area{min-height:125px;text-align:left;padding:13px;border:1px solid #304b69;border-radius:12px;background:#0e1d31;color:#edf5ff}.mm-product-area:hover,.mm-product-area:focus-visible{background:#142843;border-color:#4c739c}.mm-product-area .icon{display:block;font-size:20px;margin-bottom:9px;color:var(--accent)}.mm-product-area b{display:block;font-size:14px}.mm-product-area small{display:block;color:#aebfd3;line-height:1.4;margin-top:5px}.mm-product-boundary{margin-top:10px;color:var(--muted);font-size:11px;line-height:1.45}@media(max-width:1050px){.mm-product-area-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.mm-product-area-grid{grid-template-columns:1fr 1fr}.mm-product-areas{padding:15px}.mm-product-areas-head{display:block}}
`;document.head.appendChild(s)}
function render(slot){
  style();
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
if(!install()){
  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(timer)},50);
}
window.MM_PRODUCT_AREAS=Object.freeze({version:VERSION,areas:AREAS,open,install});
})();

/* MouldMaster ISO 9001 QMS support — 2026.09.15.1 */
(function(){
'use strict';
const DATA_URL='./src/domains/quality/data/quality-management-iso9001-v1.json';
let cached=null,loading=null;
const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const words=v=>String(v||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
function load(){
  if(cached)return Promise.resolve(cached);
  if(loading)return loading;
  loading=fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`QMS support data unavailable (${r.status})`);return r.json()})
    .then(data=>{
      if(data?.schema!==1||data?.id!=='mouldmaster-iso9001-qms-support')throw new Error('QMS support identity mismatch');
      cached=data;return data;
    }).finally(()=>{loading=null});
  return loading;
}
function standardSummary(data){
  const req=data.standards.find(x=>x.role==='current-published-requirements-basis');
  const amd=data.standards.find(x=>x.role==='current-published-amendment');
  const vocab=data.standards.find(x=>x.role==='current-terminology-basis');
  const next=data.standards.find(x=>x.role==='transition-watch');
  return `<div class="card"><span class="eyebrow">Current basis</span><h3>${esc(req?.title||'ISO 9001')}</h3>
    <p>${esc(amd?.title||'Current amendment')} remains part of the published requirements basis. ${esc(vocab?.title||'ISO 9000')} supplies the current vocabulary.</p>
    <p><b>Transition watch:</b> ${esc(next?.title||'next ISO 9001 edition')} is recorded as <b>${esc(words(next?.currentState||''))}</b>. MouldMaster does not treat it as published requirements until ISO does.</p></div>`;
}
function supportMap(data){
  return `<div class="grid2">${data.supportMap.map(row=>`<article class="card">
    <span class="eyebrow">Clause ${esc(row.clause)} · ${esc(words(row.supportLevel))}</span>
    <h3>${esc(row.theme)}</h3>
    <p><b>MouldMaster can support:</b> ${row.mouldmasterSupport.map(esc).join('; ')}.</p>
    <p><b>It does not provide:</b> ${row.notProvided.map(esc).join('; ')}.</p>
  </article>`).join('')}</div>`;
}
function recordTemplates(data){
  return data.recordTemplates.map(t=>`<details class="card">
    <summary><b>${esc(t.title)}</b></summary>
    <p>${esc(t.purpose)}</p>
    <p><b>Suggested fields:</b> ${t.fields.map(x=>`<code>${esc(x)}</code>`).join(', ')}</p>
    <p><b>States:</b> ${t.states.map(esc).join(' → ')}</p>
    <ul>${t.rules.map(rule=>`<li>${esc(rule)}</li>`).join('')}</ul>
  </details>`).join('');
}
function sources(data){
  return `<div class="grid2">${data.standards.map(s=>`<a class="card" href="${esc(s.url)}" target="_blank" rel="noopener">
    <span class="eyebrow">${esc(words(s.role))}</span><h3>${esc(s.title)}</h3><p>${esc(s.note)}</p>
  </a>`).join('')}</div>`;
}
function renderInto(host,data){
  if(host.querySelector('[data-mm-iso9001-qms]'))return;
  const flow=data.workflow.nonconformityToEffectiveness.map((x,i)=>`<li><b>${i+1}.</b> ${esc(words(x))}</li>`).join('');
  const section=document.createElement('section');
  section.className='mm-qms-support';
  section.dataset.mmIso9001Qms='1';
  section.innerHTML=`<div class="section-head"><div><span class="eyebrow">Quality management</span><h2>ISO 9001 support — evidence, not certification</h2>
    <p>MouldMaster supports quality-management practices relevant to ISO 9001. It does not establish organisational conformity, certification, accreditation or auditor approval.</p></div></div>
    <div class="grid2">${standardSummary(data)}<div class="card"><span class="eyebrow">Use boundary</span><h3>What this layer is for</h3>
      <p>${esc(data.purpose)}</p><p>${esc(data.copyrightBoundary)}</p><p><b>Privacy:</b> ${esc(data.privacyBoundary)}</p></div></div>
    <div class="section-head"><div><span class="eyebrow">Clause-to-feature map</span><h2>Where MouldMaster can help</h2>
      <p>This is a paraphrased support map, not ISO requirement text and not an audit checklist.</p></div></div>
    ${supportMap(data)}
    <div class="section-head"><div><span class="eyebrow">Evidence templates</span><h2>Records that preserve the decision trail</h2>
      <p>These are field templates for learning and QMS design. They do not become controlled organisational records merely by being completed in MouldMaster.</p></div></div>
    ${recordTemplates(data)}
    <div class="grid2"><div class="card"><span class="eyebrow">NCR / CAPA flow</span><h3>From detection to effectiveness</h3><ol>${flow}</ol>
      <p>${esc(data.workflow.evidenceRule)}</p></div>
      <div class="card"><span class="eyebrow">Transition control</span><h3>Edition 6 is a watch item</h3><p>${esc(data.transitionRule)}</p></div></div>
    <div class="section-head"><div><span class="eyebrow">Official sources</span><h2>Check ISO status before formal use</h2></div></div>
    ${sources(data)}`;
  host.appendChild(section);
}
async function render(){
  const host=document.getElementById('standards');
  if(!host||host.querySelector('[data-mm-iso9001-qms]'))return;
  try{renderInto(host,await load())}catch(err){console.warn('[MouldMaster] ISO 9001 QMS support:',err)}
}
function schedule(){(window.requestAnimationFrame||setTimeout)(render)}
const mo=new MutationObserver(schedule);
if(document.documentElement)mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
window.MM_ISO9001_QMS=Object.freeze({version:'2026.09.15.1',dataUrl:DATA_URL,load,render});
})();

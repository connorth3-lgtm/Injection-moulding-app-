/* MouldMaster authoritative source library — 2026.08.24.1 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const SOURCES={
 safety:[
  ['ISO 20430:2020','Injection moulding machine safety requirements.','https://www.iso.org/standard/68000.html'],
  ['HSE — Plastics industry guidance','UK plastics-processing safety guidance index including PPIS4 and PPIS13.','https://www.hse.gov.uk/pubns/plasindx.htm'],
  ['HSE PPIS4(rev1)','Safety at injection moulding machines.','https://www.hse.gov.uk/pubns/ppis4.pdf'],
  ['HSE PPIS13(rev1)','Controlling fume during plastics processing.','https://www.hse.gov.uk/pubns/ppis13.pdf'],
  ['OSHA Injection Molding eTool','US horizontal injection-moulding safeguarding and hazard guidance.','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'],
  ['OSHA 1910.212','General machine-guarding requirements.','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212'],
  ['OSHA 1910.147','Control of hazardous energy (lockout/tagout).','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'],
  ['OSHA 1910.1200','Hazard Communication standard.','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200'],
  ['WorkSafe NZ — Safe use of machinery','Current NZ machinery risk-management and safeguarding guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'],
  ['WorkSafe NZ — Machine lockouts','Current NZ de-energisation and lockout guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/']
 ],
 law:[
  ['UK — PUWER 1998','Official text of the Provision and Use of Work Equipment Regulations 1998.','https://www.legislation.gov.uk/uksi/1998/2306/contents'],
  ['UK — COSHH 2002','Official text of the Control of Substances Hazardous to Health Regulations 2002.','https://www.legislation.gov.uk/uksi/2002/2677/contents'],
  ['NZ — Health and Safety at Work Act 2015','Official NZ legislation source for PCBU duties and SFAIRP framework.','https://www.legislation.govt.nz/act/public/2015/70/en/latest/']
 ],
 materials:[
  ['ISO 1133-1:2022','MFR/MVR testing under specified conditions.','https://www.iso.org/standard/83905.html'],
  ['ASTM D1238','Melt-flow-rate test method for thermoplastics.','https://store.astm.org/standards/d1238'],
  ['ISO 294-1:2017','General principles for injection moulding thermoplastic test specimens.','https://www.iso.org/standard/67036.html'],
  ['Covestro — Drying for injection moulding','Manufacturer technical background on moisture, drying and hydrolysis-sensitive materials.','https://solutions.covestro.com/-/media/covestro/solution-center/whitepapers/injection-molding-of-high-quality-molded-parts-drying.pdf'],
  ['Trotta et al. (2021)','Injection-moulding rheology and high-shear behaviour.','https://doi.org/10.1016/j.polymertesting.2021.107068'],
  ['Hu et al. (2022)','Cooling-rate effects on polypropylene crystallisation.','https://doi.org/10.3390/polym14173646']
 ],
 process:[
  ['Zhao et al. (2022)','Review of warpage, shrinkage and interacting injection-moulding process parameters.','https://pubmed.ncbi.nlm.nih.gov/35194289/'],
  ['Autodesk Moldflow — Cooling stage','Cooling-stage heat-removal and solidification background.','https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html'],
  ['Autodesk Moldflow — Packing guidance','Packing/hold and gate-freeze simulation background.','https://help.autodesk.com/view/MOLDFLOW/2013/ENU/caas.html?url=caas%2Fvhelp%2Fhelp-dev-autodesk-com%2Fv%2FSimulation-Moldflow%2Fenu%2F2013%2FHelp%2F3Insight-360%2F3927-Process-3927%2F3933-Profiles3933%2F3945-Packing-3945.html']
 ],
 sensors:[
  ['Araújo et al. (2023)','In-cavity pressure measurement for injection-moulding diagnosis and simulation correlation.','https://link.springer.com/article/10.1007/s00170-023-11100-1'],
  ['Párizs et al. (2023)','Multiple in-mould sensors for quality and process control.','https://pmc.ncbi.nlm.nih.gov/articles/PMC9920048/'],
  ['Kovács et al. (2019)','Review of in-mould sensors for injection moulding and Industry 4.0.','https://pubmed.ncbi.nlm.nih.gov/31443164/'],
  ['Weinert et al. (2023)','Condition monitoring of injection-mould tooling.','https://pmc.ncbi.nlm.nih.gov/articles/PMC9966701/']
 ],
 stats:[
  ['NIST Engineering Statistics Handbook','Engineering statistics, measurement, capability and DOE reference.','https://www.itl.nist.gov/div898/handbook/'],
  ['NIST — Process capability','Capability concepts and interpretation prerequisites.','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'],
  ['NIST — Experimental design','Factors, interactions, randomisation and blocking.','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'],
  ['ISO 22514-2:2026','Process capability and performance for time-dependent process models.','https://www.iso.org/standard/88883.html'],
  ['ISO 22514-7:2021','Capability of measurement processes; recheck ISO status before formal use because a replacement edition was progressing in 2026.','https://www.iso.org/standard/80624.html']
 ]
,
 quality:[
  ['ISO 9001:2015','Current published quality-management-system requirements basis; use with Amendment 1:2024 until superseded.','https://www.iso.org/standard/62085.html'],
  ['ISO 9001:2015/Amd 1:2024','Published climate-action amendment applying to ISO 9001:2015.','https://www.iso.org/standard/88431.html'],
  ['ISO 9000:2026','Current published quality-management fundamentals and vocabulary.','https://www.iso.org/standard/9000'],
  ['ISO 9001 Edition 6 (2026)','Transition watch only: ISO listed this edition as under publication when checked 2026-09-15.','https://www.iso.org/standard/9001']
 ]
};
function categories(text){const t=String(text||'').toLowerCase(),out=[];
 if(/guard|safety|interlock|lockout|isolation|hazard|robot|cell|fume|emergency/.test(t))out.push('safety');
 if(/puwer|coshh|hswa|law|legal|pcbu|regulation/.test(t))out.push('law');
 if(/material|polymer|resin|rheolog|viscos|mfr|mvr|moisture|dry|crystalli|degrad|regrind/.test(t))out.push('materials');
 if(/pack|hold|gate|cool|thermal|shrink|warpage|fill|flow|pressure|cavity|runner|vent|burn|weld|sink/.test(t))out.push('process');
 if(/sensor|cavity pressure|monitor|trace|industry 4|condition monitoring/.test(t))out.push('sensors');
 if(/capability|cpk|ppk|doe|statistics|measurement|random|factorial|validation|sampling|msa/.test(t))out.push('stats');
 if(/quality management|qms|audit|nonconform|capa|competence|corrective|calibrat|document control/.test(t))out.push('quality');
 return [...new Set(out)];}
function select(text,limit=5){const out=[];for(const cat of categories(text))for(const s of SOURCES[cat]||[])if(!out.some(x=>x[2]===s[2]))out.push(s);return out.slice(0,limit)}
function panel(text){const src=select(text);if(!src.length)return '';return `<section class="mm-ref-panel mm-authoritative-more" data-mm-authoritative-sources="1"><span class="eyebrow">More authoritative sources</span><h3>Verify and go deeper</h3>${src.map(s=>`<a href="${esc(s[2])}" target="_blank" rel="noopener"><b>${esc(s[0])}</b><small>${esc(s[1])}</small><em>Open ↗</em></a>`).join('')}<p>These sources support principles and obligations, not universal process settings. Current material data, machine/tool documentation, approved site procedures and applicable law control specific limits.</p></section>`}
function lesson(){const article=document.querySelector('#lesson article.lesson-body');if(!article||article.querySelector('[data-mm-authoritative-sources]'))return;const title=article.querySelector('h2')?.textContent||'';const body=[...article.querySelectorAll('h3')].map(x=>x.textContent).join(' ');const html=panel(title+' '+body);if(html)article.insertAdjacentHTML('beforeend',html)}
function standards(){const host=document.getElementById('standards');if(!host||host.querySelector('[data-mm-authoritative-sources]'))return;const region=(window.user&&window.user.region)||'ALL';let text='safety law';if(region==='UK')text+=' puwer coshh';if(region==='US')text+=' osha lockout hazard';if(region==='NZ')text+=' hswa pcbu worksafe';const html=panel(text);if(html)host.insertAdjacentHTML('beforeend',html)}
function run(){lesson();standards()}
const mo=new MutationObserver(()=>requestAnimationFrame(run));if(document.documentElement)mo.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
window.MM_SOURCE_LIBRARY=SOURCES;
})();

/* MouldMaster ISO 9001 QMS support — 2026.09.15.2 */
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
window.MM_ISO9001_QMS=Object.freeze({version:'2026.09.15.2',dataUrl:DATA_URL,load,render});
})();

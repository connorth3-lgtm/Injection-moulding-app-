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
};
function categories(text){const t=String(text||'').toLowerCase(),out=[];
 if(/guard|safety|interlock|lockout|isolation|hazard|robot|cell|fume|emergency/.test(t))out.push('safety');
 if(/puwer|coshh|hswa|law|legal|pcbu|regulation/.test(t))out.push('law');
 if(/material|polymer|resin|rheolog|viscos|mfr|mvr|moisture|dry|crystalli|degrad|regrind/.test(t))out.push('materials');
 if(/pack|hold|gate|cool|thermal|shrink|warpage|fill|flow|pressure|cavity|runner|vent|burn|weld|sink/.test(t))out.push('process');
 if(/sensor|cavity pressure|monitor|trace|industry 4|condition monitoring/.test(t))out.push('sensors');
 if(/capability|cpk|ppk|doe|statistics|measurement|random|factorial|validation|sampling|msa/.test(t))out.push('stats');
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

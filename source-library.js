/* MouldMaster authoritative source library — 2026.08.25.2 */
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
const COURSE_SOURCE_IDS={
 'Foundations':['autodesk-fill-pack','iso-20430'],
 'Machine & Controls':['autodesk-fill-pack','liew-2022','iso-20430'],
 'Materials':['iso-1133','trotta-2021','covestro-drying'],
 'Mould Design':['autodesk-fill-pack','autodesk-cooling','zhao-2022'],
 'Process Setup':['autodesk-fill-pack','autodesk-molding-window','jansen-1998'],
 'Defect Troubleshooting':['basf-troubleshooter','autodesk-fill-pack','araujo-2023'],
 'Scientific Moulding':['trotta-2021','jansen-1998','araujo-2023','nist-doe'],
 'Capability & Validation':['nist-capability','nist-handbook'],
 'DOE & Statistics':['nist-doe','nist-handbook'],
 'Automation & Sensors':['liew-2022','araujo-2023','euromap-79','iso-20430'],
 'Advanced Tooling & Simulation':['autodesk-molding-window','autodesk-fill-pack','hotrunner-2024','araujo-2023'],
 'Expert Process Engineering':['nist-handbook','autodesk-molding-window','iso-20430']
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
function evidenceById(id){const s=window.MM_EVIDENCE_SOURCES?.sources?.[id];return s?[s.name,`${s.kind} · ${s.authority}`,s.url]:null}
function lessonSources(text,course,limit=5){const out=[];const add=s=>{if(s&&/^https:\/\//.test(s[2])&&!out.some(x=>x[2]===s[2]))out.push(s)};
 for(const s of select(text,limit))add(s);
 for(const s of window.MM_EVIDENCE_SOURCES?.inferred?.(text)||[])add([s.name,`${s.kind} · ${s.authority}`,s.url]);
 for(const id of COURSE_SOURCE_IDS[course]||[])add(evidenceById(id));
 return out.slice(0,limit)}
function linkHtml(s){return `<a href="${esc(s[2])}" target="_blank" rel="noopener" data-mm-lesson-evidence="1"><b>${esc(s[0])}</b><small>${esc(s[1])}</small><em>Open ↗</em></a>`}
function panel(text){const src=select(text);if(!src.length)return '';return `<section class="mm-ref-panel mm-authoritative-more" data-mm-authoritative-sources="1"><span class="eyebrow">More authoritative sources</span><h3>Verify and go deeper</h3>${src.map(linkHtml).join('')}<p>These sources support principles and obligations, not universal process settings. Current material data, machine/tool documentation, approved site procedures and applicable law control specific limits.</p></section>`}
function enrichLessonPanel(article,src){if(!src.length)return;const panels=[...article.querySelectorAll('.mm-ref-panel')],target=panels.find(p=>/Evidence\s*&\s*further reading/i.test(p.textContent||''));if(!target){article.insertAdjacentHTML('beforeend',`<section class="mm-ref-panel" data-mm-lesson-evidence-expanded="1"><span class="eyebrow">References</span><h3>Evidence & further reading</h3>${src.map(linkHtml).join('')}<p>Use these sources to understand mechanisms and methods. Exact resin grade data, machine/tool documentation, approved site procedures and applicable law control real production limits.</p></section>`);return}
 if(target.dataset.mmLessonEvidenceExpanded==='1')return;
 const hrefs=new Set([...target.querySelectorAll('a[href]')].map(a=>a.href));
 const fallback=[...target.querySelectorAll('p')].find(p=>/No general external source was auto-selected/i.test(p.textContent||''));if(fallback)fallback.remove();
 const existingCount=hrefs.size,missing=src.filter(s=>!hrefs.has(new URL(s[2],location.href).href)).slice(0,Math.max(0,5-existingCount));
 if(missing.length){const block=document.createElement('div');block.className='mm-lesson-evidence-links';block.innerHTML=missing.map(linkHtml).join('');const firstP=target.querySelector('p');firstP?target.insertBefore(block,firstP):target.appendChild(block)}
 if(!target.querySelector('[data-mm-evidence-boundary]')){const p=document.createElement('p');p.dataset.mmEvidenceBoundary='1';p.textContent='These sources support mechanisms and study methods, not universal production settings. Verify the exact resin grade, machine and mould documentation, approved site procedures and applicable law for real work.';target.appendChild(p)}
 target.dataset.mmLessonEvidenceExpanded='1'}
function lesson(){const article=document.querySelector('#lesson article.lesson-body');if(!article)return;const title=article.querySelector('h2')?.textContent||'',body=[...article.querySelectorAll('h3')].map(x=>x.textContent).join(' '),row=(window.MM_DATA?.lessons||[]).find(x=>x.title===title),course=row?.courseName||'';const context=[course,title,body,row?.mmGuide?.plain,row?.mmGuide?.evidence].filter(Boolean).join(' ');const src=lessonSources(context,course,5);enrichLessonPanel(article,src)}
function standards(){const host=document.getElementById('standards');if(!host||host.querySelector('[data-mm-authoritative-sources]'))return;const region=(window.user&&window.user.region)||'ALL';let text='safety law';if(region==='UK')text+=' puwer coshh';if(region==='US')text+=' osha lockout hazard';if(region==='NZ')text+=' hswa pcbu worksafe';const html=panel(text);if(html)host.insertAdjacentHTML('beforeend',html)}
function run(){lesson();standards()}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;run()},0)}
const mo=new MutationObserver(schedule);if(document.documentElement)mo.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
window.MM_SOURCE_LIBRARY={version:'2026.08.25.2',sources:SOURCES,courseFallbacks:COURSE_SOURCE_IDS,select,lessonSources};
})();
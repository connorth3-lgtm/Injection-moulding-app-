/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Audit remediation evidence/process runtime pack. Exact concatenation; historical execution order preserved.
 */

/* >>> source-library.js */
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
/* <<< source-library.js */

/* >>> measured-evidence-integration.js */
/* MouldMaster canonical measured-evidence runtime bridge — 2026.08.30.1 */
(function(){
'use strict';
const VERSION='2026.08.30.1';
const CANONICAL={inventoried:34,rightsExecutable:21,fullyProfiled:17,timeSeriesValues:85569824};
const FAMILIES=[
 {id:'mendeley-gtnb4j7bfx-v1',title:'Injection production records',kind:'record-level production',scale:'4,502 injection records profiled',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/gtnb4j7bfx.1',topics:['quality','reject','flash','product weight','melt temperature','mould temperature','mold temperature','cycle time','cooling','injection pressure','hold pressure','injection speed','production'],boundary:'Production-order/run-level records are not assumed to be shot-resolved; correlations do not prove root cause or a validated process window.'},
 {id:'scatimdata-avaps',title:'AVAPS high-resolution injection traces',kind:'process waveform',scale:'13,631,488 accepted pressure/flow values',timeSeries:13631488,rights:'CC BY 4.0',restricted:false,source:'https://github.com/sc4t1m/scatimdata',topics:['injection pressure','pressure curve','flow curve','fill','filling','part weight','dimension','cycle','process trace','waveform','transfer'],boundary:'Accepted counts use the 2,048 values actually delivered per linked trace, not the paper-reported 2,049; these experiments do not establish universal settings.'},
 {id:'openmms-t4g',title:'OpenMMS-T4G mould monitoring',kind:'mould/sensor waveform',scale:'298,080 accepted sensor values',timeSeries:298080,rights:'BSD-3-Clause',restricted:false,source:'https://github.com/TEPGomes/OpenMMS-T4G',topics:['cavity pressure','temperature','extraction force','ejection','acceleration','vibration','angular velocity','tooling','mould monitoring','mold monitoring','condition monitoring','fault'],boundary:'One monitored experimental campaign, including a simulated extraction-system fault; it supports condition-monitoring learning but not a universal machine-health diagnosis.'},
 {id:'cross-process-chain-17240390',title:'Cross-process injection chain',kind:'process waveform',scale:'51,241,491 accepted injection-process values',timeSeries:51241491,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.5281/zenodo.17240390',topics:['injection pressure','velocity','volume','recyclate','glass fibre','glass fiber','process chain','state','lower workpiece','upper workpiece','fill','waveform'],boundary:'Only source-defined injection-moulding measurements are accepted; commands, screw-driving streams and unresolved upper pressure/state semantics remain excluded.'},
 {id:'impure-pascoe-2022',title:'ImPure PASCOE cavity sensing',kind:'cavity-sensor waveform',scale:'1,188,348 accepted cavity pressure/temperature values',timeSeries:1188348,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.5281/zenodo.6913660',topics:['cavity pressure','cavity temperature','mould temperature','mold temperature','sensor','pressure','temperature','medical','cycle','pascoe','process trace'],boundary:'Only two cavity-pressure and two cavity-temperature channels have sufficient source semantics; hydraulic pressure, screw position and analogue inputs remain excluded.'},
 {id:'forinfpro-himd-v1',title:'FORinFPRO hybrid moulding machine temperatures',kind:'machine-temperature waveform',scale:'162,112 accepted heating-zone temperature values',timeSeries:162112,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.5281/zenodo.20744054',topics:['temperature','heating zone','barrel','machine temperature','hybrid moulding','hybrid molding','organosheet','glass fibre','glass fiber','engel','thermal'],boundary:'Sixteen ENGEL heating-zone actual-temperature channels are accepted; zone location is machine-specific and other machine/in-mould/ultrasonic fields remain excluded pending semantics.'},
 {id:'iguzzini-road-lenses',title:'Road-lens production quality records',kind:'record-level process/quality',scale:'1,451 production rows · 18,863 measured process values',timeSeries:0,rights:'Research & education release terms',restricted:true,source:'https://github.com/airtlab/machine-learning-for-quality-prediction-in-plastic-injection-molding',topics:['quality','classification','melt temperature','mould temperature','mold temperature','fill time','cycle time','clamping force','back pressure','injection pressure','screw position','shot volume','torque','production'],boundary:'Research-and-education use only; record-level evidence, not waveform evidence, and raw redistribution rights are not widened.'},
 {id:'mendeley-fhj5p7ww9v-v1',title:'PP/composite/foam measured outcomes',kind:'record-level material outcomes',scale:'96 accepted weight/flexural outcome values',timeSeries:0,rights:'CC BY-NC 3.0',restricted:true,source:'https://doi.org/10.17632/fhj5p7ww9v.1',topics:['polypropylene','pp','foam','composite','flexural strength','flexural modulus','weight','mechanical property','material'],boundary:'Noncommercial education/research only; values are source-reported outcomes by condition, not raw replicates or process waveforms.'},
 {id:'mendeley-6k8fpbrd9s-v1',title:'Polypropylene pvT characterisation',kind:'material characterisation',scale:'28,590 direct physical pvT cells profiled',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/6k8fpbrd9s.1',topics:['polypropylene','pp','pvt','specific volume','pressure','temperature','shrinkage','material','rheology','thermal'],boundary:'Material-characterisation evidence rather than injection-cycle waveform evidence; cross-figure reuse may exist, so no deduplicated experiment count is claimed.'},
 {id:'mendeley-4h98rz9f92-v3',title:'Injection-moulded material property records',kind:'record-level material properties',scale:'525 accepted direct measured property values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/4h98rz9f92.3',topics:['material property','mechanical','injection moulded','injection molded','specimen','strength','property','material'],boundary:'Only direct measured property values are represented; 105 derived averages are excluded from direct-measurement counts.'},
 {id:'pmc4753395-hdpe-cenosphere-v1',title:'HDPE/cenosphere mechanical traces',kind:'material-test trace',scale:'142,884 accepted stress/strain trace values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.1016/j.dib.2016.01.058',topics:['hdpe','cenosphere','stress','strain','tensile','mechanical','composite','material','strength','modulus'],boundary:'Mechanical specimen-test traces are material evidence, not injection-machine/cavity time-series values.'},
 {id:'mendeley-8c8fjwcw86-v1',title:'Injection-moulded Nylon 12 XRD',kind:'material characterisation',scale:'6,588 accepted XRD intensity values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/8c8fjwcw86.1',topics:['nylon 12','pa12','xrd','crystallinity','crystal','material','characterisation','characterization','structure'],boundary:'Only the series explicitly identified as injection-moulded Nylon 12 is accepted; the category/axis values do not inflate the measurement count.'},
 {id:'mendeley-yxz2w7ctnh-v1',title:'Injection-moulded ABS/PLA mechanical testing',kind:'record-level mechanical testing',scale:'489 accepted tensile/bending values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/yxz2w7ctnh.1',topics:['abs','pla','tensile','bending','mechanical','strength','injection moulded','injection molded','material','specimen'],boundary:'Only route-explicit injection-moulded tensile and bending measurements are accepted; other manufacturing-route or unsupported outcome data are excluded.'},
 {id:'mendeley-crmb7xjymg-v1',title:'XPS material/tool-interface characterisation',kind:'material/tool characterisation',scale:'71,868 accepted XPS count values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/crmb7xjymg.1',topics:['xps','surface','interface','tool','mould surface','mold surface','material','chemistry','characterisation','characterization'],boundary:'XPS signal counts are accepted; energy axes, calibration and transmission variables are not counted as direct measurements.'},
 {id:'mendeley-ypf95p4bs4-v1',title:'Injection operations time-study',kind:'record-level operations',scale:'666 accepted observed operation durations',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/ypf95p4bs4.1',topics:['maintenance','mould change','mold change','setup','downtime','cleaning','time study','operations','changeover','production'],boundary:'Direct observed operational durations only; simulation, sales, formula, financial and scheduling artefacts are excluded.'},
 {id:'mendeley-ztkc87d6sr-v1',title:'SiC/Nylon-6 tribology',kind:'record-level tribology',scale:'40 accepted friction/wear values',timeSeries:0,rights:'CC BY-NC 3.0 accepted payload',restricted:true,source:'https://doi.org/10.17632/47k6jswwg7.1',topics:['nylon 6','pa6','sic','tribology','wear','friction','coefficient of friction','material','tool interface'],boundary:'Accepted under the narrower alternate-release noncommercial licence; image-only TGA/FTIR/SEM evidence is not OCR-counted.'},
 {id:'zenodo-energy-20338544',title:'Industrial production electrical energy',kind:'industrial energy waveform',scale:'19,048,305 accepted electrical values',timeSeries:19048305,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.5281/zenodo.20338544',topics:['energy','power','current','voltage','frequency','electrical','machine load','auxiliary','base load','production','sustainability'],boundary:'Only 15 direct physical Shelly Pro 3EM channels from the accepted production streams are counted; derived totals/power factor, neutral current and the overlapping curated test subset are excluded.'}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hasTopic(text,topic){if(topic.length>3)return text.includes(topic);const safe=topic.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:^|[^a-z0-9])${safe}(?:$|[^a-z0-9])`,'i').test(text)}
function score(f,text){const t=String(text||'').toLowerCase();return f.topics.reduce((n,k)=>n+(hasTopic(t,k)?Math.max(1,k.split(' ').length):0),0)}
function select(text,limit=4){return FAMILIES.map(f=>({f,s:score(f,text)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||b.f.timeSeries-a.f.timeSeries).slice(0,limit).map(x=>x.f)}
function badge(f){return `<span class="mme-chip">${esc(f.kind)}</span><span class="mme-chip">${esc(f.rights)}</span>`}
function card(f){return `<article class="mme-card"><div class="mme-card-head"><div><b>${esc(f.title)}</b><small>${esc(f.id)}</small></div><a href="${esc(f.source)}" target="_blank" rel="noopener">Source ↗</a></div><div class="mme-chips">${badge(f)}</div><strong>${esc(f.scale)}</strong><p>${esc(f.boundary)}</p></article>`}
function style(){if(document.getElementById('mm-measured-evidence-style'))return;const s=document.createElement('style');s.id='mm-measured-evidence-style';s.textContent=`
.mme-panel{margin-top:14px;padding:16px;border:1px solid #355272;border-radius:12px;background:#0d1d31}.mme-panel h3{margin:2px 0 6px}.mme-panel>p{margin:0 0 12px;color:#b9cbe0;font-size:12px;line-height:1.55}.mme-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mme-card{padding:12px;border:1px solid #2e4968;border-radius:10px;background:#102238}.mme-card-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.mme-card-head b{display:block}.mme-card-head small{display:block;color:#8098b3;font-size:9px;margin-top:3px;overflow-wrap:anywhere}.mme-card-head a{font-size:10px;white-space:nowrap}.mme-card strong{display:block;margin:8px 0 4px;font-size:12px}.mme-card p{margin:0;color:#aebfd2;font-size:11px;line-height:1.45}.mme-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.mme-chip{font-size:9px;border:1px solid #426381;border-radius:999px;padding:3px 6px;color:#c9d9e9}.mme-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.mme-kpi{padding:9px;border:1px solid #2d4866;border-radius:9px;background:#0d1b2e;text-align:center}.mme-kpi b{display:block;font-size:18px}.mme-kpi span{font-size:9px;color:#9db2c8}.mme-all summary{cursor:pointer;font-weight:700;margin:10px 0}.mme-boundary{border-left:3px solid #d8b95c;padding-left:9px!important;color:#dfd2a4!important}.mme-workspace{margin:14px 0}.mme-restricted{color:#f1d699;font-size:10px;margin-top:8px}
@media(max-width:720px){.mme-grid{grid-template-columns:1fr}.mme-kpis{grid-template-columns:repeat(2,1fr)}}
`;document.head.appendChild(s)}
function contextText(host){const fields=[...host.querySelectorAll('input,textarea,select')].map(x=>x.value||'').join(' ');return `${host.textContent||''} ${fields}`}
function relevantPanel(text){const rows=select(text);if(!rows.length)return '';return `<section class="mme-panel" data-mm-measured-evidence="relevant"><div class="eyebrow">Canonical measured evidence</div><h3>Measured data behind this topic</h3><p>These source-profiled datasets show real measured behaviour in bounded experiments or production records. They support comparison and learning; they do not supply universal settings, prove root cause by themselves, or override the validated machine/mould/material/site process.</p><div class="mme-grid">${rows.map(card).join('')}</div></section>`}
function catalogPanel(){return `<section class="mme-panel mme-workspace" data-mm-measured-evidence="catalog"><div class="eyebrow">Measured evidence baseline</div><h3>17 fully profiled dataset families are available as evidence context</h3><div class="mme-kpis"><div class="mme-kpi"><b>${CANONICAL.fullyProfiled}</b><span>profiled families</span></div><div class="mme-kpi"><b>${CANONICAL.rightsExecutable}</b><span>rights-executable sources</span></div><div class="mme-kpi"><b>${(CANONICAL.timeSeriesValues/1e6).toFixed(1)}M</b><span>process time-series values</span></div><div class="mme-kpi"><b>${CANONICAL.inventoried}</b><span>inventoried sources</span></div></div><p class="mme-boundary">Evidence is context-specific. Record-level, material-characterisation, specimen-test and waveform evidence remain distinct; restricted educational/noncommercial rights are preserved; unresolved channels and blocked sources are not silently counted.</p><details class="mme-all"><summary>Browse all 17 measured families</summary><div class="mme-grid">${FAMILIES.map(card).join('')}</div><div class="mme-restricted">Restricted-use families are labelled explicitly; opening a source does not change its reuse terms.</div></details></section>`}
function addRelevant(host){if(!host||host.classList?.contains('hidden')||host.querySelector('[data-mm-measured-evidence="relevant"]'))return;const html=relevantPanel(contextText(host));if(html)host.insertAdjacentHTML('beforeend',html)}
function run(){
 style();
 const lesson=document.querySelector('#lesson article.lesson-body');if(lesson&&!lesson.querySelector('[data-mm-measured-evidence]')){const html=relevantPanel(contextText(lesson));if(html)lesson.insertAdjacentHTML('beforeend',html)}
 ['diagnosticLabs','processDataLabs'].forEach(id=>addRelevant(document.getElementById(id)));
 const material=[...document.querySelectorAll('.view[id]')].find(x=>/material.*lab/i.test(x.id));if(material)addRelevant(material);
 const ws=document.getElementById('mmMouldMasterWorkspace');if(ws&&!ws.classList.contains('hidden')){
   if(!ws.querySelector('[data-mm-measured-evidence="relevant"]')){const html=relevantPanel(contextText(ws));if(html)ws.insertAdjacentHTML('beforeend',html)}
   if(!ws.querySelector('[data-mm-measured-evidence="catalog"]'))ws.insertAdjacentHTML('beforeend',catalogPanel());
 }
}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;run()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();window.addEventListener('load',schedule);
window.MM_MEASURED_EVIDENCE={version:VERSION,canonical:{...CANONICAL},families:FAMILIES.map(x=>({...x,topics:[...x.topics]})),select:(text,limit=4)=>select(text,limit).map(x=>({...x,topics:[...x.topics]})),scope:'Metadata-only bridge to 17 canonically profiled measured families; no raw third-party rows, universal production recipes or root-cause authority.'};
})();
/* <<< measured-evidence-integration.js */

/* >>> measured-evidence-decision.js */
/* MouldMaster measured-evidence decision layer — 2026.08.30.3 */
(function(){
'use strict';
const VERSION='2026.08.30.3';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function base(){return window.MM_MEASURED_EVIDENCE||null}
function hasTopic(text,topic){const t=String(text||'').toLowerCase(),k=String(topic||'').toLowerCase();if(k.length>3)return t.includes(k);const safe=k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:^|[^a-z0-9])${safe}(?:$|[^a-z0-9])`,'i').test(t)}
function matchedTopics(f,text){return (f.topics||[]).filter(k=>hasTopic(text,k)).sort((a,b)=>b.length-a.length)}
function role(f){
 if(Number(f.timeSeries)>0)return {group:'direct',label:'Direct measured signal',detail:'The source contains an accepted machine, mould/cavity, sensor or energy waveform close to the decision variable.'};
 if(/production|process\/quality|operations/i.test(f.kind))return {group:'supporting',label:'Supporting process context',detail:'The source contains record-level production, quality or operational measurements rather than an intra-cycle waveform.'};
 return {group:'supporting',label:'Supporting material evidence',detail:'The source contains material, specimen, surface or tribology measurements that help interpret mechanisms but are not machine/cavity waveforms.'};
}
function explain(text,limit=4){const b=base();if(!b)return[];return b.select(text,limit).map(f=>{const matches=matchedTopics(f,text),r=role(f);return {id:f.id,title:f.title,role:r.group,roleLabel:r.label,matches,why:`${r.detail}${matches.length?` Matched topic${matches.length===1?'':'s'}: ${matches.join(', ')}.`:''}`,boundary:f.boundary,rights:f.rights,restricted:!!f.restricted,timeSeries:Number(f.timeSeries)||0}})}
function cleanContext(panel){const host=panel?.parentElement;if(!host)return'';const clone=host.cloneNode(true);clone.querySelectorAll('[data-mm-measured-evidence]').forEach(x=>x.remove());const fields=[...clone.querySelectorAll('input,textarea,select')].map(x=>x.value||'').join(' ');return `${clone.textContent||''} ${fields}`}
function addRole(card,f){if(card.querySelector('[data-mme-decision-role]'))return;const r=role(f),chips=card.querySelector('.mme-chips');if(!chips)return;chips.insertAdjacentHTML('beforeend',`<span class="mme-chip mme-role-${r.group}" data-mme-decision-role="${r.group}">${esc(r.label)}</span>`)}
function annotatePanel(panel){const b=base();if(!b||!panel)return;const byId=new Map(b.families.map(f=>[f.id,f]));const relevant=panel.getAttribute('data-mm-measured-evidence')==='relevant';const context=relevant?cleanContext(panel):'';const decisions=relevant?new Map(explain(context,8).map(x=>[x.id,x])):new Map();
 panel.querySelectorAll('.mme-card').forEach(card=>{const id=card.querySelector('.mme-card-head small')?.textContent?.trim(),f=byId.get(id);if(!f)return;addRole(card,f);if(relevant&&!card.querySelector('[data-mme-why]')){const d=decisions.get(id);if(d)card.insertAdjacentHTML('beforeend',`<p class="mme-why" data-mme-why><b>Why relevant:</b> ${esc(d.why)}</p>`)}});
 if(relevant&&!panel.querySelector('[data-mme-decision-legend]')){const intro=panel.querySelector('h3')?.nextElementSibling;if(intro)intro.insertAdjacentHTML('afterend','<p class="mme-decision-legend" data-mme-decision-legend><b>Evidence role:</b> Direct measured signal means the accepted waveform is close to the decision variable. Supporting evidence helps interpret material, quality or operational context; neither is a root-cause verdict or a universal setpoint.</p>')}
}
function style(){if(document.getElementById('mm-measured-evidence-decision-style'))return;const s=document.createElement('style');s.id='mm-measured-evidence-decision-style';s.textContent='.mme-role-direct{border-color:#4d8b78}.mme-role-supporting{border-color:#806c43}.mme-why{margin-top:8px!important;padding-top:7px;border-top:1px solid #29435e;color:#c9d8e8!important;overflow-wrap:anywhere}.mme-why b,.mme-decision-legend b{color:#eef6ff}.mme-decision-legend{padding:8px 10px;border-left:3px solid #537aa4;background:#10243b;color:#bed0e1!important}';document.head.appendChild(s)}
let queued=false;function run(){queued=false;style();document.querySelectorAll('[data-mm-measured-evidence="relevant"],[data-mm-measured-evidence="catalog"]').forEach(annotatePanel)}
function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(run,0)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
window.MM_MEASURED_EVIDENCE_DECISIONS={version:VERSION,explain,roleForFamily:id=>{const f=base()?.families.find(x=>x.id===id);return f?{...role(f)}:null},scope:'Decision-support metadata only. Direct and supporting evidence remain bounded by the canonical source profile and never become universal setpoints or root-cause verdicts.'};
})();
/* <<< measured-evidence-decision.js */

/* >>> process-data-diagnostics.js */
/* MouldMaster guided process-data diagnostics — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.09.10.1';
const PACK=window.MM_PROCESS_EVIDENCE_DATASETS;
const SOURCES=window.MM_EVIDENCE_SOURCES?.sources||{};
if(!PACK||!Array.isArray(PACK.datasets))throw new Error('process-data-diagnostics.js requires MM_PROCESS_EVIDENCE_DATASETS');

const STORAGE_BASE='mm_process_data_diagnostics_v1';
const GUIDES={
  'check-ring-leakage':{
    signal:'Part mass and cushion move together while peak injection pressure rises and fill time changes only slightly.',
    diagnosis:'Unstable effective shot delivery consistent with non-return-valve/check-ring leakage or wear.',
    next:'Run a controlled shot-delivery repeatability study using cushion, transfer/shot position, part mass and machine inspection evidence before compensating with recipe changes.'
  },
  'cooling-restriction':{
    signal:'Cooling flow falls while return and eject temperatures rise, followed by more warpage.',
    diagnosis:'A local cooling-circuit restriction is creating thermal imbalance and dimensional response.',
    next:'Verify circuit identity, actual flow, supply/return temperatures and local mould/part temperature before changing packing or cycle settings.'
  },
  'gate-seal-study':{
    signal:'Part mass and pressure-time area rise toward a plateau while sink response improves less with additional hold time.',
    diagnosis:'The data are showing a gate-seal/packing-transmission plateau rather than a reason to keep extending hold indefinitely.',
    next:'Repeat the study within the approved process envelope and identify the response plateau with part mass/pressure history and quality confirmation.'
  },
  'material-moisture-pc':{
    signal:'Material moisture and splay rise together while impact response falls even though part mass barely moves.',
    diagnosis:'A material-conditioning interruption is the strongest mechanism, not a global fill or packing problem.',
    next:'Verify actual resin moisture and the grade-specific drying/closed-transfer history before adjusting the moulding process.'
  },
  'hot-runner-zone-drift':{
    signal:'Heater duty rises strongly while the displayed zone temperature barely moves, with local mass/pressure response changing.',
    diagnosis:'A hot-runner thermal/control problem can exist even while the temperature display appears stable.',
    next:'Compare heater output, sensor health, branch/gate response and local cavity evidence using the approved hot-runner troubleshooting procedure.'
  },
  'valve-gate-timing':{
    signal:'One cavity fill signature separates as gate delay changes while the other cavity remains nearly stable.',
    diagnosis:'A local sequential valve-gate timing difference is driving cavity imbalance rather than a global machine recipe change.',
    next:'Verify commanded and actual valve timing plus cavity-specific fill/pressure response before touching global injection settings.'
  },
  'local-flash-tooling':{
    signal:'Flash width and local part mass change while clamp force and cavity peak pressure remain broadly stable.',
    diagnosis:'The pattern favours a local tooling/shutoff condition over insufficient global clamp force.',
    next:'Inspect the exact flash location, seating, support and tool condition using approved safe procedures before applying more process force.'
  },
  'energy-base-load':{
    signal:'Energy per cycle rises materially while cycle time and accepted quality remain almost unchanged.',
    diagnosis:'The increase points toward machine or auxiliary base load rather than a moulding-quality mechanism.',
    next:'Break energy use down by machine/auxiliary state and compare heater, pump/drive and temperature-control demand against a known-good baseline.'
  },
  'measurement-noise':{
    signal:'Measured dimensional spread increases while true dimension and independent process signals remain stable.',
    diagnosis:'Measurement-system variation is masquerading as process drift.',
    next:'Study measurement method, fixture, conditioning time, resolution and repeatability/reproducibility before adjusting the process.'
  },
  'recycled-pp-lot':{
    signal:'MFR changes with the lot while fill pressure/time and warpage move in a consistent rheology-related direction.',
    diagnosis:'A material lot-to-lot rheology shift is changing in-mould behaviour despite a similar nominal material description.',
    next:'Confirm lot identity and material-property evidence, then compare process actuals and part requirements before deciding whether revalidation is needed.'
  },
  'machine-transfer':{
    signal:'The velocity setpoint stays identical but actual peak velocity, transfer position and part mass change on the receiving machine.',
    diagnosis:'Copied setpoints are not reproducing the same physical process response on the second machine.',
    next:'Compare machine capability and actual velocity/pressure/position traces, then transfer on validated process responses rather than screen numbers alone.'
  },
  'cavity-pack-area':{
    signal:'Peak cavity pressure stays nearly unchanged while pressure-time area, hold time and dimension all shift.',
    diagnosis:'A single pressure peak is hiding a meaningful change in the full packing pressure history.',
    next:'Compare the full cavity-pressure curve/area and timing against the known-good baseline before interpreting peak pressure as equivalent.'
  },
  'screw-barrel-wear':{
    signal:'Recovery time, melt temperature and shot mass drift together while back-pressure response also moves.',
    diagnosis:'The coupled plasticising signals point toward screw/barrel or plasticising-system consistency rather than a purely cavity-side defect.',
    next:'Trend recovery and melt/shot evidence, verify material condition, and inspect machine plasticising components under the approved maintenance process.'
  },
  'ejector-drag':{
    signal:'Eject force, surface temperature, drag score and dimension move together during the fault phase.',
    diagnosis:'A local cooling/thermal imbalance is increasing part release load and dimensional response.',
    next:'Verify local cooling flow/temperature and part-release condition before increasing ejection force or rewriting the process.'
  }
};

const DATASETS=PACK.datasets.map(ds=>({...ds,guide:GUIDES[ds.id]})).filter(ds=>ds.guide);
if(DATASETS.length!==PACK.datasets.length)throw new Error('Every process evidence dataset must have a guided diagnostic case');

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';try{raw=String(window.db?.activeUser||window.user?.id||'anonymous')}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){try{const s=JSON.parse(localStorage.getItem(storageKey())||'{}');return s&&typeof s==='object'?s:{}}catch(_){return {}}}
function writeState(s){try{localStorage.setItem(storageKey(),JSON.stringify(s))}catch(_){}}
function caseState(id){return readState()[id]||{attempts:0,completed:false,bestScore:0}}
function saveCase(id,patch){const all=readState();all[id]={...(all[id]||{}),...patch};writeState(all)}

function mean(rows,key){const vals=rows.map(r=>Number(r[key])).filter(Number.isFinite);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0}
function decimals(key){return /(_pct|Score|_g|_mm|_s|_MPa|_C|_Lmin|_kWh|_kN|_ms|_mm_s|_MPas)/.test(key)?2:2}
function summary(ds){
  const keys=Object.keys(ds.signals||{});const phases=['baseline','fault','recovery'];
  return keys.map(key=>{
    const values=Object.fromEntries(phases.map(p=>[p,mean(ds.rows.filter(r=>r.phase===p),key)]));
    const delta=values.fault-values.baseline;
    const relative=Math.abs(values.baseline)>1e-9?delta/Math.abs(values.baseline):delta;
    return {key,values,delta,relative}
  })
}
function labelSignal(key){return key.replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2')}
function format(v,key){return Number(v).toFixed(decimals(key))}
function sourceNames(ds){return (ds.sourceIds||[]).map(id=>SOURCES[id]?.name||id)}

function buildSteps(ds){
  const g=ds.guide;
  return [
    {stage:'Read the pattern',question:'Which interpretation best describes the most useful change across baseline → fault?',correct:g.signal,distractors:[
      'The programmed recipe exists, so the physical process must be unchanged.',
      'One isolated number is enough; the other signals can be ignored.',
      'The recovery phase should be ignored because only the fault phase contains useful evidence.'
    ],feedback:'Use several linked actuals and the time sequence. The strongest pattern is the one that changes coherently with the fault and moves back during recovery.'},
    {stage:'Diagnose',question:'Which mechanism best fits the combined evidence?',correct:g.diagnosis,distractors:[
      'Increase a convenient global setting first and use the result as the diagnosis.',
      'Assume the material is always the cause because polymers vary.',
      'Assume the machine is always the cause because the data came from a moulding machine.'
    ],feedback:'Mechanism-first diagnosis uses location, timing and correlated actuals. It does not choose a cause just because a setting is easy to change.'},
    {stage:'Choose the next evidence',question:'What is the strongest next check before changing production standards?',correct:g.next,distractors:[
      'Change several settings together and keep whichever combination appears to work.',
      'Copy a generic internet setpoint because it provides a faster answer.',
      'Skip verification if one cycle looks acceptable.'
    ],feedback:'The next action should discriminate between plausible causes while preserving safety, traceability and the known-good baseline.'},
    {stage:'Interpret recovery',question:'What does the recovery phase allow you to conclude?',correct:'The return toward baseline strengthens the suspected mechanism because the linked signals recover together, but it still needs engineering confirmation in the real machine/mould/material context.',distractors:[
      'Recovery proves the same numeric settings will work on every machine, mould and resin grade.',
      'Recovery proves no further verification or maintenance evidence is required.',
      'Recovery means the fault phase can be deleted because it is no longer relevant.'
    ],feedback:'Recovery is powerful causal evidence, especially when several signals move back together. It does not turn synthetic training values into universal production limits.'}
  ]
}
function deterministicChoices(step,caseId,stepIndex){
  const arr=[{text:step.correct,correct:true},...step.distractors.map(x=>({text:x,correct:false}))];
  let seed=0;for(const ch of `${caseId}:${stepIndex}`)seed=(seed*31+ch.charCodeAt(0))>>>0;
  for(let i=arr.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr
}
function evaluateChoice(caseId,stepIndex,choiceIndex){
  const ds=DATASETS.find(x=>x.id===String(caseId||'')),stepNo=Number(stepIndex),choiceNo=Number(choiceIndex);
  if(!ds||!Number.isInteger(stepNo)||stepNo<0||stepNo>3||!Number.isInteger(choiceNo)||choiceNo<0||choiceNo>3)return {valid:false,correct:false,total:4};
  const steps=buildSteps(ds),choices=deterministicChoices(steps[stepNo],ds.id,stepNo),choice=choices[choiceNo];
  return {valid:!!choice,correct:!!choice?.correct,total:steps.length};
}

let activeId=null,answers=[],hadError=false;
function ensureStyle(){
  if(document.getElementById('mm-process-data-style'))return;
  const s=document.createElement('style');s.id='mm-process-data-style';s.textContent=`
#processDataLabs{--pd-line:#304b69;--pd-soft:#0f1f34}.pd-hero{padding:24px;background:radial-gradient(circle at 90% 0%,rgba(104,167,255,.18),transparent 34%),linear-gradient(135deg,#13263d,#0e1d31)}.pd-hero h2{font-size:30px;margin:7px 0 9px}.pd-hero p{max-width:900px;color:#bfd0e2;line-height:1.6}.pd-boundary{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px;margin-top:12px}.pd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.pd-stat{padding:14px}.pd-stat b{display:block;font-size:24px;margin-top:4px}.pd-stat span{font-size:11px;color:var(--muted)}.pd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pd-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.pd-card h3{margin:7px 0}.pd-card p{font-size:13px;color:var(--muted);line-height:1.5;flex:1}.pd-meta{display:flex;gap:6px;flex-wrap:wrap}.pd-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.pd-foot,.pd-toolbar,.pd-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.pd-done{color:var(--good);font-size:12px;font-weight:800}.pd-case{display:grid;gap:14px}.pd-panel{padding:20px}.pd-panel h2,.pd-panel h3{margin-top:0}.pd-table-wrap{overflow:auto;border:1px solid #2d4563;border-radius:11px}.pd-table{width:100%;border-collapse:collapse;min-width:640px}.pd-table th,.pd-table td{padding:10px 11px;border-bottom:1px solid #253b55;text-align:right;font-size:12px}.pd-table th:first-child,.pd-table td:first-child{text-align:left}.pd-table th{color:#9db5cf;background:#0d1b2e;position:sticky;top:0}.pd-up{color:#ffd166}.pd-down{color:#7ce6a3}.pd-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pd-progress span{height:7px;border-radius:99px;background:#253951}.pd-progress .done{background:var(--accent)}.pd-progress .current{outline:2px solid #68a7ff;outline-offset:2px}.pd-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.pd-question{font-size:19px;font-weight:800;margin:8px 0 12px}.pd-choices{display:grid;gap:8px}.pd-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.pd-choice:hover{background:#17304b}.pd-choice[disabled]{cursor:default;opacity:.9}.pd-choice.correct{border-color:#4a8a75;background:#123229}.pd-choice.wrong{border-color:#7c4651;background:#321a22}.pd-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55;color:#d9f1ea}.pd-feedback.bad{background:#2b1d20;border-color:#653f48;color:#f3d1d6}.pd-source-list{display:grid;gap:6px;margin-top:9px}.pd-source-list div{font-size:12px;color:#b8cbe0;padding:8px 10px;background:#0e1d31;border-radius:8px}.pd-summary{padding:20px;border:1px solid #3b5a79;background:#10243a;border-radius:13px}.pd-summary strong{font-size:22px}.pd-loop{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}.pd-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}
@media(max-width:900px){.pd-grid{grid-template-columns:1fr}.pd-loop{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.pd-stats{grid-template-columns:1fr}.pd-toolbar{align-items:stretch}.pd-toolbar button{width:100%}.pd-panel{padding:16px}}
`;
  document.head.appendChild(s)
}
function ensureSection(){
  let section=document.getElementById('processDataLabs');if(section)return section;
  section=document.createElement('section');section.id='processDataLabs';section.className='view hidden';
  (document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(section);return section
}
function ensureNav(){
  const nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-mm-process-data]'))return;
  const b=document.createElement('button');b.type='button';b.dataset.mmProcessData='1';b.innerHTML='⌁ <span>Data diagnosis</span>';
  const anchor=nav.querySelector('[data-mm-diagnostic-labs]')||nav.querySelector('button[data-view="scenarios"]');
  if(anchor)anchor.insertAdjacentElement('afterend',b);else nav.appendChild(b);
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openHome()})
}
function patchMobileMore(){
  if(window.__MM_PROCESS_DATA_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;
  const base=window.openMobileMenu;window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{
    const grid=document.querySelector('#modal .modal-card .grid2');if(!grid||grid.querySelector('[data-mm-process-data-menu]'))return;
    const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmProcessDataMenu='1';b.innerHTML='<span class="icon">⌁</span><b>Data diagnosis</b><small>Read process trends and choose the next evidence check.</small>';
    b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}openHome()});grid.appendChild(b)
  });return r};window.__MM_PROCESS_DATA_MORE_PATCH__=true
}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function setHeader(t,s){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=t;if(p)p.textContent=s}
function markNav(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-process-data]')?.classList.add('active')}
function backToPractice(){const b=document.querySelector('[data-mm-diagnostic-labs]')||document.querySelector('#nav button[data-view="scenarios"]');if(b)b.click()}
function stats(){const state=readState();let done=0,attempted=0,total=0;for(const ds of DATASETS){const s=state[ds.id];if(s?.completed)done++;if(s?.attempts){attempted++;total+=Number(s.bestScore||0)}}return {done,attempted,avg:attempted?Math.round(total/attempted):0}}

function openHome(){
  ensureStyle();ensureNav();patchMobileMore();hideOtherViews();const host=ensureSection();host.classList.remove('hidden');markNav();setHeader('Data diagnosis','Use process trends to distinguish mechanisms before changing settings.');renderHome();window.scrollTo?.({top:0,behavior:'smooth'})
}
function renderHome(){
  activeId=null;answers=[];hadError=false;const host=ensureSection(),st=stats();
  host.innerHTML=`<div class="pd-hero card"><div class="eyebrow">Process-data practice</div><h2>Guided Data Diagnosis</h2><p>Work through the same evidence pattern experienced process engineers use: establish a baseline, identify what changed, connect signals to a plausible mechanism, choose the next discriminating check, then use recovery evidence to challenge your conclusion.</p><div class="pd-loop"><span>1 Read pattern</span><span>2 Diagnose</span><span>3 Choose evidence</span><span>4 Interpret recovery</span></div><div class="pd-boundary"><b>Training boundary:</b> all values are deterministic synthetic training data. They illustrate signal relationships only and are not universal production setpoints, acceptance limits or substitutes for machine, mould, resin, site or legal requirements.</div></div>
  <div class="pd-stats"><div class="pd-stat card"><span>Cases completed</span><b>${st.done}/${DATASETS.length}</b></div><div class="pd-stat card"><span>Cases attempted</span><b>${st.attempted}</b></div><div class="pd-stat card"><span>Average best score</span><b>${st.avg}%</b></div></div>
  <div class="pd-toolbar"><div><h2 style="margin:0">Choose a dataset</h2><p class="muted" style="margin:4px 0 0">Each case contains 72 cycles: 24 baseline, 24 fault and 24 recovery.</p></div><button class="ghost" data-pd-back>Back to diagnostic practice</button></div>
  <div class="pd-grid" style="margin-top:12px">${DATASETS.map(cardHtml).join('')}</div>`
}
function cardHtml(ds){const s=caseState(ds.id);return `<article class="pd-card card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">${ds.rows.length} cycles</span><span class="pd-chip">${Object.keys(ds.signals).length} signals</span></div><h3>${esc(ds.title)}</h3><p>${esc(ds.fault)}</p><div class="pd-foot"><span class="${s.completed?'pd-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-pd-start="${esc(ds.id)}">${s.completed?'Practise again':'Start case'}</button></div></article>`}
function tableHtml(ds){return `<div class="pd-table-wrap"><table class="pd-table"><thead><tr><th>Signal</th><th>Baseline mean</th><th>Fault mean</th><th>Recovery mean</th><th>Fault Δ</th></tr></thead><tbody>${summary(ds).map(r=>`<tr><td>${esc(labelSignal(r.key))}</td><td>${format(r.values.baseline,r.key)}</td><td>${format(r.values.fault,r.key)}</td><td>${format(r.values.recovery,r.key)}</td><td class="${r.delta>=0?'pd-up':'pd-down'}">${r.delta>=0?'+':''}${format(r.delta,r.key)}</td></tr>`).join('')}</tbody></table></div>`}
function openCase(id){const ds=DATASETS.find(x=>x.id===id);if(!ds)return;activeId=id;answers=new Array(4).fill(null);hadError=false;const prior=caseState(id);saveCase(id,{...prior,attempts:Number(prior.attempts||0)+1});renderCase(0)}
function renderCase(stepIndex){
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return renderHome();const steps=buildSteps(ds),step=steps[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex),selected=answers[stepIndex],host=ensureSection();
  host.innerHTML=`<div class="pd-case"><div class="pd-toolbar"><button class="ghost" data-pd-home>← All data cases</button><button class="ghost" data-pd-back>Back to diagnostic practice</button></div><div class="pd-panel card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">synthetic training data</span></div><h2 style="margin:8px 0">${esc(ds.title)}</h2><p class="muted">${esc(ds.fault)}</p><div class="pd-progress">${steps.map((_,i)=>`<span class="${i<stepIndex?'done':i===stepIndex?'current':''}"></span>`).join('')}</div></div>
  <div class="pd-panel card"><h3>Evidence board</h3><p class="muted">Compare phase means first. Use the CSV only if you want to inspect the individual 72 cycles.</p>${tableHtml(ds)}<div class="pd-actions" style="margin-top:12px"><button class="ghost" data-pd-csv>Export 72-cycle CSV</button></div></div>
  <div class="pd-panel card"><div class="pd-stage">${esc(step.stage)} · ${stepIndex+1}/4</div><div class="pd-question">${esc(step.question)}</div><div class="pd-choices">${choices.map((c,i)=>choiceHtml(c,i,selected)).join('')}</div>${selected===null?'':feedbackHtml(choices[selected],step)}${selected===null?'':`<div class="pd-actions" style="margin-top:12px">${stepIndex<3?'<button class="primary" data-pd-next>Next step</button>':'<button class="primary" data-pd-finish>Finish case</button>'}<button class="ghost" data-pd-retry>Try this question again</button></div>`}</div>
  <div class="pd-panel card"><h3>Evidence sources</h3><div class="pd-source-list">${sourceNames(ds).map(x=>`<div>${esc(x)}</div>`).join('')}</div><p class="tiny muted" style="margin-bottom:0">These sources support the mechanism and study method. They do not make the synthetic values production specifications.</p></div></div>`;host.dataset.step=String(stepIndex)
}
function choiceHtml(c,i,selected){const chosen=selected===i,cls=chosen?(c.correct?' correct':' wrong'):'';return `<button class="pd-choice${cls}" data-pd-choice="${i}" ${selected===null?'':'disabled'}>${esc(c.text)}</button>`}
function feedbackHtml(choice,step){return `<div class="pd-feedback ${choice.correct?'':'bad'}"><b>${choice.correct?'Good evidence use':'Re-check the pattern'}</b><br>${esc(choice.correct?step.feedback:'Choose the answer that is most directly supported by the linked signals and preserves a controlled diagnostic sequence.')}</div>`}
function exportCsv(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const blob=new Blob([PACK.toCsv(ds.id)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-${ds.id}-synthetic-training.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function finishCase(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const steps=buildSteps(ds);let correct=0;for(let i=0;i<steps.length;i++){const choices=deterministicChoices(steps[i],ds.id,i);if(choices[answers[i]]?.correct)correct++}const score=Math.round(correct/steps.length*100),prior=caseState(ds.id);saveCase(ds.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score)});const host=ensureSection();host.innerHTML=`<div class="pd-summary card"><div class="eyebrow">Data case complete</div><strong>${score}% · ${correct}/4 decisions</strong><h2>${esc(ds.title)}</h2><p class="muted">${score===100?'You used the baseline, fault and recovery evidence as one reasoning chain.':'Review the missed step and try again. The goal is to explain why a signal pattern supports one mechanism more strongly than another.'}</p><div class="pd-actions"><button class="primary" data-pd-home>Choose another dataset</button><button class="secondary" data-pd-restart>Practise this case again</button><button class="ghost" data-pd-back>Back to diagnostic practice</button></div></div>`}
function handleClick(e){
  const t=e.target.closest('[data-pd-start],[data-pd-home],[data-pd-back],[data-pd-choice],[data-pd-next],[data-pd-finish],[data-pd-retry],[data-pd-restart],[data-pd-csv]');if(!t)return;
  if(t.dataset.pdStart)return openCase(t.dataset.pdStart);if(t.hasAttribute('data-pd-home'))return renderHome();if(t.hasAttribute('data-pd-back'))return backToPractice();if(t.hasAttribute('data-pd-restart'))return openCase(activeId);if(t.hasAttribute('data-pd-csv'))return exportCsv();
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const stepIndex=Number(ensureSection().dataset.step||0),step=buildSteps(ds)[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex);
  if(t.dataset.pdChoice!==undefined){const i=Number(t.dataset.pdChoice);answers[stepIndex]=i;if(!choices[i]?.correct)hadError=true;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-retry')){answers[stepIndex]=null;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-next'))return renderCase(Math.min(stepIndex+1,3));if(t.hasAttribute('data-pd-finish'))return finishCase()
}
function install(){ensureStyle();const host=ensureSection();ensureNav();patchMobileMore();if(host&&!host.__mmPdClick){host.addEventListener('click',handleClick);host.__mmPdClick=true}}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});install();window.addEventListener('load',schedule);
window.MM_PROCESS_DATA_DIAGNOSTICS={version:VERSION,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),open:openHome,evaluateChoice,scope:'Guided use of deterministic synthetic training data; outside the formal assessment bank and not a production recipe. evaluateChoice exposes structured practice correctness for local analytics without scraping rendered CSS or score text.'};
})();
/* <<< process-data-diagnostics.js */

/* >>> real-measured-data-assessment.js */
/* MouldMaster real measured-data assessment — 2026.09.01.1 */
(function(){
'use strict';
const VERSION='2026.09.01.1',STORAGE='mm_real_measured_assessment_v1';
const CASES=[
 {id:'avaps-delivered-traces',title:'AVAPS: count what the delivered traces actually contain',source:'scatimdata-avaps',contractPath:'data/public-benchmark-results/scatimdata-avaps-v1.json',contractBlob:'7692f3f029cd4ab1227db1f39e0376023c0eebbf',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Linked labelled cycles',3328],['Delivered points per signal per linked cycle',2048],['Accepted pressure + flow values',13631488],['Paper-reported points per signal',2049]],boundary:'Accepted counts use the 2,048 values actually delivered per signal per linked cycle. The dataset does not establish universal settings, causal defect mechanisms or a production process window.',questions:[
  ['Which point count should MouldMaster use when counting the delivered pressure/flow traces?',['2,048 values actually present in each delivered signal','2,049 because the paper reports that number','The average of 2,048 and 2,049','An inferred 2,049th point added to every trace'],0,'Use the delivered file structure. The contract explicitly refuses to fabricate the paper-reported extra point.'],
  ['What is the accepted real measured time-series total for this profiled family?',['13,631,488 pressure/flow values','3,328 values because there are 3,328 linked cycles','6,815,744 because only one signal should count','13,638,144 after adding one missing point per signal'],0,'The three accepted archive totals sum to 13,631,488 pressure and flow values.'],
  ['What conclusion is justified by this evidence profile?',['Real pressure/flow waveforms and linked quality outcomes are available for bounded analysis, but they do not prove a universal process window or root cause','The measured waveforms establish one universal injection-pressure recipe','Every pressure/flow correlation in the dataset is causal','The paper-reported sample count should override the delivered data'],0,'Real measured data strengthen evidence context, but the source contract keeps causality and universal-setting claims out of scope.']
 ]},
 {id:'openmms-time-samples',title:'OpenMMS-T4G: distinguish time samples from moulding cycles',source:'openmms-t4g',contractPath:'data/public-benchmark-results/openmms-t4g-v1.json',contractBlob:'b1ae42ff8af7926e08bf5aabc1d6b3a99afc4208',license:'BSD-3-Clause',evidenceType:'real-measured',facts:[['Rows/time samples',29808],['Measured signal columns',10],['Accepted measured values',298080],['Paper-reported case-study cycles',110]],boundary:'The 29,808 rows are time samples across two recorded module time bases, not 29,808 moulding cycles. The extraction fault was simulated in one experimental campaign and is not a universal machine-health diagnosis.',questions:[
  ['How should the 29,808 delivered rows be interpreted?',['As time samples across the recorded sensor-module time bases','As 29,808 moulding cycles','As 29,808 rejected parts','As one row per machine recipe'],0,'The source contract distinguishes time samples from the paper-reported 110 case-study cycles.'],
  ['Why is the accepted measured-value total 298,080?',['29,808 rows multiplied by 10 accepted measured signal columns','110 cycles multiplied by 2,710 values','29,808 rows plus 268,272 inferred values','Because all 12 CSV columns are counted as measurements'],0,'Ten source-defined measured signal columns are accepted; time bases/other structural columns are not inflated into the measured total.'],
  ['What does the simulated extraction fault allow you to claim?',['It supports condition-monitoring learning for that experiment, not a universal extraction-fault diagnosis','It proves every future extraction-force change has the same root cause','It establishes production alarm limits for all moulds','It makes inspection of the real machine unnecessary'],0,'The fault context is real experimental evidence but remains bounded to the campaign and its instrumentation.']
 ]},
 {id:'cross-process-lower-contract',title:'Cross-process lower workpiece: separate commands from measured actuals',source:'cross-process-chain-17240390',contractPath:'data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json',contractBlob:'94bea551aa3e4755c435b663d2553b53bcc0c6c2',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Accepted files',4989],['Accepted rows',2475581],['Accepted actual channels per row',3],['Accepted measured values',7426743],['Sampling interval',0.03]],boundary:'Pressure target is a command and is excluded. Accepted lower-workpiece actuals are pressure actual (bar), screw volume actual (cm³) and injection flow actual (cm³/s). Lower semantics must not be copied to the upper workpiece by analogy.',questions:[
  ['Which lower-workpiece channels count as measured process values?',['Pressure actual, screw-volume actual and injection-flow actual','Pressure target, pressure actual and time','Pressure target plus all three actual channels','Time, pressure target and screw volume only'],0,'The source contract accepts exactly three actual channels and excludes the pressure target command.'],
  ['What is the source-defined lower sampling interval?',['0.03 s','0.01 s inferred from the upper files','1 ms because injection waveforms are always high frequency','No interval is available'],0,'All 4,989 accepted lower TXT files resolve to the explicit 0.03 s interval in this contract.'],
  ['Why must the lower pressure unit not be copied to the upper dataset?',['The lower contract defines only the lower channels; the upper pressure unit still requires authoritative upper-workpiece metadata','Both workpieces must use bar because they are in one archive','Matching column names prove matching engineering units','The state codes can be used to infer the missing unit'],0,'A source-defined lower unit is not authoritative metadata for a separate upper schema.']
 ]},
 {id:'cross-process-upper-boundary',title:'Cross-process upper workpiece: fail closed on unresolved semantics',source:'cross-process-chain-17240390',contractPath:'data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json',contractBlob:'a3e23a0ecd5711158c3937f47a031212e7d1de8d',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Accepted cycle CSVs',10697],['Accepted rows',21907374],['Accepted measured channels per row',2],['Accepted measured values',43814748],['Pressure actual values excluded pending unit',21907374],['State values excluded pending semantics',21907374]],boundary:'Only melt volume (cm³) and volumetric injection velocity (cm³/s) are accepted as measured upper channels. Upper pressure actual remains excluded until its engineering unit is authoritative; state codes 0/1/2/4/8 remain uninterpreted until their semantics are authoritative.',questions:[
  ['Which upper-workpiece channels currently count as accepted measured values?',['Melt volume and injection velocity','Pressure actual and injection velocity','Pressure target and pressure actual','State code and pressure actual'],0,'The current contract accepts only the two source-defined channels with authoritative semantics/units.'],
  ['How should the 21,907,374 upper pressure-actual values be treated today?',['Keep them excluded from measured totals until the authoritative engineering unit is established','Assume bar because the lower workpiece uses bar','Convert them to MPa using a guessed bar scale','Count them as unitless pressure values'],0,'Structurally valid numbers are not enough: the engineering unit is part of the measurement meaning.'],
  ['What is the correct treatment of state codes 0, 1, 2, 4 and 8?',['Preserve and aggregate the codes without assigning phase names until an authoritative mapping is found','Map them to injection, pack and cooling from their timing','Discard them because unresolved data have no value','Use the most common code as the production phase'],0,'The project deliberately preserves unresolved codes without inventing process-state semantics.']
 ]}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function token(){let x='anonymous';try{x=String(window.db?.activeUser||window.user?.id||'anonymous')}catch(_){}let h=2166136261;for(const c of x){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function key(){return `${STORAGE}::${token()}`}
function state(){try{return JSON.parse(localStorage.getItem(key())||'{}')}catch(_){return{}}}
function save(x){try{localStorage.setItem(key(),JSON.stringify(x))}catch(_){}}
function shuffled(q,caseId,qi){const rows=q[1].map((text,i)=>({text,correct:i===q[2]}));let seed=2166136261;for(const c of `${caseId}:${qi}`){seed^=c.charCodeAt(0);seed=Math.imul(seed,16777619)}for(let i=rows.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[rows[i],rows[j]]=[rows[j],rows[i]]}return rows}
let active=null,answers=[];
function style(){if(document.getElementById('mm-real-measured-style'))return;const s=document.createElement('style');s.id='mm-real-measured-style';s.textContent=`#realMeasuredAssessment{display:grid;gap:14px}.rma-hero,.rma-panel,.rma-card{padding:18px}.rma-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.rma-meta{display:flex;gap:6px;flex-wrap:wrap}.rma-chip{font-size:10px;padding:4px 7px;border:1px solid #47627f;border-radius:999px;color:#c6d8eb}.rma-boundary{padding:11px;border-left:3px solid #d4b25b;background:#272316;color:#eddfaa;font-size:12px;line-height:1.5}.rma-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:12px 0}.rma-fact{padding:9px;border:1px solid #2f4966;border-radius:9px;background:#0e1e31}.rma-fact small{display:block;color:#97adc5}.rma-fact b{font-size:16px}.rma-choices{display:grid;gap:8px}.rma-choice{padding:11px;text-align:left;border:1px solid #35516f;border-radius:10px;background:#102239;color:#eef6ff}.rma-choice.correct{border-color:#44856e;background:#123128}.rma-choice.wrong{border-color:#824a54;background:#321b22}.rma-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between}.rma-source{font-size:11px;color:#9fb7cf;overflow-wrap:anywhere}@media(max-width:760px){.rma-grid,.rma-facts{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function section(){let h=document.getElementById('realMeasuredAssessment');if(h)return h;h=document.createElement('section');h.id='realMeasuredAssessment';h.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(h);return h}
function nav(){const n=document.getElementById('nav');if(!n||n.querySelector('[data-mm-real-measured]'))return;const b=document.createElement('button');b.type='button';b.dataset.mmRealMeasured='1';b.innerHTML='▥ <span>Measured data</span>';const a=n.querySelector('[data-mm-process-data]')||n.querySelector('[data-mm-diagnostic-labs]');a?a.insertAdjacentElement('afterend',b):n.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();home()})}
function hide(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-real-measured]')?.classList.add('active')}
function header(a,b){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=a;if(p)p.textContent=b}
function home(){style();nav();hide();active=null;answers=[];const h=section();h.classList.remove('hidden');header('Measured data','Practise evidence boundaries using committed aggregate contracts from real injection-moulding datasets.');const st=state();h.innerHTML=`<div class="rma-hero card"><div class="eyebrow">Real measured evidence</div><h2>Measured-Data Evidence Challenges</h2><p class="muted">These questions use audited aggregate metadata from real public measured datasets. No third-party raw rows are embedded here. The objective is to interpret what the data contract establishes—and what it deliberately does not establish.</p><div class="rma-boundary"><b>Boundary:</b> real measured does not mean universal. Units, signal roles, time bases, licensing, experiment design and unresolved semantics remain part of the evidence.</div></div><div class="rma-grid">${CASES.map(c=>`<article class="rma-card card"><div class="rma-meta"><span class="rma-chip">real-measured</span><span class="rma-chip">${esc(c.license)}</span><span class="rma-chip">3 decisions</span></div><h3>${esc(c.title)}</h3><p class="muted">${esc(c.boundary)}</p><div class="rma-actions"><span class="tiny muted">${st[c.id]?.best!==undefined?`Best ${st[c.id].best}%`:'Not attempted'}</span><button class="secondary" data-rma-start="${c.id}">Start</button></div></article>`).join('')}</div>`;window.scrollTo?.({top:0,behavior:'smooth'})}
function render(qi){const c=CASES.find(x=>x.id===active);if(!c)return home();const q=c.questions[qi],choices=shuffled(q,c.id,qi),sel=answers[qi],h=section();h.innerHTML=`<div class="rma-actions"><button class="ghost" data-rma-home>← All measured-data cases</button><span class="rma-chip">Decision ${qi+1}/3</span></div><div class="rma-panel card"><div class="rma-meta"><span class="rma-chip">${esc(c.evidenceType)}</span><span class="rma-chip">${esc(c.license)}</span></div><h2>${esc(c.title)}</h2><div class="rma-facts">${c.facts.map(([k,v])=>`<div class="rma-fact"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div><div class="rma-boundary">${esc(c.boundary)}</div><p class="rma-source">Contract: ${esc(c.contractPath)} · pinned blob ${esc(c.contractBlob)}</p></div><div class="rma-panel card"><div class="eyebrow">Question ${qi+1}</div><h3>${esc(q[0])}</h3><div class="rma-choices">${choices.map((x,i)=>`<button class="rma-choice${sel===i?(x.correct?' correct':' wrong'):''}" data-rma-choice="${i}" ${sel==null?'':'disabled'}>${esc(x.text)}</button>`).join('')}</div>${sel==null?'':`<div class="${choices[sel].correct?'pd-feedback':'pd-feedback bad'}" style="margin-top:12px"><b>${choices[sel].correct?'Correct evidence boundary':'Re-check the contract'}</b><br>${esc(choices[sel].correct?q[3]:'Use only the units, roles, counts and semantics that the audited source contract actually establishes.')}</div><div class="rma-actions" style="margin-top:12px"><button class="ghost" data-rma-retry>Try again</button>${qi<2?'<button class="primary" data-rma-next>Next</button>':'<button class="primary" data-rma-finish>Finish</button>'}</div>`}</div>`;h.dataset.qi=String(qi)}
function start(id){active=id;answers=[null,null,null];render(0)}
function finish(){const c=CASES.find(x=>x.id===active);let n=0;c.questions.forEach((q,i)=>{const rows=shuffled(q,c.id,i);if(rows[answers[i]]?.correct)n++});const score=Math.round(n/3*100),s=state();s[c.id]={best:Math.max(Number(s[c.id]?.best||0),score),last:score};save(s);const h=section();h.innerHTML=`<div class="rma-panel card"><div class="eyebrow">Measured-data case complete</div><h2>${score}% · ${n}/3</h2><p class="muted">${score===100?'You kept measured values, commands, units, time bases and unresolved semantics inside their audited boundaries.':'Review the contract boundary and repeat the case. The goal is to distinguish what is measured from what is merely named, commanded, inferred or unresolved.'}</p><div class="rma-actions"><button class="primary" data-rma-home>Choose another case</button><button class="secondary" data-rma-start="${c.id}">Practise again</button></div></div>`}
function click(e){const t=e.target.closest('[data-rma-start],[data-rma-home],[data-rma-choice],[data-rma-retry],[data-rma-next],[data-rma-finish]');if(!t)return;if(t.dataset.rmaStart)return start(t.dataset.rmaStart);if(t.hasAttribute('data-rma-home'))return home();const qi=Number(section().dataset.qi||0),c=CASES.find(x=>x.id===active),q=c?.questions[qi];if(!q)return;if(t.dataset.rmaChoice!==undefined){answers[qi]=Number(t.dataset.rmaChoice);return render(qi)}if(t.hasAttribute('data-rma-retry')){answers[qi]=null;return render(qi)}if(t.hasAttribute('data-rma-next'))return render(Math.min(2,qi+1));if(t.hasAttribute('data-rma-finish'))return finish()}
function install(){style();nav();const h=section();if(h&&!h.__rma){h.addEventListener('click',click);h.__rma=true}}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();new MutationObserver(install).observe(document.documentElement,{subtree:true,childList:true})}
window.MM_REAL_MEASURED_ASSESSMENT={version:VERSION,evidenceType:'real-measured',decisionCount:CASES.reduce((n,c)=>n+c.questions.length,0),cases:CASES.map(c=>({...c,facts:c.facts.map(x=>[...x]),questions:c.questions.map(q=>[q[0],[...q[1]],q[2],q[3]])})),open:home,scope:'Twelve learner decisions based on audited aggregate contracts from real measured datasets. No raw third-party rows, universal production settings or inferred unresolved semantics.'};
})();
/* <<< real-measured-data-assessment.js */

/* >>> process-data-local-intake.js */
/* MouldMaster local process-data intake — privacy-first preparation for real shot exports */
(function(){
'use strict';
const VERSION='2026.09.12.1';
const BASE=window.MM_PROCESS_DATA_DIAGNOSTICS;
if(!BASE)throw new Error('process-data-local-intake.js requires process-data-diagnostics.js');
const MAX_ROWS=50000;
const DROP_RE=/(?:^|_)(?:name|email|phone|address|customer|supplier_contact|serial_number|asset_tag|user|username|operator|operator_id|employee|employee_id|personnel)(?:_|$)/i;
const TIME_RE=/^(?:timestamp|date|datetime|time|created_at|updated_at|recorded_at|event_timestamp|shot_timestamp|cycle_timestamp)$/i;
const ALIAS_RE=/(?:machine|cell|mould|mold|tool|cavity|material|grade|resin|lot|batch|job|work_?order|part_?(?:number|no)|intervention)/i;
const ALIAS_ID_TOKEN_RE=/(?:^|_)(?:id|alias|code|number|no|serial)(?:_|$)/i;
const ALIAS_EXACT_RE=/^(?:machine|cell|mould|mold|tool|cavity|material|material_grade|material_lot|grade|resin|resin_grade|lot|batch|job|work_?order|part_?(?:number|no)|intervention)$/i;
const QUALITY_RE=/(?:quality|result|status|pass|fail|reject|defect|inspection|ok_ng|ng_ok)/i;
const CATEGORY_RE=/^(?:phase)$/i;
const UNIT_RE=/(?:^|_)unit$/i;
const SAFE_QUALITY=new Set(['pass','fail','ok','ng','good','bad','accept','accepted','reject','rejected','yes','no','0','1','true','false']);
const SAFE_CATEGORY=new Set(['baseline','known-good','known_good','fault','drift','test','intervention','recovery','verification']);
const SAFE_UNIT_RE=/^[a-z0-9%°µμ./^*_-]{1,16}$/i;
let lastPrepared=null;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function cleanHeader(v,index){let x=String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');if(!x)x=`column_${index+1}`;return x}
function enforceRowLimit(rows){if(rows.length>MAX_ROWS+1)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit. No truncated subset was prepared; split or filter the controlled source export and try again.`)}
function parseCsv(text){
  const rows=[];let row=[],field='',quoted=false,physicalLine=1,rowStartLine=1;
  const s=String(text||'').replace(/^\uFEFF/,'');
  for(let i=0;i<s.length;i++){
    const ch=s[i];
    if(quoted){
      if(ch==='"'&&s[i+1]==='"'){field+='"';i++}
      else if(ch==='"')quoted=false;
      else{field+=ch;if(ch==='\n')physicalLine++}
      continue
    }
    if(ch==='"'){quoted=true;continue}
    if(ch===','){row.push(field);field='';continue}
    if(ch==='\n'){row.push(field);rows.push(row);enforceRowLimit(rows);row=[];field='';physicalLine++;rowStartLine=physicalLine;continue}
    if(ch==='\r')continue;
    field+=ch;
  }
  if(quoted)throw new Error(`CSV has an unterminated quoted field starting on source line ${rowStartLine}; reached end of file at line ${physicalLine}. No data was prepared.`);
  if(field.length||row.length){row.push(field);rows.push(row);enforceRowLimit(rows)}
  while(rows.length&&rows[rows.length-1].every(x=>String(x).trim()===''))rows.pop();
  if(rows.length<2)return {headers:rows[0]?.map(cleanHeader)||[],rows:[],sourceRows:0,truncated:false};
  const headerWidth=rows[0].length;
  for(let i=1;i<rows.length;i++){
    const sourceRow=rows[i];
    if(sourceRow.every(x=>String(x).trim()===''))continue;
    if(sourceRow.length!==headerWidth){const cells=sourceRow.length;throw new Error(`CSV row ${i+1} has ${cells} cell${cells===1?'':'s'}; expected ${headerWidth} from the header. No data was prepared.`)}
  }
  const headers=rows[0].map(cleanHeader);
  const seen={};for(let i=0;i<headers.length;i++){const base=headers[i];seen[base]=(seen[base]||0)+1;if(seen[base]>1)headers[i]=`${base}_${seen[base]}`}
  const dataRows=rows.slice(1);
  if(dataRows.length>MAX_ROWS)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit. No truncated subset was prepared; split or filter the controlled source export and try again.`);
  return {headers,rows:dataRows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,String(r[i]??'').trim()]))),sourceRows:dataRows.length,truncated:false}
}
function numericColumn(rows,key){let present=0,numeric=0;for(const r of rows){const v=String(r[key]??'').trim();if(!v)continue;present++;if(Number.isFinite(Number(v)))numeric++}return present>0&&numeric/present>=0.9}
function explicitOperationalIdentifier(key){return ALIAS_RE.test(key)&&(ALIAS_EXACT_RE.test(key)||ALIAS_ID_TOKEN_RE.test(key))}
function strictlyIncreasing(values){if(values.length<2)return null;for(let i=1;i<values.length;i++)if(values[i]<=values[i-1])return false;return true}
function sequenceAudit(headers,rows){
  const warnings=[],hasShotIndex=headers.includes('shot_index'),usableShotIndex=hasShotIndex&&numericColumn(rows,'shot_index');
  let shotIndexMonotonic=null,shotIndexMissing=0;
  if(hasShotIndex){
    const raw=rows.map(r=>String(r.shot_index??'').trim()),values=raw.filter(Boolean).map(Number).filter(Number.isFinite);
    shotIndexMissing=raw.filter(v=>!v).length;
    if(usableShotIndex){
      shotIndexMonotonic=strictlyIncreasing(values);
      if(shotIndexMonotonic===false)warnings.push('Source shot_index is not strictly increasing in file row order; review sorting/grouping before analysis.');
      if(shotIndexMissing)warnings.push(`Source shot_index has ${shotIndexMissing} missing value${shotIndexMissing===1?'':'s'}; preserve the controlled source record for sequence review.`);
    }else warnings.push('Source shot_index is not predominantly numeric; a generated sequential shot_index will replace it in the prepared export.');
  }
  const timestampChecks=[];
  for(const key of headers.filter(h=>TIME_RE.test(h))){
    const raw=rows.map(r=>String(r[key]??'').trim()).filter(Boolean),parsed=raw.map(v=>Date.parse(v)).filter(Number.isFinite);
    const parseComplete=raw.length===parsed.length,monotonic=parsed.length>=2?strictlyIncreasing(parsed):null;
    timestampChecks.push({column:key,present:raw.length,parsed:parsed.length,parseComplete,monotonic});
    if(raw.length&&!parseComplete)warnings.push(`${key} contains unparseable date/time values; sequence could not be fully verified before the timestamp column was removed.`);
    if(monotonic===false)warnings.push(`${key} is not strictly increasing in file row order; review source ordering before analysis.`);
  }
  return {sourceShotIndex:usableShotIndex?'preserved':'generated',sourceShotIndexPresent:hasShotIndex,shotIndexMonotonic,shotIndexMissing,timestampChecks,reviewRequired:warnings.length>0,warnings};
}
function classify(headers,rows){return headers.map(key=>{if(DROP_RE.test(key))return {key,action:'drop',reason:'direct/person identifier'};if(TIME_RE.test(key))return {key,action:'drop',reason:'timestamp/date checked for sequence then removed; row order remains represented by shot_index'};if(explicitOperationalIdentifier(key))return {key,action:'alias',reason:'operational identifier replaced with stable per-file alias'};if(numericColumn(rows,key))return {key,action:'keep',reason:'numeric process/quality signal; malformed nonblank values are omitted and reported'};if(ALIAS_RE.test(key))return {key,action:'alias',reason:'operational identifier replaced with stable per-file alias'};if(UNIT_RE.test(key))return {key,action:'unit',reason:'structured measurement unit retained only when it is a short unit token'};if(CATEGORY_RE.test(key))return {key,action:'category',reason:'controlled analysis phase retained; unknown labels aliased per file'};if(QUALITY_RE.test(key))return {key,action:'quality',reason:'limited quality category; unknown labels aliased per file'};return {key,action:'drop',reason:'unrecognised free-text field'}})}
function aliasPrefix(key){return key.replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,24)||'id'}
function prepare(parsed){
  const headers=parsed?.headers||[],rows=parsed?.rows||[];
  if(rows.length>MAX_ROWS||Number(parsed?.sourceRows||rows.length)>MAX_ROWS)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit. No truncated subset was prepared.`);
  const sequence=sequenceAudit(headers,rows),rules=classify(headers,rows),maps={},invalidNumeric={};
  for(const rule of rules)if(['alias','quality','category'].includes(rule.action))maps[rule.key]=new Map();
  const preserveShotIndex=sequence.sourceShotIndex==='preserved';
  const out=rows.map((raw,index)=>{
    const row=preserveShotIndex?{}:{shot_index:index+1};
    for(const rule of rules){const v=String(raw[rule.key]??'').trim();if(rule.action==='drop')continue;
      if(rule.action==='keep'){
        if(v===''){row[rule.key]='';continue}
        const n=Number(v);if(Number.isFinite(n)){row[rule.key]=n}else{row[rule.key]='';invalidNumeric[rule.key]=(invalidNumeric[rule.key]||0)+1}
        continue
      }
      if(rule.action==='unit'){row[rule.key]=!v?'':SAFE_UNIT_RE.test(v)?v:'';continue}
      if(rule.action==='category'){const q=v.toLowerCase();if(!q){row[rule.key]='';continue}if(SAFE_CATEGORY.has(q)){row[rule.key]=q;continue}const m=maps[rule.key];if(!m.has(v))m.set(v,`${aliasPrefix(rule.key)}-${String(m.size+1).padStart(2,'0')}`);row[rule.key]=m.get(v);continue}
      if(rule.action==='quality'){const q=v.toLowerCase();if(!q){row[rule.key]='';continue}if(SAFE_QUALITY.has(q)){row[rule.key]=q;continue}const m=maps[rule.key];if(!m.has(v))m.set(v,`${aliasPrefix(rule.key)}-${String(m.size+1).padStart(2,'0')}`);row[rule.key]=m.get(v);continue}
      if(rule.action==='alias'){if(!v){row[rule.key]='';continue}const m=maps[rule.key];if(!m.has(v))m.set(v,`${aliasPrefix(rule.key)}-${String(m.size+1).padStart(2,'0')}`);row[rule.key]=m.get(v)}
    }
    return row
  });
  const keptHeaders=rules.filter(r=>r.action!=='drop').map(r=>r.key),outputHeaders=preserveShotIndex?keptHeaders:['shot_index',...keptHeaders.filter(k=>k!=='shot_index')];
  if(new Set(outputHeaders).size!==outputHeaders.length)throw new Error('Prepared output contains duplicate headers; review the source column names.');
  const invalidNumericByColumn=Object.entries(invalidNumeric).map(([column,count])=>({column,count})),invalidNumericValues=invalidNumericByColumn.reduce((s,x)=>s+x.count,0);
  const validation={invalidNumericValues,invalidNumericByColumn,reviewRequired:invalidNumericValues>0,note:invalidNumericValues?'Malformed nonblank values in predominantly numeric columns were omitted from prepared output and are listed by column.':'No malformed nonblank numeric values were detected in retained numeric columns.'};
  return {schema:3,version:VERSION,rows:out,headers:outputHeaders,rules,sequence,validation,summary:{sourceRows:Number(parsed?.sourceRows??rows.length),inputRows:rows.length,outputRows:out.length,truncated:false,invalidNumericValues,keptNumeric:rules.filter(r=>r.action==='keep').length,aliased:rules.filter(r=>r.action==='alias').length,quality:rules.filter(r=>r.action==='quality').length,categories:rules.filter(r=>r.action==='category').length,units:rules.filter(r=>r.action==='unit').length,dropped:rules.filter(r=>r.action==='drop').length},boundary:'Prepared locally in memory. Files over the row safety limit are rejected rather than silently truncated. Raw identifiers, person/operator fields and timestamps are not retained by this module. Timestamp and source shot-index values may be inspected in-session only to flag ordering problems before timestamp removal. Malformed nonblank values in retained numeric columns are omitted and reported by column rather than converted to NaN. Structurally malformed CSV rows and unterminated quoted fields are rejected before preparation. Unknown categorical quality/phase labels are aliased only within the current prepared file. Output is pseudonymised/prepared data, not proof of anonymity and not a production recipe.'}
}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function toCsv(prepared){const lines=[prepared.headers.map(csvCell).join(',')];for(const row of prepared.rows)lines.push(prepared.headers.map(k=>csvCell(row[k])).join(','));return lines.join('\n')+'\n'}
function templateCsv(){return 'timestamp,shot_index,machine,mould,cavity,material_grade,material_lot,phase,fill_time_s,transfer_position_mm,transfer_pressure_mpa,cushion_mm,recovery_time_s,peak_cavity_pressure_mpa,pressure_time_area,part_mass_g,cycle_time_s,cooling_time_s,supply_temp_c,return_temp_c,flow_lmin,dimension_value,dimension_unit,quality_result,defect_code,intervention_code\n'}
function download(name,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function host(){return document.getElementById('processDataLabs')}
function ensureStyle(){if(document.getElementById('mm-pdi-style'))return;const s=document.createElement('style');s.id='mm-pdi-style';s.textContent=`.pdi-launch{margin:12px 8px 0 0}.pdi-hero{padding:22px}.pdi-note{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;font-size:12px;line-height:1.55}.pdi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.pdi-panel{padding:18px}.pdi-actions{display:flex;gap:8px;flex-wrap:wrap}.pdi-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:12px 0}.pdi-kpi{padding:10px;border:1px solid #304b69;border-radius:9px;background:#0e1d31}.pdi-kpi b{display:block;font-size:18px}.pdi-kpi span{font-size:10px;color:var(--muted)}.pdi-rules{display:grid;gap:6px;max-height:320px;overflow:auto}.pdi-rule{display:grid;grid-template-columns:minmax(120px,1fr) 90px 2fr;gap:8px;padding:8px 10px;border-radius:8px;background:#0e1d31;font-size:11px}.pdi-rule b{text-transform:uppercase}.pdi-rule .keep{color:#7ce6a3}.pdi-rule .alias{color:#69a8ff}.pdi-rule .quality,.pdi-rule .category{color:#ffd166}.pdi-rule .unit{color:#c4d8ed}.pdi-rule .drop{color:#ff9da8}.pdi-empty{padding:14px;border:1px dashed #3a5675;border-radius:10px;color:var(--muted)}@media(max-width:760px){.pdi-grid{grid-template-columns:1fr}.pdi-summary{grid-template-columns:1fr 1fr}.pdi-rule{grid-template-columns:1fr}.pdi-actions button,.pdi-actions label{width:100%}}`;document.head.appendChild(s)}
function attachLauncher(){const h=host();if(!h||!h.querySelector('.pd-hero')||h.querySelector('[data-pdi-launch]')||h.querySelector('[data-pdi-root]'))return;ensureStyle();const b=document.createElement('button');b.type='button';b.className='secondary pdi-launch';b.dataset.pdiLaunch='1';b.textContent='Prepare real shot CSV locally';b.addEventListener('click',open);h.querySelector('.pd-hero').appendChild(b)}
function sequenceHtml(p){const q=p.sequence||{},warnings=q.warnings||[],source=q.sourceShotIndex==='preserved'?'Source shot_index preserved.':'Generated shot_index follows source file row order.',checked=(q.timestampChecks||[]).filter(x=>x.present).length;return `<div class="pdi-note" style="margin-top:12px"><b>${warnings.length?'Sequence review required':'Sequence check'}</b><br>${esc(source)} ${checked?`${checked} timestamp/date column${checked===1?' was':'s were'} checked before removal.`:'No parseable timestamp/date sequence was supplied.'}${warnings.length?`<br>${warnings.map(x=>`• ${esc(x)}`).join('<br>')}`:'<br>No ordering warning was detected in the available sequence fields.'}</div>`}
function validationHtml(p){const v=p.validation||{};if(!v.invalidNumericValues)return `<div class="pdi-note" style="margin-top:12px"><b>Numeric validation</b><br>No malformed nonblank values were detected in retained numeric columns.</div>`;return `<div class="pdi-note" style="margin-top:12px"><b>Numeric review required</b><br>${v.invalidNumericValues} malformed nonblank value${v.invalidNumericValues===1?' was':'s were'} omitted rather than converted to NaN.<br>${(v.invalidNumericByColumn||[]).map(x=>`• ${esc(x.column)}: ${x.count}`).join('<br>')}</div>`}
function render(prepared=null,error=''){
  ensureStyle();const h=host();if(!h)return;lastPrepared=prepared;
  h.innerHTML=`<div data-pdi-root><div class="pdi-actions" style="margin-bottom:12px"><button class="ghost" data-pdi-back>← Guided data diagnosis</button><button class="ghost" data-pdi-template>Download CSV template</button></div><div class="card pdi-hero"><div class="eyebrow">Local real-data preparation</div><h2>Prepare shot data without uploading it</h2><p>Choose a CSV exported from your machine, cavity-sensing, quality or auxiliary system. MouldMaster processes it only in this browser/desktop session, checks available shot/timestamp order before dropping timestamps, removes direct/person identifiers, aliases operational identifiers and keeps numeric evidence signals.</p><div class="pdi-note"><b>Privacy & engineering boundary:</b> this is pseudonymisation and schema preparation, not guaranteed anonymisation. Review the prepared file before sharing it. Files above ${MAX_ROWS.toLocaleString()} data rows are rejected rather than silently truncated. Structurally malformed CSV is rejected before any data is prepared. No raw file is stored or uploaded by this module, and the output does not create production limits, validated setpoints or machine authorisation.</div></div><div class="pdi-grid"><section class="card pdi-panel"><h3>1 · Select local CSV</h3><p class="muted">Maximum ${MAX_ROWS.toLocaleString()} data rows per preparation run; oversized files are rejected rather than truncated.</p><input type="file" accept=".csv,text/csv" data-pdi-file>${error?`<p style="color:#ff9da8">${esc(error)}</p>`:''}<div class="pdi-actions" style="margin-top:12px"><button class="secondary" data-pdi-export ${prepared?'':'disabled'}>Export prepared CSV</button><button class="ghost" data-pdi-dictionary ${prepared?'':'disabled'}>Export data dictionary</button></div>${prepared?summaryHtml(prepared)+sequenceHtml(prepared)+validationHtml(prepared):'<div class="pdi-empty" style="margin-top:12px">No file processed yet. Raw file contents stay in memory only while this page is open.</div>'}</section><section class="card pdi-panel"><h3>2 · Column treatment</h3>${prepared?rulesHtml(prepared):'<div class="pdi-empty">After selecting a CSV, this panel shows exactly which columns were kept, aliased or dropped.</div>'}</section></div></div>`;
  h.querySelector('[data-pdi-back]')?.addEventListener('click',()=>BASE.open());
  h.querySelector('[data-pdi-template]')?.addEventListener('click',()=>download('mouldmaster-shot-data-template.csv',templateCsv(),'text/csv;charset=utf-8'));
  h.querySelector('[data-pdi-file]')?.addEventListener('change',async e=>{try{const file=e.target.files?.[0];if(!file)return;const parsed=parseCsv(await file.text());if(!parsed.headers.length||!parsed.rows.length)throw new Error('CSV needs a header row and at least one data row.');render(prepare(parsed))}catch(err){render(null,err?.message||'Could not prepare this CSV.')}});
  h.querySelector('[data-pdi-export]')?.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-prepared-shot-data.csv',toCsv(lastPrepared),'text/csv;charset=utf-8')});
  h.querySelector('[data-pdi-dictionary]')?.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-prepared-data-dictionary.json',JSON.stringify({schema:lastPrepared.schema,version:lastPrepared.version,summary:lastPrepared.summary,sequence:lastPrepared.sequence,validation:lastPrepared.validation,rules:lastPrepared.rules,boundary:lastPrepared.boundary},null,2)+'\n','application/json;charset=utf-8')});
}
function summaryHtml(p){const s=p.summary;return `<div class="pdi-summary"><div class="pdi-kpi"><b>${s.outputRows}</b><span>rows prepared</span></div><div class="pdi-kpi"><b>${s.keptNumeric}</b><span>numeric kept</span></div><div class="pdi-kpi"><b>${s.aliased}</b><span>ID columns aliased</span></div><div class="pdi-kpi"><b>${s.invalidNumericValues}</b><span>invalid numeric omitted</span></div><div class="pdi-kpi"><b>${s.dropped}</b><span>columns dropped</span></div></div>`}
function rulesHtml(p){return `<div class="pdi-rules">${p.rules.map(r=>`<div class="pdi-rule"><span>${esc(r.key)}</span><b class="${esc(r.action)}">${esc(r.action)}</b><span>${esc(r.reason)}</span></div>`).join('')}</div>`}
function open(){BASE.open();requestAnimationFrame(()=>render())}
const originalOpen=BASE.open.bind(BASE);BASE.open=function(){const r=originalOpen();requestAnimationFrame(attachLauncher);return r};
attachLauncher();
window.MM_PROCESS_DATA_LOCAL_INTAKE={version:VERSION,maxRows:MAX_ROWS,parseCsv,prepare,toCsv,templateCsv,open,scope:'Local in-memory CSV preparation only; rejects oversized or structurally malformed CSV rather than truncating or silently repairing it, checks available sequence fields, strips direct/person identifiers and timestamps, aliases operational identifiers and unknown quality/phase categories per prepared file, omits/reports malformed numeric values, keeps evidence signals and structured units, performs no upload/storage/machine control and does not define production limits.'};
})();
/* <<< process-data-local-intake.js */

/* >>> mould-master-workspace.js */
/* MouldMaster evidence-led troubleshooting workspace — 2026.09.03.3 */
(function(){
'use strict';
const VERSION='2026.09.03.3';
const MAX_CASES=80;
let activeId='';
let caseCache=[];
let hydrationPromise=null;
let hydratedLearnerToken='';
let storageFailure='';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function engineeringStore(){return window.MM_ENGINEERING_STORE||null}
async function resolveStore(){
  let store=engineeringStore();if(store)return store;
  try{if(window.MM_DOMAIN_BOOTSTRAP?.ready)await window.MM_DOMAIN_BOOTSTRAP.ready}catch(_){}
  return engineeringStore()
}
function uid(){try{return crypto.randomUUID()}catch(_){return 'case-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}}
function now(){return new Date().toISOString()}
function blank(){return{id:uid(),createdAt:now(),updatedAt:now(),title:'',defectId:null,defect:'',materialGradeId:null,material:'',machineId:null,machine:'',mouldId:null,mould:'',cavityId:null,onset:'Unknown / not yet defined',location:'',baseline:'',evidence:'',hypothesis:'',controlledTest:'',testResult:'',afterChange:'',verification:'',conclusion:'',status:'Investigating'}}
function all(){return caseCache.slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))}
function get(id){return all().find(x=>x.id===id)||null}
function replaceCache(cases){caseCache=(Array.isArray(cases)?cases:[]).slice(0,MAX_CASES).map(x=>({...x}));return all()}
async function hydrate({force=false}={}){
  const store=await resolveStore();if(!store)throw new Error('Engineering case store unavailable');
  const owner=store.learnerToken();
  if(!force&&hydrationPromise&&hydratedLearnerToken===owner)return hydrationPromise;
  if(hydratedLearnerToken!==owner){activeId='';caseCache=[]}
  hydratedLearnerToken=owner;
  hydrationPromise=(async()=>{
    await store.bootstrap?.();
    const cases=await store.listCases(owner);
    if(hydratedLearnerToken!==owner)return all();
    storageFailure='';return replaceCache(cases)
  })().catch(err=>{if(hydratedLearnerToken===owner){storageFailure=String(err?.message||err);console.warn('[MouldMaster workspace] canonical case store unavailable',err)}return all()});
  return hydrationPromise
}
async function saveCase(c){
  await hydrate();const store=await resolveStore();if(!store)throw new Error(storageFailure||'Engineering case store unavailable');
  let owner=store.learnerToken();if(hydratedLearnerToken!==owner){await hydrate({force:true});owner=store.learnerToken()}
  c.status=status(c);c.updatedAt=now();
  const saved=await store.saveCase(c,{token:owner}),cases=all().filter(x=>x.id!==saved.id);caseCache=[{...saved},...cases].slice(0,MAX_CASES);return saved
}
async function deleteCase(id){
  await hydrate();const store=await resolveStore();if(!store)throw new Error(storageFailure||'Engineering case store unavailable');
  let owner=store.learnerToken();if(hydratedLearnerToken!==owner){await hydrate({force:true});owner=store.learnerToken()}
  const removed=await store.deleteCase(id,owner);if(removed)caseCache=all().filter(x=>x.id!==id);if(activeId===id)activeId='';return removed
}
function persistenceError(err){storageFailure=String(err?.message||err);console.warn('[MouldMaster workspace] case persistence failed',err);window.toast?.('Case could not be saved locally')}

function defects(){try{return Array.isArray(D?.defects)?D.defects:[]}catch(_){return[]}}
function lessons(){try{return Array.isArray(D?.lessons)?D.lessons:[]}catch(_){return[]}}
function specialist(){return window.MM_SPECIALIST_CURRICULUM?.lessons||[]}
function dataCases(){
  const guided=(window.MM_PROCESS_DATA_DIAGNOSTICS?.cases||[]).map(x=>({...x,origin:'Guided 14'}));
  const deep=(window.MM_PROCESS_DATA_DEEP_DIVE_50?.cases||[]).map(x=>({...x,origin:'50-case deep dive'}));
  const atlas=(window.MM_PROCESS_DATA_20_PASS_ATLAS?.cases||[]).map(x=>({...x,kind:x.kind||x.domain||'20-pass atlas',origin:'20-pass atlas'}));
  return [...guided,...deep,...atlas]
}
function materialLabs(){return window.MM_MATERIAL_BEHAVIOUR_LABS?.labs||[]}
function selectedDefect(c){return defects().find(d=>d.name===c.defect)||null}
const SHORT_TERMS=new Set(['PP','PC','ABS','POM','PET','PBT','TPU','PMMA','PEEK','PPS','LCP','HDPE','PA66','PA6','PPA','PEI','TPE'].map(x=>x.toLowerCase()));
function words(v){return String(v||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>3||SHORT_TERMS.has(x))}
function caseTerms(c){return [...new Set(words([c.defect,c.material,c.title,c.evidence,c.hypothesis].join(' ')))].slice(0,28)}
function scoreText(text,terms){const s=String(text||'').toLowerCase();return terms.reduce((n,t)=>n+(s.includes(t)?1:0),0)}
function relatedLessons(c){const terms=caseTerms(c);return lessons().map(l=>({l,score:scoreText([l.title,l.summary,l.intro,(l.keypoints||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.l)}
function relatedSpecialist(c){const terms=caseTerms(c);return specialist().map(l=>({l,score:scoreText([l.title,l.level].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.l)}
function relatedData(c){const terms=caseTerms(c);return dataCases().map(x=>({x,score:scoreText([x.title,x.kind,x.domain,x.passTitle,x.fault,x.diagnosis,x.next,(x.signals||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.x)}
function relatedMaterial(c){const terms=caseTerms(c);return materialLabs().map(x=>({x,score:scoreText([x.title,x.focus,(x.materials||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.x)}

function status(c){
  if(c.conclusion.trim()&&c.verification.trim()&&c.afterChange.trim())return 'Verified / documented';
  if(c.testResult.trim())return 'Tested — verification pending';
  if(c.controlledTest.trim())return 'Test planned';
  if(c.hypothesis.trim())return 'Mechanism ranked';
  return 'Investigating'
}
function completeness(c){const fields=['defect','onset','baseline','evidence','hypothesis','controlledTest','testResult','afterChange','verification','conclusion'];return Math.round(fields.filter(k=>String(c[k]||'').trim()).length/fields.length*100)}

function style(){if(document.getElementById('mm-mould-master-style'))return;const s=document.createElement('style');s.id='mm-mould-master-style';s.textContent=`
#mmMouldMasterWorkspace{--mw-line:#31506f;--mw-soft:#0e1d31}.mw-hero{padding:22px;background:radial-gradient(circle at 92% 0%,rgba(85,214,190,.17),transparent 33%),linear-gradient(135deg,#13273d,#0d1b2e)}.mw-hero h2{font-size:30px;margin:7px 0 8px}.mw-hero p{max-width:920px;line-height:1.6;color:#bfd0e2}.mw-boundary{margin-top:12px;padding:12px 14px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;font-size:12px;line-height:1.55}.mw-loop{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:14px}.mw-loop span{padding:8px 5px;text-align:center;border:1px solid #31506f;border-radius:9px;background:#102137;color:#bfd3e8;font-size:10px}.mw-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0}.mw-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:14px}.mw-panel{padding:18px}.mw-panel h3{margin:0 0 10px}.mw-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.mw-form .wide{grid-column:1/-1}.mw-form textarea{min-height:96px}.mw-form textarea.tall{min-height:132px}.mw-help{font-size:11px;color:var(--muted);line-height:1.45;margin-top:5px}.mw-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.mw-summary{display:grid;gap:10px}.mw-kpi{padding:13px;border:1px solid #2d4764;border-radius:10px;background:#0e1d31}.mw-kpi span{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.mw-kpi b{display:block;margin-top:4px}.mw-list{display:grid;gap:7px}.mw-item{padding:10px 11px;border:1px solid #2f4a68;border-radius:10px;background:#0f2035}.mw-item b{display:block;margin-bottom:4px}.mw-item p{margin:0;color:#b8c9dc;font-size:12px;line-height:1.45}.mw-chip-row{display:flex;gap:6px;flex-wrap:wrap}.mw-chip{font-size:10px;border:1px solid #3b5978;border-radius:999px;padding:4px 7px;color:#c4d8ed;background:#102137}.mw-cases{display:grid;gap:8px}.mw-case{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid #304b69;border-radius:11px;background:#0e1d31}.mw-case small{color:var(--muted)}.mw-danger{border-color:#6b3b45!important;color:#ffc7d0!important}.mw-evidence-board{display:grid;gap:8px}.mw-evidence-row{padding:10px 12px;border-left:4px solid #69a8ff;background:#102137;border-radius:8px;line-height:1.45;font-size:12px}.mw-mechanism{border-left-color:#ffd166}.mw-check{border-left-color:#55d6be}.mw-empty{padding:14px;border:1px dashed #3a5675;border-radius:10px;color:var(--muted);font-size:12px}.mw-related button{width:100%;text-align:left;margin-top:6px}.mw-progress{height:7px;background:#20344d;border-radius:99px;overflow:hidden}.mw-progress i{display:block;height:100%;background:linear-gradient(90deg,#55d6be,#69a8ff)}
@media(max-width:900px){.mw-layout{grid-template-columns:1fr}.mw-loop{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.mw-form{grid-template-columns:1fr}.mw-form .wide{grid-column:auto}.mw-loop{grid-template-columns:repeat(2,1fr)}.mw-toolbar button{flex:1}.mw-panel{padding:15px}}
`;document.head.appendChild(s)}
function section(){let x=document.getElementById('mmMouldMasterWorkspace');if(x)return x;x=document.createElement('section');x.id='mmMouldMasterWorkspace';x.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(x);return x}
function hideViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function header(){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent='Mould Master';if(p)p.textContent='Build an evidence-led troubleshooting case from symptom to verified conclusion.'}
function mark(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));window.MM_APP_SHELL?.navigation?.setCustomActive?.('mould-master','practice')}

function defectOptions(c){return `<option value="">Select a defect / symptom…</option>${defects().map(d=>`<option ${d.name===c.defect?'selected':''}>${esc(d.name)}</option>`).join('')}`}
function onsetOptions(c){const vals=['Unknown / not yet defined','Just started','After material change','After mould maintenance','After machine change','After restart / setup','Gradually over time','Intermittent'];return vals.map(x=>`<option ${x===c.onset?'selected':''}>${esc(x)}</option>`).join('')}
function textField(label,key,c,wide=false,help=''){return `<label class="${wide?'wide':''}">${esc(label)}<input data-mw-field="${key}" value="${esc(c[key]||'')}">${help?`<div class="mw-help">${esc(help)}</div>`:''}</label>`}
function area(label,key,c,help='',tall=false){return `<label class="wide">${esc(label)}<textarea class="${tall?'tall':''}" data-mw-field="${key}">${esc(c[key]||'')}</textarea>${help?`<div class="mw-help">${esc(help)}</div>`:''}</label>`}

function evidenceBoard(c){const d=selectedDefect(c);if(!d)return '<div class="mw-empty">Choose a defect to load its known symptom, mechanism candidates and evidence checks. These are prompts to investigate, not an automatic diagnosis.</div>';return `<div class="mw-evidence-board"><div class="mw-evidence-row"><b>Observed symptom pattern</b><br>${esc(d.symptom||'')}</div>${(d.mechanisms||[]).slice(0,5).map(x=>`<div class="mw-evidence-row mw-mechanism"><b>Mechanism candidate</b><br>${esc(x)}</div>`).join('')}${(d.checks||[]).slice(0,6).map(x=>`<div class="mw-evidence-row mw-check"><b>Evidence to collect</b><br>${esc(x)}</div>`).join('')}</div>`}
function relatedHtml(c){
  const ls=relatedLessons(c),ss=relatedSpecialist(c),ds=relatedData(c),ms=relatedMaterial(c);
  const lessonButtons=ls.length?ls.map(l=>`<button class="ghost" type="button" data-mw-lesson="${l.id}">${esc(l.id+'. '+l.title)}</button>`).join(''):'<div class="mw-empty">Add a defect, material or evidence terms to surface related lessons.</div>';
  const spec=ss.length?`<div class="mw-chip-row">${ss.map(x=>`<span class="mw-chip">${esc(x.id+' · '+x.title)}</span>`).join('')}</div>`:'';
  const data=ds.length?ds.map(x=>`<button class="ghost" type="button" data-mw-data="${esc(x.id)}" data-mw-data-origin="${esc(x.origin||'Guided 14')}">${esc(x.origin||'Data case')} · ${esc(x.title)}</button>`).join(''):'';
  const mat=ms.length?ms.map(x=>`<button class="ghost" type="button" data-mw-material="${esc(x.id)}">Material lab · ${esc(x.title)}</button>`).join(''):'';
  return `<div class="mw-related"><h3>Learning & evidence links</h3>${lessonButtons}${spec}${data}${mat}<button class="ghost" type="button" data-mw-defects>Open Defect Finder</button><button class="ghost" type="button" data-mw-diagnostic>Open Diagnostic Labs</button><button class="ghost" type="button" data-mw-data-home>Open Data Diagnosis</button><p class="mw-help">Use these links to learn the mechanism or test your reasoning. Case notes remain your own local evidence record.</p></div>`
}
function casesHtml(active){const cs=all();if(!cs.length)return '<div class="mw-empty">No saved cases yet.</div>';return `<div class="mw-cases">${cs.slice(0,12).map(c=>`<div class="mw-case"><div><b>${esc(c.title||c.defect||'Untitled case')}</b><small>${esc(status(c))} · ${new Date(c.updatedAt).toLocaleDateString()}</small></div><button class="ghost" type="button" data-mw-open="${esc(c.id)}">${c.id===active?'Open':'View'}</button></div>`).join('')}</div>`}

function renderCase(c){activeId=c.id;const host=section();c.status=status(c);const pct=completeness(c);host.innerHTML=`
<div class="mw-hero card"><div class="eyebrow">Evidence-led troubleshooting workspace</div><h2>Mould Master case</h2><p>Define the symptom, localise where and when it occurs, compare against a known-good baseline, rank mechanisms, run the smallest controlled discriminating test, then verify the before/after result.</p><div class="mw-loop"><span>1 Define</span><span>2 Localise</span><span>3 Collect evidence</span><span>4 Rank mechanism</span><span>5 Controlled test</span><span>6 Verify</span></div><div class="mw-boundary"><b>Production boundary:</b> this workspace organises evidence and learning. It does not provide universal temperatures, pressures, speeds, force limits or authorisation to defeat safeguards. Verify the exact resin, machine, mould, validated process, approved site procedure and applicable safety requirements before real changes.</div></div>
<div class="mw-toolbar"><div><b>${esc(c.title||c.defect||'Untitled case')}</b><div class="mw-help">Saved locally for this learner only.</div></div><div class="mw-actions"><button class="secondary" type="button" data-mw-new>New case</button><button class="ghost" type="button" data-mw-list>Case list</button><button class="ghost" type="button" data-mw-export>Export case</button></div></div>
<div class="mw-layout">
  <div class="mw-panel card"><h3>Case evidence record</h3><div class="mw-form">
    ${textField('Case title','title',c,false,'Use a short identifier such as “Cavity 3 flash after insert change”.')}
    <label>Defect / symptom<select data-mw-field="defect">${defectOptions(c)}</select><div class="mw-help">Select the closest visible symptom; the mechanism still has to be proven.</div></label>
    ${textField('Material / grade','material',c,false,'Record the exact grade and lot when known.')}
    ${textField('Machine / cell','machine',c,false,'Record the actual machine/cell, not only a recipe name.')}
    ${textField('Mould / tool / cavity','mould',c,false,'Include cavity, gate, insert or local area where relevant.')}
    <label>When did it start?<select data-mw-field="onset">${onsetOptions(c)}</select><div class="mw-help">Timing around a change event is often strong localisation evidence.</div></label>
    ${textField('Where / how often','location',c,true,'e.g. cavity-specific, one side of part, every cycle, intermittent, after warm-up.')}
    ${area('Known-good baseline','baseline',c,'Record the last verified-good condition: actuals, material state, tool/cooling condition and part response as applicable.')}
    ${area('Current measured evidence','evidence',c,'Use actual measurements, alarms, trends, part location/pattern and physical inspection. Separate facts from assumptions.',true)}
    ${area('Ranked mechanism / hypothesis','hypothesis',c,'State the mechanism and why the evidence supports it more strongly than alternatives. Do not write a setting change as the diagnosis.')}
    ${area('Smallest controlled discriminating test','controlledTest',c,'Define one safe test or inspection that separates plausible mechanisms while staying inside approved limits.',true)}
    ${area('Test result','testResult',c,'Record what actually changed and whether the result supported or weakened the mechanism.')}
    ${area('After-change / recovery evidence','afterChange',c,'Compare the same signals and part response used in the baseline. Recovery toward baseline strengthens causal confidence.')}
    ${area('Verification & repeatability','verification',c,'Record repeat cycles, independent quality checks, measurement confidence and any maintenance/tooling confirmation.')}
    ${area('Conclusion / standardisation','conclusion',c,'State what was proven, what remains uncertain, and what approved standard/work instruction/change-control action follows.',true)}
  </div><div class="mw-actions"><button class="primary" type="button" data-mw-save>Save case</button><button class="danger mw-danger" type="button" data-mw-delete>Delete case</button></div></div>
  <aside class="mw-summary">
    <div class="mw-panel card"><h3>Case status</h3><div class="mw-kpi"><span>Evidence chain</span><b>${esc(c.status)}</b></div><div class="mw-kpi"><span>Record completeness</span><b>${pct}%</b><div class="mw-progress"><i style="width:${pct}%"></i></div></div><div class="mw-kpi"><span>Decision rule</span><b>${c.verification.trim()?'Verification recorded':'Do not standardise yet'}</b></div></div>
    <div class="mw-panel card"><h3>Defect evidence board</h3>${evidenceBoard(c)}</div>
    <div class="mw-panel card">${relatedHtml(c)}</div>
  </aside>
</div>`;wire(host,c)}

function collect(c){document.querySelectorAll('#mmMouldMasterWorkspace [data-mw-field]').forEach(el=>{c[el.dataset.mwField]=el.value});c.status=status(c);return c}
function wire(host,c){
  let timer=null;host.querySelectorAll('[data-mw-field]').forEach(el=>el.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{try{await saveCase(collect(c))}catch(err){persistenceError(err)}},500)}));
  host.querySelector('[data-mw-save]')?.addEventListener('click',async()=>{try{const saved=await saveCase(collect(c));renderCase(saved);window.toast?.('Mould Master case saved')}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-new]')?.addEventListener('click',async()=>{try{const n=await saveCase(blank());renderCase(n)}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-list]')?.addEventListener('click',()=>renderList());
  host.querySelector('[data-mw-delete]')?.addEventListener('click',async()=>{if(!confirm('Delete this local troubleshooting case?'))return;try{await deleteCase(c.id);renderList()}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-export]')?.addEventListener('click',()=>exportCase(collect(c)));
  host.querySelectorAll('[data-mw-lesson]').forEach(b=>b.addEventListener('click',()=>{try{user.currentLesson=Number(b.dataset.mwLesson);persist();switchView('lesson')}catch(_){}}));
  host.querySelector('[data-mw-defects]')?.addEventListener('click',()=>switchView('defects'));
  host.querySelector('[data-mw-diagnostic]')?.addEventListener('click',()=>window.MM_DIAGNOSTIC_LABS?.open?.());
  host.querySelector('[data-mw-data-home]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());
  host.querySelectorAll('[data-mw-data]').forEach(b=>b.addEventListener('click',()=>{
    const origin=b.dataset.mwDataOrigin||'Guided 14',id=b.dataset.mwData;
    if(origin==='20-pass atlas'){
      window.MM_PROCESS_DATA_20_PASS_ATLAS?.open?.();
      return setTimeout(()=>document.querySelector(`[data-at20-open="${CSS.escape(id)}"]`)?.click(),0)
    }
    if(origin==='50-case deep dive'){
      window.MM_PROCESS_DATA_DEEP_DIVE_50?.open?.();
      return setTimeout(()=>document.querySelector(`[data-dd50-open="${CSS.escape(id)}"]`)?.click(),0)
    }
    window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.();
    setTimeout(()=>document.querySelector(`[data-pd-start="${CSS.escape(id)}"]`)?.click(),0)
  }));
  host.querySelectorAll('[data-mw-material]').forEach(b=>b.addEventListener('click',()=>{window.MM_MATERIAL_BEHAVIOUR_LABS?.open?.();setTimeout(()=>document.querySelector(`[data-ml-start="${CSS.escape(b.dataset.mwMaterial)}"]`)?.click(),0)}));
  host.querySelector('[data-mw-field="defect"]')?.addEventListener('change',async()=>{try{const saved=await saveCase(collect(c));renderCase(saved)}catch(err){persistenceError(err)}})
}
function exportCase(c){const payload={schema:1,version:VERSION,exportedAt:now(),trainingBoundary:'Evidence record only; not a universal production recipe or machine authorisation.',case:c};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-case-${String(c.title||c.id).replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,48)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function renderList(){activeId='';const host=section();host.innerHTML=`<div class="mw-hero card"><div class="eyebrow">Mould Master</div><h2>Troubleshooting casebook</h2><p>Keep diagnosis tied to the evidence chain rather than a sequence of unrecorded machine adjustments.</p><div class="mw-boundary"><b>Local-only record:</b> cases stay in this browser/desktop profile unless you explicitly export a case JSON file. No case data is uploaded by this module.</div></div><div class="mw-toolbar"><div><h2 style="margin:0">Saved cases</h2><p class="muted" style="margin:4px 0 0">${all().length} local case${all().length===1?'':'s'}</p></div><button class="primary" type="button" data-mw-new>New case</button></div><div class="mw-panel card">${casesHtml('')}</div>`;host.querySelector('[data-mw-new]')?.addEventListener('click',async()=>{try{const c=await saveCase(blank());renderCase(c)}catch(err){persistenceError(err)}});host.querySelectorAll('[data-mw-open]').forEach(b=>b.addEventListener('click',()=>{const c=get(b.dataset.mwOpen);if(c)renderCase(c)}))}
async function open(id){style();await hydrate();const host=section();hideViews();host.classList.remove('hidden');header();mark();const c=id&&get(id)||get(activeId);if(c)renderCase(c);else renderList();window.scrollTo?.({top:0,behavior:'smooth'})}
async function newCase(seed={}){await hydrate();const c=await saveCase({...blank(),...seed,id:uid(),createdAt:now(),updatedAt:now()});await open(c.id);return c.id}

style();section();
window.mmOpenMouldMaster=()=>open();
window.MM_MOULD_MASTER_WORKSPACE={version:VERSION,canonicalStore:'indexeddb-v2',hydrate,open,newCase,cases:()=>all().map(x=>({...x})),getCase:id=>{const c=get(id);return c?{...c}:null},learnerToken:()=>hydratedLearnerToken,storageError:()=>storageFailure,scope:'Learner-scoped local IndexedDB evidence casebook; legacy localStorage is migration input only; no network upload, universal production setpoints, assessment mutation or machine authorisation.'};
window.addEventListener('mm:domains-ready',()=>hydrate({force:true}),{once:true});
})();
/* <<< mould-master-workspace.js */

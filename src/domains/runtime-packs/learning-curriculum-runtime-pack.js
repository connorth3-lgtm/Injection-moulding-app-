/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: learning-curriculum-runtime-pack.js
 */

/* >>> lesson-evidence-depth.js */
/* MouldMaster targeted lesson evidence depth — 2026.08.26.3 */
(function(){
'use strict';
const VERSION='2026.08.26.3';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const CURATED={
 'fda-validation':{name:'FDA — Process Validation: General Principles and Practices',authority:'US FDA',kind:'regulated-manufacturing validation guidance',url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/process-validation-general-principles-and-practices',note:'FDA pharmaceutical/process-validation guidance; use here to teach validation structure, not as a universal plastics regulatory requirement.'},
 'euromap-77':{name:'EUROMAP 77 — IMM/MES data exchange',authority:'EUROMAP / VDMA',kind:'industry interface specification',url:'https://www.euromap.org/euromap77'},
 'autodesk-draft':{name:'Autodesk Moldflow — Draft Angle result',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowAdviser-Results/files/GUID-7F36552A-8F0E-4965-BEBD-A12A346382C1.htm'},
 'energy-review':{name:'Zhang et al. (2017) — energy consumption in injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/en10111768'},
 'machine-control':{name:'Ren et al. (2024) — injection-moulding machine control and sensing',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/s24072205'},
 'mould-design':{name:'Godec et al. (2024) — injection-moulding tooling/design optimisation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-024-13263-x'},
 'fibre-orientation':{name:'Gao et al. (2025) — fibre orientation variation and geometrical shrinkage in FRP injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym17172360'},
 'vision-inspection':{name:'Fan & Qiu (2023) — machine-vision inspection for injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/pr11020411'},
 'predictive-maintenance':{name:'Rousopoulou et al. (2020) — predictive maintenance for injection-moulding machines',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3389/frai.2020.578152'},
 'validation-methodology':{name:'Arslan et al. (2025) — AI-driven cognition for advanced injection moulding and industrial implementation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-025-15611-x'},
 'reprocessing-degradation':{name:'Polymers (2024) — polypropylene degradation through repeated processing',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym16070895'}
};
const COURSE_FALLBACKS={
 'Foundations':['autodesk-fill-pack','iso-20430'],
 'Machine & Controls':['autodesk-fill-pack','liew-2022','iso-20430'],
 'Materials':['iso-1133','trotta-2021','covestro-drying'],
 'Mould Design':['autodesk-fill-pack','autodesk-cooling','zhao-2022'],
 'Process Setup':['autodesk-fill-pack','autodesk-molding-window','jansen-1998'],
 'Defect Troubleshooting':['basf-troubleshooter','autodesk-fill-pack','araujo-2023'],
 'Scientific Moulding':['trotta-2021','jansen-1998','araujo-2023','nist-doe'],
 'Capability & Validation':['nist-capability','nist-handbook'],
 'DOE & Statistics':['nist-doe','nist-handbook','adoe-2024'],
 'Automation & Sensors':['liew-2022','araujo-2023','euromap-79','iso-20430'],
 'Advanced Tooling & Simulation':['autodesk-molding-window','autodesk-fill-pack','hotrunner-2024','araujo-2023'],
 'Expert Process Engineering':['nist-handbook','autodesk-molding-window','iso-20430']
};
const RULES=[
 [/^Basic process documentation$/i,['e:nist-handbook','e:liew-2022']],
 [/^Safe start-up observation$/i,['e:iso-20430','e:autodesk-fill-pack']],
 [/^Part quality basics$/i,['e:nist-handbook','e:basf-troubleshooter']],
 [/^Cycle-time anatomy$/i,['e:autodesk-fill-pack','e:autodesk-cooling','e:euromap-60']],
 [/^Repeatability fundamentals$/i,['e:nist-handbook','e:liew-2022']],
 [/^Beginner process audit$/i,['e:nist-handbook','e:iso-20430']],
 [/^Injection unit anatomy$/i,['e:autodesk-fill-pack','e:iso-20430']],
 [/^Screw geometry$/i,['e:trotta-2021','e:autodesk-fill-pack']],
 [/^Non-return valve behaviour$/i,['e:nrv-wear-2023','e:liew-2022','e:autodesk-fill-pack']],
 [/^Clamp unit anatomy$/i,['e:autodesk-clamp-modeling','e:iso-20430','e:liew-2022']],
 [/^Hydraulic vs electric drives$/i,['c:energy-review','e:euromap-60']],
 [/^Controller screens$/i,['c:machine-control','e:liew-2022']],
 [/^Shot capacity & screw diameter$/i,['e:autodesk-fill-pack','e:iso-20430']],
 [/^Melt temperature$/i,['e:trotta-2021','e:basf-troubleshooter']],
 [/^Melt temperature study$/i,['e:trotta-2021','e:autodesk-fill-pack','e:basf-troubleshooter']],
 [/^Residence time$/i,['e:thermal-degradation-1990','e:basf-troubleshooter','e:trotta-2021']],
 [/^Draft and texture$/i,['c:autodesk-draft','c:mould-design']],
 [/^Ejection$/i,['c:autodesk-draft','e:autodesk-cooling']],
 [/^Pre-start checklist$/i,['e:iso-20430','e:autodesk-fill-pack']],
 [/^Screw recovery$/i,['e:liew-2022','e:autodesk-fill-pack']],
 [/^Cushion control$/i,['e:nrv-wear-2023','e:liew-2022','e:autodesk-fill-pack']],
 [/^Golden setup sheet$/i,['e:nist-handbook','e:liew-2022']],
 [/^Brittleness & cracking$/i,['e:covestro-drying','e:basf-troubleshooter']],
 [/^Dimensional drift$/i,['e:nist-handbook','e:liew-2022','e:autodesk-cooling']],
 [/^Decoupled process thinking$/i,['e:autodesk-fill-pack','e:nist-doe']],
 [/^Scientific moulding report$/i,['e:nist-doe','e:nist-handbook']],
 [/^(IQ|OQ|PQ) concepts$/i,['c:fda-validation','c:validation-methodology']],
 [/^Change control$/i,['c:fda-validation','e:nist-handbook']],
 [/^Factors and responses$/i,['e:nist-doe','e:doe-micro-2013','e:adoe-2024']],
 [/^Main effects$/i,['e:nist-doe','e:nist-handbook']],
 [/^Interactions$/i,['e:nist-doe','e:doe-micro-2013','e:adoe-2024']],
 [/^Replication$/i,['e:nist-doe','e:nist-handbook']],
 [/^Blocking$/i,['e:nist-doe','e:doe-micro-2013','e:adoe-2024']],
 [/^Confirmation runs$/i,['e:nist-doe','e:adoe-2024','e:nist-handbook']],
 [/^Part presence sensing$/i,['e:euromap-79','e:iso-20430']],
 [/^Process alarms$/i,['e:liew-2022','e:iso-20430']],
 [/^(MES basics|Traceability)$/i,['c:euromap-77','e:liew-2022']],
 [/^Vision inspection$/i,['c:vision-inspection','e:nist-ai-drift']],
 [/^Automated cell audit$/i,['e:euromap-79','e:iso-20430']],
 [/^Shear heating$/i,['e:trotta-2021','e:autodesk-fill-pack']],
 [/^Orientation$/i,['c:fibre-orientation','e:zhao-2022']],
 [/^Simulation interpretation$/i,['c:mould-design','e:autodesk-fill-pack']],
 [/^Root-cause systems thinking$/i,['e:basf-troubleshooter','e:nist-handbook']],
 [/^Golden process control$/i,['e:liew-2022','e:nist-handbook']],
 [/^Layered process audits$/i,['e:nist-handbook','c:fda-validation']],
 [/^Cycle-time economics$/i,['c:energy-review','e:euromap-60']],
 [/^Scrap reduction$/i,['e:basf-troubleshooter','c:reprocessing-degradation']],
 [/^Maintenance-process interaction$/i,['c:predictive-maintenance','e:liew-2022']],
 [/^Technical coaching$/i,['e:nist-handbook','c:validation-methodology']],
 [/^Expert capstone$/i,['e:nist-handbook','e:nist-doe','c:fda-validation']],
 [/^(Polymer families|Amorphous materials|Semi-crystalline materials)$/i,['e:trotta-2021','e:iso-1133']],
 [/^Material changeover$/i,['e:basf-troubleshooter','e:iso-15512']],
 [/^Regrind control$/i,['c:reprocessing-degradation','e:iso-1133']],
 [/^(Mould anatomy|Tooling process review|Tooling optimisation loop)$/i,['c:mould-design','e:autodesk-fill-pack']],
 [/^Mould protection$/i,['e:iso-20430','e:autodesk-clamp']],
 [/^Machine capability checklist$/i,['e:autodesk-clamp','e:autodesk-fill-pack']],
 [/^Process robustness$/i,['e:autodesk-molding-window','e:nist-doe']]
];
function normalise(s){return s&&/^https:\/\//i.test(s.url||'')?s:null}
function evidence(id){const s=window.MM_EVIDENCE_SOURCES?.sources?.[id];return s?normalise({id:'e:'+id,name:s.name,authority:s.authority,kind:s.kind,url:s.url}):null}
function curated(id){const s=CURATED[id];return s?normalise({id:'c:'+id,...s}):null}
function ref(token){const [kind,id]=String(token).split(':');return kind==='e'?evidence(id):kind==='c'?curated(id):null}
function tuple(t){return Array.isArray(t)&&/^https:\/\//i.test(t[2]||'')?{id:'library:'+String(t[2]),name:t[0],authority:'MouldMaster audited source library',kind:t[1],url:t[2]}:null}
function add(out,s,origin){s=normalise(s);if(!s||out.some(x=>x.url===s.url))return;out.push({...s,origin})}
function explicit(title){const out=[];for(const [rx,refs] of RULES)if(rx.test(String(title||'')))for(const token of refs)add(out,ref(token),'explicit');return out}
function legacyCategories(text){const t=String(text||'').toLowerCase(),out=[];
 if(/guard|safety|interlock|lockout|isolation|hazard|robot|cell|fume|emergency/.test(t))out.push('safety');
 if(/puwer|coshh|hswa|law|legal|pcbu|regulation/.test(t))out.push('law');
 if(/material|polymer|resin|rheolog|viscos|mfr|mvr|moisture|dry|crystalli|degrad|regrind/.test(t))out.push('materials');
 if(/pack|hold|gate|cool|thermal|shrink|warpage|fill|flow|pressure|cavity|runner|vent|burn|weld|sink/.test(t))out.push('process');
 if(/sensor|cavity pressure|monitor|trace|industry 4|condition monitoring/.test(t))out.push('sensors');
 if(/capability|cpk|ppk|doe|statistics|measurement|random|factorial|validation|sampling|msa/.test(t))out.push('stats');
 return [...new Set(out)]}
function librarySelect(text,limit=8){const L=window.MM_SOURCE_LIBRARY;if(typeof L?.select==='function')return L.select(text,limit);const out=[];for(const cat of legacyCategories(text))for(const x of L?.[cat]||[])if(!out.some(y=>y[2]===x[2]))out.push(x);return out.slice(0,limit)}
function topicSources(row){const out=[],title=String(row?.title||'');
 for(const t of librarySelect(title,8))add(out,tuple(t),'title-category');
 for(const s of window.MM_EVIDENCE_SOURCES?.inferred?.(title)||[])add(out,{id:'e:'+s.id,name:s.name,authority:s.authority,kind:s.kind,url:s.url},'title-inference');
 for(const s of explicit(title))add(out,s,s.origin||'explicit');
 return out}
function fallbackSources(row){const out=[];const ids=window.MM_SOURCE_LIBRARY?.courseFallbacks?.[row?.courseName]||COURSE_FALLBACKS[row?.courseName]||[];for(const id of ids)add(out,evidence(id),'course-fallback');return out}
function lessonSources(row,limit=5){const out=[];for(const s of topicSources(row))add(out,s,s.origin);for(const s of fallbackSources(row))add(out,s,'course-fallback');return out.slice(0,limit)}
function auth(s){return String(s?.authority||'').toLowerCase().replace(/peer-reviewed .*/,'peer-reviewed research').replace(/\s*\/.*$/,'').trim()}
function auditLesson(row){const topic=topicSources(row),display=lessonSources(row,5),authorityFamilies=[...new Set(topic.map(auth).filter(Boolean))];return {id:row?.id,title:row?.title,course:row?.courseName,topicCount:topic.length,authorityCount:authorityFamilies.length,authorityFamilies,displayCount:display.length,status:topic.length>=2?'strong':topic.length===1?'supported':'fallback-only',topicSources:topic.map(s=>({id:s.id,name:s.name,url:s.url,authority:s.authority,origin:s.origin})),displaySources:display.map(s=>({id:s.id,name:s.name,url:s.url,origin:s.origin}))}}
function auditAll(rows){const lessons=(rows||[]).map(auditLesson),counts={strong:0,supported:0,'fallback-only':0};for(const x of lessons)counts[x.status]++;return {version:VERSION,total:lessons.length,counts,lessons}}
function linkHtml(s){return `<a href="${esc(s.url)}" target="_blank" rel="noopener" data-mm-lesson-evidence-depth="1"><b>${esc(s.name)}</b><small>${esc(s.kind)} · ${esc(s.authority)}</small><em>Open ↗</em></a>`}
function enrich(){const article=document.querySelector?.('#lesson article.lesson-body');if(!article)return;const title=article.querySelector('h2')?.textContent||'',row=(window.MM_DATA?.lessons||[]).find(x=>x.title===title);if(!row)return;const panels=[...article.querySelectorAll('.mm-ref-panel')],target=panels.find(p=>/Evidence\s*&\s*further reading/i.test(p.textContent||''));if(!target)return;
 target.querySelectorAll('[data-mm-lesson-evidence="1"],.mm-lesson-evidence-links,[data-mm-lesson-evidence-depth="1"],.mm-lesson-evidence-depth-links').forEach(x=>x.remove());
 [...target.querySelectorAll('p')].filter(p=>/No general external source was auto-selected|These sources support mechanisms and study methods/i.test(p.textContent||'')).forEach(p=>p.remove());
 const existing=new Set([...target.querySelectorAll('a[href]')].map(a=>a.href));const selected=lessonSources(row,5),remaining=selected.filter(s=>!existing.has(new URL(s.url,location.href).href)).slice(0,Math.max(0,5-existing.size));
 if(remaining.length){const block=document.createElement('div');block.className='mm-lesson-evidence-depth-links';block.innerHTML=remaining.map(linkHtml).join('');target.appendChild(block)}
 const p=document.createElement('p');p.dataset.mmEvidenceBoundary='depth';p.textContent='These references support mechanisms, study methods and evidence discipline; they are not universal production recipes. Verify the exact resin grade, machine and mould documentation, approved site procedures, product requirements and applicable law for real work.';target.appendChild(p);target.dataset.mmLessonEvidenceExpanded='1';target.dataset.mmLessonEvidenceDepth=VERSION}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;enrich()},0)}
if(typeof MutationObserver!=='undefined'&&document.documentElement)new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,0));else setTimeout(schedule,0);
window.MM_LESSON_EVIDENCE_AUDIT={version:VERSION,curatedSources:CURATED,rules:RULES,topicSources,fallbackSources,lessonSources,auditLesson,auditAll};
})();
/* <<< lesson-evidence-depth.js */

/* >>> lesson-deep-authoring-v2.js */
/* MouldMaster lesson deep authoring v2 — lesson-specific mechanism/evidence/decision layer 2026-09-01 */
(function(){
'use strict';
if(window.MM_LESSON_DEEP_AUTHORING_V2)return;
const VERSION='2026.09.07.4';
const D=window.MM_DATA,R=window.MM_RUNTIME_V2;
if(!D||!Array.isArray(D.lessons)||D.lessons.length!==120)throw new Error('lesson-deep-authoring-v2.js requires the canonical 120-lesson pathway');
if(!R||typeof R.after!=='function')throw new Error('lesson-deep-authoring-v2.js requires runtime-v2.js');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function uniq(rows){const out=[];for(const x of rows.map(clean).filter(Boolean))if(!out.includes(x))out.push(x);return out}
function sentence(v){const x=clean(v);return !x?'':/[.!?]$/.test(x)?x:x+'.'}
function compact(v,max=175){
  const x=sentence(v);if(!x||x.length<=max)return x;
  const first=x.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();if(first&&first.length<=max)return first;
  const clipped=x.slice(0,max+1),cut=clipped.lastIndexOf(' '),end=cut>Math.floor(max*.65)?clipped.slice(0,cut):x.slice(0,max);
  return end.replace(/[,:;–—-]+\s*$/,'').trim()+'…';
}
function teachingRecord(l){
  const objectives=uniq(l.objectives||[]),points=uniq(l.keypoints||[]),summary=clean(l.summary||l.intro||''),exercise=clean(l.exercise||'');
  const guide=l.mmGuide||{};
  const evidencePrompt=sentence(l.evidencePrompt||'');
  const commonTrap=sentence(l.commonTrap||'');
  const mechanism=sentence(summary||points[0]||guide.plain||`This lesson develops the ${clean(l.title)} mechanism.`);
  const evidence=uniq([guide.evidence,...points.slice(0,3),...objectives.slice(0,2)]).slice(0,4);
  const decision=sentence(exercise||guide.example||objectives[0]||`Explain how you would recognise and verify ${clean(l.title)} in a real moulding process.`);
  const misconception=sentence(guide.mistake||points[points.length-1]||`Do not turn ${clean(l.title)} into a universal setting; verify the actual machine, mould, material and measurement context.`);
  const teachBack=sentence(objectives.length?`Without using the lesson wording, explain ${objectives[objectives.length-1].replace(/^to\s+/i,'')}`:`Explain the evidence that would change your conclusion about ${clean(l.title)}`);
  const boundary=/safe|guard|interlock|isolation|hazard|robot|fume/i.test([l.title,summary,...points].join(' '))?
    'Safety boundary: use current machine documentation, authorised site procedures and applicable jurisdiction requirements. This learning activity never authorises bypassing safeguards or entering a danger zone.':
    'Engineering boundary: this lesson teaches a mechanism and evidence chain, not a universal recipe. Exact grade data, machine/tool limits, validated site controls and product requirements govern production decisions.';
  return {id:l.id,title:l.title,course:l.courseName,mechanism,evidence,decision,misconception,teachBack,evidencePrompt,commonTrap,boundary}
}
function pedagogicalPayload(r){return {mechanism:r.mechanism,evidence:r.evidence,decision:r.decision,misconception:r.misconception,teachBack:r.teachBack,evidencePrompt:r.evidencePrompt,commonTrap:r.commonTrap,boundary:r.boundary}}
function fingerprintPayload(payload){let h=2166136261;for(const c of JSON.stringify(payload)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
function contentFingerprint(r){return fingerprintPayload(pedagogicalPayload(r))}
const records=D.lessons.map(teachingRecord);
const byId=Object.fromEntries(records.map(x=>[String(x.id),x]));
const fingerprints=records.map(contentFingerprint);
if(new Set(fingerprints).size!==records.length)throw new Error('lesson deep authoring produced duplicate lesson records with substantively identical mechanism/evidence/decision/teach-back content');
function style(){if(document.getElementById('mm-lesson-deep-v2-style'))return;const s=document.createElement('style');s.id='mm-lesson-deep-v2-style';s.textContent=`
.mm-deep-v2{margin:12px 0;display:grid;gap:8px}.mm-deep-v2-card{border:1px solid #2e4968;border-radius:12px;background:#0e1d31}.mm-deep-v2-essentials{padding:0;overflow:hidden}.mm-deep-v2-row{display:grid;grid-template-columns:126px minmax(0,1fr);gap:14px;align-items:start;padding:12px 15px}.mm-deep-v2-row+.mm-deep-v2-row{border-top:1px solid #263f5c}.mm-deep-v2-row h4{margin:0;font-size:13px;line-height:1.35;color:#f2f7ff}.mm-deep-v2-row p{margin:0;font-size:13px;line-height:1.5;color:#c0d0e3}.mm-deep-v2 details.mm-deep-v2-card{padding:0;overflow:hidden}.mm-deep-v2 details>summary{min-height:46px;display:flex;align-items:center;padding:10px 13px;cursor:pointer;list-style:none}.mm-deep-v2 details>summary::-webkit-details-marker{display:none}.mm-deep-v2 details>summary::before{content:'▸';display:inline-block;margin-right:7px}.mm-deep-v2 details[open]>summary::before{content:'▾'}.mm-deep-v2-detail{padding:2px 15px 14px;border-top:1px solid #263f5c}.mm-deep-v2-detail h4{margin:14px 0 6px}.mm-deep-v2-detail p,.mm-deep-v2-detail li{font-size:13px;line-height:1.55;color:#c0d0e3}.mm-deep-v2-detail ul{padding-left:19px;margin:7px 0}.mm-deep-v2-boundary{padding:11px 13px;border-left:3px solid #d4b25b;background:#292414;color:#f0e1ad;font-size:12px;line-height:1.55}.mm-deep-v2-id{font-size:10px;color:#7f98b8;margin-top:10px}@media(max-width:720px){.mm-deep-v2{margin:10px 0}.mm-deep-v2-row{grid-template-columns:1fr;gap:3px;padding:10px 13px}.mm-deep-v2-row h4{font-size:15px}.mm-deep-v2-row p{font-size:14px;line-height:1.42}.mm-deep-v2 details>summary{padding:10px 13px}.mm-deep-v2-detail{padding:2px 13px 13px}}
`;document.head.appendChild(s)}
function current(){try{return typeof window.currentLesson==='function'?window.currentLesson():null}catch(_){return null}}
// Full mechanism/evidence/decision/misconception/teach-back content remains available in the collapsed disclosure; the default mobile view shows only the minimum useful teaching signal.
function markup(r){
  const takeaway=compact(r.evidence[0]||r.mechanism,165);
  const apply=compact(r.decision,175);
  const safety=/^Safety boundary:/i.test(r.boundary);
  const caution=compact(safety?r.boundary:r.misconception,175);
  const secondaryLabel=safety?'Watch out':'Apply';
  const secondaryText=safety?caution:apply;
  return `<section class="mm-deep-v2" id="mmLessonDeepV2" aria-label="Lesson essentials"><article class="mm-deep-v2-card mm-deep-v2-essentials"><div class="mm-deep-v2-row"><h4>Key takeaway</h4><p>${esc(takeaway)}</p></div><div class="mm-deep-v2-row"><h4>${secondaryLabel}</h4><p>${esc(secondaryText)}</p></div></article><details class="mm-deep-v2-card"><summary><b>More detail</b></summary><div class="mm-deep-v2-detail"><h4>Mechanism</h4><p>${esc(r.mechanism)}</p><h4>Evidence chain</h4>${r.evidence.length?`<ul>${r.evidence.map(x=>`<li>${esc(sentence(x))}</li>`).join('')}</ul>`:'<p>Use the lesson objectives, current actuals and known-good comparison to build the evidence chain.</p>'}<h4>Evidence check</h4><p><b>Capture:</b> ${esc(r.evidencePrompt||'Compare the current setpoint, measured actuals and repeatability before drawing a conclusion.')}</p><p><b>Common trap:</b> ${esc(r.commonTrap||r.misconception)}</p><h4>Plant decision</h4><p>${esc(r.decision)}</p><h4>Misconception check</h4><p>${esc(r.misconception)}</p><h4>Teach-back</h4><p>${esc(r.teachBack)}</p><div class="mm-deep-v2-boundary"><b>Boundary:</b> ${esc(r.boundary)}</div><div class="mm-deep-v2-id">Authoring record ${esc(String(r.id))} · ${esc(contentFingerprint(r))}</div></div></details></section>`;
}
function enrich(){style();const l=current(),body=document.querySelector('#lesson article.lesson-body')||document.querySelector('#lesson .lesson-body');if(!l||!body||body.querySelector('#mmLessonDeepV2'))return;const r=byId[String(l.id)];if(!r)return;const anchor=body.querySelector('#mmTeaching')||body.querySelector('.mm-teaching-grid')||body.querySelector('.callout')||body.querySelector('h3');if(anchor)anchor.insertAdjacentHTML('afterend',markup(r));else body.insertAdjacentHTML('beforeend',markup(r))}
R.after('renderLesson',()=>{try{enrich()}catch(e){console.warn('[MouldMaster lesson depth v2]',e)}});
R.registerModule('lesson-deep-authoring-v2',{version:VERSION,type:'lesson-render-hook',records:records.length});
let queued=false;const schedule=()=>{if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;try{enrich()}catch(_){}},0)};
const lessonRoot=document.getElementById('lesson');if(lessonRoot)new MutationObserver(schedule).observe(lessonRoot,{childList:true,subtree:true});
window.MM_LESSON_DEEP_AUTHORING_V2=Object.freeze({version:VERSION,total:records.length,records:records.map(x=>({...x,fingerprint:contentFingerprint(x)})),record:id=>byId[String(id)]||null,recordingMode:'runtime-v2 after-render hook',duplicatePolicy:'Substantive pedagogical payloads must be unique even when lesson IDs, titles or course labels differ.',policy:'Every canonical lesson receives a lesson-specific mechanism/evidence/decision/teach-back record derived from its own authored summary, objectives, keypoints, exercise and safety context; duplicate generated records are rejected.'});
schedule();
})();
/* <<< lesson-deep-authoring-v2.js */

/* >>> learning-experience.js */
/* MouldMaster learning experience tightening — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.09.10.3';
if(typeof renderLesson!=='function'||typeof renderDashboard!=='function'||typeof currentLesson!=='function'){
  throw new Error('MouldMaster core learning functions must load before learning-experience.js');
}

const originalRenderLesson=renderLesson;
const originalRenderDashboard=renderDashboard;
let noteTimer=null;

const styles=document.createElement('style');
styles.id='mm-learning-experience-style';
styles.textContent=`
.mm-learning-progress{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:13px 15px;margin:-6px 0 18px;border:1px solid #2f4968;border-radius:13px;background:#0d1b2f}
.mm-learning-progress strong{display:block;margin-bottom:3px}.mm-learning-progress small{color:var(--muted);line-height:1.4}.mm-learning-progress .mini-bar{grid-column:1/-1;margin:0}
.mm-learning-jumps{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 18px}.mm-learning-jumps button{min-height:38px;padding:7px 10px;border:1px solid #344f6f;border-radius:999px;background:#11243a;color:#c8d9ec;font-size:12px}
.mm-learning-jumps button:hover,.mm-learning-jumps button:focus-visible{border-color:#68a7ff;background:#17304d;color:#fff}
.mm-next-card{margin-top:18px;padding:16px;border:1px solid #34516e;border-radius:13px;background:linear-gradient(135deg,#10243a,#122b3d)}
.mm-next-card h3{margin:5px 0 7px}.mm-next-card p{margin:0;color:#b9cade;line-height:1.5}.mm-next-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.mm-note-status{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:7px;color:var(--muted);font-size:11px}.mm-note-status [data-state="saved"]{color:var(--good)}
.mm-today-focus{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:17px 18px;margin-bottom:14px;border:1px solid #34516e;border-radius:15px;background:linear-gradient(135deg,#10233a,#122b3d)}
.mm-today-focus h2{font-size:20px;margin:4px 0 5px}.mm-today-focus p{margin:0;color:#b9cade;line-height:1.45}.mm-today-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
.mm-home-utility{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mm-home-utility button{min-height:44px;padding:8px 11px}
.mm-home-task-hub{margin-bottom:16px;padding:18px;border:1px solid #2f4968;border-radius:16px;background:linear-gradient(180deg,#101f34,#0d1a2d)}
.mm-home-task-hub h2{font-size:21px;margin:5px 0 5px}.mm-home-task-hub>p{margin:0;color:#aebfd4;line-height:1.45}
.mm-home-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
.mm-home-action{min-height:128px;padding:15px;border:1px solid #35516f;border-radius:14px;background:linear-gradient(180deg,#14243a,#0e1c2f);color:#edf5ff;text-align:left;display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.mm-home-action:hover,.mm-home-action:focus-visible{border-color:#69a8ff;background:#172b45;transform:translateY(-1px)}
.mm-home-action-primary{border-color:#438177;background:linear-gradient(180deg,#12333a,#10262f)}
.mm-home-action-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#19334c;color:#9dd3ff;font-size:18px;font-weight:900}
.mm-home-action-primary .mm-home-action-icon{background:#16433d;color:#9ff3df}
.mm-home-action strong{display:block;font-size:14px;line-height:1.3}.mm-home-action small{display:block;margin-top:4px;color:#9fb3cb;line-height:1.4;font-size:11px}
.mm-lesson-list-state{font-size:10px;color:var(--muted);margin-left:4px}.lesson-list button[aria-current="step"]{box-shadow:inset 3px 0 0 var(--accent)}
.mm-mobile-actions{display:none}
@media(max-width:1100px){.mm-home-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){
  .mm-today-focus{grid-template-columns:1fr}.mm-today-focus>button{width:100%}
  .mm-home-task-hub{padding:15px;margin-bottom:14px}.mm-home-task-hub h2{font-size:19px}
  .mm-home-actions{grid-template-columns:1fr 1fr;gap:8px}.mm-home-action{min-height:116px;padding:13px}
  #dashboard .mm-home-core-hero,#dashboard .mm-home-kpis,#dashboard .mm-home-course-head,#dashboard .mm-home-course-grid{display:none!important}
  #dashboard .mm-specialist-strip{padding:14px 15px!important;margin-top:14px!important}
  #dashboard .mm-specialist-strip>p{display:none!important}
  #dashboard .mm-specialist-strip .mm-specialist-meta{margin:7px 0 10px!important}
  #dashboard .mm-specialist-strip .mm-specialist-meta span:last-child{display:none!important}
  #dashboard .mm-specialist-strip button{width:100%}
  #lesson .lesson-body{padding:19px 17px 98px}.mm-learning-progress{grid-template-columns:1fr}.mm-learning-progress .pill{width:max-content}
  .mm-mobile-actions{position:fixed;display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;left:0;right:0;bottom:0;z-index:18;padding:9px max(12px,env(safe-area-inset-right)) calc(9px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:rgba(7,16,28,.96);border-top:1px solid #314966;backdrop-filter:blur(12px)}
  .mm-mobile-actions button{min-height:46px}.mm-mobile-actions .primary{width:100%}
  #lesson .lesson-side{margin-bottom:76px}.mm-learning-jumps{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}.mm-learning-jumps button{white-space:nowrap}
}
@media(max-width:430px){.mm-home-actions{grid-template-columns:1fr}.mm-home-action{min-height:0;display:grid;grid-template-columns:auto 1fr;align-items:center}.mm-home-action-icon{grid-row:1/span 2}}
@media(prefers-reduced-motion:reduce){.mm-learning-jumps button{scroll-behavior:auto}.mm-home-action:hover{transform:none}}
`;
document.head.appendChild(styles);

function context(){
  const lesson=currentLesson();
  const course=D.courses.find(x=>x.id===lesson.course);
  const position=Math.max(0,course.lessonIds.indexOf(lesson.id));
  const globalIndex=Math.max(0,D.lessons.findIndex(x=>x.id===lesson.id));
  const previous=D.lessons[globalIndex-1]||null;
  const next=D.lessons[globalIndex+1]||null;
  return {lesson,course,position,globalIndex,previous,next};
}

function jumpTo(id){
  const el=document.getElementById(id);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
}
window.mmLearningJump=jumpTo;

function saveNotesNow(id,area,status){
  if(!area)return;
  user.notes=user.notes||{};
  user.notes[id]=area.value;
  persist();
  if(status){status.textContent='Saved';status.dataset.state='saved'}
}

function installAutosave(lesson){
  const area=document.getElementById('lessonNotes');
  if(!area)return;
  const status=document.querySelector('#lesson .mm-note-save-state');
  const schedule=()=>{
    if(status){status.textContent='Saving…';status.dataset.state='saving'}
    clearTimeout(noteTimer);
    noteTimer=setTimeout(()=>saveNotesNow(lesson.id,area,status),650);
  };
  area.addEventListener('input',schedule);
  area.addEventListener('blur',()=>{
    clearTimeout(noteTimer);
    saveNotesNow(lesson.id,area,status);
  });
}

function completeAndContinue(id){
  const active=D.lessons.find(x=>x.id===id);
  if(!active)return;
  const wasComplete=user.completed.includes(id);
  if(!wasComplete)user.completed.push(id);
  const index=D.lessons.findIndex(x=>x.id===id);
  const next=D.lessons[index+1]||null;
  if(next){
    const courseFinished=active.course!==next.course;
    user.currentLesson=next.id;
    persist();
    renderLesson();
    window.scrollTo({top:0,behavior:'smooth'});
    toast(courseFinished?'Track complete · next track ready':'Lesson complete · next lesson ready');
  }else{
    persist();
    renderLesson();
    toast('Learning path complete ✓');
  }
}
window.mmCompleteAndContinue=completeAndContinue;

window.mmPreviousLesson=function(){
  const c=context();
  if(c.previous)goLesson(c.previous.id);
};
window.mmNextLesson=function(){
  const c=context();
  if(c.next)goLesson(c.next.id);
};
window.mmOpenMouldMaster=function(){
  if(typeof switchView==='function')switchView('defects');
};
window.mmOpenDataDiagnosis=function(){
  if(window.MM_PROCESS_DATA_DIAGNOSTICS?.open)return window.MM_PROCESS_DATA_DIAGNOSTICS.open();
  if(typeof toast==='function')toast('Data diagnosis is still loading. Try again in a moment.');
};

function decorateLesson(){
  const root=document.getElementById('lesson');
  const article=root?.querySelector('.lesson-body');
  const side=root?.querySelector('.lesson-side');
  if(!article||!side)return;
  const c=context();
  const doneInCourse=c.course.lessonIds.filter(id=>user.completed.includes(id)).length;
  const coursePct=Math.round(doneInCourse/c.course.lessonIds.length*100);
  const complete=user.completed.includes(c.lesson.id);

  article.insertAdjacentHTML('afterbegin',`
    <div class="mm-learning-progress" aria-label="Lesson progress">
      <div><strong>Track ${c.course.id}: ${esc(c.course.name)}</strong><small>Lesson ${c.position+1} of ${c.course.lessonIds.length} · ${c.lesson.duration} min · ${doneInCourse}/${c.course.lessonIds.length} completed</small></div>
      <span class="pill">${coursePct}% track progress</span>
      <div class="mini-bar" aria-hidden="true"><span style="width:${coursePct}%"></span></div>
    </div>
    <nav class="mm-learning-jumps" aria-label="Lesson sections">
      <button type="button" data-mm-onclick="mmLearningJump('mmObjectives')">Objectives</button>
      <button type="button" data-mm-onclick="mmLearningJump('mmKeyPoints')">Key points</button>
      <button type="button" data-mm-onclick="mmLearningJump('mmExercise')">Practice</button>
      <button type="button" data-mm-onclick="mmLearningJump('mmNotes')">Notes</button>
    </nav>`);

  const headings=[...article.querySelectorAll('h3')];
  const objectives=headings.find(x=>x.textContent.trim()==='Learning objectives');
  const keypoints=headings.find(x=>x.textContent.trim()==='Key engineering points');
  const exercise=headings.find(x=>x.textContent.trim()==='Shop-floor exercise');
  const notes=headings.find(x=>x.textContent.trim()==='Your lesson notes');
  if(objectives)objectives.id='mmObjectives';
  if(keypoints)keypoints.id='mmKeyPoints';
  if(exercise)exercise.id='mmExercise';
  if(notes)notes.id='mmNotes';

  const buttons=[...article.querySelectorAll('.hero-buttons button')];
  const completeButton=buttons.find(b=>(b.getAttribute('onclick')||'').includes('completeLesson'));
  if(completeButton){
    completeButton.textContent=complete?'Continue to next lesson →':'Complete & continue →';
    completeButton.setAttribute('onclick',`mmCompleteAndContinue(${c.lesson.id})`);
  }
  const noteButton=buttons.find(b=>(b.getAttribute('onclick')||'').includes('saveLessonNote'));
  if(noteButton)noteButton.textContent='Save now';

  const area=document.getElementById('lessonNotes');
  if(area){
    area.setAttribute('aria-describedby','mmNoteSaveHelp');
    area.insertAdjacentHTML('afterend',`<div class="mm-note-status" id="mmNoteSaveHelp"><span>Notes autosave on this device.</span><span class="mm-note-save-state" data-state="saved">Saved</span></div>`);
  }

  const actionRow=article.querySelector('.hero-buttons:last-of-type');
  if(actionRow){
    const nextTitle=c.next?`${c.next.id}. ${esc(c.next.title)}`:'You have reached the end of the 120-lesson path.';
    actionRow.insertAdjacentHTML('afterend',`
      <section class="mm-next-card" aria-label="Next learning step">
        <span class="eyebrow">Up next</span><h3>${nextTitle}</h3>
        <p>${c.next?'Complete this lesson when you can explain the key points in your own words and identify what evidence you would check in practice.':'Review your bookmarks, scenarios and knowledge checks to reinforce the full pathway.'}</p>
        <div class="mm-next-actions">
          ${c.previous?'<button class="ghost" type="button" data-mm-onclick="mmPreviousLesson()">← Previous lesson</button>':''}
          ${c.next?`<button class="secondary" type="button" data-mm-onclick="mmNextLesson()">Preview next lesson</button>`:'<button class="secondary" type="button" data-mm-onclick="switchView(\'dashboard\')">Return home</button>'}
        </div>
      </section>`);
  }

  const lessonButtons=[...side.querySelectorAll('.lesson-list button')];
  lessonButtons.forEach((button,index)=>{
    const id=c.course.lessonIds[index];
    if(id===c.lesson.id)button.setAttribute('aria-current','step');
    button.title=user.completed.includes(id)?'Completed lesson':'Open lesson';
  });
  const sideNext=[...side.querySelectorAll('button')].find(b=>b.textContent.includes('Next lesson'));
  if(sideNext){
    sideNext.textContent=c.next?'Next lesson →':'End of path ✓';
    sideNext.disabled=!c.next;
  }

  root.insertAdjacentHTML('beforeend',`
    <div class="mm-mobile-actions" aria-label="Mobile lesson actions">
      <button class="ghost" type="button" data-mm-onclick="mmPreviousLesson()" ${c.previous?'':'disabled'} aria-label="Previous lesson">←</button>
      <button class="primary" type="button" data-mm-onclick="mmCompleteAndContinue(${c.lesson.id})">${complete?'Continue →':'Complete & continue →'}</button>
    </div>`);
  installAutosave(c.lesson);
}

function decorateDashboard(){
  const root=document.getElementById('dashboard');
  if(!root)return;
  const c=context();
  const overall=completedPct();
  const hero=root.querySelector('.hero');if(hero)hero.classList.add('mm-home-core-hero');
  const kpis=root.querySelector('.kpis');if(kpis)kpis.classList.add('mm-home-kpis');
  const courseHead=[...root.querySelectorAll('.section-head')].find(x=>/Continue your path/i.test(x.textContent||''));
  if(courseHead){courseHead.classList.add('mm-home-course-head');courseHead.nextElementSibling?.classList.add('mm-home-course-grid')}
  root.insertAdjacentHTML('afterbegin',`
    <section class="mm-today-focus" data-mm-role="today-focus" aria-label="Today's learning focus">
      <div>
        <span class="eyebrow">Today’s focus</span>
        <h2>${esc(c.lesson.title)}</h2>
        <p>Track ${c.course.id}: ${esc(c.course.name)} · Lesson ${c.position+1}/${c.course.lessonIds.length}. Pick up exactly where you left off.</p>
        <div class="mm-today-meta"><span class="pill">${c.lesson.duration} min lesson</span><span class="pill">${user.dailyMinutes||15} min daily goal</span><span class="pill">${overall}% overall</span></div>
        <div class="mm-home-utility" aria-label="Home shortcuts"><button class="ghost" type="button" data-mm-role="daily-practice" data-mm-onclick="switchView('scenarios')">◎ Daily practice</button><button class="ghost" type="button" data-mm-role="saved-lessons" data-mm-onclick="switchView('profile')">☆ Saved lessons</button></div>
      </div>
      <button class="primary" type="button" data-mm-role="continue-lesson" data-mm-onclick="switchView('lesson')">Continue lesson →</button>
    </section>
    <section class="mm-home-task-hub" data-mm-role="task-hub" aria-label="MouldMaster quick actions">
      <span class="eyebrow">What do you need help with?</span>
      <h2>Choose your next task</h2>
      <p>Go straight to diagnosis, process evidence or practice without searching through the course catalogue.</p>
      <div class="mm-home-actions">
        <button class="mm-home-action mm-home-action-primary" type="button" data-mm-role="diagnose-defect" data-mm-onclick="mmOpenMouldMaster()"><span class="mm-home-action-icon">◇</span><span><strong>Diagnose a moulding problem</strong><small>Mould Master · start from the defect, rank mechanisms and check evidence.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-role="process-data" data-mm-onclick="mmOpenDataDiagnosis()"><span class="mm-home-action-icon">⌁</span><span><strong>Analyse process data</strong><small>Read baseline, fault and recovery trends before changing settings.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-role="practice-scenario" data-mm-onclick="switchView('scenarios')"><span class="mm-home-action-icon">◎</span><span><strong>Practice a scenario</strong><small>Build shop-floor judgement with evidence-first decisions.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-role="explore-learning" data-mm-onclick="switchView('path')"><span class="mm-home-action-icon">▦</span><span><strong>Explore your learning</strong><small>Open the 120-lesson pathway, progress and linked practice.</small></span></button>
      </div>
    </section>`);
}

renderLesson=function(){
  originalRenderLesson();
  decorateLesson();
};
renderDashboard=function(){
  originalRenderDashboard();
  decorateDashboard();
};

window.MM_LEARNING_EXPERIENCE={version:VERSION,decorateLesson,decorateDashboard,completeAndContinue};
if(typeof currentView==='string'){
  if(currentView==='lesson')decorateLesson();
  if(currentView==='dashboard')decorateDashboard();
}
})();
/* <<< learning-experience.js */

/* >>> curriculum-integration.js */
/* MouldMaster curriculum integration — theory → practice → evidence — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.08.26.1';
const RETURN_KEY='mm_curriculum_return_v1';

if(typeof renderLesson!=='function'||typeof renderDashboard!=='function'||typeof currentLesson!=='function'||typeof D==='undefined'){
  throw new Error('curriculum-integration.js requires the core lesson runtime');
}
if(!window.MM_LEARNING_EXPERIENCE||!window.MM_DIAGNOSTIC_LABS||!window.MM_PROCESS_DATA_DIAGNOSTICS||!window.MM_MATERIAL_BEHAVIOUR_LABS){
  throw new Error('curriculum-integration.js requires learning experience, diagnostic, process-data and material practice modules');
}

const ROUTES=Object.freeze([
  {type:'diagnostic',id:'cavity-short-shot',courses:[4,6,11,12],keywords:['short shot','cavity','imbalance','gate','runner','vent','local flow'],why:'Use cavity identity and local-versus-global evidence before changing the whole process.'},
  {type:'diagnostic',id:'splay-moisture',courses:[3,6,12],keywords:['splay','silver streak','moisture','drying','material change','volatile'],why:'Separate displayed dryer conditions from verified resin condition and handling history.'},
  {type:'diagnostic',id:'pressure-limited-fill',courses:[1,2,5,7,12],keywords:['setpoint','actual','velocity','injection speed','pressure limit','fill time','machine capability'],why:'Compare commanded settings with measured machine response before assuming the process followed the recipe.'},
  {type:'diagnostic',id:'check-ring-repeatability',courses:[2,5,7,8,12],keywords:['check ring','non-return','cushion','repeatability','shot delivery','part mass','transfer position'],why:'Connect repeatability signals to the physical shot-delivery system instead of tuning around instability.'},
  {type:'diagnostic',id:'cooling-warpage',courses:[4,6,11,12],keywords:['cooling','warpage','coolant','circuit','mould temperature','thermal balance'],why:'Use cooling-flow and thermal-balance evidence to distinguish a tooling condition from a recipe problem.'},
  {type:'diagnostic',id:'gate-seal-study',courses:[5,7,8,9],keywords:['gate seal','hold time','packing','hold pressure','part mass','scientific moulding','process window'],why:'Turn packing theory into a controlled study that links one input change to a measured response.'},
  {type:'diagnostic',id:'measurement-noise',courses:[8,9,10,12],keywords:['measurement','gauge','gage','repeatability','reproducibility','noise','dimension','capability'],why:'Challenge the measurement system before adjusting a stable moulding process to chase noise.'},
  {type:'diagnostic',id:'hot-runner-imbalance',courses:[4,10,11,12],keywords:['hot runner','heater','thermocouple','manifold','branch','cavity balance'],why:'Combine local cavity behaviour with heater/control evidence instead of trusting one displayed temperature.'},
  {type:'diagnostic',id:'local-flash',courses:[4,6,11,12],keywords:['flash','shutoff','parting line','tool damage','mould support','clamp force'],why:'Use defect location and tooling history to test a local mechanism before applying global force or pressure.'},

  {type:'data',id:'check-ring-leakage',courses:[1,2,5,7,8,12],keywords:['check ring','non-return','cushion','shot mass','shot delivery','repeatability'],why:'Read correlated cushion, mass and pressure signals across baseline, fault and recovery cycles.'},
  {type:'data',id:'cooling-restriction',courses:[4,6,11,12],keywords:['cooling','coolant','flow','warpage','mould temperature','thermal'],why:'Use a 72-cycle pattern to connect reduced circuit flow with thermal and dimensional response.'},
  {type:'data',id:'gate-seal-study',courses:[5,7,8,9],keywords:['gate seal','hold time','packing','part mass','pressure area'],why:'Use synthetic study data to recognise the response plateau that supports a gate-seal conclusion.'},
  {type:'data',id:'material-moisture-pc',courses:[3,6,12],keywords:['moisture','drying','polycarbonate','pc','splay','material condition'],why:'Compare material-condition signals with cosmetic and mechanical responses instead of relying on a dryer screen.'},
  {type:'data',id:'hot-runner-zone-drift',courses:[4,10,11,12],keywords:['hot runner','heater duty','zone','temperature drift','thermocouple','controller'],why:'See how control effort and local response can expose a thermal fault even when displayed temperature looks stable.'},
  {type:'data',id:'valve-gate-timing',courses:[4,10,11,12],keywords:['valve gate','sequential','timing','cavity trace','cavity pressure'],why:'Use cavity-specific timing evidence to distinguish a local sequence problem from a global machine change.'},
  {type:'data',id:'local-flash-tooling',courses:[4,6,11,12],keywords:['flash','shutoff','parting line','tooling','local defect'],why:'Compare local flash evidence with stable global signals to test a tooling mechanism.'},
  {type:'data',id:'energy-base-load',courses:[1,8,10,12],keywords:['energy','efficiency','economics','cycle time','utility','base load'],why:'Connect stable quality and cycle performance with changing energy demand so efficiency decisions stay evidence based.'},
  {type:'data',id:'measurement-noise',courses:[8,9,10,12],keywords:['measurement','noise','msa','gauge','gage','dimension','repeatability','reproducibility'],why:'Compare true process stability with rising measurement spread before drawing a process conclusion.'},
  {type:'data',id:'recycled-pp-lot',courses:[3,8,9,12],keywords:['recycled','regrind','polypropylene','pp','mfr','mvr','lot','rheology'],why:'Connect incoming-material lot evidence to pressure, fill and dimensional response instead of copying old settings.'},
  {type:'data',id:'machine-transfer',courses:[1,2,5,7,8,12],keywords:['machine transfer','transfer process','setpoint','actual','machine capability','copy recipe','process transfer'],why:'See why identical screen values on two machines do not guarantee the same physical process response.'},
  {type:'data',id:'cavity-pack-area',courses:[4,5,7,8,11,12],keywords:['cavity pressure','pack area','pressure curve','pressure history','packing','peak pressure'],why:'Use the full pressure-history area to see changes that a single peak value can hide.'},
  {type:'data',id:'screw-barrel-wear',courses:[2,5,8,12],keywords:['screw','barrel','wear','recovery','plasticising','back pressure','melt temperature'],why:'Trend plasticising and recovery signals together before compensating for a changing mechanical system.'},
  {type:'data',id:'ejector-drag',courses:[4,6,10,11,12],keywords:['ejection','ejector','drag','release','draft','eject force'],why:'Connect ejection force, local temperature and part response to a cooling/release mechanism.'},

  {type:'material',id:'pp-vs-pc-drying',courses:[1,3,5],keywords:['polymer family','polypropylene','pp','polycarbonate','pc','drying','grade','material handling'],why:'Compare two resin families to practise using exact grade requirements instead of one generic drying rule.'},
  {type:'material',id:'pc-wet-vs-dry',courses:[3,6,8,12],keywords:['polycarbonate','pc','moisture','drying','splay','hydrolysis','impact'],why:'Connect verified pellet moisture to appearance and property risk after a handling interruption.'},
  {type:'material',id:'pa66-gf30-dry-conditioned',courses:[3,4,8,11,12],keywords:['nylon','pa66','glass fibre','glass fiber','fibre orientation','fiber orientation','conditioning','anisotropy','warpage','shrinkage'],why:'Separate pre-mould drying from post-mould conditioning and connect reinforcement orientation to dimensional behaviour.'},
  {type:'material',id:'abs-thermal-history',courses:[3,5,6,12],keywords:['abs','residence time','thermal history','degradation','purge','black speck','discolour','discolor'],why:'Use process history and restart timing to distinguish thermal degradation from a generic moisture assumption.'},
  {type:'material',id:'pom-thermal-safety',courses:[3,5,6,12],keywords:['pom','acetal','formaldehyde','contamination','thermal degradation','nozzle blockage','material safety'],why:'Practise the point where material identity changes the safe decision space before optimisation can continue.'},
  {type:'material',id:'recycled-pp-lot-rheology',courses:[3,8,9,12],keywords:['recycled','regrind','secondary feedstock','mfr','mvr','rheology','material lot','polypropylene'],why:'Use lot identity, incoming QC and process actuals together when secondary-feedstock rheology changes.'}
]);

const COURSE_FALLBACKS=Object.freeze({
  1:[{type:'diagnostic',id:'pressure-limited-fill'},{type:'data',id:'check-ring-leakage'}],
  2:[{type:'diagnostic',id:'check-ring-repeatability'},{type:'data',id:'machine-transfer'}],
  3:[{type:'material',id:'pp-vs-pc-drying'},{type:'data',id:'material-moisture-pc'}],
  4:[{type:'diagnostic',id:'cooling-warpage'},{type:'data',id:'cooling-restriction'}],
  5:[{type:'diagnostic',id:'gate-seal-study'},{type:'data',id:'gate-seal-study'}],
  6:[{type:'diagnostic',id:'cavity-short-shot'},{type:'data',id:'local-flash-tooling'}],
  7:[{type:'diagnostic',id:'gate-seal-study'},{type:'data',id:'cavity-pack-area'}],
  8:[{type:'diagnostic',id:'measurement-noise'},{type:'data',id:'machine-transfer'}],
  9:[{type:'diagnostic',id:'measurement-noise'},{type:'data',id:'measurement-noise'}],
  10:[{type:'diagnostic',id:'hot-runner-imbalance'},{type:'data',id:'valve-gate-timing'}],
  11:[{type:'diagnostic',id:'hot-runner-imbalance'},{type:'data',id:'hot-runner-zone-drift'}],
  12:[{type:'diagnostic',id:'check-ring-repeatability'},{type:'data',id:'machine-transfer'}]
});

const TYPE_META=Object.freeze({
  diagnostic:{label:'Diagnostic lab',detail:'Reason through a realistic evidence-first fault case.',selector:'data-dl-start'},
  data:{label:'Data diagnosis',detail:'Read baseline → fault → recovery evidence from a 72-cycle synthetic dataset.',selector:'data-pd-start'},
  material:{label:'Material lab',detail:'Apply grade-aware material evidence and safe handling logic.',selector:'data-ml-start'}
});

function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function key(route){return `${route.type}:${route.id}`}
function courseFor(lesson){return D.courses.find(c=>c.id===lesson.course)||null}
function libraryFor(type){
  if(type==='diagnostic')return window.MM_DIAGNOSTIC_LABS.labs||[];
  if(type==='data')return window.MM_PROCESS_DATA_DIAGNOSTICS.cases||[];
  if(type==='material')return window.MM_MATERIAL_BEHAVIOUR_LABS.labs||[];
  return [];
}
function itemFor(route){return libraryFor(route.type).find(item=>item.id===route.id)||null}
function routeFor(type,id){return ROUTES.find(r=>r.type===type&&r.id===id)||null}
function lessonText(lesson,course){
  return [lesson.title,lesson.summary,lesson.intro,...(lesson.objectives||[]),...(lesson.keypoints||[]),lesson.exercise,course?.name,course?.description].join(' ').toLowerCase();
}
function scoreRoute(route,lesson,course){
  const title=String(lesson.title||'').toLowerCase();
  const text=lessonText(lesson,course);
  let score=route.courses.includes(lesson.course)?2:0;
  for(const keyword of route.keywords){
    const k=keyword.toLowerCase();
    if(title.includes(k))score+=8;
    else if(text.includes(k))score+=4;
  }
  return score;
}
function expand(routeLike){
  const route=routeFor(routeLike.type,routeLike.id);
  if(!route)return null;
  const item=itemFor(route);
  return item?{...route,item}:null;
}
function recommendationsFor(lesson){
  const course=courseFor(lesson);
  const ranked=ROUTES.map(route=>({route,score:scoreRoute(route,lesson,course)})).filter(x=>itemFor(x.route)).sort((a,b)=>b.score-a.score||key(a.route).localeCompare(key(b.route)));
  const chosen=[];
  const seen=new Set();
  const add=route=>{const expanded=expand(route);if(!expanded||seen.has(key(expanded)))return false;seen.add(key(expanded));chosen.push(expanded);return true};

  const strong=ranked.filter(x=>x.score>2);
  if(strong[0])add(strong[0].route);
  const firstType=chosen[0]?.type;
  const diverse=strong.find(x=>x.route.type!==firstType&&!seen.has(key(x.route)));
  if(diverse)add(diverse.route);
  for(const candidate of strong){if(chosen.length>=2)break;add(candidate.route)}
  for(const fallback of COURSE_FALLBACKS[lesson.course]||[]){if(chosen.length>=2)break;add(fallback)}
  for(const candidate of ranked){if(chosen.length>=2)break;add(candidate.route)}
  return chosen.slice(0,2);
}

function validateCoverage(){
  if(!Array.isArray(D.lessons)||D.lessons.length!==120)throw new Error('Curriculum integration expects the canonical 120-lesson pathway');
  for(let course=1;course<=12;course++){
    const fallback=COURSE_FALLBACKS[course];
    if(!Array.isArray(fallback)||fallback.length<2)throw new Error(`Curriculum integration missing fallback practice for course ${course}`);
    for(const item of fallback)if(!expand(item))throw new Error(`Curriculum integration fallback is not available: ${item.type}:${item.id}`);
  }
  for(const route of ROUTES)if(!itemFor(route))throw new Error(`Curriculum route points to unavailable practice: ${key(route)}`);
  for(const lesson of D.lessons){
    const recs=recommendationsFor(lesson);
    if(recs.length!==2)throw new Error(`Lesson ${lesson.id} does not have two valid curriculum practice connections`);
  }
}

function setReturn(lessonId){
  try{sessionStorage.setItem(RETURN_KEY,JSON.stringify({lessonId:Number(lessonId),at:Date.now()}))}catch(_){}
  updateReturnButton();
}
function getReturn(){
  try{const x=JSON.parse(sessionStorage.getItem(RETURN_KEY)||'null');return x&&Number.isInteger(Number(x.lessonId))?x:null}catch(_){return null}
}
function clearReturn(){try{sessionStorage.removeItem(RETURN_KEY)}catch(_){}updateReturnButton()}
function practiceButton(type,id){
  const attr=TYPE_META[type]?.selector;
  return attr?document.querySelector(`[${attr}="${id}"]`):null;
}
function openPractice(type,id,lessonId){
  const route=expand({type,id});
  if(!route)return toast?.('Linked practice is unavailable');
  setReturn(lessonId);
  window.MM_LEARNING_ANALYTICS?.record?.('curriculum_practice_open',{module:type,id});
  if(type==='diagnostic')window.MM_DIAGNOSTIC_LABS.open();
  else if(type==='data')window.MM_PROCESS_DATA_DIAGNOSTICS.open();
  else if(type==='material')window.MM_MATERIAL_BEHAVIOUR_LABS.open();
  requestAnimationFrame(()=>{
    const button=practiceButton(type,id);
    if(button)button.click();
    else toast?.('Open the recommended practice from this activity list');
    updateReturnButton();
  });
}
window.mmCurriculumOpen=openPractice;

function returnToLesson(){
  const origin=getReturn();
  if(!origin)return;
  const lesson=D.lessons.find(l=>l.id===Number(origin.lessonId));
  if(!lesson){clearReturn();return}
  user.currentLesson=lesson.id;
  persist();
  clearReturn();
  window.MM_LEARNING_ANALYTICS?.record?.('curriculum_return',{module:'lesson',id:String(lesson.id)});
  switchView('lesson');
  toast?.('Returned to linked lesson');
}
window.mmCurriculumReturn=returnToLesson;

function ensureReturnButton(){
  let button=document.getElementById('mmCurriculumReturnButton');
  if(button)return button;
  button=document.createElement('button');
  button.id='mmCurriculumReturnButton';
  button.type='button';
  button.className='secondary mm-curriculum-return hidden';
  button.addEventListener('click',returnToLesson);
  document.body.appendChild(button);
  return button;
}
function updateReturnButton(){
  const button=ensureReturnButton();
  const origin=getReturn();
  const lessonVisible=!document.getElementById('lesson')?.classList.contains('hidden');
  if(!origin||lessonVisible){button.classList.add('hidden');return}
  const lesson=D.lessons.find(l=>l.id===Number(origin.lessonId));
  button.textContent=lesson?`← Return to lesson ${lesson.id}`:'← Return to lesson';
  button.classList.remove('hidden');
}

const style=document.createElement('style');
style.id='mm-curriculum-integration-style';
style.textContent=`
.mm-curriculum-section{margin-top:24px;padding:18px;border:1px solid #38617a;border-radius:15px;background:linear-gradient(135deg,#0f2638,#11243a)}
.mm-curriculum-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.mm-curriculum-head h3{margin:5px 0 6px}.mm-curriculum-head p{margin:0;color:#bdd0e2;line-height:1.5;max-width:760px}
.mm-curriculum-loop{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.mm-curriculum-loop span{font-size:10px;padding:5px 8px;border:1px solid #3a5877;border-radius:999px;background:#102137;color:#c6d8ea}.mm-curriculum-loop b{color:var(--accent)}
.mm-curriculum-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.mm-curriculum-card{padding:14px;border:1px solid #34516e;border-radius:12px;background:#0d1d31}.mm-curriculum-card h4{margin:6px 0 7px;font-size:16px}.mm-curriculum-card p{margin:0;color:#b9cade;font-size:12px;line-height:1.5}.mm-curriculum-card .mm-next-actions{margin-top:11px}
.mm-curriculum-type{font-size:10px;text-transform:uppercase;letter-spacing:.11em;color:var(--accent);font-weight:800}.mm-curriculum-boundary{margin-top:12px;font-size:11px;color:#9fb4ca;line-height:1.5}.mm-curriculum-boundary b{color:#d8e5f1}
.mm-curriculum-focus{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:-3px 0 14px;padding:13px 15px;border:1px solid #304d6b;border-radius:13px;background:#0e1e31}.mm-curriculum-focus p{margin:3px 0 0;color:#aebfd1;font-size:12px;line-height:1.4}.mm-curriculum-focus b{display:block}
.mm-curriculum-return{position:fixed;right:18px;bottom:18px;z-index:24;box-shadow:0 10px 30px rgba(0,0,0,.35)}
@media(max-width:760px){.mm-curriculum-grid{grid-template-columns:1fr}.mm-curriculum-focus{align-items:stretch;flex-direction:column}.mm-curriculum-focus button{width:100%}.mm-curriculum-return{right:12px;bottom:78px;max-width:calc(100vw - 24px)}}
`;
document.head.appendChild(style);

function cardHtml(rec,index,lessonId){
  const meta=TYPE_META[rec.type];
  const title=rec.item.title||rec.id;
  const detail=index===0?'Best fit for this lesson':'Evidence extension';
  return `<article class="mm-curriculum-card"><span class="mm-curriculum-type">${esc(meta.label)} · ${detail}</span><h4>${esc(title)}</h4><p>${esc(rec.why||meta.detail)}</p><div class="mm-next-actions"><button class="secondary" type="button" data-mm-onclick="mmCurriculumOpen('${esc(rec.type)}','${esc(rec.id)}',${Number(lessonId)})">Open linked practice →</button></div></article>`;
}
function decorateLesson(){
  const root=document.getElementById('lesson');
  const lesson=currentLesson();
  const notes=root?.querySelector('#mmNotes')||[...(root?.querySelectorAll('.lesson-body h3')||[])].find(h=>h.textContent.trim()==='Your lesson notes');
  if(!root||!notes||root.querySelector('#mmCurriculumPractice'))return;
  const recs=recommendationsFor(lesson);
  notes.insertAdjacentHTML('beforebegin',`<section class="mm-curriculum-section" id="mmCurriculumPractice" aria-label="Linked curriculum practice"><div class="mm-curriculum-head"><div><span class="eyebrow">Theory → practice → evidence</span><h3>Apply this lesson</h3><p>Use the concept you just studied in two guided activities. The first is the closest fit; the second strengthens the evidence habit from another angle.</p></div><span class="pill">2 linked activities</span></div><div class="mm-curriculum-loop"><span><b>1</b> Learn the mechanism</span><span><b>2</b> Make a diagnosis</span><span><b>3</b> Read the evidence</span><span><b>4</b> Return and explain</span></div><div class="mm-curriculum-grid">${recs.map((rec,index)=>cardHtml(rec,index,lesson.id)).join('')}</div><div class="mm-curriculum-boundary"><b>Learning boundary:</b> linked practice is optional formative learning. It does not change formal assessment answers, certificate rules or production setpoints.</div></section>`);
  const jumps=root.querySelector('.mm-learning-jumps');
  if(jumps&&!jumps.querySelector('[data-mm-curriculum-jump]'))jumps.insertAdjacentHTML('beforeend','<button type="button" data-mm-curriculum-jump data-mm-onclick="mmLearningJump(\'mmCurriculumPractice\')">Linked practice</button>');
  const origin=getReturn();
  if(origin&&Number(origin.lessonId)===lesson.id)clearReturn();
}
function decorateDashboard(){
  const root=document.getElementById('dashboard');
  if(!root||root.querySelector('.mm-curriculum-focus'))return;
  const lesson=currentLesson();
  const rec=recommendationsFor(lesson)[0];
  if(!rec)return;
  const focus=root.querySelector('.mm-today-focus');
  const html=`<section class="mm-curriculum-focus" aria-label="Current lesson practice connection"><div><span class="eyebrow">Learning loop</span><b>After ${esc(lesson.title)}: ${esc(rec.item.title||rec.id)}</b><p>Move from the lesson explanation into guided practice, then return to explain what evidence changed your conclusion.</p></div><button class="ghost" type="button" data-mm-onclick="mmCurriculumOpen('${esc(rec.type)}','${esc(rec.id)}',${Number(lesson.id)})">Open linked practice</button></section>`;
  if(focus)focus.insertAdjacentHTML('afterend',html);else root.insertAdjacentHTML('afterbegin',html);
}

const originalRenderLesson=renderLesson;
const originalRenderDashboard=renderDashboard;
renderLesson=function(){originalRenderLesson();decorateLesson();updateReturnButton()};
renderDashboard=function(){originalRenderDashboard();decorateDashboard();updateReturnButton()};

validateCoverage();
ensureReturnButton();
window.MM_CURRICULUM_INTEGRATION={
  version:VERSION,
  recommendations:lessonId=>{const lesson=D.lessons.find(l=>l.id===Number(lessonId));return lesson?recommendationsFor(lesson).map(r=>({type:r.type,id:r.id,title:r.item.title||r.id,why:r.why})):[]},
  open:openPractice,
  returnToLesson,
  coverage:{lessons:D.lessons.length,courses:D.courses.length,linksPerLesson:2},
  scope:'Formative curriculum links from lessons to existing diagnostic, material and synthetic-data practice; no formal assessment mutation and no production recipe.'
};

if(typeof currentView==='string'){
  if(currentView==='lesson')decorateLesson();
  if(currentView==='dashboard')decorateDashboard();
}
updateReturnButton();
})();
/* <<< curriculum-integration.js */

/* >>> specialist-curriculum.js */
/* MouldMaster specialist curriculum — optional gap-driven extensions — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.08.26.1';
const STORAGE_BASE='mm_specialist_curriculum_v1';
const CORE=window.MM_DATA;
if(!CORE||!Array.isArray(CORE.lessons)||CORE.lessons.length!==120)throw new Error('specialist-curriculum.js requires the canonical 120-lesson core');

const LESSONS=[
  {
    id:'S01',title:'Hazardous-energy intervention, isolation & stored energy',level:'Specialist safety',
    gap:'The core teaches safe observation and safeguarding, while regional assessment evidence goes deeper into servicing, guard removal, danger-zone entry and stored energy. This extension connects those ideas without replacing site-specific authorised isolation training.',
    coreLessons:[6,15,100],
    objectives:['Distinguish normal stop, emergency stop, safeguarding and hazardous-energy isolation.','Recognise when servicing or intervention changes the risk state of the moulding cell.','Identify the evidence an authorised isolation procedure must address before work begins.'],
    keypoints:['A stopped machine can still contain electrical, hydraulic, pneumatic, thermal, gravitational or mechanically stored energy.','An interlock or emergency-stop function is not automatically an energy-isolation method.','Isolation requirements depend on the real task, equipment, jurisdiction and approved site procedure.','Training must never encourage bypassing guards, defeating interlocks or entering a danger zone to complete an exercise.'],
    evidenceTask:'For a hypothetical intervention, list the energy forms that could remain after a normal stop, then identify which current machine manual, site isolation procedure and jurisdiction-specific safety source would have to be checked by an authorised person before work.',
    practices:[{type:'standards',label:'Review standards & safety references'},{type:'core',id:'6',label:'Revisit core lesson 6 — Safe start-up observation'}]
  },
  {
    id:'S02',title:'Clamp force, projected area & mould-opening risk',level:'Specialist process engineering',
    gap:'Clamp anatomy and flash are already covered, but the core does not give projected-area reasoning its own focused learning step even though the assessment and defect library use it.',
    coreLessons:[14,18,52,65],
    objectives:['Explain how cavity pressure acting over projected area creates mould-opening force.','Separate local flash/tooling evidence from a genuine global clamp-capability question.','Recognise why machine-, mould- and process-specific methods are required instead of a universal tonnage rule.'],
    keypoints:['Projected area is the cavity and runner area projected onto the parting plane, not part surface area in three dimensions.','Cavity pressure is not perfectly uniform, so simple multiplication is a reasoning model rather than a universal sizing recipe.','Local flash after a tooling event can occur while global clamp force remains stable.','More clamp force is not a substitute for inspecting parting lines, inserts, support, mould condition and the actual pressure history.'],
    evidenceTask:'Sketch the projected footprint of an example multi-cavity tool, identify what pressure evidence would be needed to reason about opening force, and separately list evidence that would favour a local shutoff/tooling cause.',
    practices:[{type:'data',id:'local-flash-tooling',label:'Data diagnosis — Local flash vs global clamp'},{type:'core',id:'14',label:'Revisit core lesson 14 — Clamp unit anatomy'}]
  },
  {
    id:'S03',title:'Plasticising controls: back pressure, screw speed, decompression & recovery',level:'Specialist machine/process',
    gap:'Screw recovery is a core topic, but plasticising controls need a deeper systems view so learners do not treat recovery time, melt condition, mixing and decompression as independent knobs.',
    coreLessons:[11,12,13,25,48],
    objectives:['Relate screw rotation, back pressure, recovery time and melt condition as coupled plasticising responses.','Explain why decompression is a pressure-management function rather than a material-quality cure.','Use recovery and shot-delivery trends to decide whether a machine/plasticising investigation is warranted.'],
    keypoints:['Screw speed and back pressure can change shear work, mixing, recovery time and material thermal history.','A barrel-zone setpoint does not by itself prove actual melt condition.','Decompression can influence nozzle pressure and feed behaviour but should not be used to hide an unstable shot-delivery mechanism.','Trend recovery time, cushion, transfer, shot mass and melt evidence together before making a mechanism claim.'],
    evidenceTask:'Compare a stable and drifting plasticising sequence. Decide which measured actuals would distinguish feed inconsistency, check-ring behaviour, excessive recovery demand and a developing screw/barrel condition.',
    practices:[{type:'data',id:'screw-barrel-wear',label:'Data diagnosis — Screw/barrel wear'},{type:'data',id:'check-ring-leakage',label:'Data diagnosis — Check-ring leakage'}]
  },
  {
    id:'S04',title:'Reinforced polymers: fibre orientation, anisotropy & conditioning',level:'Specialist materials',
    gap:'The core covers polymer families, orientation and warpage, but reinforced materials need an explicit bridge between fibre direction, anisotropic shrinkage/stiffness and the material conditioning state used for measurement.',
    coreLessons:[21,23,58,104,107],
    objectives:['Explain why reinforced polymers can respond differently along and across flow direction.','Separate pre-mould drying from post-mould conditioning and test-state definition.','Connect gate/flow orientation and thermal balance to directional dimensional behaviour.'],
    keypoints:['Fibre reinforcement can make shrinkage, stiffness and warpage strongly direction-dependent.','Drying before moulding and conditioning after moulding are different operations with different purposes.','A property or dimension without its conditioning state and measurement direction can be misleading.','Global process compensation can hide an orientation or tooling mechanism rather than correct it.'],
    evidenceTask:'Define a dimensional study for a glass-filled polyamide part that records flow direction, conditioning state, measurement timing and local thermal evidence before comparing dimensions.',
    practices:[{type:'material',id:'pa66-gf30-dry-conditioned',label:'Material lab — PA66-GF30 dry vs conditioned'},{type:'core',id:'104',label:'Revisit core lesson 104 — Orientation'}]
  },
  {
    id:'S05',title:'Purging, contamination & material compatibility',level:'Specialist materials/safety',
    gap:'Material changeover and thermal degradation are core topics, but contamination and purge compatibility need a stronger material-specific safety boundary.',
    coreLessons:[27,28,29,30],
    objectives:['Treat purge/changeover decisions as material-specific rather than universal.','Recognise when contamination or excessive thermal history becomes a safety issue as well as a quality issue.','Use identity, history and approved supplier/site procedures before attempting process recovery.'],
    keypoints:['A purge method acceptable for one resin may be ineffective or unsafe for another.','Unknown material identity is evidence of uncertainty, not permission to process through it.','Thermal abuse can create degradation products and pressure hazards; increasing heat is not a universal blockage response.','Contamination evidence should be traced through hoppers, dryers, transfer lines, barrel/nozzle, hot runner and regrind streams as applicable.'],
    evidenceTask:'For a hypothetical mixed-material changeover, identify the material identities and compatibility information that must be verified, the locations where hold-up could remain, and the approved documents that control the clean-out/restart decision.',
    practices:[{type:'material',id:'pom-thermal-safety',label:'Material lab — POM thermal/contamination safety'},{type:'material',id:'abs-thermal-history',label:'Material lab — ABS thermal history'}]
  },
  {
    id:'S06',title:'Internal defects: voids, delamination & hidden failure modes',level:'Specialist troubleshooting',
    gap:'Voids and delamination already exist in the Defect Finder but do not have dedicated core lessons, leaving a gap between visible symptom troubleshooting and internal/sectioned evidence.',
    coreLessons:[53,56,59,67],
    objectives:['Distinguish internal shrinkage voids from surface sink and other internal discontinuities.','Recognise contamination/incompatibility and interlayer bonding as possible delamination mechanisms.','Choose destructive inspection, material identity and packing evidence when surface appearance is insufficient.'],
    keypoints:['A visually acceptable surface does not prove the interior is sound.','Voids in thick sections can reflect center shrinkage, gate effectiveness and cooling gradients.','Delamination can point toward incompatibility, contamination, excessive shear or weak interlayer bonding.','Sectioning, microscopy or other approved inspection methods can be more diagnostic than repeated machine adjustments.'],
    evidenceTask:'Take one hypothetical hidden defect and define the minimum evidence needed to distinguish geometry/packing/cooling from material incompatibility or degradation before changing the validated process.',
    practices:[{type:'defects',label:'Defect Finder — Voids and delamination'},{type:'data',id:'gate-seal-study',label:'Data diagnosis — Gate-seal/packing plateau'}]
  },
  {
    id:'S07',title:'SPC, control charts & reaction plans',level:'Specialist quality engineering',
    gap:'Capability and DOE are strong in the core, but statistical process control needs an explicit lesson on time order, common/special causes and disciplined reaction rather than adjustment to every point.',
    coreLessons:[9,60,71,72,73,74,80],
    objectives:['Explain why time-ordered stability evidence comes before capability interpretation.','Distinguish common-cause variation from signals that warrant investigation under an approved reaction plan.','Avoid tampering with a stable process in response to measurement noise or isolated points.'],
    keypoints:['A process can be within specification and still be unstable; specification limits and control limits answer different questions.','Control charts are decision aids whose chart type, subgrouping and rules must match the process and quality system.','Reaction plans should identify what evidence to check before changing the process.','Measurement-system problems can create apparent process signals that should not be tuned away.'],
    evidenceTask:'Design a simple time-ordered monitoring plan for one critical dimension or process actual: define the subgroup logic, known-good baseline evidence, investigation trigger and first checks in the reaction plan without inventing universal numeric limits.',
    practices:[{type:'data',id:'measurement-noise',label:'Data diagnosis — Measurement noise masquerading as drift'},{type:'core',id:'72',label:'Revisit core lesson 72 — Stability before capability'}]
  },
  {
    id:'S08',title:'Gage R&R, MSA & measurement uncertainty',level:'Specialist measurement',
    gap:'Measurement-system awareness is already a core lesson, but learners need a deeper exercise separating repeatability, reproducibility, resolution, fixture/method and part variation.',
    coreLessons:[60,72,75,76,82],
    objectives:['Separate process variation from variation introduced by the measurement system.','Explain repeatability and reproducibility in practical moulded-part measurement.','Recognise when fixture, conditioning time, operator method or resolution can dominate the conclusion.'],
    keypoints:['A larger measured spread does not prove the moulding process became less stable.','Measurement studies must reflect the real characteristic, method, operators/conditions and expected part range.','Resolution alone does not establish measurement adequacy.','Capability, DOE and validation conclusions inherit the limitations of the measurement system used to generate them.'],
    evidenceTask:'Build a measurement-system investigation for a dimension that suddenly appears noisier: define repeated measurements, operator/method comparisons, fixture and conditioning controls, and an independent process signal to compare against.',
    practices:[{type:'data',id:'measurement-noise',label:'Data diagnosis — Measurement-system variation'},{type:'core',id:'75',label:'Revisit core lesson 75 — Measurement system awareness'}]
  },
  {
    id:'S09',title:'Sequential and valve-gate timing',level:'Specialist tooling/process',
    gap:'Hot runners and balancing are core topics, but sequential valve-gate timing deserves focused treatment because a local timing shift can look like a global fill problem.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Explain why valve timing changes local flow-front interaction and cavity balance.','Compare commanded valve timing with actual actuation and cavity-specific response.','Avoid global recipe changes when the evidence isolates one sequential branch or gate.'],
    keypoints:['One cavity or branch separating while others remain stable is strong localisation evidence.','Commanded timing is not proof that the valve physically actuated at that time.','Cavity pressure, fill signature, actuator/sensor evidence and part pattern should be interpreted together.','Sequential-gating optimisation must remain within approved tool, hot-runner and process limits.'],
    evidenceTask:'For a two-branch sequential-gate example, identify the signals that would distinguish an actual valve-delay fault from a global viscosity or machine-velocity change.',
    practices:[{type:'data',id:'valve-gate-timing',label:'Data diagnosis — Valve-gate timing'},{type:'core',id:'108',label:'Revisit core lesson 108 — Hot-runner balancing'}]
  },
  {
    id:'S10',title:'Screw/barrel wear & plasticising-system health',level:'Specialist maintenance/process',
    gap:'Maintenance-process interaction is a core expert lesson, but screw/barrel wear deserves its own diagnostic bridge because gradual wear often appears first as coupled recovery, melt and shot-delivery drift.',
    coreLessons:[11,12,13,48,113,118],
    objectives:['Recognise coupled process signatures that justify a plasticising-system investigation.','Separate gradual machine wear from material-lot, feed and cavity-side causes.','Use trend and maintenance evidence rather than compensating indefinitely with recipe changes.'],
    keypoints:['Wear can alter conveying, melting, recovery and repeatability before it becomes visually obvious.','Recovery time alone is not enough; combine it with melt, shot, back-pressure and material evidence.','A changed process response after maintenance should be compared with the known-good baseline.','Confirmed mechanical deterioration should be corrected under the approved maintenance process before redefining the validated moulding window.'],
    evidenceTask:'Create a trend review that uses recovery time, melt/shot evidence, back-pressure response, material history and maintenance findings to decide whether a machine inspection is warranted.',
    practices:[{type:'data',id:'screw-barrel-wear',label:'Data diagnosis — Screw/barrel wear'},{type:'core',id:'118',label:'Revisit core lesson 118 — Maintenance-process interaction'}]
  },
  {
    id:'S11',title:'Ejector/tool condition, drag & release evidence',level:'Specialist tooling',
    gap:'Ejection is taught in the core, but drag, eject force and local thermal/tool condition need a deeper diagnostic link so learners do not simply increase ejection force or speed.',
    coreLessons:[35,36,37,49,58,106],
    objectives:['Relate ejection load to local temperature, shrinkage, draft, texture and tool condition.','Use eject-force and thermal trends as evidence rather than treating release as a purely mechanical setting.','Separate a local release problem from a global cycle or packing problem.'],
    keypoints:['Higher eject force is a symptom measurement as well as a machine setting concern.','Local cooling imbalance can change dimensions and release load together.','Draft, texture, surface/tool condition and deformation can all affect drag.','Increasing ejection force without identifying the mechanism can damage parts or tooling and conceal the real condition.'],
    evidenceTask:'Compare baseline and high-drag cycles using eject force, part/eject temperature, dimension, surface evidence and cooling-flow data. State which evidence would send the investigation toward cooling versus tooling/release geometry.',
    practices:[{type:'data',id:'ejector-drag',label:'Data diagnosis — Ejector drag'},{type:'core',id:'37',label:'Revisit core lesson 37 — Ejection'}]
  },
  {
    id:'S12',title:'Sustainable processing: energy base load & recycled-feedstock variability',level:'Specialist sustainability/process',
    gap:'Cycle-time economics and scrap reduction are in the expert core, but energy efficiency and recycled-material variability need explicit evidence-based treatment so sustainability changes are not separated from quality and validation.',
    coreLessons:[29,63,71,80,112,116,117],
    objectives:['Separate energy consumed by productive moulding work from machine/auxiliary base load.','Treat recycled-feedstock lot variation as a material/process input that may require verification or revalidation.','Evaluate sustainability changes against quality, robustness, traceability and approved material requirements rather than one metric alone.'],
    keypoints:['Energy per cycle can rise while cycle time and accepted quality remain stable, pointing toward machine or auxiliary demand.','Nominally similar recycled feedstock can show meaningful rheology and lot variation.','Lower energy or higher recycled content is not a valid improvement if quality, material compliance or process robustness is lost.','Track material identity, lot/property evidence, process actuals, reject/scrap response and energy together.'],
    evidenceTask:'Build a before/after sustainability review that includes energy per accepted part, cycle/quality stability, material lot/property evidence and the change-control decision needed before adopting a new normal condition.',
    practices:[{type:'data',id:'energy-base-load',label:'Data diagnosis — Energy base load'},{type:'data',id:'recycled-pp-lot',label:'Data diagnosis — Recycled PP lot variability'},{type:'material',id:'recycled-pp-lot-rheology',label:'Material lab — Recycled PP rheology'}]
  }
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';
  try{if(typeof user!=='undefined'&&user?.id)raw=String(user.id);else if(window.db?.activeUser)raw=String(window.db.activeUser)}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){try{const x=JSON.parse(localStorage.getItem(storageKey())||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
function writeState(x){try{localStorage.setItem(storageKey(),JSON.stringify(x))}catch(_){}}
function isDone(id){return !!readState()[id]}
function setDone(id,done){const s=readState();if(done)s[id]=true;else delete s[id];writeState(s);decorateDashboard(true)}
function coreLesson(id){return CORE.lessons.find(x=>x.id===Number(id))}

function ensureStyle(){
  if(document.getElementById('mm-specialist-style'))return;
  const s=document.createElement('style');s.id='mm-specialist-style';s.textContent=`
.mm-specialist-strip{margin-top:16px;padding:18px;border:1px solid #315171;border-radius:14px;background:linear-gradient(135deg,#10243a,#0d1c30)}.mm-specialist-strip h3{margin:4px 0 8px}.mm-specialist-strip p{color:var(--muted,#a9bdd6);line-height:1.55;margin:0 0 12px}.mm-specialist-meta{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0 13px}.mm-specialist-meta span{font-size:11px;border:1px solid #3a5a79;border-radius:999px;padding:5px 8px;color:#bfd2e8}.mm-specialist-modal{position:fixed;inset:0;z-index:10050;background:rgba(4,10,20,.82);display:grid;place-items:center;padding:18px}.mm-specialist-modal.hidden{display:none}.mm-specialist-dialog{width:min(1080px,96vw);max-height:92vh;overflow:auto;border:1px solid #385a7c;border-radius:18px;background:#0c182a;color:#edf5ff;box-shadow:0 26px 70px rgba(0,0,0,.5)}.mm-specialist-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:19px 21px;background:#101f33;border-bottom:1px solid #28435f}.mm-specialist-head h2{margin:4px 0 0}.mm-specialist-body{padding:20px}.mm-specialist-boundary{padding:12px 14px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;line-height:1.55;font-size:12px;margin:0 0 16px}.mm-specialist-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mm-specialist-card{padding:17px;border:1px solid #2e4a68;border-radius:13px;background:#102037}.mm-specialist-card h3{margin:7px 0}.mm-specialist-card p{font-size:13px;color:#b8cbe0;line-height:1.55}.mm-specialist-card .done{color:#79e3b2;font-weight:800}.mm-specialist-eyebrow{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#79aef2;font-weight:800}.mm-specialist-section{padding:15px;border:1px solid #294661;border-radius:12px;background:#0f1d30;margin:12px 0}.mm-specialist-section h3{margin-top:0}.mm-specialist-section ul{margin:8px 0 0;padding-left:20px}.mm-specialist-section li{margin:7px 0;line-height:1.5;color:#d6e2ef}.mm-specialist-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mm-specialist-actions button{min-height:38px}.mm-specialist-core{display:flex;gap:6px;flex-wrap:wrap}.mm-specialist-core button{font-size:11px}.mm-specialist-evidence{border-left:4px solid #55d6be;padding-left:14px}.mm-specialist-done-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid #29445f}@media(max-width:760px){.mm-specialist-grid{grid-template-columns:1fr}.mm-specialist-modal{padding:0}.mm-specialist-dialog{width:100vw;max-height:100vh;height:100vh;border-radius:0}.mm-specialist-head{padding:15px}.mm-specialist-body{padding:15px}}
`;
  document.head.appendChild(s)
}
function ensureModal(){
  ensureStyle();let m=document.getElementById('mmSpecialistModal');if(m)return m;
  m=document.createElement('div');m.id='mmSpecialistModal';m.className='mm-specialist-modal hidden';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Specialist curriculum extensions');
  m.innerHTML='<div class="mm-specialist-dialog"><div class="mm-specialist-head"><div><span class="mm-specialist-eyebrow">Optional specialist learning</span><h2 id="mmSpecialistTitle">Specialist extensions</h2></div><button class="ghost" type="button" data-mm-onclick="mmSpecialistClose()" aria-label="Close specialist curriculum">Close ×</button></div><div class="mm-specialist-body" id="mmSpecialistBody"></div></div>';
  m.addEventListener('click',e=>{if(e.target===m)close()});document.body.appendChild(m);return m
}
function open(){const m=ensureModal();m.classList.remove('hidden');renderCatalog();m.querySelector('button')?.focus()}
function close(){document.getElementById('mmSpecialistModal')?.classList.add('hidden')}
function boundary(){return '<div class="mm-specialist-boundary"><strong>Learning boundary:</strong> These are optional specialist extensions outside the canonical 120-lesson completion path. They are formative education, do not change formal assessment answers or certificate requirements, and are not production recipes or machine-specific authorisation. Verify the exact resin, machine, mould, approved site procedure and applicable safety requirements before real work.</div>'}
function renderCatalog(){
  const body=document.getElementById('mmSpecialistBody');const title=document.getElementById('mmSpecialistTitle');if(!body||!title)return;
  title.textContent='Specialist extensions';const done=LESSONS.filter(x=>isDone(x.id)).length;
  body.innerHTML=boundary()+`<div class="mm-specialist-meta"><span>120 core lessons unchanged</span><span>${LESSONS.length} optional extensions</span><span>${done}/${LESSONS.length} completed locally</span></div><div class="mm-specialist-grid">${LESSONS.map(l=>`<article class="mm-specialist-card"><span class="mm-specialist-eyebrow">${esc(l.id)} · ${esc(l.level)}</span><h3>${esc(l.title)}</h3><p>${esc(l.gap)}</p>${isDone(l.id)?'<div class="done">Completed ✓</div>':''}<div class="mm-specialist-actions"><button class="secondary" type="button" data-mm-onclick="mmSpecialistLesson('${l.id}')">Open extension →</button></div></article>`).join('')}</div>`
}
function renderLesson(id){
  const l=LESSONS.find(x=>x.id===id);if(!l)return;const m=ensureModal();m.classList.remove('hidden');const body=document.getElementById('mmSpecialistBody'),title=document.getElementById('mmSpecialistTitle');title.textContent=l.title;
  const coreButtons=l.coreLessons.map(id=>{const x=coreLesson(id);return x?`<button class="ghost" type="button" data-mm-onclick="mmSpecialistPractice('core','${id}')">${id}. ${esc(x.title)}</button>`:''}).join('');
  body.innerHTML=boundary()+`<button class="ghost" type="button" data-mm-onclick="mmSpecialistOpen()">← All specialist extensions</button><section class="mm-specialist-section"><span class="mm-specialist-eyebrow">Gap this closes</span><p>${esc(l.gap)}</p></section><section class="mm-specialist-section"><h3>Learning objectives</h3><ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section"><h3>Key engineering points</h3><ul>${l.keypoints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section mm-specialist-evidence"><h3>Evidence task</h3><p>${esc(l.evidenceTask)}</p></section><section class="mm-specialist-section"><h3>Linked core learning</h3><div class="mm-specialist-core">${coreButtons}</div></section><section class="mm-specialist-section"><h3>Apply the extension</h3><p>Use existing MouldMaster formative practice to test the mechanism with evidence.</p><div class="mm-specialist-actions">${l.practices.map((p,i)=>`<button class="secondary" type="button" data-mm-onclick="mmSpecialistPractice('${p.type}','${esc(p.id||'')}')">${esc(p.label||`Practice ${i+1}`)}</button>`).join('')}</div></section><div class="mm-specialist-done-row"><span>${isDone(l.id)?'Completed locally ✓':'Optional completion is stored only on this device for this learner.'}</span><button class="primary" type="button" data-mm-onclick="mmSpecialistToggle('${l.id}')">${isDone(l.id)?'Mark incomplete':'Mark specialist lesson complete'}</button></div>`
}
function practice(type,id){
  close();
  if(type==='core'){
    const n=Number(id);if(typeof openLesson==='function')return openLesson(n);try{currentLesson=n;if(typeof switchView==='function')switchView('lesson')}catch(_){}return
  }
  if(type==='defects'){if(typeof switchView==='function')switchView('defects');return}
  if(type==='standards'){if(typeof switchView==='function')switchView('standards');return}
  if(type==='data'&&window.MM_PROCESS_DATA_DIAGNOSTICS){window.MM_PROCESS_DATA_DIAGNOSTICS.open();setTimeout(()=>document.querySelector(`[data-pd-start="${id}"]`)?.click(),0);return}
  if(type==='material'&&window.MM_MATERIAL_BEHAVIOUR_LABS){window.MM_MATERIAL_BEHAVIOUR_LABS.open();setTimeout(()=>document.querySelector(`[data-ml-start="${id}"]`)?.click(),0);return}
}
function toggle(id){setDone(id,!isDone(id));renderLesson(id)}
function decorateDashboard(force){
  ensureStyle();const root=document.getElementById('dashboard');if(!root)return;const old=root.querySelector('#mmSpecialistDashboard');if(old){if(!force)return;old.remove()}
  const done=LESSONS.filter(x=>isDone(x.id)).length;
  root.insertAdjacentHTML('beforeend',`<section class="mm-specialist-strip" id="mmSpecialistDashboard" aria-label="Specialist curriculum extensions"><span class="mm-specialist-eyebrow">Go deeper where the core stops</span><h3>Specialist extensions</h3><p>The 120-lesson core remains the complete main pathway. These ${LESSONS.length} optional lessons close specific depth gaps in safety intervention, machine health, materials, measurement, tooling and sustainability—and each links back to existing evidence practice.</p><div class="mm-specialist-meta"><span>${LESSONS.length} optional lessons</span><span>${done} completed locally</span><span>No certificate requirement</span></div><button class="secondary" type="button" data-mm-onclick="mmSpecialistOpen()">Explore specialist extensions →</button></section>`)
}

const originalRenderDashboard=typeof renderDashboard==='function'?renderDashboard:null;
if(originalRenderDashboard){renderDashboard=function(){originalRenderDashboard();decorateDashboard(false)}}
window.mmSpecialistOpen=open;window.mmSpecialistClose=close;window.mmSpecialistLesson=renderLesson;window.mmSpecialistPractice=practice;window.mmSpecialistToggle=toggle;
window.MM_SPECIALIST_CURRICULUM={version:VERSION,coreLessonCount:120,optional:true,lessons:LESSONS.map(l=>({id:l.id,title:l.title,level:l.level,coreLessons:[...l.coreLessons],practices:l.practices.map(p=>({...p}))})),open,scope:'Optional formative specialist learning; canonical 120-lesson completion path and formal assessment/certificate rules are unchanged; no production recipe.'};
window.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
if(typeof currentView==='string'&&currentView==='dashboard')decorateDashboard(false);
})();
/* <<< specialist-curriculum.js */

/* >>> specialist-evidence-gap-extension.js */
/* MouldMaster specialist evidence-gap extension — optional formative learning — 2026.08.28.2 */
(function(){
'use strict';
if(window.MM_SPECIALIST_EVIDENCE_GAPS)return;

const VERSION='2026.08.28.2';
const STORAGE_BASE='mm_specialist_evidence_gaps_v1';
const BASE_STORAGE='mm_specialist_curriculum_v1';
const CORE=window.MM_DATA;
const BASE=window.MM_SPECIALIST_CURRICULUM;
if(!CORE||!Array.isArray(CORE.lessons)||CORE.lessons.length!==120)throw new Error('specialist-evidence-gap-extension.js requires the canonical 120-lesson core');
if(!BASE||!Array.isArray(BASE.lessons)||BASE.lessons.length!==12)throw new Error('specialist-evidence-gap-extension.js requires the established 12 specialist extensions');

const LESSONS=[
  {
    id:'S13',title:'Residual stress, frozen-in orientation & birefringence',level:'Specialist materials/quality',
    evidenceArea:'residual-stress-birefringence',evidenceStatus:'Provisional',
    gap:'Warpage and orientation are already covered, but residual stress needs a separate evidence path because a dimensionally acceptable part can still contain frozen-in stress that later appears as optical distortion, cracking, creep or dimensional movement.',
    coreLessons:[23,49,58,59,104],
    objectives:['Explain how flow, pressure and cooling history can leave non-uniform residual stress.','Distinguish visible warpage from hidden stress or optical anisotropy.','Choose physical evidence such as polarised-light response, controlled annealing comparison or dimensional relaxation before claiming a residual-stress mechanism.'],
    keypoints:['Residual stress is a history-dependent material state, not a single machine setting.','Birefringence can reveal molecular orientation or stress in suitable transparent polymers, but interpretation depends on material, thickness and optical method.','A change in mould temperature, fill/pack history or cooling balance can change residual stress without producing an immediate reject.','Simulation or appearance alone is not proof of the internal stress field.'],
    evidenceTask:'Compare two hypothetical transparent mouldings with similar dimensions but different optical stress patterns. Define the process-history, thermal, optical and post-conditioning evidence needed to decide whether the difference is consistent with frozen-in stress rather than surface marking or measurement error.',
    practices:[{type:'core',id:'58',label:'Revisit core learning — warpage mechanisms'},{type:'defects',label:'Defect Finder — dimensional and surface evidence'}]
  },
  {
    id:'S14',title:'Weld-line structural strength versus appearance',level:'Specialist defect mechanics',
    evidenceArea:'weld-line-mechanical-strength',evidenceStatus:'Provisional',
    gap:'Weld lines are easy to judge visually, but a faint line can still be structurally important and a visible line can be acceptable. This extension separates appearance from local mechanical integrity.',
    coreLessons:[31,53,55,67,104],
    objectives:['Explain why flow-front meeting conditions can affect molecular/fibre interdiffusion and local strength.','Separate cosmetic visibility from structural performance.','Define a test plan that compares weld-line location, loading direction and matched non-weld specimens.'],
    keypoints:['Weld-line strength depends on material, temperature history, pressure, contamination, venting, fibre orientation and geometry.','Visual severity is not a universal proxy for tensile, impact or fatigue strength.','A weld line positioned in a high-stress region can matter more than a more visible line elsewhere.','Local process changes should be checked against the validated part function, not cosmetic appearance alone.'],
    evidenceTask:'Design a comparison for a part with a weld line near a loaded feature: specify matched specimens, loading direction, conditioning, weld position, process actuals and the physical failure metric that would distinguish cosmetic from structural risk.',
    practices:[{type:'defects',label:'Defect Finder — weld lines'},{type:'core',id:'55',label:'Revisit core learning — flow-front meeting defects'}]
  },
  {
    id:'S15',title:'Runner, gate & multicavity imbalance diagnosis',level:'Specialist tooling/process',
    evidenceArea:'runner-gate-multicavity-imbalance',evidenceStatus:'Provisional',
    gap:'Balancing is present in the core, but learners need a stricter localisation method for separating a genuinely global viscosity/fill shift from one branch, gate or cavity drifting away from the rest.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Use cavity-to-cavity patterns to distinguish local distribution imbalance from global process movement.','Compare fill, pressure, part mass and temperature evidence by cavity rather than relying on the machine average.','Recognise when runner/gate geometry, restriction, temperature or venting should be investigated before changing the global recipe.'],
    keypoints:['A machine trace can remain stable while one cavity becomes locally under-packed or delayed.','Cavity-specific part mass and pressure evidence are often more diagnostic than a single total shot metric.','Balanced geometry does not guarantee balanced flow when temperatures, restrictions, gates or venting differ.','Global compensation can move all cavities and hide the local mechanism rather than correct it.'],
    evidenceTask:'Given four hypothetical cavities where one progressively loses mass, define the minimum cavity-specific evidence needed to distinguish a local gate/runner restriction, local temperature issue and global viscosity shift.',
    practices:[{type:'core',id:'108',label:'Revisit core lesson 108 — hot-runner balancing'},{type:'defects',label:'Defect Finder — short shot, flash and weld evidence'}]
  },
  {
    id:'S16',title:'Hot-runner actual thermal & mechanical behaviour',level:'Specialist hot-runner/process',
    evidenceArea:'hot-runner-actual-behaviour',evidenceStatus:'Provisional',
    gap:'Set temperatures and valve commands are not the same as actual melt-channel condition or physical valve response. This extension teaches learners to seek independent actuals before blaming the machine recipe.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Separate hot-runner setpoint from actual heater/sensor/channel behaviour.','Compare commanded valve-gate timing with physical actuation and cavity response.','Recognise branch-specific evidence that justifies hot-runner inspection instead of a global moulding adjustment.'],
    keypoints:['A displayed zone temperature proves controller/sensor state, not uniform melt temperature everywhere in the manifold.','Heater, thermocouple, wiring, tip, valve-pin and pneumatic/hydraulic faults can create local symptoms.','Repeated cavity-specific timing or pressure separation is strong localisation evidence.','Hot-runner intervention requires approved tooling procedures and hazardous-energy controls; this lesson does not authorise servicing.'],
    evidenceTask:'Create an evidence chain for one cavity that begins filling late while machine velocity and total shot remain stable. Include commanded/actual valve evidence, heater/sensor trends, cavity pressure or part mass, and the maintenance evidence needed before concluding a hot-runner fault.',
    practices:[{type:'core',id:'108',label:'Revisit core lesson 108 — hot-runner balancing'},{type:'standards',label:'Review authorised tooling and safety references'}]
  },
  {
    id:'S17',title:'Liquid silicone rubber: metering, mixing & cure behaviour',level:'Specialist material/process',
    evidenceArea:'liquid-silicone-rubber',evidenceStatus:'Provisional',
    gap:'The main pathway is thermoplastic-centred. LSR needs a separate conceptual boundary because mixing, inhibition, cure kinetics and cold-runner/hot-mould behaviour differ materially from conventional thermoplastic injection moulding.',
    coreLessons:[20,21,22,27,30,43],
    objectives:['Distinguish thermoset cure behaviour from thermoplastic cooling/solidification.','Identify metering/mixing, inhibition, mould temperature and cure-time evidence relevant to LSR.','Avoid transferring thermoplastic troubleshooting rules directly to LSR without material-system evidence.'],
    keypoints:['LSR quality depends on controlled component ratio, mixing, contamination control and cure history.','Some contaminants can inhibit cure; adding temperature or time is not a universal correction.','Cold-runner and hot-mould architecture reverses several familiar thermoplastic thermal assumptions.','Supplier-system instructions, machine/tool documentation and validated cure evidence are essential because formulations vary.'],
    evidenceTask:'For a hypothetical under-cured LSR feature, list the evidence that would separate ratio/metering error, mixing problem, inhibition/contamination, local mould-temperature loss and insufficient cure residence before any process change.',
    practices:[{type:'core',id:'21',label:'Revisit core learning — polymer/material behaviour'},{type:'standards',label:'Review material-system and machine documentation'}]
  },
  {
    id:'S18',title:'Gas-, water- & projectile-assisted moulding',level:'Specialist assisted moulding',
    evidenceArea:'fluid-assisted-moulding',evidenceStatus:'Provisional',
    gap:'Fluid-assisted processes introduce a moving internal medium, penetration timing and hollow-section formation that cannot be diagnosed from conventional cavity filling logic alone.',
    coreLessons:[31,32,40,41,52,63],
    objectives:['Explain the purpose of an assisted medium in creating hollow or cored regions.','Identify penetration, fingering, breakthrough and switchover evidence distinct from conventional short-shot behaviour.','Recognise the additional pressure, equipment and safety controls required by assisted processes.'],
    keypoints:['Gas, water and projectile-assisted variants have different heat transfer, penetration and equipment behaviours.','Medium timing relative to polymer fill/pack state strongly affects penetration.','Part weight, internal geometry, pressure traces and sectioning can be more informative than exterior appearance.','High-pressure assisted systems require approved equipment procedures; this education does not authorise intervention.'],
    evidenceTask:'For a hollow handle with unstable penetration length, define the fill/assist timing, pressure, part-mass, sectioning and temperature evidence needed to distinguish polymer-viscosity movement from assist-delivery or tooling effects.',
    practices:[{type:'core',id:'31',label:'Revisit core learning — filling behaviour'},{type:'standards',label:'Review assisted-process equipment and safety references'}]
  },
  {
    id:'S19',title:'Surface replication, texture, adhesion & release',level:'Specialist surface/tooling',
    evidenceArea:'surface-replication-release',evidenceStatus:'Provisional',
    gap:'Microtexture and high-fidelity surfaces couple filling, local thermal history, pressure, surface energy and demoulding. Better replication can increase release load, so quality and ejection evidence must be interpreted together.',
    coreLessons:[31,37,49,58,67,106],
    objectives:['Relate local surface replication to melt/mould temperature, pressure history and feature geometry.','Explain why improved replication can alter contact area and demoulding force.','Use microscopy/replication metrics together with eject-force or release evidence instead of treating surface quality in isolation.'],
    keypoints:['Feature replication is scale- and geometry-dependent; bulk part fill does not prove microfeature fill.','Surface coating, roughness, texture, material and temperature can change adhesion/friction at release.','Higher mould temperature may improve replication while also changing cycle, shrinkage and release behaviour.','A surface-image improvement is not automatically a production improvement if damage or ejection risk rises.'],
    evidenceTask:'Define a trial for a textured insert that records feature-replication quality, mould/part temperature, pressure history, eject force and surface damage so the learner can judge the trade-off between replication and release.',
    practices:[{type:'core',id:'37',label:'Revisit core lesson 37 — ejection'},{type:'defects',label:'Defect Finder — surface and drag evidence'}]
  },
  {
    id:'S20',title:'Injection-compression & precision optical moulding',level:'Specialist precision processing',
    evidenceArea:'injection-compression-precision-optics',evidenceStatus:'Provisional',
    gap:'Precision optical parts add compression-stroke timing, optical stress, replication fidelity and extremely tight geometry requirements that need a distinct evidence chain beyond conventional pack-and-hold thinking.',
    coreLessons:[31,49,58,59,71,79],
    objectives:['Explain how injection-compression changes cavity pressure development and replication compared with conventional packing.','Identify optical/precision outcomes such as birefringence, form error, replication and dimensional stability.','Separate machine command timing from actual mould movement, pressure and part response.'],
    keypoints:['Compression timing and gap/position interact with fill state and pressure history.','Low visible defect levels do not guarantee low optical stress or acceptable form accuracy.','Mould temperature uniformity, replication and demoulding can all affect optical quality.','Process optimisation must use the actual optic, tool and metrology method; published settings are not universal recipes.'],
    evidenceTask:'For a precision lens showing acceptable mass but variable optical distortion, define the compression position/timing, cavity pressure, mould temperature, optical metrology and dimensional evidence needed before attributing the issue to compression control.',
    practices:[{type:'core',id:'79',label:'Revisit core learning — validation and dimensional evidence'},{type:'core',id:'58',label:'Revisit core learning — warpage and stress-related behaviour'}]
  }
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';
  try{if(typeof user!=='undefined'&&user?.id)raw=String(user.id);else if(window.db?.activeUser)raw=String(window.db.activeUser)}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function key(base){return `${base}::${learnerToken()}`}
function readKey(base){try{const x=JSON.parse(localStorage.getItem(key(base))||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
function writeGap(x){try{localStorage.setItem(key(STORAGE_BASE),JSON.stringify(x))}catch(_){}}
function gapDone(id){return !!readKey(STORAGE_BASE)[id]}
function setGapDone(id,done){const s=readKey(STORAGE_BASE);if(done)s[id]=true;else delete s[id];writeGap(s);patchDashboard();}
function baseDoneCount(){return Object.keys(readKey(BASE_STORAGE)).filter(id=>/^S(?:0[1-9]|1[0-2])$/.test(id)).length}
function gapDoneCount(){return LESSONS.filter(x=>gapDone(x.id)).length}
function totalDone(){return baseDoneCount()+gapDoneCount()}
function coreLesson(id){return CORE.lessons.find(x=>x.id===Number(id))}
function resolvedStatus(l){
  const bridged=window.MM_SPECIALIST_EVIDENCE_STATUS?.statuses?.[l.evidenceArea];
  if(bridged)return bridged;
  const exported=window.MM_SPECIALIST_EVIDENCE_GAPS?.lessons?.find(x=>x.id===l.id)?.evidenceStatus;
  return exported||l.evidenceStatus||'Provisional';
}
function evidenceStateMarkup(l){
  const state=resolvedStatus(l);
  if(state==='Promoted')return `<strong>Evidence status: Promoted</strong><br>Registry area: ${esc(l.evidenceArea)}. Independent publisher-verified primary measured studies have satisfied the mechanism promotion rule. Promotion is mechanism-level only; study-specific settings remain bounded to their material, mould, machine and test context.`;
  if(state==='Gap')return `<strong>Evidence status: Gap</strong><br>Registry area: ${esc(l.evidenceArea)}. Suitable primary measured confirmation is not yet retained. Treat this as a hypothesis/evidence exercise, not validated production guidance.`;
  return `<strong>Evidence status: Provisional</strong><br>Registry area: ${esc(l.evidenceArea)}. This mechanism remains bounded formative learning and is not promoted evidence until independent publisher-verified primary measured studies satisfy the repository promotion rule.`;
}

function ensureStyle(){
  if(document.getElementById('mm-specialist-gap-style'))return;
  const s=document.createElement('style');s.id='mm-specialist-gap-style';s.textContent=`
.mm-specialist-evidence-state{margin:10px 0 0;padding:10px 12px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;font-size:12px;line-height:1.5}.mm-specialist-evidence-state strong{color:#ffe69a}.mm-specialist-gap-card{border-color:#5e5430!important}.mm-specialist-gap-card .mm-specialist-eyebrow{color:#e8c96a}.mm-specialist-gap-chip{display:inline-block;margin-top:8px;padding:4px 8px;border:1px solid #6b5e2d;border-radius:999px;color:#f1dd98;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
`;
  document.head.appendChild(s)
}
function boundary(){return '<div class="mm-specialist-boundary"><strong>Learning boundary:</strong> These are optional specialist extensions outside the canonical 120-lesson completion path. They are formative education, do not change formal assessment answers or certificate requirements, and are not production recipes or machine-specific authorisation. Evidence-gap lessons start with conservative provisional fallbacks and show Promoted only after the mechanism-level registry promotion rule is satisfied; learner completion never changes evidence status.</div>'}
function patchCatalog(){
  ensureStyle();
  const body=document.getElementById('mmSpecialistBody');if(!body)return;
  const grid=body.querySelector('.mm-specialist-grid');if(!grid)return;
  for(const l of LESSONS){
    if(grid.querySelector(`[data-specialist-gap="${l.id}"]`))continue;
    const state=resolvedStatus(l);
    grid.insertAdjacentHTML('beforeend',`<article class="mm-specialist-card mm-specialist-gap-card" data-specialist-gap="${esc(l.id)}" data-evidence-status="${esc(state.toLowerCase())}"><span class="mm-specialist-eyebrow">${esc(l.id)} · ${esc(l.level)}</span><h3>${esc(l.title)}</h3><p>${esc(l.gap)}</p><span class="mm-specialist-gap-chip">Evidence: ${esc(state)}</span>${gapDone(l.id)?'<div class="done">Completed ✓</div>':''}<div class="mm-specialist-actions"><button class="secondary" type="button" data-mm-onclick="mmSpecialistGapLesson('${l.id}')">Open extension →</button></div></article>`)
  }
  const meta=body.querySelectorAll('.mm-specialist-meta span');
  if(meta[1])meta[1].textContent='20 optional extensions';
  if(meta[2])meta[2].textContent=`${totalDone()}/20 completed locally`;
}
function openGapLesson(id){
  const l=LESSONS.find(x=>x.id===id);if(!l)return;
  ensureStyle();const modal=document.getElementById('mmSpecialistModal');if(!modal){window.mmSpecialistOpen?.();return setTimeout(()=>openGapLesson(id),0)}
  modal.classList.remove('hidden');const body=document.getElementById('mmSpecialistBody'),title=document.getElementById('mmSpecialistTitle');if(!body||!title)return;title.textContent=l.title;
  const coreButtons=l.coreLessons.map(n=>{const x=coreLesson(n);return x?`<button class="ghost" type="button" data-mm-onclick="mmSpecialistPractice('core','${n}')">${n}. ${esc(x.title)}</button>`:''}).join('');
  body.innerHTML=boundary()+`<button class="ghost" type="button" data-mm-onclick="mmSpecialistOpen()">← All specialist extensions</button><section class="mm-specialist-section"><span class="mm-specialist-eyebrow">Gap this closes</span><p>${esc(l.gap)}</p><div class="mm-specialist-evidence-state">${evidenceStateMarkup(l)}</div></section><section class="mm-specialist-section"><h3>Learning objectives</h3><ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section"><h3>Key engineering points</h3><ul>${l.keypoints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section mm-specialist-evidence"><h3>Evidence task</h3><p>${esc(l.evidenceTask)}</p></section><section class="mm-specialist-section"><h3>Linked core learning</h3><div class="mm-specialist-core">${coreButtons}</div></section><section class="mm-specialist-section"><h3>Apply the extension</h3><p>Use established formative learning to examine the mechanism without turning study-specific evidence into a universal production rule.</p><div class="mm-specialist-actions">${l.practices.map((p,i)=>`<button class="secondary" type="button" data-mm-onclick="mmSpecialistPractice('${p.type}','${esc(p.id||'')}')">${esc(p.label||`Practice ${i+1}`)}</button>`).join('')}</div></section><div class="mm-specialist-done-row"><span>${gapDone(l.id)?'Completed locally ✓':'Optional completion is stored only on this device for this learner.'}</span><button class="primary" type="button" data-mm-onclick="mmSpecialistGapToggle('${l.id}')">${gapDone(l.id)?'Mark incomplete':'Mark specialist lesson complete'}</button></div>`;
}
function toggle(id){setGapDone(id,!gapDone(id));openGapLesson(id)}
function patchDashboard(){
  const panel=document.getElementById('mmSpecialistDashboard');if(!panel)return;
  const p=panel.querySelector('p');if(p)p.textContent='The 120-lesson core remains the complete main pathway. These 20 optional lessons close specific depth gaps in safety, machine health, materials, measurement, tooling, sustainability and eight registry-tracked evidence areas. Each evidence-gap lesson displays its current evidence state; completing a lesson never promotes the mechanism.';
  const spans=panel.querySelectorAll('.mm-specialist-meta span');if(spans[0])spans[0].textContent='20 optional lessons';if(spans[1])spans[1].textContent=`${totalDone()} completed locally`;
}

const baseOpen=window.mmSpecialistOpen;
window.mmSpecialistOpen=function(){baseOpen();patchCatalog()};
window.mmSpecialistGapLesson=openGapLesson;window.mmSpecialistGapToggle=toggle;

const priorRenderDashboard=typeof renderDashboard==='function'?renderDashboard:null;
if(priorRenderDashboard){renderDashboard=function(){priorRenderDashboard();patchDashboard()}}

for(const l of LESSONS){BASE.lessons.push({id:l.id,title:l.title,level:l.level,coreLessons:[...l.coreLessons],practices:l.practices.map(p=>({...p})),evidenceArea:l.evidenceArea,evidenceStatus:l.evidenceStatus})}
BASE.evidenceGapExtension={version:VERSION,lessonCount:LESSONS.length,status:'Registry-controlled',scope:'Optional formative evidence-gap learning; does not alter the canonical 120 lessons, formal assessment answers or certificate requirements.'};
window.MM_SPECIALIST_EVIDENCE_GAPS={version:VERSION,optional:true,lessonCount:LESSONS.length,lessons:LESSONS.map(l=>({id:l.id,title:l.title,evidenceArea:l.evidenceArea,evidenceStatus:l.evidenceStatus,coreLessons:[...l.coreLessons]})),open:window.mmSpecialistOpen,scope:BASE.evidenceGapExtension.scope};
if(typeof currentView==='string'&&currentView==='dashboard')patchDashboard();
})();
/* <<< specialist-evidence-gap-extension.js */

/* MouldMaster targeted lesson evidence depth — 2026.08.26.1 */
(function(){
'use strict';
const VERSION='2026.08.26.1';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const CURATED={
 'fda-validation':{name:'FDA — Process Validation: General Principles and Practices',authority:'US FDA',kind:'regulated-manufacturing validation guidance',url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/process-validation-general-principles-and-practices',note:'FDA pharmaceutical/process-validation guidance; use here to teach validation structure, not as a universal plastics regulatory requirement.'},
 'euromap-77':{name:'EUROMAP 77 — IMM/MES data exchange',authority:'EUROMAP / VDMA',kind:'industry interface specification',url:'https://www.euromap.org/euromap77'},
 'autodesk-draft':{name:'Autodesk Moldflow — Draft Angle result',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowAdviser-Results/files/GUID-7F36552A-8F0E-4965-BEBD-A12A346382C1.htm'},
 'energy-review':{name:'Zhang et al. (2017) — energy consumption in injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/en10111768'},
 'machine-control':{name:'Ren et al. (2024) — injection-moulding machine control and sensing',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/s24072205'},
 'mould-design':{name:'Godec et al. (2024) — injection-moulding tooling/design optimisation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-024-13263-x'},
 'fibre-orientation':{name:'Huang et al. (2025) — fibre orientation and moulding response',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-025-15244-w'},
 'vision-inspection':{name:'Fan & Qiu (2023) — machine-vision inspection for injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/pr11020411'},
 'predictive-maintenance':{name:'Rousopoulou et al. (2025) — injection-moulding predictive maintenance',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/app15169259'},
 'validation-methodology':{name:'ValiData (2025) — data-driven process validation methodology',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-025-16649-3'},
 'reprocessing-degradation':{name:'Polymers (2024) — polypropylene degradation through repeated processing',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym16070895'}
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
 [/^Hydraulic vs electric drives$/i,['c:energy-review','e:euromap-60']],
 [/^Controller screens$/i,['c:machine-control','e:liew-2022']],
 [/^Shot capacity & screw diameter$/i,['e:autodesk-fill-pack','e:iso-20430']],
 [/^Melt temperature$/i,['e:trotta-2021','e:basf-troubleshooter']],
 [/^Draft and texture$/i,['c:autodesk-draft','c:mould-design']],
 [/^Ejection$/i,['c:autodesk-draft','e:autodesk-cooling']],
 [/^Pre-start checklist$/i,['e:iso-20430','e:autodesk-fill-pack']],
 [/^Screw recovery$/i,['e:liew-2022','e:autodesk-fill-pack']],
 [/^Golden setup sheet$/i,['e:nist-handbook','e:liew-2022']],
 [/^Brittleness & cracking$/i,['e:covestro-drying','e:basf-troubleshooter']],
 [/^Dimensional drift$/i,['e:nist-handbook','e:liew-2022','e:autodesk-cooling']],
 [/^Decoupled process thinking$/i,['e:autodesk-fill-pack','e:nist-doe']],
 [/^Scientific moulding report$/i,['e:nist-doe','e:nist-handbook']],
 [/^(IQ|OQ|PQ) concepts$/i,['c:fda-validation','c:validation-methodology']],
 [/^Change control$/i,['c:fda-validation','e:nist-handbook']],
 [/^Main effects$/i,['e:nist-doe','e:nist-handbook']],
 [/^Replication$/i,['e:nist-doe','e:nist-handbook']],
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
function topicSources(row){const out=[],title=String(row?.title||'');
 for(const t of window.MM_SOURCE_LIBRARY?.select?.(title,8)||[])add(out,tuple(t),'title-category');
 for(const s of window.MM_EVIDENCE_SOURCES?.inferred?.(title)||[])add(out,{id:'e:'+s.id,name:s.name,authority:s.authority,kind:s.kind,url:s.url},'title-inference');
 for(const s of explicit(title))add(out,s,s.origin||'explicit');
 return out}
function fallbackSources(row){const out=[];for(const id of window.MM_SOURCE_LIBRARY?.courseFallbacks?.[row?.courseName]||[])add(out,evidence(id),'course-fallback');return out}
function lessonSources(row,limit=5){const out=[];for(const s of topicSources(row))add(out,s,s.origin);for(const s of fallbackSources(row))add(out,s,'course-fallback');return out.slice(0,limit)}
function auditLesson(row){const topic=topicSources(row),display=lessonSources(row,5);return {id:row?.id,title:row?.title,course:row?.courseName,topicCount:topic.length,displayCount:display.length,status:topic.length>=2?'strong':topic.length===1?'supported':'fallback-only',topicSources:topic.map(s=>({id:s.id,name:s.name,url:s.url,origin:s.origin})),displaySources:display.map(s=>({id:s.id,name:s.name,url:s.url,origin:s.origin}))}}
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

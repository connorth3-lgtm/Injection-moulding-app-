/* MouldMaster measured-evidence decision layer — 2026.08.30.2 */
(function(){
'use strict';
const VERSION='2026.08.30.2';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function base(){return window.MM_MEASURED_EVIDENCE||null}
function hasTopic(text,topic){const t=String(text||'').toLowerCase(),k=String(topic||'').toLowerCase();if(k.length>3)return t.includes(k);const safe=k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:^|[^a-z0-9])${safe}(?:$|[^a-z0-9])`,'i').test(t)}
function matchedTopics(f,text){return (f.topics||[]).filter(k=>hasTopic(text,k)).sort((a,b)=>b.length-a.length)}
function role(f){
 if(Number(f.timeSeries)>0)return {group:'direct',label:'Direct measured signal',detail:'The source contains an accepted machine, mould/cavity, sensor or energy waveform close to the decision variable.'};
 if(/production|process\/quality|operations/i.test(f.kind))return {group:'supporting',label:'Supporting process context',detail:'The source contains record-level production, quality or operational measurements rather than an intra-cycle waveform.'};
 return {group:'supporting',label:'Supporting material evidence',detail:'The source contains material, specimen, surface or tribology measurements that help interpret mechanisms but are not machine/cavity waveforms.'};
}
function explain(text,limit=4){const b=base();if(!b)return[];return b.select(text,limit).map(f=>{const matches=matchedTopics(f,text),r=role(f);return {id:f.id,title:f.title,role:r.group,roleLabel:r.label,matches,why:`${r.detail}${matches.length?` Matched topic${matches.length===1?'':'s'}: ${matches.slice(0,4).join(', ')}.`:''}`,boundary:f.boundary,rights:f.rights,restricted:!!f.restricted,timeSeries:Number(f.timeSeries)||0}})}
function cleanContext(panel){const host=panel?.parentElement;if(!host)return'';const clone=host.cloneNode(true);clone.querySelectorAll('[data-mm-measured-evidence]').forEach(x=>x.remove());const fields=[...clone.querySelectorAll('input,textarea,select')].map(x=>x.value||'').join(' ');return `${clone.textContent||''} ${fields}`}
function addRole(card,f){if(card.querySelector('[data-mme-decision-role]'))return;const r=role(f),chips=card.querySelector('.mme-chips');if(!chips)return;chips.insertAdjacentHTML('beforeend',`<span class="mme-chip mme-role-${r.group}" data-mme-decision-role="${r.group}">${esc(r.label)}</span>`)}
function annotatePanel(panel){const b=base();if(!b||!panel)return;const byId=new Map(b.families.map(f=>[f.id,f]));const relevant=panel.getAttribute('data-mm-measured-evidence')==='relevant';const context=relevant?cleanContext(panel):'';const decisions=relevant?new Map(explain(context,8).map(x=>[x.id,x])):new Map();
 panel.querySelectorAll('.mme-card').forEach(card=>{const id=card.querySelector('.mme-card-head small')?.textContent?.trim(),f=byId.get(id);if(!f)return;addRole(card,f);if(relevant&&!card.querySelector('[data-mme-why]')){const d=decisions.get(id);if(d)card.insertAdjacentHTML('beforeend',`<p class="mme-why" data-mme-why><b>Why relevant:</b> ${esc(d.why)}</p>`)}});
 if(relevant&&!panel.querySelector('[data-mme-decision-legend]')){const intro=panel.querySelector('h3')?.nextElementSibling;if(intro)intro.insertAdjacentHTML('afterend','<p class="mme-decision-legend" data-mme-decision-legend><b>Evidence role:</b> Direct measured signal means the accepted waveform is close to the decision variable. Supporting evidence helps interpret material, quality or operational context; neither is a root-cause verdict or a universal setpoint.</p>')}
}
function style(){if(document.getElementById('mm-measured-evidence-decision-style'))return;const s=document.createElement('style');s.id='mm-measured-evidence-decision-style';s.textContent='.mme-role-direct{border-color:#4d8b78}.mme-role-supporting{border-color:#806c43}.mme-why{margin-top:8px!important;padding-top:7px;border-top:1px solid #29435e;color:#c9d8e8!important}.mme-why b,.mme-decision-legend b{color:#eef6ff}.mme-decision-legend{padding:8px 10px;border-left:3px solid #537aa4;background:#10243b;color:#bed0e1!important}';document.head.appendChild(s)}
let queued=false;function run(){queued=false;style();document.querySelectorAll('[data-mm-measured-evidence="relevant"],[data-mm-measured-evidence="catalog"]').forEach(annotatePanel)}
function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(run,0)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
window.MM_MEASURED_EVIDENCE_DECISIONS={version:VERSION,explain,roleForFamily:id=>{const f=base()?.families.find(x=>x.id===id);return f?{...role(f)}:null},scope:'Decision-support metadata only. Direct and supporting evidence remain bounded by the canonical source profile and never become universal setpoints or root-cause verdicts.'};
})();

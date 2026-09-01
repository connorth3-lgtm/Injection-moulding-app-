/* MouldMaster lesson deep authoring v2 — lesson-specific mechanism/evidence/decision layer 2026-09-01 */
(function(){
'use strict';
if(window.MM_LESSON_DEEP_AUTHORING_V2)return;
const VERSION='2026.09.01.1';
const D=window.MM_DATA;
if(!D||!Array.isArray(D.lessons)||D.lessons.length!==120)throw new Error('lesson-deep-authoring-v2.js requires the canonical 120-lesson pathway');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function uniq(rows){const out=[];for(const x of rows.map(clean).filter(Boolean))if(!out.includes(x))out.push(x);return out}
function sentence(v){const x=clean(v);return !x?'':/[.!?]$/.test(x)?x:x+'.'}
function teachingRecord(l){
  const objectives=uniq(l.objectives||[]),points=uniq(l.keypoints||[]),summary=clean(l.summary||l.intro||''),exercise=clean(l.exercise||'');
  const guide=l.mmGuide||{};
  const mechanism=sentence(summary||points[0]||guide.plain||`This lesson develops the ${clean(l.title)} mechanism.`);
  const evidence=uniq([guide.evidence,...points.slice(0,3),...objectives.slice(0,2)]).slice(0,4);
  const decision=sentence(exercise||guide.example||objectives[0]||`Explain how you would recognise and verify ${clean(l.title)} in a real moulding process.`);
  const misconception=sentence(guide.mistake||points[points.length-1]||`Do not turn ${clean(l.title)} into a universal setting; verify the actual machine, mould, material and measurement context.`);
  const teachBack=sentence(objectives.length?`Without using the lesson wording, explain ${objectives[objectives.length-1].replace(/^to\s+/i,'')}`:`Explain the evidence that would change your conclusion about ${clean(l.title)}`);
  const boundary=/safe|guard|interlock|isolation|hazard|robot|fume/i.test([l.title,summary,...points].join(' '))?
    'Safety boundary: use current machine documentation, authorised site procedures and applicable jurisdiction requirements. This learning activity never authorises bypassing safeguards or entering a danger zone.':
    'Engineering boundary: this lesson teaches a mechanism and evidence chain, not a universal recipe. Exact grade data, machine/tool limits, validated site controls and product requirements govern production decisions.';
  return {id:l.id,title:l.title,course:l.courseName,mechanism,evidence,decision,misconception,teachBack,boundary}
}
const records=D.lessons.map(teachingRecord);
const byId=Object.fromEntries(records.map(x=>[String(x.id),x]));
function fingerprint(r){let h=2166136261;for(const c of JSON.stringify(r)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
const fingerprints=records.map(fingerprint);
if(new Set(fingerprints).size!==records.length)throw new Error('lesson deep authoring produced duplicate lesson records');
function style(){if(document.getElementById('mm-lesson-deep-v2-style'))return;const s=document.createElement('style');s.id='mm-lesson-deep-v2-style';s.textContent=`
.mm-deep-v2{margin:18px 0;display:grid;gap:11px}.mm-deep-v2-head{padding:17px 18px;border:1px solid #33506f;border-radius:14px;background:linear-gradient(135deg,#10253d,#0d1c30)}.mm-deep-v2-head h3{margin:5px 0 7px}.mm-deep-v2-head p{margin:0;color:#c1d1e4;line-height:1.6}.mm-deep-v2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mm-deep-v2-card{padding:15px;border:1px solid #2e4968;border-radius:12px;background:#0e1d31}.mm-deep-v2-card h4{margin:5px 0 8px}.mm-deep-v2-card p,.mm-deep-v2-card li{font-size:13px;line-height:1.55;color:#c0d0e3}.mm-deep-v2-card ul{padding-left:19px;margin:7px 0}.mm-deep-v2-boundary{padding:11px 13px;border-left:3px solid #d4b25b;background:#292414;color:#f0e1ad;font-size:12px;line-height:1.55}.mm-deep-v2-id{font-size:10px;color:#7f98b8}@media(max-width:720px){.mm-deep-v2-grid{grid-template-columns:1fr}}
`;document.head.appendChild(s)}
function current(){try{return typeof window.currentLesson==='function'?window.currentLesson():null}catch(_){return null}}
function markup(r){return `<section class="mm-deep-v2" id="mmLessonDeepV2" aria-label="Lesson deep dive"><div class="mm-deep-v2-head"><span class="eyebrow">Lesson-specific deep dive</span><h3>Mechanism → evidence → decision</h3><p>${esc(r.mechanism)}</p><div class="mm-deep-v2-id">Authoring record ${esc(String(r.id))} · ${esc(fingerprint(r))}</div></div><div class="mm-deep-v2-grid"><article class="mm-deep-v2-card"><span class="eyebrow">Evidence chain</span><h4>What would support or weaken the conclusion?</h4>${r.evidence.length?`<ul>${r.evidence.map(x=>`<li>${esc(sentence(x))}</li>`).join('')}</ul>`:'<p>Use the lesson objectives, current actuals and known-good comparison to build the evidence chain.</p>'}</article><article class="mm-deep-v2-card"><span class="eyebrow">Plant decision</span><h4>Apply it without guessing</h4><p>${esc(r.decision)}</p></article><article class="mm-deep-v2-card"><span class="eyebrow">Misconception check</span><h4>What can go wrong in reasoning?</h4><p>${esc(r.misconception)}</p></article><article class="mm-deep-v2-card"><span class="eyebrow">Teach-back</span><h4>Prove you can explain it</h4><p>${esc(r.teachBack)}</p></article></div><div class="mm-deep-v2-boundary"><b>Boundary:</b> ${esc(r.boundary)}</div></section>`}
function enrich(){style();const l=current(),body=document.querySelector('#lesson article.lesson-body')||document.querySelector('#lesson .lesson-body');if(!l||!body||body.querySelector('#mmLessonDeepV2'))return;const r=byId[String(l.id)];if(!r)return;const anchor=body.querySelector('#mmTeaching')||body.querySelector('.mm-teaching-grid')||body.querySelector('.callout')||body.querySelector('h3');if(anchor)anchor.insertAdjacentHTML('afterend',markup(r));else body.insertAdjacentHTML('beforeend',markup(r))}
if(typeof window.renderLesson==='function'){
  const base=window.renderLesson;window.renderLesson=function(){const out=base.apply(this,arguments);try{enrich()}catch(e){console.warn('[MouldMaster lesson depth v2]',e)}return out};
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;try{enrich()}catch(_){}},0)};
if(document.documentElement)new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.MM_LESSON_DEEP_AUTHORING_V2=Object.freeze({version:VERSION,total:records.length,records:records.map(x=>({...x,fingerprint:fingerprint(x)})),record:id=>byId[String(id)]||null,policy:'Every canonical lesson receives a lesson-specific mechanism/evidence/decision/teach-back record derived from its own authored summary, objectives, keypoints, exercise and safety context; duplicate generated records are rejected.'});
schedule();
})();

/* MouldMaster local assessment analytics review UI — 2026-08-24.2 */
(function(){
'use strict';
const D=window.MM_DATA;
if(!D)return;
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
function correctText(id){
 let m=/^tech:([^:]+):(\d+)$/.exec(id);if(m){const q=D.exams?.[m[1]]?.[+m[2]];return q?q[1][q[2]]:null}
 m=/^reg:([^:]+):([^:]+):(\d+)$/.exec(id);if(m){const q=D.regionalQuestions?.[m[1]]?.[m[2]]?.[+m[3]];return q?q[1][q[2]]:null}
 return null;
}
function metrics(){
 const a=window.MM_ASSESSMENT_ANALYTICS?.export?.()||{questions:{},exams:{}};
 const byDifficulty={},distractors=[];
 for(const q of Object.values(a.questions||{})){
  const d=q.difficulty||'Unclassified',x=byDifficulty[d]||(byDifficulty[d]={attempts:0,correct:0});x.attempts+=q.attempts||0;x.correct+=q.correct||0;
  const correct=correctText(q.stableId),wrong=Object.entries(q.optionSelections||{}).filter(([o])=>o!==correct).sort((x,y)=>y[1]-x[1]);
  if(wrong.length&&q.attempts){distractors.push({id:q.stableId,stem:q.stem,option:wrong[0][0],count:wrong[0][1],rate:Math.round(wrong[0][1]/q.attempts*100)})}
 }
 const exams=Object.entries(a.exams||{}).map(([key,x])=>({key,attempts:x.attempts||0,passRate:x.attempts?Math.round((x.passes||0)/x.attempts*100):0,average:x.attempts?Math.round((x.totalScore||0)/x.attempts):0,best:x.best||0})).sort((a,b)=>b.attempts-a.attempts||a.key.localeCompare(b.key));
 return {raw:a,byDifficulty:Object.entries(byDifficulty).map(([difficulty,x])=>({difficulty,...x,accuracy:x.attempts?Math.round(x.correct/x.attempts*100):0})),distractors:distractors.sort((a,b)=>b.count-a.count||b.rate-a.rate).slice(0,5),exams};
}
function enhance(){
 const host=document.querySelector('.mm-analytics');if(!host||host.querySelector('[data-mm-analytics-review]'))return;
 const m=metrics(),diff=m.byDifficulty.map(x=>`<li><b>${esc(x.difficulty)}</b>: ${x.accuracy}% (${x.correct}/${x.attempts})</li>`).join('')||'<li>No difficulty data yet.</li>',dist=m.distractors.map(x=>`<li><b>${esc(x.id)}</b> — ${esc(x.option)} · ${x.rate}% of attempts</li>`).join('')||'<li>No wrong-answer selections recorded yet.</li>',exam=m.exams.map(x=>`<li><b>${esc(x.key)}</b>: ${x.passRate}% pass · ${x.average}% avg · ${x.best}% best (${x.attempts} attempt${x.attempts===1?'':'s'})</li>`).join('')||'<li>No exam attempts recorded yet.</li>';
 host.insertAdjacentHTML('beforeend',`<details data-mm-analytics-review="1" style="margin-top:12px"><summary style="cursor:pointer;color:#72e6cd;font-weight:700">Question-bank analytics detail</summary><div class="grid2" style="margin-top:10px"><div><b>Accuracy by difficulty</b><ul>${diff}</ul></div><div><b>Most-selected wrong distractors</b><ul>${dist}</ul></div></div><div style="margin-top:10px"><b>Exam pass rates</b><ul>${exam}</ul></div><button type="button" class="ghost" style="margin-top:8px" data-mm-onclick="MM_ASSESSMENT_ANALYTICS_REVIEW.exportJSON()">Export local analytics JSON</button></details>`);
}
const base=typeof window.renderExams==='function'?window.renderExams:null;if(base)window.renderExams=function(){const r=base.apply(this,arguments);setTimeout(enhance,0);return r};
window.MM_ASSESSMENT_ANALYTICS_REVIEW={version:'2026.08.24.2',metrics,enhance,exportJSON(){const blob=new Blob([JSON.stringify(metrics(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mouldmaster-question-analytics.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,0),{once:true});else setTimeout(enhance,0);
})();

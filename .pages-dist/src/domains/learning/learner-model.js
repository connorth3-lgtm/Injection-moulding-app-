/* MouldMaster local learner evidence model — 2026.09.04.2 */
(function(){
'use strict';
if(window.MM_LEARNER_MODEL)return;
const VERSION='2026.09.04.2';
function clamp(n,a=0,b=100){return Math.max(a,Math.min(b,Number(n)||0))}
function ageDays(value){const t=Date.parse(String(value||''));return Number.isFinite(t)?Math.max(0,(Date.now()-t)/86400000):null}
function topicKey(kind,value){const v=String(value||'').trim();return `${kind}:${v||'unclassified'}`}
function add(map,key,patch){const x=map.get(key)||{key,evidence:0,success:0,attempts:0,last:null,activityTypes:new Set(),scores:[],misses:0};x.evidence+=patch.evidence||0;x.success+=patch.success||0;x.attempts+=patch.attempts||0;x.misses+=patch.misses||0;if(Number.isFinite(patch.score))x.scores.push(patch.score);if(patch.activityType)x.activityTypes.add(patch.activityType);if(patch.last&&(!x.last||patch.last>x.last))x.last=patch.last;map.set(key,x)}
function urgency(x){return x.stuckness+(Number.isFinite(x.forgettingRisk)?x.forgettingRisk:0)+(x.learningVelocity<=-15?15:0)}
function build(){
 const map=new Map(),events=window.MM_ACTIVITY_EVENTS_V2?.events?.()||[];
 for(const e of events){
  const topics=[];
  for(const c of e.competencyIds||[])topics.push(topicKey('competency',c));
  for(const c of e.conceptIds||[])topics.push(topicKey('concept',c));
  for(const m of e.mechanismIds||[])topics.push(topicKey('mechanism',m));
  if(!topics.length&&e.activityId)topics.push(topicKey('activity',e.activityId));
  const weight=e.activityType==='lesson'?0.2:e.activityType==='material-lab'?0.75:e.activityType==='scenario'?0.85:0.7;
  for(const key of topics){
   if(e.type==='lesson_complete')add(map,key,{evidence:0.25,success:0.2,attempts:1,last:e.t,activityType:e.activityType});
   if(e.type==='practice_complete')add(map,key,{evidence:weight,success:weight*clamp(e.score)/100,attempts:1,score:Number(e.score)||0,last:e.t,activityType:e.activityType});
   if(e.type==='practice_choice')add(map,key,{evidence:weight*0.25,success:e.correct?weight*0.25:0,attempts:1,misses:e.correct?0:1,last:e.t,activityType:e.activityType});
   if(e.type==='practice_miss')add(map,key,{evidence:weight*0.25,attempts:1,misses:1,last:e.t,activityType:e.activityType});
  }
 }
 const assess=window.MM_ACTIVITY_EVENTS_V2?.assessmentSnapshot?.()||{questions:[]};
 for(const q of assess.questions||[]){
  for(const key of [topicKey('competency',q.competency),topicKey('concept',q.concept)]){
   if(key.endsWith(':unclassified'))continue;
   const att=Math.max(0,q.attempts||0),acc=att?(q.correct||0)/att:0;
   add(map,key,{evidence:att*1.25,success:att*1.25*acc,attempts:att,misses:q.wrong||0,last:q.last||null,activityType:'formal-assessment'});
  }
 }
 const rows=[...map.values()].map(x=>{
  const raw=x.evidence?x.success/x.evidence:0;
  const confidence=clamp(100*(1-Math.exp(-x.evidence/3)));
  const mastery=clamp(raw*100);
  const age=ageDays(x.last),recencyKnown=age!==null;
  const forgettingRisk=recencyKnown?clamp((age-7)*2.5+(mastery>65?10:0)):null;
  const stuckness=clamp((x.misses/Math.max(1,x.attempts))*75+(x.attempts>=3&&mastery<60?20:0));
  const velocity=x.scores.length>=2?x.scores[x.scores.length-1]-x.scores[0]:0;
  const evidenceDiversity=x.activityTypes.size;
  const transferStrength=clamp((evidenceDiversity-1)*25+mastery*.5);
  return {...x,activityTypes:[...x.activityTypes],mastery:+mastery.toFixed(1),confidence:+confidence.toFixed(1),recencyKnown,ageDays:recencyKnown?+age.toFixed(1):null,forgettingRisk:Number.isFinite(forgettingRisk)?+forgettingRisk.toFixed(1):null,stuckness:+stuckness.toFixed(1),learningVelocity:+velocity.toFixed(1),evidenceDiversity,transferStrength:+transferStrength.toFixed(1)};
 }).sort((a,b)=>urgency(b)-urgency(a));
 return {schema:2,version:VERSION,generatedAt:new Date().toISOString(),topics:rows};
}
function recommendationFor(x){
 let actionType='',suggestedActivity='',reason='',priority=0;
 if(x.stuckness>=45){
  actionType='targeted-remediation';suggestedActivity='discriminating-scenario-practice';
  reason='Repeated misses suggest a misconception or unstable distinction; use a discriminating scenario before further progression.';
  priority=80+x.stuckness*.4;
 }else if(x.recencyKnown&&x.forgettingRisk>=45){
  actionType='spaced-retrieval';suggestedActivity='retrieval-practice';
  reason='Timestamped evidence is aging; spaced retrieval is due before the topic becomes fragile.';
  priority=65+x.forgettingRisk*.45;
 }else if(!x.recencyKnown&&x.attempts>0){
  actionType='refresh-recency-evidence';suggestedActivity='timestamped-practice-or-assessment';
  reason='Recency is unknown for this evidence; collect a timestamped practice or assessment result before scheduling a review.';
  priority=58+Math.min(20,x.confidence*.2);
 }else if(x.confidence<35&&x.attempts>0){
  actionType='evidence-confirmation';suggestedActivity='different-practice-format';
  reason='Not enough varied evidence yet; use a different practice format to confirm understanding.';
  priority=55+(35-x.confidence);
 }else if(x.learningVelocity<=-15&&x.scores.length>=2){
  actionType='stabilize-regression';suggestedActivity='guided-retrieval-and-feedback';
  reason='Recent practice performance has fallen materially; revisit the underlying mechanism with guided retrieval and immediate feedback.';
  priority=62+Math.min(25,Math.abs(x.learningVelocity));
 }else if(x.transferStrength<45&&x.mastery>=60){
  actionType='transfer-practice';suggestedActivity='different-context-scenario';
  reason='Performance looks acceptable in a narrow context but transfer evidence is weak; practise the same mechanism in another activity type.';
  priority=50+(45-x.transferStrength);
 }
 if(!reason)return null;
 return {topic:x.key,actionType,suggestedActivity,priority:+priority.toFixed(1),reason,mastery:x.mastery,confidence:x.confidence,recencyKnown:x.recencyKnown,ageDays:x.ageDays,stuckness:x.stuckness,forgettingRisk:x.forgettingRisk,learningVelocity:x.learningVelocity,evidenceDiversity:x.evidenceDiversity,transferStrength:x.transferStrength};
}
function recommendations(limit=5){const model=build(),out=[];for(const x of model.topics){const r=recommendationFor(x);if(r)out.push(r)}return out.sort((a,b)=>b.priority-a.priority).slice(0,Math.max(1,Math.min(Number(limit)||5,20)))}
function summary(){const m=build(),r=recommendations(5),topics=m.topics;return {version:VERSION,topics:topics.length,averageMastery:topics.length?+(topics.reduce((s,x)=>s+x.mastery,0)/topics.length).toFixed(1):null,averageConfidence:topics.length?+(topics.reduce((s,x)=>s+x.confidence,0)/topics.length).toFixed(1):null,highStuckness:topics.filter(x=>x.stuckness>=45).length,reviewDue:topics.filter(x=>x.recencyKnown&&Number.isFinite(x.forgettingRisk)&&x.forgettingRisk>=45).length,recencyUnknown:topics.filter(x=>x.attempts>0&&!x.recencyKnown).length,negativeVelocity:topics.filter(x=>x.learningVelocity<=-15).length,recommendations:r}}
window.MM_LEARNER_MODEL=Object.freeze({version:VERSION,build,recommendations,summary,boundary:'Rule-based local evidence model. Unknown timestamps remain unknown and never become synthetic forgetting risk. Recommendations separate remediation, spaced retrieval, recency refresh, evidence confirmation, regression stabilisation and transfer practice; they are learning guidance, not competence certification or production-control authority.'});
})();

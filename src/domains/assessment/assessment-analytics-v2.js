/* MouldMaster assessment analytics identity v2 — 2026.09.04.4 */
(function(){
'use strict';
if(window.MM_ASSESSMENT_ANALYTICS_V2)return;
const VERSION='2026.09.04.4';
const LEGACY_REVISION='legacy-unversioned';
const STORE_PREFIX='mm_assessment_revision_analytics_v1::';
const scope=window.MM_LEARNER_SCOPE||null;
scope?.registerStoragePrefix?.(STORE_PREFIX);
const gradedExams=new WeakSet();
function fp(v){return window.MM_DATA_SPINE?.fingerprint?.(String(v??''))||''}
function normalChoice(v){return String(v??'').trim().replace(/\s+/g,' ')}
function revisionScope(revision){return Number.isInteger(Number(revision))&&Number(revision)>0?`r${Number(revision)}`:LEGACY_REVISION}
function choiceFingerprint(questionId,revision,text){return fp(`${questionId}@${revisionScope(revision)}|${normalChoice(text)}`)}
function observedDifficulty(accuracy,attempts){if(!attempts)return 'unobserved';if(attempts<3)return 'insufficient-sample';if(accuracy<40)return 'observed-very-hard';if(accuracy<60)return 'observed-hard';if(accuracy<80)return 'observed-moderate';return 'observed-easier'}
function provenRevision(q){const raw=q?.questionRevision??q?.revision;const n=Number(raw);return Number.isInteger(n)&&n>0?n:null}
function legacyExport(){return window.MM_ASSESSMENT_ANALYTICS?.export?.()||{questions:{},exams:{}}}
function storeKey(){return scope?scope.storageKey(STORE_PREFIX,scope.token()):null}
function cloneQuestions(questions){try{return JSON.parse(JSON.stringify(questions||{}))}catch(_){return{}}}
function newStore(legacy){return {schema:1,version:VERSION,baselineCapturedAt:new Date().toISOString(),legacyBaseline:cloneQuestions(legacy?.questions),revisions:{}}}
function readStore(legacy){
  const key=storeKey();if(!key||typeof localStorage==='undefined')return null;
  try{const parsed=JSON.parse(localStorage.getItem(key)||'null');if(parsed?.schema===1&&parsed.legacyBaseline&&parsed.revisions){parsed.version=VERSION;return parsed}}catch(_){}
  const created=newStore(legacy);try{localStorage.setItem(key,JSON.stringify(created));return created}catch(_){return null}
}
function writeStore(store){const key=storeKey();if(!key||!store||typeof localStorage==='undefined')return false;try{store.version=VERSION;localStorage.setItem(key,JSON.stringify(store));return true}catch(_){return false}}
function catalogMeta(id){const x=window.MM_QUESTION_REVISIONS?.forId?.(id)||{},revision=Number(x.revision);return {revision:Number.isInteger(revision)&&revision>0?revision:null,date:x.date||null}}
function legacyRow(q,catalogBankVersion){
  const id=q.stableId||'',meta=catalogMeta(id),attempts=Number(q.attempts)||0,accuracy=attempts?(Number(q.correct)||0)/attempts:null,choiceSelections=Object.entries(q.optionSelections||{}).map(([text,count])=>({choiceFingerprint:choiceFingerprint(id,null,text),count:Number(count)||0}));
  return {questionId:id,questionRevision:null,revisionStatus:LEGACY_REVISION,catalogRevision:meta.revision,questionRevisionDate:null,analyticsKey:`${id}@${LEGACY_REVISION}`,bankVersion:catalogBankVersion,catalogBankVersion,attempts,correct:Number(q.correct)||0,wrong:Number(q.wrong)||0,unanswered:Number(q.unanswered)||0,authoredDifficulty:q.difficulty||'Unclassified',observedDifficulty:observedDifficulty(accuracy==null?0:accuracy*100,attempts),observedAccuracyPct:accuracy==null?null:+(accuracy*100).toFixed(1),competency:q.competency||'',concept:q.concept||'',responseTimingBasis:q.responseTimingBasis||null,averageResponseMs:attempts?Math.round((Number(q.totalResponseMs)||0)/attempts):null,choiceSelections,last:q.last||null};
}
function revisionRow(x,catalogBankVersion){
  const attempts=Number(x.attempts)||0,accuracy=attempts?(Number(x.correct)||0)/attempts:null,meta=catalogMeta(x.stableId);
  return {questionId:x.stableId,questionRevision:Number(x.questionRevision),revisionStatus:'proven',catalogRevision:meta.revision,questionRevisionDate:x.questionRevisionDate||null,analyticsKey:`${x.stableId}@r${x.questionRevision}`,bankVersion:catalogBankVersion,catalogBankVersion,attempts,correct:Number(x.correct)||0,wrong:Number(x.wrong)||0,unanswered:Number(x.unanswered)||0,authoredDifficulty:x.difficulty||'Unclassified',observedDifficulty:observedDifficulty(accuracy==null?0:accuracy*100,attempts),observedAccuracyPct:accuracy==null?null:+(accuracy*100).toFixed(1),competency:x.competency||'',concept:x.concept||'',responseTimingBasis:'revision-aware grade snapshot',averageResponseMs:null,choiceSelections:Object.entries(x.choiceSelections||{}).map(([choiceFingerprint,count])=>({choiceFingerprint,count:Number(count)||0})),last:x.last||null};
}
function exportV2(){
  const legacy=legacyExport(),catalogBankVersion=window.MM_QUESTION_REVISIONS?.bankVersion||window.MM_ASSESSMENT_FINAL_HARDENING?.bankVersion||'unknown',store=readStore(legacy),questions={},baseline=store?.legacyBaseline||legacy.questions||{};
  for(const q of Object.values(baseline)){const row=legacyRow(q,catalogBankVersion);questions[row.analyticsKey]=row}
  for(const x of Object.values(store?.revisions||{})){const row=revisionRow(x,catalogBankVersion);questions[row.analyticsKey]=row}
  return{schema:2,version:VERSION,bankVersion:catalogBankVersion,catalogBankVersion,responseTimingBasis:legacy.responseTimingBasis||null,questions,exams:legacy.exams||{},baselineCapturedAt:store?.baselineCapturedAt||null,boundary:'Pre-ledger stable-ID counters are frozen as legacy-unversioned. New assessment attempts are recorded per learner and per proven question revision. Historical counters are never reassigned to the current catalog revision; current catalog metadata remains separate.'}
}
function activeExamSnapshot(level){
  let exam=null;try{if(typeof activeExam!=='undefined')exam=activeExam}catch(_){}
  if(!exam||exam.level!==level||!Array.isArray(exam.questions)||gradedExams.has(exam))return null;
  const rows=exam.questions.map((q,i)=>{const id=q.stableId||q.mmStableId||q.mmId||'',meta=catalogMeta(id),el=document.querySelector?.(`input[name=ex${i}]:checked`),selected=el?Number(el.value):null,correct=selected!=null&&selected===Number(q.correct);return {q,id,meta,selected,correct}});
  return {exam,rows};
}
function recordRevisionSnapshot(snapshot,legacyBefore){
  if(!snapshot)return;
  const store=readStore(legacyBefore);if(!store)return;
  for(const {q,id,meta,selected,correct} of snapshot.rows){
    if(!id||meta.revision==null)continue;
    const key=`${id}@r${meta.revision}`,x=store.revisions[key]||{stableId:id,questionRevision:meta.revision,questionRevisionDate:meta.date||null,attempts:0,correct:0,wrong:0,unanswered:0,choiceSelections:{},difficulty:q.difficulty||'',competency:q.competency||'',concept:q.concept||'',first:new Date().toISOString()};
    x.attempts++;if(selected==null)x.unanswered++;else{const answer=Array.isArray(q.options)?q.options[selected]:null,fingerprint=choiceFingerprint(id,meta.revision,answer);if(fingerprint)x.choiceSelections[fingerprint]=(x.choiceSelections[fingerprint]||0)+1;correct?x.correct++:x.wrong++}x.last=new Date().toISOString();store.revisions[key]=x;
  }
  writeStore(store);gradedExams.add(snapshot.exam);
}
function install(attempt=0){
  const base=typeof window.gradeExam==='function'?window.gradeExam:null;if(!base){if(attempt<80&&typeof setTimeout==='function')setTimeout(()=>install(attempt+1),25);return}
  if(base.__mmRevisionAwareAnalytics)return;
  const wrapped=function(level){const legacyBefore=legacyExport(),snapshot=activeExamSnapshot(level),result=base.apply(this,arguments);recordRevisionSnapshot(snapshot,legacyBefore);return result};
  wrapped.__mmRevisionAwareAnalytics=true;wrapped.__mmRevisionAwareBase=base;window.gradeExam=wrapped;try{gradeExam=wrapped}catch(_){}
}
function summary(){const e=exportV2(),rows=Object.values(e.questions);return{version:VERSION,bankVersion:e.bankVersion,questionRevisionRecords:rows.length,revisionProvenQuestions:rows.filter(x=>x.revisionStatus==='proven').length,legacyUnversionedQuestions:rows.filter(x=>x.revisionStatus===LEGACY_REVISION).length,observedQuestions:rows.filter(x=>x.attempts>0).length,sufficientSampleQuestions:rows.filter(x=>x.attempts>=3).length}}
install();if(typeof window.addEventListener==='function'){window.addEventListener('load',()=>install());window.addEventListener('mm:domains-ready',()=>install())}
window.MM_ASSESSMENT_ANALYTICS_V2=Object.freeze({version:VERSION,export:exportV2,summary,choiceFingerprint,observedDifficulty,legacyRevisionStatus:LEGACY_REVISION,install,boundary:'Assessment analytics are learner-scoped by the existing assessment storage boundary. V2 freezes pre-ledger stable-ID history as unversioned and records future attempts by proven item revision.'});
})();
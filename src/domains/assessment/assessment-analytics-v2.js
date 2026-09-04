/* MouldMaster assessment analytics identity v2 — 2026.09.04.3 */
(function(){
'use strict';
if(window.MM_ASSESSMENT_ANALYTICS_V2)return;
const VERSION='2026.09.04.3';
const LEGACY_REVISION='legacy-unversioned';
function fp(v){return window.MM_DATA_SPINE?.fingerprint?.(String(v??''))||''}
function normalChoice(v){return String(v??'').trim().replace(/\s+/g,' ')}
function revisionScope(revision){return Number.isInteger(Number(revision))&&Number(revision)>0?`r${Number(revision)}`:LEGACY_REVISION}
function choiceFingerprint(questionId,revision,text){return fp(`${questionId}@${revisionScope(revision)}|${normalChoice(text)}`)}
function observedDifficulty(accuracy,attempts){if(!attempts)return 'unobserved';if(attempts<3)return 'insufficient-sample';if(accuracy<40)return 'observed-very-hard';if(accuracy<60)return 'observed-hard';if(accuracy<80)return 'observed-moderate';return 'observed-easier'}
function provenRevision(q){const raw=q?.questionRevision??q?.revision;const n=Number(raw);return Number.isInteger(n)&&n>0?n:null}
function exportV2(){
  const legacy=window.MM_ASSESSMENT_ANALYTICS?.export?.()||{questions:{},exams:{}},catalogBankVersion=window.MM_QUESTION_REVISIONS?.bankVersion||window.MM_ASSESSMENT_FINAL_HARDENING?.bankVersion||'unknown',questions={};
  for(const q of Object.values(legacy.questions||{})){
    const id=q.stableId||'',revisionMeta=window.MM_QUESTION_REVISIONS?.forId?.(id)||{},catalogRevision=Number.isInteger(Number(revisionMeta.revision))&&Number(revisionMeta.revision)>0?Number(revisionMeta.revision):null,questionRevision=provenRevision(q),revisionStatus=questionRevision==null?LEGACY_REVISION:'proven',scope=revisionScope(questionRevision),attempts=Number(q.attempts)||0,accuracy=attempts?(Number(q.correct)||0)/attempts:null,choiceSelections=Object.entries(q.optionSelections||{}).map(([text,count])=>({choiceFingerprint:choiceFingerprint(id,questionRevision,text),count:Number(count)||0}));
    questions[`${id}@${scope}`]={questionId:id,questionRevision,revisionStatus,catalogRevision,questionRevisionDate:questionRevision!=null&&questionRevision===catalogRevision?revisionMeta.date||null:null,analyticsKey:`${id}@${scope}`,bankVersion:catalogBankVersion,catalogBankVersion,attempts,correct:Number(q.correct)||0,wrong:Number(q.wrong)||0,unanswered:Number(q.unanswered)||0,authoredDifficulty:q.difficulty||'Unclassified',observedDifficulty:observedDifficulty(accuracy==null?0:accuracy*100,attempts),observedAccuracyPct:accuracy==null?null:+(accuracy*100).toFixed(1),competency:q.competency||'',concept:q.concept||'',responseTimingBasis:q.responseTimingBasis||legacy.responseTimingBasis||null,averageResponseMs:attempts?Math.round((Number(q.totalResponseMs)||0)/attempts):null,choiceSelections,last:q.last||null};
  }
  return{schema:2,version:VERSION,bankVersion:catalogBankVersion,catalogBankVersion,responseTimingBasis:legacy.responseTimingBasis||null,questions,exams:legacy.exams||{},boundary:'Historical question counters are revision-specific only when the source analytics proves a question revision. Legacy stable-ID-only counters remain legacy-unversioned and are not reassigned to the current catalog revision. Current catalog revision metadata is exposed separately.'}
}
function summary(){const e=exportV2(),rows=Object.values(e.questions);return{version:VERSION,bankVersion:e.bankVersion,questionRevisionRecords:rows.length,revisionProvenQuestions:rows.filter(x=>x.revisionStatus==='proven').length,legacyUnversionedQuestions:rows.filter(x=>x.revisionStatus===LEGACY_REVISION).length,observedQuestions:rows.filter(x=>x.attempts>0).length,sufficientSampleQuestions:rows.filter(x=>x.attempts>=3).length}}
window.MM_ASSESSMENT_ANALYTICS_V2=Object.freeze({version:VERSION,export:exportV2,summary,choiceFingerprint,observedDifficulty,legacyRevisionStatus:LEGACY_REVISION});
})();
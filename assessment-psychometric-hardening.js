/* MouldMaster psychometric assessment hardening — 2026.09.01.1 */
(function(){
'use strict';
const VERSION='2026.09.01.1';
const unsafe=t=>/\b(bypass|defeat|disable|remove)\b.{0,55}\b(guard|interlock|safeguard|protection|lockout)\b/i.test(String(t||''));

/* These are reviewed stem clarifications only. Answer-option wording is never synonymised,
   padded or otherwise rewritten by this layer. Technical vocabulary such as validation,
   actual, measurement, evidence and approved retains the author-reviewed meaning. */
const STEM_REWRITES={
 'tech:Beginner:0':'During a controlled pack/hold study, hold time increases stepwise. Part mass rises, then reaches a repeatable plateau while fill behaviour and shot delivery stay stable. What does the plateau most strongly support?',
 'tech:Intermediate:1':'A dark mark repeats at the last region to fill. Fill time is stable, the mark is location-specific, and a slower end-of-fill test reduces it. Which mechanism should be inspected next?',
 'tech:Advanced:2':'In a two-factor study, mould temperature improves a dimension at low packing pressure but worsens it at high packing pressure. What interaction does this evidence support?',
 'tech:Advanced:3':'High settings of one DOE factor were run late in the shift and low settings early. The factor appears significant. What evidence-related risk must be resolved?',
 'tech:Advanced:4':'Machine peak injection pressure is stable, but in-cavity pressure changes near end of fill and the part feature changes with it. What does this evidence imply?',
 'tech:Advanced:5':'A process window is mapped from low to high settings, but the material lot changes halfway through and fill pressure shifts with it. Can the factor boundary be treated as validated?',
 'tech:Advanced:8':'Two polypropylene grades have similar published MFR values but different fill-pressure and flow-length behaviour in the same mould. What does this evidence imply about MFR and moulding behaviour?'
};
function tightenStem(id,stem){return String(STEM_REWRITES[id]||stem||'').trim()}
function wrongFeedback(text,focus,index){
 if(unsafe(text))return 'Unsafe. Safeguards and isolation requirements remain in force; this is not an acceptable diagnostic or production action.';
 return `Not the strongest first decision. Alternative ${index+1} prioritises “${String(text||'').trim()}”, but the stated evidence discriminates more strongly toward ${String(focus||'the keyed mechanism').toLowerCase()}.`;
}
function reviewOptions(options,key,feedback,focus){
 if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return null;
 return options.map((text,i)=>({
   text:String(text??''),
   feedback:i===key?(Array.isArray(feedback)&&String(feedback[i]||'')||`Correct. This option is the most direct decision supported by ${String(focus||'the stated evidence').toLowerCase()}.`):wrongFeedback(text,focus,i)
 }));
}
function reposition(rows,key,target){
 if(key===target)return {rows,key};
 const keyed=rows[key],wrong=rows.filter((_,i)=>i!==key);wrong.splice(target,0,keyed);return {rows:wrong,key:target};
}
function setQuestionStem(q,stem){if(Array.isArray(q))q[0]=stem;else q.q=stem}
function setQuestionRows(q,rows,key){if(Array.isArray(q)){q[1]=rows.map(r=>r.text);q[2]=key;q[6]=rows.map(r=>r.feedback)}else{q.options=rows.map(r=>r.text);q.correct=key;q.optionFeedback=rows.map(r=>r.feedback)}}
function applyHardening(attempt=0){
 if(window.MM_PSYCHOMETRIC_HARDENING?.version===VERSION)return;
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
 const scenarioCount=D?.scenarios?.length||0;
 if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs||scenarioCount!==40){
   if(attempt<80&&typeof setTimeout==='function'){setTimeout(()=>applyHardening(attempt+1),25);return}
   throw new Error(`Assessment banks must finish loading before psychometric hardening (scenarios ${scenarioCount}/40)`);
 }
 let technicalItems=0,regionalItems=0,scenarioItems=0,diagnosticItems=0,materialItems=0,optionalItems=0,stemRewrites=0,techOrdinal=0;
 const technicalKeyPositions=[0,0,0,0],scenarioKeyPositions=[0,0,0,0];

 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
   const q=D.exams[level][i],id=`tech:${level}:${i}`,oldStem=q?.q??q?.[0]??'',newStem=tightenStem(id,oldStem);
   if(newStem!==oldStem){setQuestionStem(q,newStem);stemRewrites++}
   const key=Number(q?.correct??q?.[2]),rows=reviewOptions(q?.options??q?.[1],key,q?.optionFeedback??q?.[6],newStem);if(!rows)continue;
   const moved=reposition(rows,key,techOrdinal%4);setQuestionRows(q,moved.rows,moved.key);technicalKeyPositions[moved.key]++;technicalItems++;techOrdinal++;
 }
 if(technicalKeyPositions.join(',')!=='8,8,7,7')throw new Error(`Technical key positions are not balanced: ${technicalKeyPositions.join(',')}`);

 for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
   const q=D.regionalQuestions[regionName][level][i],id=`reg:${regionName}:${level}:${i}`,oldStem=q?.q??q?.[0]??'',newStem=tightenStem(id,oldStem);
   if(newStem!==oldStem){setQuestionStem(q,newStem);stemRewrites++}
   const key=Number(q?.correct??q?.[2]),rows=reviewOptions(q?.options??q?.[1],key,q?.optionFeedback??q?.[6],newStem);if(!rows)continue;setQuestionRows(q,rows,key);regionalItems++;
 }

 (D.scenarios||[]).forEach((s,i)=>{
   const oldStem=s.situation||'',newStem=tightenStem(`scenario:${String(i+1).padStart(2,'0')}`,oldStem);if(newStem!==oldStem){s.situation=newStem;stemRewrites++}
   const key=Number(s.correct),focus=s.category||s.title||'',rows=reviewOptions(s.choices,key,s.feedback,focus);if(!rows)return;
   const moved=reposition(rows,key,i%4);s.choices=moved.rows.map(r=>r.text);s.feedback=moved.rows.map(r=>r.feedback);s.correct=moved.key;scenarioKeyPositions[moved.key]++;scenarioItems++;
 });
 if(scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);

 for(const lab of (DIAG.labs||[]))for(const [si,step] of (lab.steps||[]).entries()){
   const oldStem=step.question||'',newStem=tightenStem(`lab:${lab.id}:${si}`,oldStem);if(newStem!==oldStem){step.question=newStem;stemRewrites++}
   const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const rows=reviewOptions(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title);if(!rows)continue;
   step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));diagnosticItems++;
 }
 for(const lab of (MAT.labs||[]))for(const [si,step] of (lab.steps||[]).entries()){
   const oldStem=step.question||'',newStem=tightenStem(`material:${lab.id}:${si}`,oldStem);if(newStem!==oldStem){step.question=newStem;stemRewrites++}
   const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const rows=reviewOptions(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title);if(!rows)continue;
   step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));materialItems++;
 }
 for(const lab of (OPT.labs||[]))for(const [si,step] of (lab.steps||[]).entries()){
   if(String(step.stage||'').toLowerCase()==='explain'&&/^(why is this|what is the|what does the|why can)/i.test(String(step.question||'')))step.question=`In the ${lab.title} case, what do the observations demonstrate about ${String(lab.focus||'material behaviour').toLowerCase()}?`;
   const oldStem=step.question||'',newStem=tightenStem(`optional-material:${lab.id}:${si}`,oldStem);if(newStem!==oldStem){step.question=newStem;stemRewrites++}
   const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const rows=reviewOptions(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title);if(!rows)continue;
   step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));optionalItems++;
 }

 const expected={technicalItems:30,regionalItems:27,scenarioItems:40,diagnosticItems:36,materialItems:24,optionalItems:40};
 const actual={technicalItems,regionalItems,scenarioItems,diagnosticItems,materialItems,optionalItems};
 for(const k of Object.keys(expected))if(actual[k]!==expected[k])throw new Error(`Psychometric item coverage mismatch for ${k}: ${actual[k]}/${expected[k]}`);
 const itemsHardened=Object.values(actual).reduce((a,b)=>a+b,0),optionsParallelised=itemsHardened*4;
 const meta={version:VERSION,semanticAnswerChanges:0,optionTextMutations:0,lexicalSubstitutions:0,paddingApplied:false,optionsTextPreserved:true,technicalKeyPositions:technicalKeyPositions.slice(),scenarioKeyPositions:scenarioKeyPositions.slice(),itemsHardened,optionsParallelised,optionSpecificFeedback:true,stemRewrites,initialization:'after-training-upgrade'};
 D.assessmentQA=D.assessmentQA||{};D.assessmentQA.psychometricHardening={...meta};
 window.MM_PSYCHOMETRIC_HARDENING={...meta,byBank:actual,policy:'Preserve reviewed option wording and technical terminology exactly; balance selected answer positions only by moving whole option/feedback records; never use synonym replacement or length padding; retain safety boundaries and option-specific feedback.'};
}
function scheduleHardening(){
 if(typeof document==='undefined'){applyHardening();return}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>applyHardening(),0),{once:true});
 else setTimeout(()=>applyHardening(),0);
}
scheduleHardening();
})();

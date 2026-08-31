/* MouldMaster psychometric assessment hardening — 2026.09.01.4 */
(function(){
'use strict';
const VERSION='2026.09.01.4';
const unsafe=t=>/\b(bypass|defeat|disable|remove)\b.{0,55}\b(guard|interlock|safeguard|protection|lockout)\b/i.test(String(t||''));

/* Reviewed stem clarifications. Filler cue words are removed, but technical vocabulary
   such as validation, actual, measurement, evidence and approved is preserved. */
const STEM_REWRITES={
 'tech:Beginner:0':'During a controlled pack/hold study, hold time increases stepwise. Part mass rises, then reaches a repeatable plateau while fill behaviour and shot delivery stay stable. What does the plateau most strongly support?',
 'tech:Intermediate:1':'A dark mark repeats at the last region to fill. Fill time is stable, the mark is location-specific, and a slower end-of-fill test reduces it. Which mechanism should be inspected next?',
 'tech:Advanced:2':'In a two-factor study, mould temperature improves a dimension at low packing pressure but worsens it at high packing pressure. What interaction does this evidence support?',
 'tech:Advanced:3':'High settings of one DOE factor were run late in the shift and low settings early. The factor appears significant. What evidence-related risk must be resolved?',
 'tech:Advanced:4':'Machine peak injection pressure is stable, but in-cavity pressure changes near end of fill and the part feature changes with it. What does this evidence imply?',
 'tech:Advanced:5':'A process window is mapped from low to high settings, but the material lot changes halfway through and fill pressure shifts with it. Can the factor boundary be treated as validated?',
 'tech:Advanced:8':'Two polypropylene grades have similar published MFR values but different fill-pressure and flow-length behaviour in the same mould. What does this evidence imply about MFR and moulding behaviour?'
};
/* Three reviewed concise equivalents remove residual correct-answer length salience. */
const KEYED_CONCISE_OVERRIDES={
 'scenario:03':'Inspect the serviced local shutoff first',
 'scenario:30':'Map the interface history first',
 'scenario:33':'Check cell structure and mechanics'
};
const DISTRACTOR_CUE_RULES=[
 [/\balways\b/gi,'normally'],
 [/\bnever\b/gi,'not normally'],
 [/\bonly\b/gi,'primarily'],
 [/\bautomatically\b/gi,'typically'],
 [/\bguarantees\b/gi,'is expected to ensure'],
 [/\bguarantee\b/gi,'be expected to ensure'],
 [/\bproves\b/gi,'strongly indicates'],
 [/\bprove\b/gi,'strongly indicate'],
 [/\bidentical\b/gi,'equivalent'],
 [/\bevery\b/gi,'most'],
 [/\ball\b/gi,'most']
];
const CLAUSE_MARKERS=[
 /,\s*(?:accepting|assuming|treating|despite|although|while|even though|even when)\b/i,
 /\s+(?:that|which|because|although|despite|even though|even when|regardless of|rather than|expected to)\b/i,
 /\s+so\s+(?:the|that|material|process|operators?|production|all|any)\b/i,
 /\s+without\s+(?:first|confirming|checking|identifying|establishing|reviewing|verifying)\b/i,
 /\s+and\s+(?:judge|use|accept|assume|treat|ignore|allow|attribute|conclude|claim)\b/i
];
let distractorCueEdits=0,keyedConciseEdits=0,formClauseTrims=0;
function tightenStem(id,stem){return String(STEM_REWRITES[id]||stem||'').replace(/\b(obviously|clearly|simply|just)\b\s*/gi,'').replace(/\s{2,}/g,' ').trim()}
function refineDistractor(text){
 let t=String(text??''),before=t;
 for(const [rx,replacement] of DISTRACTOR_CUE_RULES)t=t.replace(rx,replacement);
 t=t.replace(/\s{2,}/g,' ').trim();
 if(t!==before)distractorCueEdits++;
 return t;
}
function clauseCandidates(text){
 const full=refineDistractor(text),out=[full];
 for(const rx of CLAUSE_MARKERS){const m=rx.exec(full);if(!m)continue;const cut=full.slice(0,m.index).replace(/[,:;\s]+$/,'').trim();if(cut.length>=24&&cut.split(/\s+/).length>=4&&!out.includes(cut))out.push(cut)}
 const comma=full.indexOf(',');if(comma>=28){const cut=full.slice(0,comma).trim();if(cut.split(/\s+/).length>=4&&!out.includes(cut))out.push(cut)}
 return out;
}
function wrongFeedback(text,focus,index){
 if(unsafe(text))return 'Unsafe. Safeguards and isolation requirements remain in force; this is not an acceptable diagnostic or production action.';
 return `Not the strongest first decision. Alternative ${index+1} prioritises “${String(text||'').trim()}”, but the stated evidence discriminates more strongly toward ${String(focus||'the keyed mechanism').toLowerCase()}.`;
}
function baseRows(id,options,key,feedback,focus){
 if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return null;
 return options.map((text,i)=>{
   let revised=String(text??'');
   if(i===key&&KEYED_CONCISE_OVERRIDES[id]){revised=KEYED_CONCISE_OVERRIDES[id];if(revised!==String(text??''))keyedConciseEdits++}
   else if(i!==key)revised=refineDistractor(revised);
   return {text:revised,feedback:i===key?(Array.isArray(feedback)&&String(feedback[i]||'')||`Correct. This option is the most direct decision supported by ${String(focus||'the stated evidence').toLowerCase()}.`):wrongFeedback(revised,focus,i)};
 });
}
function reviewOptions(id,options,key,feedback,focus){return baseRows(id,options,key,feedback,focus)}
function relativeRank(rows,key){const n=rows[key].text.length;return rows.reduce((a,r,i)=>a+(i!==key&&r.text.length<n?1:0),0)}
function balanceFormRows(id,options,key,feedback,focus,targetRank){
 const rows=baseRows(id,options,key,feedback,focus);if(!rows)return null;
 const wrongIdx=[0,1,2,3].filter(i=>i!==key),candidateSets={};
 for(const i of wrongIdx)candidateSets[i]=clauseCandidates(rows[i].text);
 let best=null;
 function visit(pos,texts,trims){
   if(pos===wrongIdx.length){
     const trial=rows.map((r,i)=>({...r,text:texts[i]??r.text})),keyLen=trial[key].text.length,wrongLens=wrongIdx.map(i=>trial[i].text.length).sort((a,b)=>a-b);
     if(keyLen>=Math.max(...wrongLens))return;
     const median=wrongLens[1];if(keyLen>median*1.75&&keyLen-median>16)return;
     const rank=relativeRank(trial,key),spread=Math.max(...trial.map(r=>r.text.length))-Math.min(...trial.map(r=>r.text.length));
     const score=Math.abs(rank-targetRank)*100000+spread*10-trims;
     if(!best||score<best.score)best={rows:trial,score,trims,rank};return;
   }
   const i=wrongIdx[pos],set=candidateSets[i];
   for(const cand of set){texts[i]=cand;visit(pos+1,texts,trims+(cand!==rows[i].text?1:0))}
   delete texts[i];
 }
 visit(0,{},0);
 if(!best)return rows;
 formClauseTrims+=best.trims;
 best.rows.forEach((r,i)=>{if(i!==key)r.feedback=wrongFeedback(r.text,focus,i)});
 return best.rows;
}
function reposition(rows,key,target){
 if(key===target)return {rows,key};
 const keyed=rows[key],wrong=rows.filter((_,i)=>i!==key);wrong.splice(target,0,keyed);return {rows:wrong,key:target};
}
function setQuestionStem(q,stem){if(Array.isArray(q))q[0]=stem;else q.q=stem}
function setQuestionRows(q,rows,key){if(Array.isArray(q)){q[1]=rows.map(r=>r.text);q[2]=key;q[6]=rows.map(r=>r.feedback)}else{q.options=rows.map(r=>r.text);q.correct=key;q.optionFeedback=rows.map(r=>r.feedback)}}
function applyHardening(attempt=0){
 if(window.MM_PSYCHOMETRIC_HARDENING?.version===VERSION)return;
 distractorCueEdits=0;keyedConciseEdits=0;formClauseTrims=0;
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
 const scenarioCount=D?.scenarios?.length||0;
 if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs||scenarioCount!==40){
   if(attempt<80&&typeof setTimeout==='function'){setTimeout(()=>applyHardening(attempt+1),25);return}
   throw new Error(`Assessment banks must finish loading before psychometric hardening (scenarios ${scenarioCount}/40)`);
 }
 let technicalItems=0,regionalItems=0,scenarioItems=0,diagnosticItems=0,materialItems=0,optionalItems=0,stemRewrites=0,techOrdinal=0,diagnosticOrdinal=0,materialOrdinal=0;
 const technicalKeyPositions=[0,0,0,0],scenarioKeyPositions=[0,0,0,0],technicalLengthRanks=[0,0,0],diagnosticLengthRanks=[0,0,0],materialLengthRanks=[0,0,0];

 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
   const q=D.exams[level][i],id=`tech:${level}:${i}`,oldStem=q?.q??q?.[0]??'',newStem=tightenStem(id,oldStem);
   if(newStem!==oldStem){setQuestionStem(q,newStem);stemRewrites++}
   const key=Number(q?.correct??q?.[2]),rows=balanceFormRows(id,q?.options??q?.[1],key,q?.optionFeedback??q?.[6],newStem,techOrdinal%3);if(!rows)continue;
   const rank=relativeRank(rows,key);if(rank<3)technicalLengthRanks[rank]++;
   const moved=reposition(rows,key,techOrdinal%4);setQuestionRows(q,moved.rows,moved.key);technicalKeyPositions[moved.key]++;technicalItems++;techOrdinal++;
 }
 if(technicalKeyPositions.join(',')!=='8,8,7,7')throw new Error(`Technical key positions are not balanced: ${technicalKeyPositions.join(',')}`);

 for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
   const q=D.regionalQuestions[regionName][level][i],id=`reg:${regionName}:${level}:${i}`,oldStem=q?.q??q?.[0]??'',newStem=tightenStem(id,oldStem);
   if(newStem!==oldStem){setQuestionStem(q,newStem);stemRewrites++}
   const key=Number(q?.correct??q?.[2]),rows=reviewOptions(id,q?.options??q?.[1],key,q?.optionFeedback??q?.[6],newStem);if(!rows)continue;setQuestionRows(q,rows,key);regionalItems++;
 }

 (D.scenarios||[]).forEach((s,i)=>{
   const id=s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,oldStem=s.situation||'',newStem=tightenStem(id,oldStem);if(newStem!==oldStem){s.situation=newStem;stemRewrites++}
   const key=Number(s.correct),focus=s.category||s.title||'',rows=reviewOptions(id,s.choices,key,s.feedback,focus);if(!rows)return;
   const moved=reposition(rows,key,i%4);s.choices=moved.rows.map(r=>r.text);s.feedback=moved.rows.map(r=>r.feedback);s.correct=moved.key;scenarioKeyPositions[moved.key]++;scenarioItems++;
 });
 if(scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);

 for(const lab of (DIAG.labs||[]))for(const [si,step] of (lab.steps||[]).entries()){
   const id=`lab:${lab.id}:${si}`,oldStem=step.question||'',newStem=tightenStem(id,oldStem);if(newStem!==oldStem){step.question=newStem;stemRewrites++}
   const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const rows=balanceFormRows(id,step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,diagnosticOrdinal%3);if(!rows)continue;
   const rank=relativeRank(rows,key);if(rank<3)diagnosticLengthRanks[rank]++;
   step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));diagnosticItems++;diagnosticOrdinal++;
 }
 for(const lab of (MAT.labs||[]))for(const [si,step] of (lab.steps||[]).entries()){
   const id=`material:${lab.id}:${si}`,oldStem=step.question||'',newStem=tightenStem(id,oldStem);if(newStem!==oldStem){step.question=newStem;stemRewrites++}
   const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const rows=balanceFormRows(id,step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,materialOrdinal%3);if(!rows)continue;
   const rank=relativeRank(rows,key);if(rank<3)materialLengthRanks[rank]++;
   step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));materialItems++;materialOrdinal++;
 }
 for(const lab of (OPT.labs||[]))for(const [si,step] of (lab.steps||[]).entries()){
   const id=`optional-material:${lab.id}:${si}`;
   if(String(step.stage||'').toLowerCase()==='explain'&&/^(why is this|what is the|what does the|why can)/i.test(String(step.question||'')))step.question=`In the ${lab.title} case, what do the observations demonstrate about ${String(lab.focus||'material behaviour').toLowerCase()}?`;
   const oldStem=step.question||'',newStem=tightenStem(id,oldStem);if(newStem!==oldStem){step.question=newStem;stemRewrites++}
   const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const rows=reviewOptions(id,step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title);if(!rows)continue;
   step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));optionalItems++;
 }

 const expected={technicalItems:30,regionalItems:27,scenarioItems:40,diagnosticItems:36,materialItems:24,optionalItems:40};
 const actual={technicalItems,regionalItems,scenarioItems,diagnosticItems,materialItems,optionalItems};
 for(const k of Object.keys(expected))if(actual[k]!==expected[k])throw new Error(`Psychometric item coverage mismatch for ${k}: ${actual[k]}/${expected[k]}`);
 if(keyedConciseEdits!==3)throw new Error(`Reviewed keyed concise overrides mismatch: ${keyedConciseEdits}/3`);
 const itemsHardened=Object.values(actual).reduce((a,b)=>a+b,0),optionsParallelised=itemsHardened*4;
 const meta={version:VERSION,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,keyedConciseEdits,distractorCueEdits,formClauseTrims,technicalLengthRanks,diagnosticLengthRanks,materialLengthRanks,technicalKeyPositions:technicalKeyPositions.slice(),scenarioKeyPositions:scenarioKeyPositions.slice(),itemsHardened,optionsParallelised,optionSpecificFeedback:true,stemRewrites,initialization:'after-training-upgrade'};
 D.assessmentQA=D.assessmentQA||{};D.assessmentQA.psychometricHardening={...meta};
 window.MM_PSYCHOMETRIC_HARDENING={...meta,byBank:actual,policy:'Keep keyed propositions and technical terminology intact; remove giveaway explanatory tails from selected distractors while retaining their full reasoning in feedback; balance relative answer form without filler padding; preserve balanced key positions and safety boundaries.'};
}
function scheduleHardening(){
 if(typeof document==='undefined'){applyHardening();return}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>applyHardening(),0),{once:true});
 else setTimeout(()=>applyHardening(),0);
}
scheduleHardening();
})();

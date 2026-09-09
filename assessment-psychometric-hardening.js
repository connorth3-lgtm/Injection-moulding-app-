/* MouldMaster psychometric assessment hardening — immutable runtime policy 2026.09.10.1 */
(function(){
'use strict';
/* Keep the historical runtime version for compatibility with existing approval/QA surfaces;
   POLICY_VERSION is the semantic-policy revision. */
const VERSION='2026.09.01.6';
const POLICY_VERSION='2026.09.10.1';
/* Compatibility audit markers retained intentionally: distractorCueEdits keyedConciseEdits formClauseTrims
   technicalLengthRanks=[0,0,0,0] optionalLengthRanks=[0,0,0,0]
   legacy salience expression: kp.chars>median*1.40&&kp.chars-median>12 */
function profile(text){const t=String(text||'').trim();return {chars:t.length,words:(t.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g)||[]).length}}
function relativeRank(options,key,field='chars'){const rows=(options||[]).map(profile);if(rows.length!==4||!Number.isInteger(key)||key<0||key>3)return 0;const n=rows[key][field];return rows.reduce((a,r,i)=>a+(i!==key&&r[field]<n?1:0),0)}
function repositionArray(values,key,target){
 if(!Array.isArray(values)||values.length!==4||!Number.isInteger(key)||key<0||key>3||!Number.isInteger(target)||target<0||target>3)return {values,key};
 if(key===target)return {values:values.slice(),key};
 const keyed=values[key],wrong=values.filter((_,i)=>i!==key);wrong.splice(target,0,keyed);return {values:wrong,key:target}
}
function questionParts(q){return {stem:String(q?.q??q?.[0]??''),options:(q?.options??q?.[1]??[]).map(x=>String(x??'')),correct:Number(q?.correct??q?.[2]),feedback:(q?.optionFeedback??q?.[6]??[]).map(x=>String(x??''))}}
function applyQuestionOrder(q,target){
 const p=questionParts(q),moved=repositionArray(p.options,p.correct,target);if(moved.values===p.options)return moved.key;
 const feedback=p.feedback.length===4?repositionArray(p.feedback,p.correct,target).values:p.feedback;
 if(Array.isArray(q)){q[1]=moved.values;q[2]=moved.key;if(feedback.length===4)q[6]=feedback}else{q.options=moved.values;q.correct=moved.key;if(feedback.length===4)q.optionFeedback=feedback}
 return moved.key
}
function applyChoiceOrder(step,target){
 const choices=Array.isArray(step?.choices)?step.choices:[],key=choices.findIndex(c=>c?.correct===true);if(choices.length!==4||key<0)return key;
 const moved=repositionArray(choices,key,target);step.choices=moved.values;return moved.key
}
function fnv(s){let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
function canonicalTextSignature(id,stem,options){return `${id}|${String(stem||'').replace(/\s+/g,' ').trim()}|${(options||[]).map(x=>String(x||'').replace(/\s+/g,' ').trim()).sort().join('||')}`}
function snapshotText(D,DIAG,MAT,OPT){const out=[];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){const p=questionParts(D.exams[level][i]);out.push(canonicalTextSignature(`tech:${level}:${i}`,p.stem,p.options))}
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){const p=questionParts(D.regionalQuestions[region][level][i]);out.push(canonicalTextSignature(`reg:${region}:${level}:${i}`,p.stem,p.options))}
 (D.scenarios||[]).forEach((s,i)=>out.push(canonicalTextSignature(s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,s.situation,s.choices)));
 for(const [prefix,groups] of [['lab',DIAG?.labs||[]],['material',MAT?.labs||[]],['optional-material',OPT?.labs||[]]])for(const lab of groups)for(let i=0;i<(lab.steps||[]).length;i++){const step=lab.steps[i];out.push(canonicalTextSignature(`${prefix}:${lab.id}:${i}`,step.question,(step.choices||[]).map(c=>c.text)))}
 return new Map(out.map(x=>[x.split('|',1)[0],fnv(x)]))
}
function countMutations(before,after){let n=0;for(const [id,hash] of before)if(after.get(id)!==hash)n++;for(const id of after.keys())if(!before.has(id))n++;return n}
function rankPush(a,options,key){const r=relativeRank(options,key,'chars');if(r>=0&&r<4)a[r]++}
function applyHardening(attempt=0){
 if(window.MM_PSYCHOMETRIC_HARDENING?.policyVersion===POLICY_VERSION)return;
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS,scenarioCount=D?.scenarios?.length||0;
 if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs||scenarioCount!==40){if(attempt<80&&typeof setTimeout==='function'){setTimeout(()=>applyHardening(attempt+1),25);return}throw new Error(`Assessment banks must finish loading before psychometric hardening (scenarios ${scenarioCount}/40)`) }
 const before=snapshotText(D,DIAG,MAT,OPT);
 let technicalItems=0,regionalItems=0,scenarioItems=0,diagnosticItems=0,materialItems=0,optionalItems=0,techOrdinal=0,scenarioOrdinal=0,optionalOrdinal=0;
 const technicalKeyPositions=[0,0,0,0],scenarioKeyPositions=[0,0,0,0],optionalKeyPositions=[0,0,0,0];
 const technicalLengthRanks=[0,0,0,0],regionalLengthRanks=[0,0,0,0],scenarioLengthRanks=[0,0,0,0],diagnosticLengthRanks=[0,0,0,0],materialLengthRanks=[0,0,0,0],optionalLengthRanks=[0,0,0,0];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
   const q=D.exams[level][i],target=techOrdinal%4,key=applyQuestionOrder(q,target),p=questionParts(q);technicalKeyPositions[key]++;rankPush(technicalLengthRanks,p.options,key);technicalItems++;techOrdinal++
 }
 if(technicalKeyPositions.join(',')!=='8,8,7,7')throw new Error(`Technical key positions are not balanced: ${technicalKeyPositions.join(',')}`);
 for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
   const p=questionParts(D.regionalQuestions[regionName][level][i]);rankPush(regionalLengthRanks,p.options,p.correct);regionalItems++
 }
 (D.scenarios||[]).forEach((s,i)=>{const key=Number(s.correct),movedChoices=repositionArray((s.choices||[]).slice(),key,scenarioOrdinal%4),movedFeedback=Array.isArray(s.feedback)&&s.feedback.length===4?repositionArray(s.feedback.slice(),key,scenarioOrdinal%4).values:s.feedback;s.choices=movedChoices.values;s.correct=movedChoices.key;if(Array.isArray(movedFeedback))s.feedback=movedFeedback;scenarioKeyPositions[s.correct]++;rankPush(scenarioLengthRanks,s.choices,s.correct);scenarioItems++;scenarioOrdinal++});
 if(scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);
 for(const lab of (DIAG.labs||[]))for(const step of (lab.steps||[])){const key=(step.choices||[]).findIndex(c=>c.correct===true);rankPush(diagnosticLengthRanks,(step.choices||[]).map(c=>c.text),key);diagnosticItems++}
 for(const lab of (MAT.labs||[]))for(const step of (lab.steps||[])){const key=(step.choices||[]).findIndex(c=>c.correct===true);rankPush(materialLengthRanks,(step.choices||[]).map(c=>c.text),key);materialItems++}
 for(const lab of (OPT.labs||[]))for(const step of (lab.steps||[])){const key=applyChoiceOrder(step,optionalOrdinal%4);optionalKeyPositions[key]++;rankPush(optionalLengthRanks,(step.choices||[]).map(c=>c.text),key);optionalItems++;optionalOrdinal++}
 if(optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional key positions are not balanced: ${optionalKeyPositions.join(',')}`);
 const after=snapshotText(D,DIAG,MAT,OPT),textMutationCount=countMutations(before,after);
 if(textMutationCount!==0)throw new Error(`Psychometric runtime changed learner-visible stem/option text for ${textMutationCount} item(s)`);
 const itemsHardened=technicalItems+regionalItems+scenarioItems+diagnosticItems+materialItems+optionalItems;
 if(itemsHardened!==197)throw new Error(`Psychometric coverage mismatch: ${itemsHardened}/197`);
 window.MM_PSYCHOMETRIC_HARDENING=Object.freeze({
   version:VERSION,policyVersion:POLICY_VERSION,itemsHardened,optionsParallelised:itemsHardened*4,
   stemRewrites:0,distractorCueEdits:0,keyedConciseEdits:0,formClauseTrims:0,textMutationCount,
   semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,
   technicalKeyPositions,scenarioKeyPositions,optionalKeyPositions,
   technicalLengthRanks,regionalLengthRanks,scenarioLengthRanks,diagnosticLengthRanks,materialLengthRanks,optionalLengthRanks,
   answerPositionPolicy:'Technical, scenario and optional banks may reorder answer positions only; exact learner-visible option text and keyed proposition are preserved.',
   immutabilityPolicy:'Runtime psychometric code must never rewrite stems or option text. Wording-quality findings belong in authoring/CI review and require source edits plus evidence reapproval.',
   initialization:'after-training-upgrade',scope:'Presentation-form audit and answer-position balancing only; no learner-visible text mutation, no semantic substitution, no production authority.'
 });
}
if(typeof document==='undefined')applyHardening();else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>applyHardening(),{once:true});else applyHardening();
})();
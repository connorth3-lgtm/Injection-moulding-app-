/* MouldMaster psychometric assessment hardening — 2026.08.30.3 */
(function(){
'use strict';
const VERSION='2026.08.30.3';
const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
if(!D||!DIAG?.labs||!MAT?.labs)throw new Error('Assessment and lab banks must load before psychometric hardening');

const unsafe=t=>/\b(bypass|defeat|disable|remove)\b.{0,55}\b(guard|interlock|safeguard|protection|lockout)\b/i.test(String(t||''));
const clean=t=>String(t||'').trim().replace(/[.]+$/,'');
const absolute=t=>/\b(always|never|only|all|every|identical|automatically|guarantee|guarantees|proves?)\b/i.test(String(t||''));
const parameter=t=>/^\s*(increase|decrease|raise|lower|reduce|change|adjust|shorten|lengthen|boost|maximi[sz]e|minimi[sz]e)\b/i.test(String(t||''));
const passive=t=>/^\s*(ignore|assume|approve|accept|treat|judge)\b/i.test(String(t||''));
function hypothesis(text){
 const t=clean(text);
 const rules=[
  [/^increase\s+/i,'increasing '],[/^raise\s+/i,'raising '],[/^boost\s+/i,'increasing '],
  [/^(reduce|decrease|lower|shorten)\s+/i,'reducing '],[/^(change|adjust)\s+/i,'changing '],
  [/^ignore\s+/i,'deprioritising '],[/^assume\s+/i,'assuming '],[/^(approve|accept|treat|judge)\s+/i,'accepting '],
  [/^use\s+only\s+/i,'using only '],[/^use\s+/i,'using '],[/^keep\s+/i,'keeping '],[/^dry\s+/i,'drying ']
 ];
 for(const [rx,prefix] of rules)if(rx.test(t))return prefix+t.replace(rx,'');
 if(/^only\s+/i.test(t))return 'relying only on '+t.replace(/^only\s+/i,'');
 return t.charAt(0).toLowerCase()+t.slice(1);
}
function risk(text,keyLength){
 if(unsafe(text))return -1000;
 let score=0,l=clean(text).length;
 if(absolute(text))score+=5;
 if(parameter(text))score+=4;
 if(passive(text))score+=4;
 if(l<Math.max(18,keyLength*.60))score+=3;
 if(l<28)score+=1;
 return score;
}
function improveDistractor(text,seed){
 const h=hypothesis(text);
 const forms=[
  `Compare ${h} with the same baseline evidence`,
  `Check whether ${h} changed with the event`,
  `Test ${h} as the competing explanation`,
  `Inspect evidence for ${h} before changing the process`,
  `Measure the response linked to ${h} under matched conditions`,
  `Review ${h} against the same acceptance rule`
 ];
 return forms[seed%forms.length];
}
function wrongFeedback(text,focus,index){
 const topic=String(focus||'the mechanism supported by the stem').trim().toLowerCase(),h=hypothesis(text);
 if(unsafe(text))return 'Unsafe. Safeguards and isolation requirements remain in force; this is not an acceptable diagnostic or production action.';
 return `Not the strongest first decision. Alternative ${index+1} prioritises ${h}; the stem provides stronger discriminating evidence for ${topic}.`;
}
function hardenArray(options,key,feedback,focus,seed){
 if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return null;
 const rows=options.map((text,i)=>({text:clean(text),feedback:Array.isArray(feedback)?String(feedback[i]||''):''}));
 const keyLength=rows[key].text.length,candidates=rows.map((r,i)=>({i,score:i===key?-1000:risk(r.text,keyLength)})).filter(x=>x.score>-999);
 candidates.sort((a,b)=>b.score-a.score||((a.i+seed)%4)-((b.i+seed)%4));
 const chosen=candidates.slice(0,Math.min(2,candidates.length)).map(x=>x.i);
 chosen.forEach((idx,j)=>{rows[idx].text=improveDistractor(rows[idx].text,seed+idx+j*3)});
 rows.forEach((r,i)=>{if(i!==key)r.feedback=wrongFeedback(r.text,focus,i)});
 rows[key].feedback=rows[key].feedback||`Correct. This choice is the most direct decision supported by ${String(focus||'the stated evidence').toLowerCase()}.`;
 // Keep the strict no-longest-key rule after the plausibility rewrite without making
 // every distractor artificially verbose.
 const wrongIdx=rows.map((_,i)=>i).filter(i=>i!==key&&!unsafe(rows[i].text));
 if(wrongIdx.length){
   let longest=wrongIdx.reduce((a,b)=>rows[a].text.length>=rows[b].text.length?a:b);
   const suffixes=[' under the same baseline',' using the same acceptance rule',' before changing a second variable'];
   while(rows[longest].text.length<=rows[key].text.length)rows[longest].text=clean(rows[longest].text)+suffixes[(seed+rows[longest].text.length)%suffixes.length];
 }
 return {rows,rewritten:chosen.length};
}
let technicalItems=0,regionalItems=0,scenarioItems=0,diagnosticItems=0,materialItems=0,optionalItems=0,distractorsRewritten=0;
function absorb(x){if(!x)return false;distractorsRewritten+=x.rewritten;return true}
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
 const q=D.exams[level][i],key=Number(q?.correct??q?.[2]),opts=q?.options??q?.[1],fb=q?.optionFeedback??q?.[6],focus=q?.q??q?.[0],x=hardenArray(opts,key,fb,focus,100+i+(level==='Intermediate'?20:level==='Advanced'?40:0));if(!absorb(x))continue;
 const next=x.rows.map(r=>r.text),nextFb=x.rows.map(r=>r.feedback);if(Array.isArray(q)){q[1]=next;q[6]=nextFb}else{q.options=next;q.optionFeedback=nextFb}technicalItems++;
}
for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
 const q=D.regionalQuestions[regionName][level][i],key=Number(q?.correct??q?.[2]),opts=q?.options??q?.[1],fb=q?.optionFeedback??q?.[6],focus=q?.q??q?.[0],x=hardenArray(opts,key,fb,focus,300+i+(regionName==='US'?30:regionName==='NZ'?60:0)+(level==='Intermediate'?10:level==='Advanced'?20:0));if(!absorb(x))continue;
 const next=x.rows.map(r=>r.text),nextFb=x.rows.map(r=>r.feedback);if(Array.isArray(q)){q[1]=next;q[6]=nextFb}else{q.options=next;q.optionFeedback=nextFb}regionalItems++;
}
const scenarioKeyPositions=[0,0,0,0];
(D.scenarios||[]).forEach((s,i)=>{
 const key=Number(s.correct),x=hardenArray(s.choices,key,s.feedback,s.category||s.title,500+i*7);if(!absorb(x))return;
 const correctRow=x.rows[key],wrong=x.rows.filter((_,j)=>j!==key),target=i%4;wrong.splice(target,0,correctRow);
 s.choices=wrong.map(r=>r.text);s.feedback=wrong.map(r=>r.feedback);s.correct=target;scenarioKeyPositions[target]++;scenarioItems++;
});
if((D.scenarios||[]).length===40&&scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);
for(const [labIndex,lab] of (DIAG.labs||[]).entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const x=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,800+labIndex*11+stepIndex);if(!absorb(x))continue;
 step.choices=x.rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));diagnosticItems++;
}
for(const [labIndex,lab] of (MAT.labs||[]).entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const x=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1100+labIndex*13+stepIndex);if(!absorb(x))continue;
 step.choices=x.rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));materialItems++;
}
if(OPT?.labs)for(const [labIndex,lab] of OPT.labs.entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;
 if(String(step.stage||'').toLowerCase()==='explain'&&/^(why is this|what is the|what does the|why can)/i.test(String(step.question||'')))step.question=`In the ${lab.title} case, what does the evidence demonstrate about ${String(lab.focus||'material behaviour').toLowerCase()}?`;
 const x=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1400+labIndex*17+stepIndex);if(!absorb(x))continue;
 step.choices=x.rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));optionalItems++;
}
const expected={technicalItems:30,regionalItems:27,scenarioItems:40,diagnosticItems:36,materialItems:24,optionalItems:40};
const actual={technicalItems,regionalItems,scenarioItems,diagnosticItems,materialItems,optionalItems};
for(const k of Object.keys(expected))if(actual[k]!==expected[k])throw new Error(`Psychometric item coverage mismatch for ${k}: ${actual[k]}/${expected[k]}`);
const itemsHardened=Object.values(actual).reduce((a,b)=>a+b,0);
D.assessmentQA=D.assessmentQA||{};D.assessmentQA.psychometricHardening={version:VERSION,semanticAnswerChanges:0,scenarioKeyPositions:scenarioKeyPositions.slice(),itemsHardened,distractorsRewritten,optionSpecificFeedback:true};
window.MM_PSYCHOMETRIC_HARDENING={version:VERSION,semanticAnswerChanges:0,scenarioKeyPositions:scenarioKeyPositions.slice(),itemsHardened,distractorsRewritten,byBank:actual,policy:'Upgrade the two highest-risk safe distractors in each decision, preserve unsafe distractors as unsafe, retain the engineering truth, and remove answer-position/wording shortcuts without homogenising all options.'};
})();

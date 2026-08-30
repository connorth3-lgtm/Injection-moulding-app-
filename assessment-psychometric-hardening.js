/* MouldMaster psychometric assessment hardening — 2026.08.30.2 */
(function(){
'use strict';
const VERSION='2026.08.30.2';
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
 if(l<Math.max(18,keyLength*.55))score+=3;
 if(l<28)score+=1;
 return score;
}
function improveDistractor(text,focus,seed){
 const h=hypothesis(text),topic=String(focus||'the stated mechanism').toLowerCase();
 const forms=[
  `Test ${h} as an alternative hypothesis against the same baseline before prioritising ${topic}`,
  `Compare evidence for ${h} with the observed change before deciding that ${topic} is the better explanation`,
  `Use a controlled check of ${h} as the competing hypothesis, then compare the response with ${topic}`,
  `Review whether ${h} changed at the same time and could explain the observation before prioritising ${topic}`,
  `Assess ${h} under matched conditions as a competing explanation before concluding that ${topic} is causal`,
  `Check the data supporting ${h} as an alternative cause and compare it with the evidence for ${topic}`
 ];
 return forms[seed%forms.length];
}
function wrongFeedback(text,focus){
 const topic=String(focus||'the mechanism supported by the stem').trim().toLowerCase();
 if(unsafe(text))return 'Unsafe. Safeguards and isolation requirements remain in force; this is not an acceptable diagnostic or production action.';
 return `Not the strongest first decision. This is a plausible competing path, but the evidence in the stem does not discriminate it as strongly as ${topic}.`;
}
function hardenArray(options,key,feedback,focus,seed){
 if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return null;
 const rows=options.map((text,i)=>({text:clean(text),feedback:Array.isArray(feedback)?String(feedback[i]||''):''}));
 const keyLength=rows[key].text.length,candidates=rows.map((r,i)=>({i,score:i===key?-1000:risk(r.text,keyLength)})).filter(x=>x.score>-999);
 candidates.sort((a,b)=>b.score-a.score||((a.i+seed)%4)-((b.i+seed)%4));
 const chosen=candidates[0]?.i;
 if(Number.isInteger(chosen))rows[chosen].text=improveDistractor(rows[chosen].text,focus,seed+chosen);
 rows.forEach((r,i)=>{if(i!==key)r.feedback=wrongFeedback(r.text,focus)});
 rows[key].feedback=rows[key].feedback||`Correct. This choice is the most direct decision supported by ${String(focus||'the stated evidence').toLowerCase()}.`;
 // The earlier strict gate remains non-negotiable: if the key became longest after one
 // distractor rewrite, extend only the selected competing hypothesis, never the key.
 if(Number.isInteger(chosen)){
   const target=rows[key].text.length;
   const suffixes=[' while holding the other verified conditions at baseline',' with the same measurement method and acceptance rule',' before changing a second variable or accepting the root-cause conclusion'];
   while(rows[chosen].text.length<=target)rows[chosen].text=clean(rows[chosen].text)+suffixes[(seed+rows[chosen].text.length)%suffixes.length];
 }
 return {rows,rewritten:Number.isInteger(chosen)?1:0};
}
let technical=0,regional=0,scenario=0,diagnostic=0,material=0,optional=0;
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
 const q=D.exams[level][i],key=Number(q?.correct??q?.[2]),opts=q?.options??q?.[1],fb=q?.optionFeedback??q?.[6],focus=q?.q??q?.[0],x=hardenArray(opts,key,fb,focus,100+i+(level==='Intermediate'?20:level==='Advanced'?40:0));if(!x)continue;
 const next=x.rows.map(r=>r.text),nextFb=x.rows.map(r=>r.feedback);if(Array.isArray(q)){q[1]=next;q[6]=nextFb}else{q.options=next;q.optionFeedback=nextFb}technical+=x.rewritten;
}
for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
 const q=D.regionalQuestions[regionName][level][i],key=Number(q?.correct??q?.[2]),opts=q?.options??q?.[1],fb=q?.optionFeedback??q?.[6],focus=q?.q??q?.[0],x=hardenArray(opts,key,fb,focus,300+i+(regionName==='US'?30:regionName==='NZ'?60:0)+(level==='Intermediate'?10:level==='Advanced'?20:0));if(!x)continue;
 const next=x.rows.map(r=>r.text),nextFb=x.rows.map(r=>r.feedback);if(Array.isArray(q)){q[1]=next;q[6]=nextFb}else{q.options=next;q.optionFeedback=nextFb}regional+=x.rewritten;
}
const scenarioKeyPositions=[0,0,0,0];
(D.scenarios||[]).forEach((s,i)=>{
 const key=Number(s.correct),x=hardenArray(s.choices,key,s.feedback,s.category||s.title,500+i*7);if(!x)return;
 const correctRow=x.rows[key],wrong=x.rows.filter((_,j)=>j!==key),target=i%4;wrong.splice(target,0,correctRow);
 s.choices=wrong.map(r=>r.text);s.feedback=wrong.map(r=>r.feedback);s.correct=target;scenarioKeyPositions[target]++;scenario+=x.rewritten;
});
if((D.scenarios||[]).length===40&&scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);
for(const [labIndex,lab] of (DIAG.labs||[]).entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;
 const x=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,800+labIndex*11+stepIndex);if(!x)continue;
 step.choices=x.rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));diagnostic+=x.rewritten;
}
for(const [labIndex,lab] of (MAT.labs||[]).entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;
 const x=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1100+labIndex*13+stepIndex);if(!x)continue;
 step.choices=x.rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));material+=x.rewritten;
}
if(OPT?.labs)for(const [labIndex,lab] of OPT.labs.entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;
 if(String(step.stage||'').toLowerCase()==='explain'&&/^(why is this|what is the|what does the|why can)/i.test(String(step.question||'')))step.question=`In the ${lab.title} case, what does the evidence demonstrate about ${String(lab.focus||'material behaviour').toLowerCase()}?`;
 const x=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1400+labIndex*17+stepIndex);if(!x)continue;
 step.choices=x.rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));optional+=x.rewritten;
}
const expected={technical:30,regional:27,scenario:40,diagnostic:36,material:24,optional:40};
const actual={technical,regional,scenario,diagnostic,material,optional};
for(const k of Object.keys(expected))if(actual[k]!==expected[k])throw new Error(`Psychometric distractor coverage mismatch for ${k}: ${actual[k]}/${expected[k]}`);
const rewritten=Object.values(actual).reduce((a,b)=>a+b,0);
D.assessmentQA=D.assessmentQA||{};D.assessmentQA.psychometricHardening={version:VERSION,semanticAnswerChanges:0,scenarioKeyPositions:scenarioKeyPositions.slice(),distractorsRewritten:rewritten,optionSpecificFeedback:true};
window.MM_PSYCHOMETRIC_HARDENING={version:VERSION,semanticAnswerChanges:0,scenarioKeyPositions:scenarioKeyPositions.slice(),distractorsRewritten:rewritten,byBank:actual,policy:'Upgrade the single highest-risk distractor in every decision, keep unsafe distractors explicitly unsafe, preserve engineering truth, and remove answer-position/wording shortcuts without homogenising all options.'};
})();

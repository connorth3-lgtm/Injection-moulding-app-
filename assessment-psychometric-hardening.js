/* MouldMaster psychometric assessment hardening — 2026.08.30.1 */
(function(){
'use strict';
const VERSION='2026.08.30.1';
const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
if(!D||!DIAG?.labs||!MAT?.labs)throw new Error('Assessment and lab banks must load before psychometric hardening');

const unsafe=t=>/\b(bypass|defeat|disable|remove)\b.{0,55}\b(guard|interlock|safeguard|protection|lockout)\b/i.test(String(t||''));
const clean=t=>String(t||'').trim().replace(/[.]+$/,'');
function hypothesis(text){
 const t=clean(text),l=t.toLowerCase();
 const rules=[
  [/^increase\s+/i,'increasing '],[/^raise\s+/i,'raising '],[/^boost\s+/i,'increasing '],
  [/^(reduce|decrease|lower|shorten)\s+/i,'reducing '],[/^(change|adjust)\s+/i,'changing '],
  [/^ignore\s+/i,'deprioritising '],[/^assume\s+/i,'the assumption that '],[/^(approve|accept|treat)\s+/i,'accepting '],
  [/^use\s+only\s+/i,'using only '],[/^use\s+/i,'using '],[/^keep\s+/i,'keeping '],[/^dry\s+/i,'drying ']
 ];
 for(const [rx,prefix] of rules)if(rx.test(t))return prefix+t.replace(rx,'');
 if(/^only\s+/i.test(t))return 'relying on '+t.replace(/^only\s+/i,'');
 if(/^all\s+/i.test(t))return 'treating '+l+' as universally applicable';
 return l;
}
const templates=[
 h=>`Check evidence for ${h} in a controlled comparison and treat it as the leading alternative hypothesis`,
 h=>`Compare whether ${h} changed with the event before prioritising the mechanism indicated by the stem`,
 h=>`Use a single-variable test of ${h} as the first discriminator, then review whether the response follows it`,
 h=>`Inspect the data supporting ${h} and prioritise that path before the stated mechanism`,
 h=>`Verify whether ${h} is repeatable under matched conditions and use it as the initial working hypothesis`,
 h=>`Measure the response associated with ${h} first, then decide whether the stated mechanism still needs investigation`
];
function professionalise(text,seed){
 if(unsafe(text))return clean(text);
 const h=hypothesis(text),base=templates[seed%templates.length](h);
 return base.charAt(0).toUpperCase()+base.slice(1);
}
function wrongFeedback(text,focus){
 const h=hypothesis(text),topic=String(focus||'the mechanism supported by the stem').trim().toLowerCase();
 if(unsafe(text))return 'Unsafe. Safeguards and isolation requirements remain in force; this option is not an acceptable diagnostic or production action.';
 return `Not the strongest first decision. This option prioritises ${h}, but the stated evidence does not make that path more discriminating than ${topic}.`;
}
function lengthBalance(rows,key,focus,seed){
 const keyed=clean(rows[key].text),target=keyed.length;
 const wrong=rows.filter((_,i)=>i!==key&&!unsafe(rows[i].text));
 if(!wrong.length)return;
 wrong.forEach((r,j)=>{r.text=professionalise(r.text,seed+j)});
 const ranked=wrong.slice().sort((a,b)=>clean(b.text).length-clean(a.text).length);
 const suffixes=[
  ' while holding the remaining verified conditions at their baseline',
  ' with the same measurement method and acceptance rule used for the baseline',
  ' before changing any second variable or accepting the root-cause conclusion'
 ];
 const medianFloor=Math.ceil(target/1.38);
 ranked.slice(0,2).forEach((r,j)=>{while(clean(r.text).length<medianFloor)r.text=clean(r.text)+suffixes[(seed+j)%suffixes.length]});
 const longest=ranked[0];while(clean(longest.text).length<=target)longest.text=clean(longest.text)+suffixes[(seed+2)%suffixes.length];
 rows.forEach((r,i)=>{if(i!==key)r.feedback=wrongFeedback(r.text,focus)});
}
function hardenArray(options,key,feedback,focus,seed){
 if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return null;
 const rows=options.map((text,i)=>({text:clean(text),feedback:Array.isArray(feedback)?String(feedback[i]||''):''}));
 const keyedFeedback=rows[key].feedback;
 lengthBalance(rows,key,focus,seed);
 rows[key].feedback=keyedFeedback||`Correct. This choice is the most direct decision supported by ${String(focus||'the stated evidence').toLowerCase()}.`;
 return rows;
}
let technicalDistractors=0,regionalDistractors=0,scenarioDistractors=0,diagnosticDistractors=0,materialDistractors=0,optionalDistractors=0;

for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
 const q=D.exams[level][i],key=Number(q?.correct??q?.[2]),opts=q?.options??q?.[1],fb=q?.optionFeedback??q?.[6],focus=q?.q??q?.[0];
 const rows=hardenArray(opts,key,fb,focus,100+i+(level==='Intermediate'?20:level==='Advanced'?40:0));if(!rows)continue;
 const next=rows.map(r=>r.text),nextFb=rows.map(r=>r.feedback);if(Array.isArray(q)){q[1]=next;q[6]=nextFb}else{q.options=next;q.optionFeedback=nextFb}technicalDistractors+=3;
}
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){
 const q=D.regionalQuestions[region][level][i],key=Number(q?.correct??q?.[2]),opts=q?.options??q?.[1],fb=q?.optionFeedback??q?.[6],focus=q?.q??q?.[0];
 const rows=hardenArray(opts,key,fb,focus,300+i+(region==='US'?30:region==='NZ'?60:0)+(level==='Intermediate'?10:level==='Advanced'?20:0));if(!rows)continue;
 const next=rows.map(r=>r.text),nextFb=rows.map(r=>r.feedback);if(Array.isArray(q)){q[1]=next;q[6]=nextFb}else{q.options=next;q.optionFeedback=nextFb}regionalDistractors+=3;
}

const scenarioKeyPositions=[0,0,0,0];
(D.scenarios||[]).forEach((s,i)=>{
 const key=Number(s.correct),rows=hardenArray(s.choices,key,s.feedback,s.category||s.title,500+i*7);if(!rows)return;
 const correctRow=rows[key],wrong=rows.filter((_,j)=>j!==key),target=i%4;wrong.splice(target,0,correctRow);
 s.choices=wrong.map(r=>r.text);s.feedback=wrong.map(r=>r.feedback);s.correct=target;scenarioKeyPositions[target]++;scenarioDistractors+=3;
});
if((D.scenarios||[]).length===40&&scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);

for(const [labIndex,lab] of (DIAG.labs||[]).entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;
 const rows=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,800+labIndex*11+stepIndex);if(!rows)continue;
 step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));diagnosticDistractors+=3;
}
for(const [labIndex,lab] of (MAT.labs||[]).entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;
 const rows=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1100+labIndex*13+stepIndex);if(!rows)continue;
 step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));materialDistractors+=3;
}
if(OPT?.labs)for(const [labIndex,lab] of OPT.labs.entries())for(const [stepIndex,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;
 if(String(step.stage||'').toLowerCase()==='explain'&&/^(why is this|what is the|what does the|why can)/i.test(String(step.question||'')))step.question=`What does the ${lab.id.replace(/-/g,' ')} case demonstrate about ${String(lab.focus||'material behaviour').toLowerCase()}?`;
 const rows=hardenArray(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1400+labIndex*17+stepIndex);if(!rows)continue;
 step.choices=rows.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));optionalDistractors+=3;
}

const expected={technical:90,regional:81,scenario:120,diagnostic:108,material:72,optional:120};
const actual={technical:technicalDistractors,regional:regionalDistractors,scenario:scenarioDistractors,diagnostic:diagnosticDistractors,material:materialDistractors,optional:optionalDistractors};
for(const k of Object.keys(expected))if(actual[k]!==expected[k])throw new Error(`Psychometric distractor coverage mismatch for ${k}: ${actual[k]}/${expected[k]}`);
D.assessmentQA=D.assessmentQA||{};D.assessmentQA.psychometricHardening={version:VERSION,semanticAnswerChanges:0,scenarioKeyPositions:scenarioKeyPositions.slice(),distractorsRewritten:Object.values(actual).reduce((a,b)=>a+b,0),optionSpecificFeedback:true};
window.MM_PSYCHOMETRIC_HARDENING={version:VERSION,semanticAnswerChanges:0,scenarioKeyPositions:scenarioKeyPositions.slice(),distractorsRewritten:Object.values(actual).reduce((a,b)=>a+b,0),byBank:actual,policy:'Every distractor must be plausible enough that wording style alone cannot identify the key; engineering truth and safety boundaries remain unchanged.'};
})();

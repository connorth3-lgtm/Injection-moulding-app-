/* MouldMaster psychometric assessment hardening — 2026.08.30.4 */
(function(){
'use strict';
const VERSION='2026.08.30.4';
const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
if(!D||!DIAG?.labs||!MAT?.labs)throw new Error('Assessment and lab banks must load before psychometric hardening');
const clean=t=>String(t||'').trim().replace(/[.]+$/,'');
const unsafe=t=>/\b(bypass|defeat|disable|remove)\b.{0,55}\b(guard|interlock|safeguard|protection|lockout)\b/i.test(String(t||''));
function lcFirst(s){s=clean(s);return s?s.charAt(0).toLowerCase()+s.slice(1):s}
function parallel(text){
 const t=clean(text);
 const rules=[
  [/^Verify\s+/i,'Verification of '],[/^Inspect\s+/i,'Inspection of '],[/^Compare\s+/i,'Comparison of '],[/^Measure\s+/i,'Measurement of '],[/^Investigate\s+/i,'Investigation of '],[/^Validate\s+/i,'Validation of '],[/^Confirm\s+/i,'Confirmation of '],[/^Check\s+/i,'A check of '],[/^Test\s+/i,'A controlled test of '],[/^Map\s+/i,'Mapping of '],[/^Separate\s+/i,'Separation of '],[/^Restore\s+/i,'Restoration of '],[/^Correct\s+/i,'Correction of '],
  [/^Increase\s+/i,'An increase in '],[/^Raise\s+/i,'An increase in '],[/^Boost\s+/i,'An increase in '],[/^Decrease\s+/i,'A decrease in '],[/^Lower\s+/i,'A decrease in '],[/^Reduce\s+/i,'A reduction in '],[/^Shorten\s+/i,'A reduction in '],[/^Change\s+/i,'A change to '],[/^Adjust\s+/i,'An adjustment to '],
  [/^Ignore\s+/i,'Deprioritising '],[/^Assume\s+/i,'The assumption that '],[/^Approve\s+/i,'Approval based on '],[/^Accept\s+/i,'Acceptance based on '],[/^Treat\s+/i,'Treatment of '],[/^Judge\s+/i,'Judgement based on '],[/^Use\s+/i,'Use of '],[/^Keep\s+/i,'Keeping '],[/^Dry\s+/i,'Drying ']
 ];
 for(const [rx,p] of rules)if(rx.test(t))return p+lcFirst(t.replace(rx,''));
 if(/^Never\s+/i.test(t))return 'Treating '+lcFirst(t.replace(/^Never\s+/i,''))+' as unnecessary in every case';
 if(/^Always\s+/i.test(t))return 'Treating '+lcFirst(t.replace(/^Always\s+/i,''))+' as universally required';
 if(/^All\s+/i.test(t))return 'Universal application of '+lcFirst(t.replace(/^All\s+/i,''));
 if(/^Every\s+/i.test(t))return 'A single rule applied to '+lcFirst(t.replace(/^Every\s+/i,''));
 if(/^Only\s+/i.test(t))return 'Exclusive reliance on '+lcFirst(t.replace(/^Only\s+/i,''));
 return t;
}
function wrongFeedback(text,focus,index){
 if(unsafe(text))return 'Unsafe. Safeguards and isolation requirements remain in force; this is not an acceptable diagnostic or production action.';
 return `Not the strongest first decision. Alternative ${index+1} prioritises “${clean(text)}”, but the stated evidence discriminates more strongly toward ${String(focus||'the keyed mechanism').toLowerCase()}.`;
}
function harden(options,key,feedback,focus,seed){
 if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return null;
 const rows=options.map((text,i)=>({text:parallel(text),feedback:Array.isArray(feedback)?String(feedback[i]||''):''}));
 rows.forEach((r,i)=>{if(i!==key)r.feedback=wrongFeedback(r.text,focus,i)});
 rows[key].feedback=rows[key].feedback||`Correct. This option is the most direct decision supported by ${String(focus||'the stated evidence').toLowerCase()}.`;
 const safeWrong=rows.map((_,i)=>i).filter(i=>i!==key&&!unsafe(rows[i].text));
 if(safeWrong.length){
   let longest=safeWrong.reduce((a,b)=>rows[a].text.length>=rows[b].text.length?a:b);
   const suffix=[' under the stated conditions',' using the same acceptance rule',' against the same validated baseline'];
   while(rows[longest].text.length<=rows[key].text.length)rows[longest].text=clean(rows[longest].text)+suffix[(seed+rows[longest].text.length)%suffix.length];
 }
 return rows;
}
let technicalItems=0,regionalItems=0,scenarioItems=0,diagnosticItems=0,materialItems=0,optionalItems=0;
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
 const q=D.exams[level][i],key=Number(q?.correct??q?.[2]),x=harden(q?.options??q?.[1],key,q?.optionFeedback??q?.[6],q?.q??q?.[0],100+i);if(!x)continue;
 if(Array.isArray(q)){q[1]=x.map(r=>r.text);q[6]=x.map(r=>r.feedback)}else{q.options=x.map(r=>r.text);q.optionFeedback=x.map(r=>r.feedback)}technicalItems++;
}
for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
 const q=D.regionalQuestions[regionName][level][i],key=Number(q?.correct??q?.[2]),x=harden(q?.options??q?.[1],key,q?.optionFeedback??q?.[6],q?.q??q?.[0],300+i);if(!x)continue;
 if(Array.isArray(q)){q[1]=x.map(r=>r.text);q[6]=x.map(r=>r.feedback)}else{q.options=x.map(r=>r.text);q.optionFeedback=x.map(r=>r.feedback)}regionalItems++;
}
const scenarioKeyPositions=[0,0,0,0];
(D.scenarios||[]).forEach((s,i)=>{const key=Number(s.correct),x=harden(s.choices,key,s.feedback,s.category||s.title,500+i);if(!x)return;const keyed=x[key],wrong=x.filter((_,j)=>j!==key),target=i%4;wrong.splice(target,0,keyed);s.choices=wrong.map(r=>r.text);s.feedback=wrong.map(r=>r.feedback);s.correct=target;scenarioKeyPositions[target]++;scenarioItems++});
if((D.scenarios||[]).length===40&&scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);
for(const [li,lab] of (DIAG.labs||[]).entries())for(const [si,step] of (lab.steps||[]).entries()){const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const x=harden(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,800+li*7+si);if(!x)continue;step.choices=x.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));diagnosticItems++}
for(const [li,lab] of (MAT.labs||[]).entries())for(const [si,step] of (lab.steps||[]).entries()){const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const x=harden(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1100+li*7+si);if(!x)continue;step.choices=x.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));materialItems++}
if(OPT?.labs)for(const [li,lab] of OPT.labs.entries())for(const [si,step] of (lab.steps||[]).entries()){
 const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;
 if(String(step.stage||'').toLowerCase()==='explain'&&/^(why is this|what is the|what does the|why can)/i.test(String(step.question||'')))step.question=`In the ${lab.title} case, what does the evidence demonstrate about ${String(lab.focus||'material behaviour').toLowerCase()}?`;
 const x=harden(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1400+li*7+si);if(!x)continue;step.choices=x.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));optionalItems++;
}
const expected={technicalItems:30,regionalItems:27,scenarioItems:40,diagnosticItems:36,materialItems:24,optionalItems:40};
const actual={technicalItems,regionalItems,scenarioItems,diagnosticItems,materialItems,optionalItems};for(const k of Object.keys(expected))if(actual[k]!==expected[k])throw new Error(`Psychometric item coverage mismatch for ${k}: ${actual[k]}/${expected[k]}`);
const itemsHardened=Object.values(actual).reduce((a,b)=>a+b,0),optionsParallelised=itemsHardened*4;
D.assessmentQA=D.assessmentQA||{};D.assessmentQA.psychometricHardening={version:VERSION,semanticAnswerChanges:0,scenarioKeyPositions:scenarioKeyPositions.slice(),itemsHardened,optionsParallelised,optionSpecificFeedback:true};
window.MM_PSYCHOMETRIC_HARDENING={version:VERSION,semanticAnswerChanges:0,scenarioKeyPositions:scenarioKeyPositions.slice(),itemsHardened,optionsParallelised,byBank:actual,policy:'Parallelise the wording form of every option, retain each proposition and safety boundary, keep the keyed answer shorter than at least one distractor, and balance scenario key positions.'};
})();

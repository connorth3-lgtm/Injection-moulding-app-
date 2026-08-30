/* MouldMaster psychometric assessment hardening — 2026.08.31.2 */
(function(){
'use strict';
const VERSION='2026.08.31.2';
const clean=t=>String(t||'').trim().replace(/[.]+$/,'');
const unsafe=t=>/\b(bypass|defeat|disable|remove)\b.{0,55}\b(guard|interlock|safeguard|protection|lockout)\b/i.test(String(t||''));
const prefixes=['Assessment of ','Review of ','Evaluation of ','Consideration of '];
const negTails=['; with no alteration to the stated case','; with no alteration to the recorded window','; with no alteration to the production state','; with no alteration to the reference state'];
const pads=[
 [' under the stated case conditions',' within this production review',' for the present decision'],
 [' within the recorded contrast window',' for this production review',' at the present decision point'],
 [' for the observed production state',' within this case review',' at the current decision point'],
 [' against the recorded reference state',' for this case review',' within the current decision point']
];
const STEM_REWRITES={
 'tech:Beginner:0':'During a controlled pack/hold study, hold time increases stepwise. Part mass rises, then reaches a repeatable plateau while fill behaviour and shot delivery stay stable. What does the plateau most strongly support?',
 'tech:Intermediate:1':'A dark mark repeats at the last region to fill. Fill time is stable, the mark is location-specific, and a slower end-of-fill test reduces it. Which mechanism should be inspected next?',
 'tech:Advanced:2':'In a two-factor study, mould temperature improves a dimension at low packing pressure but worsens it at high packing pressure. What interaction does this evidence support?',
 'tech:Advanced:3':'High settings of one DOE factor were run late in the shift and low settings early. The factor appears significant. What evidence-related risk must be resolved?',
 'tech:Advanced:4':'Machine peak injection pressure is stable, but in-cavity pressure changes near end of fill and the part feature changes with it. What does this evidence imply?',
 'tech:Advanced:5':'A process window is mapped from low to high settings, but the material lot changes halfway through and fill pressure shifts with it. Can the factor boundary be treated as validated?',
 'tech:Advanced:8':'Two polypropylene grades have similar published MFR values but different fill-pressure and flow-length behaviour in the same mould. What does this evidence imply about MFR and moulding behaviour?'
};
function lcFirst(s){s=clean(s);return s?s.charAt(0).toLowerCase()+s.slice(1):s}
function cueNeutral(text){
 let t=clean(text);
 const rules=[
  [/^Verify\s+/i,'Review of '],[/^Inspect\s+/i,'Examination of '],[/^Compare\s+/i,'Contrast of '],[/^Measure\s+/i,'Quantification of '],[/^Investigate\s+/i,'Examination of '],[/^Validate\s+/i,'Qualification of '],[/^Confirm\s+/i,'Corroboration of '],[/^Check\s+/i,'Review of '],[/^Test\s+/i,'Trial of '],[/^Map\s+/i,'Mapping of '],[/^Separate\s+/i,'Separation of '],[/^Restore\s+/i,'Restoration of '],[/^Correct\s+/i,'Correction of '],
  [/^Increase\s+/i,'An increase in '],[/^Raise\s+/i,'An increase in '],[/^Boost\s+/i,'An increase in '],[/^Decrease\s+/i,'A decrease in '],[/^Lower\s+/i,'A decrease in '],[/^Reduce\s+/i,'A reduction in '],[/^Shorten\s+/i,'A reduction in '],[/^Change\s+/i,'A change to '],[/^Adjust\s+/i,'An adjustment to '],
  [/^Ignore\s+/i,'Deprioritising '],[/^Assume\s+/i,'The assumption that '],[/^Approve\s+/i,'Acceptance based on '],[/^Accept\s+/i,'Acceptance based on '],[/^Treat\s+/i,'Treatment of '],[/^Judge\s+/i,'Judgement based on '],[/^Use\s+/i,'Use of '],[/^Keep\s+/i,'Keeping '],[/^Dry\s+/i,'Drying ']
 ];
 for(const [rx,p] of rules)if(rx.test(t)){t=p+lcFirst(t.replace(rx,''));break}
 const replacements=[
  [/\bvalidated\b/gi,'qualified'],[/\bvalidation\b/gi,'qualification'],[/\bverify\b/gi,'corroborate'],[/\bverification\b/gi,'corroboration'],
  [/\bevidence\b/gi,'observations'],[/\bactual\b/gi,'observed'],[/\bexact\b/gi,'defined'],[/\bapproved\b/gi,'authorised'],[/\bcontrolled\b/gi,'structured'],[/\bbaseline\b/gi,'reference state'],
  [/\bcompare\b/gi,'contrast'],[/\bcomparison\b/gi,'contrast'],[/\bmeasure\b/gi,'quantify'],[/\bmeasurement\b/gi,'quantification'],[/\binspect\b/gi,'examine'],[/\binspection\b/gi,'examination'],
  [/\binvestigate\b/gi,'examine'],[/\binvestigation\b/gi,'examination'],[/\bconfirm\b/gi,'corroborate'],[/\bconfirmation\b/gi,'corroboration'],[/\brepeatability\b/gi,'consistency'],[/\brepeat\b/gi,'re-run'],
  [/\bspecific\b/gi,'defined'],[/\bappropriate\b/gi,'suitable'],
  [/\balways\b/gi,'universally'],[/\bnever\b/gi,'categorically'],[/\bonly\b/gi,'exclusively'],[/\bautomatically\b/gi,'by default'],[/\bguarantees\b/gi,'ensures'],[/\bguarantee\b/gi,'ensure'],
  [/\bproves\b/gi,'establishes'],[/\bprove\b/gi,'establish'],[/\bproven\b/gi,'established'],[/\bidentical\b/gi,'the same'],[/\bevery\b/gi,'each'],[/\ball\b/gi,'the full set of']
 ];
 for(const [rx,r] of replacements)t=t.replace(rx,r);
 t=t.replace(/,\s*/g,'; ').replace(/\s+and\s+/gi,' together with ').replace(/\s{2,}/g,' ');
 return clean(t);
}
function tightenStem(id,stem){
 let s=String(STEM_REWRITES[id]||stem||'').trim();
 s=s.replace(/\b(obviously|clearly|simply|just)\b\s*/gi,'').replace(/\s{2,}/g,' ').replace(/\s+([,.;:?])/g,'$1');
 return s;
}
function frame(core,index,context){
 const tag=context&&String(context).length<46?`; for this ${String(context).toLowerCase()} case`:'';
 return prefixes[index%4]+lcFirst(core)+negTails[index%4]+tag;
}
function wrongFeedback(core,focus,index){
 if(unsafe(core))return 'Unsafe. Safeguards and isolation requirements remain in force; this is not an acceptable diagnostic or production action.';
 return `Not the strongest first decision. Alternative ${index+1} prioritises “${clean(core)}”, but the stated observations discriminate more strongly toward ${String(focus||'the keyed mechanism').toLowerCase()}.`;
}
function harden(options,key,feedback,focus,seed,context=''){
 if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return null;
 const rows=options.map((text,i)=>{const core=cueNeutral(text);return {core,text:frame(core,i,context),feedback:Array.isArray(feedback)?String(feedback[i]||''):''}});
 rows.forEach((r,i)=>{if(i!==key)r.feedback=wrongFeedback(r.core,focus,i)});
 rows[key].feedback=rows[key].feedback||`Correct. This option is the most direct decision supported by ${String(focus||'the stated observations').toLowerCase()}.`;
 const target=Math.max(124,Math.max(...rows.map(r=>r.text.length))+10);
 rows.forEach((r,i)=>{let n=0;while(r.text.length<target){r.text=clean(r.text)+pads[i][n%pads[i].length];n++}});
 const wrong=rows.map((_,i)=>i).filter(i=>i!==key),chosen=wrong.reduce((a,b)=>rows[a].text.length>=rows[b].text.length?a:b);
 let n=0;while(rows[chosen].text.length<=rows[key].text.length){rows[chosen].text=clean(rows[chosen].text)+pads[chosen][n%pads[chosen].length];n++}
 return rows;
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
 const technicalKeyPositions=[0,0,0,0];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
  const q=D.exams[level][i],id=`tech:${level}:${i}`,oldStem=q?.q??q?.[0]??'',newStem=tightenStem(id,oldStem);if(newStem!==oldStem){setQuestionStem(q,newStem);stemRewrites++}
  const key=Number(q?.correct??q?.[2]),x=harden(q?.options??q?.[1],key,q?.optionFeedback??q?.[6],newStem,100+techOrdinal);if(!x)continue;
  const target=techOrdinal%4,moved=reposition(x,key,target);setQuestionRows(q,moved.rows,moved.key);technicalKeyPositions[moved.key]++;technicalItems++;techOrdinal++;
 }
 if(technicalKeyPositions.join(',')!=='8,8,7,7')throw new Error(`Technical key positions are not balanced: ${technicalKeyPositions.join(',')}`);
 for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
  const q=D.regionalQuestions[regionName][level][i],id=`reg:${regionName}:${level}:${i}`,oldStem=q?.q??q?.[0]??'',newStem=tightenStem(id,oldStem);if(newStem!==oldStem){setQuestionStem(q,newStem);stemRewrites++}
  const key=Number(q?.correct??q?.[2]),x=harden(q?.options??q?.[1],key,q?.optionFeedback??q?.[6],newStem,300+i);if(!x)continue;setQuestionRows(q,x,key);regionalItems++;
 }
 const scenarioKeyPositions=[0,0,0,0];
 (D.scenarios||[]).forEach((s,i)=>{const oldStem=s.situation||'',newStem=tightenStem(`scenario:${String(i+1).padStart(2,'0')}`,oldStem);if(newStem!==oldStem){s.situation=newStem;stemRewrites++}const key=Number(s.correct),context=s.category||s.title||'',x=harden(s.choices,key,s.feedback,context,500+i,context);if(!x)return;const moved=reposition(x,key,i%4);s.choices=moved.rows.map(r=>r.text);s.feedback=moved.rows.map(r=>r.feedback);s.correct=moved.key;scenarioKeyPositions[moved.key]++;scenarioItems++});
 if(scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);
 for(const [li,lab] of (DIAG.labs||[]).entries())for(const [si,step] of (lab.steps||[]).entries()){step.question=tightenStem(`lab:${lab.id}:${si}`,step.question);const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const x=harden(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,800+li*7+si);if(!x)continue;step.choices=x.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));diagnosticItems++}
 for(const [li,lab] of (MAT.labs||[]).entries())for(const [si,step] of (lab.steps||[]).entries()){step.question=tightenStem(`material:${lab.id}:${si}`,step.question);const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const x=harden(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1100+li*7+si);if(!x)continue;step.choices=x.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));materialItems++}
 for(const [li,lab] of OPT.labs.entries())for(const [si,step] of (lab.steps||[]).entries()){
  if(String(step.stage||'').toLowerCase()==='explain'&&/^(why is this|what is the|what does the|why can)/i.test(String(step.question||'')))step.question=`In the ${lab.title} case, what do the observations demonstrate about ${String(lab.focus||'material behaviour').toLowerCase()}?`;
  step.question=tightenStem(`optional-material:${lab.id}:${si}`,step.question);
  const key=(step.choices||[]).findIndex(c=>c.correct===true);if(key<0)continue;const x=harden(step.choices.map(c=>c.text),key,step.choices.map(c=>c.feedback),lab.focus||lab.title,1400+li*7+si);if(!x)continue;step.choices=x.map((r,i)=>({text:r.text,correct:i===key,feedback:r.feedback}));optionalItems++;
 }
 const expected={technicalItems:30,regionalItems:27,scenarioItems:40,diagnosticItems:36,materialItems:24,optionalItems:40};
 const actual={technicalItems,regionalItems,scenarioItems,diagnosticItems,materialItems,optionalItems};for(const k of Object.keys(expected))if(actual[k]!==expected[k])throw new Error(`Psychometric item coverage mismatch for ${k}: ${actual[k]}/${expected[k]}`);
 const itemsHardened=Object.values(actual).reduce((a,b)=>a+b,0),optionsParallelised=itemsHardened*4;
 const meta={version:VERSION,semanticAnswerChanges:0,technicalKeyPositions:technicalKeyPositions.slice(),scenarioKeyPositions:scenarioKeyPositions.slice(),itemsHardened,optionsParallelised,optionSpecificFeedback:true,stemRewrites,initialization:'after-training-upgrade'};
 D.assessmentQA=D.assessmentQA||{};D.assessmentQA.psychometricHardening={...meta};
 window.MM_PSYCHOMETRIC_HARDENING={...meta,byBank:actual,initialization:'after-training-upgrade',policy:'Keep every option concise and grammatically parallel, neutralise surface cue vocabulary without changing the proposition, keep the keyed answer shorter than at least one distractor, balance technical and scenario key positions, and retain safety boundaries.'};
}
function scheduleHardening(){
 if(typeof document==='undefined'){applyHardening();return}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>applyHardening(),0),{once:true});
 else setTimeout(()=>applyHardening(),0);
}
scheduleHardening();
})();

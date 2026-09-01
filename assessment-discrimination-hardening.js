/* MouldMaster assessment discrimination hardening — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
const EXPECTED_COUNTS=Object.freeze({
  'evidence-verb-key-cue':77,
  'parameter-change-distractor-cue':45,
  'correct-qualification-density':24,
  'correct-length-salience-moderate':16,
  'negation-key-cue':15,
  'implausibly-short-distractor':2
});
const EXPECTED_ITEMS=111,EXPECTED_WARNINGS=179;
const QUALIFIERS=new Set(['verify','validated','validation','evidence','actual','exact','approved','controlled','baseline','compare','measure','inspect','investigate','confirm','confirmation','repeat','repeatability','specific','appropriate']);
const NEGATIONS=new Set(['not','no','never','cannot','cant','wont','without']);
const PARAMETER_START=new Set(['increase','decrease','raise','lower','reduce','change','adjust','shorten','lengthen','boost','maximize','minimize']);
const EVIDENCE_START=new Set(['verify','measure','compare','inspect','investigate','validate','confirm','check','map','separate','restore','correct']);
const UNSAFE=/\b(bypass|defeat|disable|remove)\b.{0,55}\b(guard|interlock|safeguard|protection|lockout)\b/i;
const PREFIX='Response — ';
function tokens(v){return (String(v||'').match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g)||[]).map(x=>x.toLowerCase())}
function clean(v){return String(v??'').replace(/^Response\s*[—-]\s*/i,'').replace(/[.\s]+$/,'').replace(/\s{2,}/g,' ').trim()}
function profile(v){const t=String(v||'').trim(),ts=tokens(t);return{chars:t.length,qualifiers:ts.filter(x=>QUALIFIERS.has(x)).length,negations:ts.filter(x=>NEGATIONS.has(x)).length,first:ts[0]||'',startsParameter:!!ts.length&&PARAMETER_START.has(ts[0]),startsEvidence:!!ts.length&&EVIDENCE_START.has(ts[0])}}
function flags(options,key){const out=[];if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return out;const ps=options.map(profile),kp=ps[key],wrong=ps.filter((_,i)=>i!==key),wrongChars=wrong.map(x=>x.chars).sort((a,b)=>a-b),median=wrongChars[1];
 if(kp.chars>median*1.40&&kp.chars-median>12)out.push('correct-length-salience-moderate');
 if(kp.qualifiers>=2&&kp.qualifiers>=Math.max(...wrong.map(x=>x.qualifiers))+2)out.push('correct-qualification-density');
 if(wrong.filter(x=>x.startsParameter).length>=2&&!kp.startsParameter)out.push('parameter-change-distractor-cue');
 if(kp.startsEvidence&&!wrong.some(x=>x.startsEvidence))out.push('evidence-verb-key-cue');
 if(kp.negations>0&&!wrong.some(x=>x.negations>0))out.push('negation-key-cue');
 if(Math.min(...wrong.map(x=>x.chars))<Math.max(8,0.28*Math.max(1,kp.chars)))out.push('implausibly-short-distractor');
 return out}
function softenDistractor(v){let t=clean(v);if(UNSAFE.test(t))return t;
 t=t.replace(/^Ignore\s+(.+)$/i,'Treat $1 as normal variation during the next controlled comparison');
 t=t.replace(/^Assume\s+(.+)$/i,'Treat the proposition that $1 as a provisional hypothesis for the next controlled comparison');
 t=t.replace(/\b(always|never|automatically)\b/gi,m=>m.toLowerCase()==='always'?'normally':m.toLowerCase()==='never'?'not normally':'typically');
 return t}
function addSuffix(v,s){const core=clean(v);return PREFIX+core+(core.endsWith(';')?' ':'; ')+s}
function wrap(v){return PREFIX+clean(v)}
function rebalance(options,key,preFlags){let out=options.map((x,i)=>wrap(i===key?x:softenDistractor(x))),wrongIdx=[0,1,2,3].filter(i=>i!==key);
 if(preFlags.includes('correct-qualification-density')){const kq=profile(out[key]).qualifiers;for(const i of wrongIdx){if(profile(out[i]).qualifiers<Math.max(1,kq-1))out[i]=addSuffix(out[i],'verify it with a controlled comparison against the stated evidence')}}
 if(preFlags.includes('negation-key-cue')&&!wrongIdx.some(i=>profile(out[i]).negations>0)){const i=wrongIdx.slice().sort((a,b)=>profile(out[a]).chars-profile(out[b]).chars)[0];out[i]=addSuffix(out[i],'this does not by itself establish a universal production rule')}
 let guard=0;while(guard++<6){const f=flags(out,key);if(!f.includes('correct-length-salience-moderate')&&!f.includes('implausibly-short-distractor'))break;const i=wrongIdx.slice().sort((a,b)=>profile(out[a]).chars-profile(out[b]).chars)[0];out[i]=addSuffix(out[i],'compare the same observation window before accepting the interpretation')}
 for(const i of wrongIdx)if(tokens(clean(out[i])).length<4)out[i]=addSuffix(out[i],'compare it against the stated evidence before acting');
 return out.map(x=>x.replace(/[.]$/,''))}
function wrongFeedback(text){return `Plausible competing response, but not the strongest supported decision. “${clean(text)}” should be rejected because the stated observation window discriminates more strongly toward the keyed response.`}
function collect(){const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS,out=[];
 const add=(id,kind,get,set)=>out.push({id,kind,get,set});
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D?.exams?.[level]||[]).length;i++){const q=D.exams[level][i];add(`tech:${level}:${i}`,'technical-exam',()=>({options:q.options??q[1],key:Number(q.correct??q[2]),feedback:(q.optionFeedback??q[6])||[]}),x=>{if(Array.isArray(q)){q[1]=x.options;q[6]=x.feedback}else{q.options=x.options;q.optionFeedback=x.feedback}})}
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D?.regionalQuestions?.[region]?.[level]||[]).length;i++){const q=D.regionalQuestions[region][level][i];add(`reg:${region}:${level}:${i}`,'regional-exam',()=>({options:q.options??q[1],key:Number(q.correct??q[2]),feedback:(q.optionFeedback??q[6])||[]}),x=>{if(Array.isArray(q)){q[1]=x.options;q[6]=x.feedback}else{q.options=x.options;q.optionFeedback=x.feedback}})}
 for(const [i,s] of (D?.scenarios||[]).entries())add(s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,'scenario',()=>({options:s.choices,key:Number(s.correct),feedback:s.feedback||[]}),x=>{s.choices=x.options;s.feedback=x.feedback});
 for(const lab of (DIAG?.labs||[]))for(const [i,s] of (lab.steps||[]).entries())add(`lab:${lab.id}:${i}`,'diagnostic-lab',()=>({options:(s.choices||[]).map(c=>c.text),key:(s.choices||[]).findIndex(c=>c.correct===true),feedback:(s.choices||[]).map(c=>c.feedback||'')}),x=>{s.choices=x.options.map((text,j)=>({text,correct:j===x.key,feedback:x.feedback[j]}))});
 for(const lab of (MAT?.labs||[]))for(const [i,s] of (lab.steps||[]).entries())add(`material:${lab.id}:${i}`,'material-lab',()=>({options:(s.choices||[]).map(c=>c.text),key:(s.choices||[]).findIndex(c=>c.correct===true),feedback:(s.choices||[]).map(c=>c.feedback||'')}),x=>{s.choices=x.options.map((text,j)=>({text,correct:j===x.key,feedback:x.feedback[j]}))});
 for(const lab of (OPT?.labs||[]))for(const [i,s] of (lab.steps||[]).entries())add(`optional-material:${lab.id}:${i}`,'optional-material-practice',()=>({options:(s.choices||[]).map(c=>c.text),key:(s.choices||[]).findIndex(c=>c.correct===true),feedback:(s.choices||[]).map(c=>c.feedback||'')}),x=>{s.choices=x.options.map((text,j)=>({text,correct:j===x.key,feedback:x.feedback[j]}))});
 return out}
function run(attempt=0){if(window.MM_ASSESSMENT_DISCRIMINATION_HARDENING?.version===VERSION)return;const records=collect();if(!window.MM_PSYCHOMETRIC_HARDENING||records.length!==197){if(attempt<80&&typeof setTimeout==='function'){setTimeout(()=>run(attempt+1),25);return}window.MM_ASSESSMENT_DISCRIMINATION_HARDENING={version:VERSION,status:'review-required',reason:`expected 197 post-psychometric items, got ${records.length}`};return}
 const beforeCounts=Object.fromEntries(Object.keys(EXPECTED_COUNTS).map(k=>[k,0])),targets=[];let beforeWarnings=0;
 for(const r of records){const x=r.get(),fs=flags(x.options,x.key);for(const f of fs)if(f in beforeCounts){beforeCounts[f]++;beforeWarnings++}if(fs.length)targets.push({r,x,fs})}
 const countsMatch=Object.entries(EXPECTED_COUNTS).every(([k,v])=>beforeCounts[k]===v),scopeMatch=targets.length===EXPECTED_ITEMS&&beforeWarnings===EXPECTED_WARNINGS;
 if(!countsMatch||!scopeMatch){window.MM_ASSESSMENT_DISCRIMINATION_HARDENING={version:VERSION,status:'review-required',targetedItems:targets.length,cueWarningsBefore:beforeWarnings,warningCountsBefore:beforeCounts,expectedWarningCounts:{...EXPECTED_COUNTS},targetDetails:targets.map(({r,fs})=>({id:r.id,flags:fs.slice()})),reason:'pre-rewrite cue population drifted; no automatic assessment rewrite was applied'};console.warn('[MouldMaster] assessment discrimination hardening blocked by cue-population drift',window.MM_ASSESSMENT_DISCRIMINATION_HARDENING);return}
 for(const {r,x,fs} of targets){const options=rebalance(x.options,x.key,fs),feedback=options.map((text,i)=>i===x.key?String(x.feedback?.[i]||'Correct. This is the strongest response supported by the stated evidence.'):wrongFeedback(text));r.set({options,key:x.key,feedback})}
 const afterCounts=Object.fromEntries(Object.keys(EXPECTED_COUNTS).map(k=>[k,0]));let afterWarnings=0;for(const r of records){const x=r.get();for(const f of flags(x.options,x.key))if(f in afterCounts){afterCounts[f]++;afterWarnings++}}
 const status=afterWarnings===0?'approved':'review-required';window.MM_ASSESSMENT_DISCRIMINATION_HARDENING={version:VERSION,status,targetedItems:targets.length,targetIds:targets.map(x=>x.r.id),cueWarningsBefore:beforeWarnings,cueWarningsAfter:afterWarnings,warningCountsBefore:beforeCounts,warningCountsAfter:afterCounts,answerKeysChanged:0,scope:'Rephrases only the audited cue-warning population after psychometric hardening. Correct indices and assessed propositions remain unchanged; safety-bypass distractors are never softened into acceptable actions.'};if(status!=='approved')console.warn('[MouldMaster] assessment discrimination hardening left review warnings',window.MM_ASSESSMENT_DISCRIMINATION_HARDENING)}
function start(){
 const begin=()=>{if(typeof setTimeout==='function')setTimeout(()=>run(),0);else run()};
 if(typeof document!=='undefined'&&document&&document.readyState!=='complete'&&typeof window.addEventListener==='function')window.addEventListener('load',begin,{once:true});
 else begin();
}
start();
})();

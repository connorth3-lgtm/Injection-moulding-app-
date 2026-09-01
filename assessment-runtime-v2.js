/* MouldMaster assessment runtime v2 — blueprint-preserving bank rotation 2026-09-01 */
(function(){
'use strict';
if(window.MM_ASSESSMENT_RUNTIME_V2)return;
const VERSION='2026.09.01.1';
const STORAGE_BASE='mm_assessment_membership_history_v2';
const BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting'];
const D=window.MM_DATA;
if(!D||!D.exams||!D.regionalQuestions)throw new Error('assessment-runtime-v2.js requires the canonical assessment bank');
if(typeof window.getExamQuestions!=='function')throw new Error('assessment-runtime-v2.js requires the audited assessment selector');

function activeLearner(){
  try{if(window.db?.activeUser)return String(window.db.activeUser)}catch(_){}
  try{if(window.user?.id)return String(window.user.id)}catch(_){}
  return 'anonymous';
}
function hash(raw){let h=2166136261;for(const c of String(raw||'anonymous')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function storageKey(){return `${STORAGE_BASE}::${hash(activeLearner())}`}
function emptyHistory(){return {schema:1,version:VERSION,attempts:{},items:{}}}
function readHistory(){try{const x=JSON.parse(localStorage.getItem(storageKey())||'null');if(x&&x.schema===1&&x.items&&x.attempts)return x}catch(_){}return emptyHistory()}
function writeHistory(x){try{x.version=VERSION;localStorage.setItem(storageKey(),JSON.stringify(x));return true}catch(_){return false}}
function resetHistory(){try{localStorage.removeItem(storageKey())}catch(_){}return true}

function norm(v){return String(v??'').trim().toLowerCase().replace(/\s+/g,' ')}
function competencies(text){
  const t=norm(text),out=[];
  if(/resin|polymer|material|moisture|dry|mfr|mvr|rheolog|viscos|melt temp|crystalli|regrind|recycl|degrad/.test(t))out.push('materials');
  if(/machine|screw|cushion|recovery|non-return|check ring|barrel|controller|setpoint|injection unit|clamp|transfer position|hydraulic|servo/.test(t))out.push('machine');
  if(/mould|mold|cavity|gate|runner|vent|cooling|water line|parting line|ejection|hot runner|valve gate|surface temperature|tool/.test(t))out.push('tooling');
  if(/fill|pack|hold|gate seal|velocity|pressure|cycle|process window|transfer|shot|flow|shear|residence/.test(t))out.push('process');
  if(/cpk|ppk|capability|measurement|gauge|gage|doe|experiment|random|block|validation|specification|sample|control chart|quality|dimension/.test(t))out.push('quality');
  if(/diagnos|troubleshoot|first|strongest|investigat|drift|changes|becomes|fails|defect|short shot|flash|sink|splay|burn|weld|warpage|brittle|disagree|evidence/.test(t))out.push('troubleshooting');
  return [...new Set(out)]
}
function concept(text){
  const t=norm(text),defs=[
    ['moisture-drying',/moisture|hygroscopic|dry/],['mfr-rheology',/\bmfr\b|\bmvr\b|rheolog|viscos/],['gate-seal',/gate seal|gate freeze|mass plateau/],
    ['cavity-pressure',/cavity pressure|in-cavity|machine peak pressure/],['shot-delivery',/cushion|non-return|check ring|shot delivery|recovery/],
    ['cooling-thermal',/cooling|water line|mould-surface|mold-surface|warpage/],['capability',/cpk|ppk|capability/],['measurement',/measurement|gauge|gage|fixture/],
    ['doe',/\bdoe\b|experiment|randomis|randomiz|blocking|confound/],['process-transfer',/receiving machine|process equivalence|transfer strategy/],
    ['setpoint-actual',/setpoint|saved recipe|known-good baseline/],['tooling-locality',/one cavity|local flow|branch|parting line|gate wear/]
  ];
  for(const [id,re] of defs)if(re.test(t))return id;
  return t.split(/[^a-z0-9]+/).filter(x=>x.length>4).slice(0,4).join('-')||'general'
}
function tech(level,i,q){
  const text=q?.q??q?.[0]??'',options=q?.options??q?.[1]??[],correct=Number(q?.correct??q?.[2]??0),feedback=q?.optionFeedback??q?.feedback??q?.[6]??[];
  const cs=competencies(text);return {q:text,options:[...options],correct,explanation:q?.explanation??q?.why??q?.[3]??'',reference:q?.reference??q?.source??q?.[4]??'',sourceUrl:q?.sourceUrl??q?.url??q?.[5]??null,optionFeedback:[...feedback],critical:!!(q?.critical??q?.[7]),kind:'technical',level,bankIndex:i,stableId:`tech:${level}:${i}`,mmId:`tech:${level}:${i}`,competencies:cs,competency:cs[0]||BLUEPRINT[i%BLUEPRINT.length],concept:concept(text)}
}
function regional(region,level,i,q){
  return {q:q?.q??q?.[0]??'',options:[...(q?.options??q?.[1]??[])],correct:Number(q?.correct??q?.[2]??0),explanation:q?.explanation??q?.why??q?.[3]??'',reference:q?.reference??q?.source??q?.[4]??'',sourceUrl:q?.sourceUrl??q?.url??q?.[5]??null,optionFeedback:[...(q?.optionFeedback??q?.feedback??q?.[6]??[])],critical:(q?.critical??q?.[7])!==false,kind:'regional',region,level,bankIndex:i,stableId:`reg:${region}:${level}:${i}`,mmId:`reg:${region}:${level}:${i}`,competencies:['safety'],competency:'safety',concept:`safety-${region.toLowerCase()}-${i}`}
}
function seeded(seed){let x=2166136261;for(const c of String(seed)){x^=c.charCodeAt(0);x=Math.imul(x,16777619)}return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function shuffle(a,rng){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function shuffleOptions(item,rng){const rows=item.options.map((text,i)=>({text,correct:i===item.correct,feedback:item.optionFeedback?.[i]??null}));const mixed=shuffle(rows,rng);return {...item,options:mixed.map(x=>x.text),optionFeedback:mixed.map(x=>x.feedback),correct:mixed.findIndex(x=>x.correct)}}
function exposure(history,id){return history.items[id]||{count:0,last:-1}}
function rank(pool,history,attempt,rng){
  return pool.slice().sort((a,b)=>{
    const ea=exposure(history,a.stableId),eb=exposure(history,b.stableId);
    return ea.count-eb.count||ea.last-eb.last||(rng()-.5)
  })
}
function selectTechnical(level,history,attempt,rng){
  const pool=(D.exams[level]||[]).map((q,i)=>tech(level,i,q));
  if(pool.length!==10)throw new Error(`assessment runtime v2 expects 10 technical items for ${level}; found ${pool.length}`);
  const chosen=[],used=new Set();
  const add=item=>{if(!item||used.has(item.stableId))return false;chosen.push(item);used.add(item.stableId);return true};
  for(const domain of BLUEPRINT){
    const candidates=pool.filter(x=>!used.has(x.stableId)&&x.competencies.includes(domain));
    if(candidates.length)add(rank(candidates,history,attempt,rng)[0]);
  }
  while(chosen.length<7){
    const remaining=pool.filter(x=>!used.has(x.stableId));
    if(!remaining.length)break;
    const concepts=new Set(chosen.map(x=>x.concept));
    const diverse=remaining.filter(x=>!concepts.has(x.concept));
    add(rank(diverse.length?diverse:remaining,history,attempt,rng)[0]);
  }
  if(chosen.length!==7)throw new Error(`assessment runtime v2 could select only ${chosen.length}/7 technical items for ${level}`);
  const covered=new Set();for(const q of chosen)for(const c of q.competencies)covered.add(c);
  const missing=BLUEPRINT.filter(x=>!covered.has(x));
  if(missing.length)throw new Error(`assessment runtime v2 blueprint incomplete for ${level}: ${missing.join(', ')}`);
  return chosen
}
function selectRegional(region,level,rng){
  if(region==='ALL'){
    const out=[];for(const r of ['UK','US','NZ'])for(let i=0;i<(D.regionalQuestions[r]?.[level]||[]).length;i++)out.push(regional(r,level,i,D.regionalQuestions[r][level][i]));return out
  }
  const rows=(D.regionalQuestions[region]?.[level]||[]).map((q,i)=>regional(region,level,i,q));
  return shuffle(rows,rng).slice(0,3)
}
function nextExam(level,region){
  const history=readHistory(),attempt=(Number(history.attempts[level]||0)+1),rng=seeded(`${hash(activeLearner())}:${level}:${region}:${attempt}`);
  const technical=selectTechnical(level,history,attempt,rng),regs=selectRegional(region,level,rng),selected=[...technical,...regs];
  history.attempts[level]=attempt;
  for(const q of technical){const e=exposure(history,q.stableId);history.items[q.stableId]={count:e.count+1,last:attempt}}
  writeHistory(history);
  return shuffle(selected,rng).map(q=>shuffleOptions(q,rng))
}

const legacySelector=window.getExamQuestions;
window.getExamQuestions=function(level,region){
  if(!['Beginner','Intermediate','Advanced'].includes(level))return legacySelector.apply(this,arguments);
  if(!['UK','US','NZ','ALL'].includes(region))return legacySelector.apply(this,arguments);
  return nextExam(level,region)
};

function coverageSimulation(level,attempts=3){
  const history=emptyHistory(),seen=new Set();
  for(let n=1;n<=attempts;n++){
    const rng=seeded(`qa:${level}:${n}`),rows=selectTechnical(level,history,n,rng);
    for(const q of rows){seen.add(q.stableId);const e=exposure(history,q.stableId);history.items[q.stableId]={count:e.count+1,last:n}}
  }
  return {level,attempts,seen:[...seen],coverage:seen.size,total:(D.exams[level]||[]).length}
}
window.MM_ASSESSMENT_RUNTIME_V2=Object.freeze({version:VERSION,blueprint:[...BLUEPRINT],technicalPerExam:7,technicalBankPerLevel:10,membershipHistory:'learner-scoped persistent exposure counts',selectionPolicy:'least-exposed blueprint-preserving stable IDs; all six domains required every attempt',storageKey,resetHistory,history:()=>JSON.parse(JSON.stringify(readHistory())),coverageSimulation});
})();

/* MouldMaster assessment quality suite — 2026-08-24.2 */
(function(){
'use strict';
const D=window.MM_DATA;
if(!D||!D.exams||!D.regionalQuestions||!D.scenarios)throw new Error('MouldMaster assessment data must load before quality suite');

const VERSION='2026.08.24.2';
const ANALYTICS_KEY='mm_assessment_analytics_v1';
const REVIEW_KEY='mm_spaced_review_v2';
const SOURCE_REVIEWED='2026-08-24';
const SOURCE_REVIEW_BY='2026-11-24';
const LEVELS=['Beginner','Intermediate','Advanced'];
const REGIONS=['UK','US','NZ'];
const BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting'];
const LABELS={materials:'Materials & rheology',machine:'Machine & controls',tooling:'Tooling & thermal',process:'Process development',quality:'Quality & statistics',troubleshooting:'Troubleshooting',safety:'Safety & compliance'};
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
const shuffle=a=>{const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
function read(k,d){try{const x=JSON.parse(localStorage.getItem(k)||'');return obj(x)?x:d}catch(_){return d}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}}

function competencySet(text){
 const t=norm(text),out=[];
 if(/resin|polymer|material|moisture|dry|mfr|mvr|rheolog|viscos|melt temp|temperature check|crystalli|regrind|recycl/.test(t))out.push('materials');
 if(/machine|screw|cushion|recovery|non-return|check ring|barrel|controller|setpoint|injection unit|clamp|transfer position|hydraulic|servo/.test(t))out.push('machine');
 if(/mould|mold|cavity|gate|runner|vent|cooling|water line|parting line|ejection|hot runner|valve gate|surface temperature|tool/.test(t))out.push('tooling');
 if(/fill|pack|hold|gate seal|velocity|pressure|cycle|process window|transfer|shot|flow|shear|residence/.test(t))out.push('process');
 if(/cpk|ppk|capability|measurement|gauge|gage|doe|experiment|random|block|validation|specification|sample|control chart|quality|dimension/.test(t))out.push('quality');
 if(/diagnos|troubleshoot|first|strongest|investigat|drift|changes|becomes|fails|defect|short shot|flash|sink|splay|burn|weld|warpage|brittle|disagree/.test(t))out.push('troubleshooting');
 return [...new Set(out)];
}
function primaryCompetency(text,index){const a=competencySet(text);if(a.length)return a[0];return BLUEPRINT[index%BLUEPRINT.length]}
function concept(text){
 const t=norm(text);
 const defs=[['moisture-drying',/moisture|hygroscopic|dry/],['mfr-rheology',/\bmfr\b|\bmvr\b|rheolog|viscos/],['gate-seal',/gate seal|gate freeze|mass plateau/],['cavity-pressure',/cavity pressure|in-cavity|machine peak pressure/],['shot-delivery',/cushion|non-return|check ring|shot delivery|recovery/],['cooling-thermal',/cooling|water line|mould-surface|mold-surface|warpage/],['capability',/cpk|ppk|capability/],['measurement',/measurement|gauge|gage|fixture/],['doe',/\bdoe\b|experiment|randomis|randomiz|blocking|confound/],['process-transfer',/receiving machine|process equivalence|transfer strategy/],['setpoint-actual',/setpoint|saved recipe|known-good baseline/],['tooling-locality',/one cavity|local flow|branch|parting line|gate wear/],['safety-isolation',/lockout|isolation|interlock|guard|hazardous energy/]];
 for(const [id,re] of defs)if(re.test(t))return id;
 return t.split(/[^a-z0-9]+/).filter(x=>x.length>4).slice(0,4).join('-')||'general';
}
function difficulty(level,index){
 if(level==='Beginner')return index<4?'Foundation':'Applied';
 if(level==='Intermediate')return index<3?'Applied':index<8?'Diagnostic':'Applied';
 return index<3?'Diagnostic':'Expert';
}
function techId(level,index){return `tech:${level}:${index}`}
function regId(region,level,index){return `reg:${region}:${level}:${index}`}
function scenarioId(index){return `scenario:${String(index+1).padStart(2,'0')}`}

const META_BY_TEXT=new Map();
function rebuildMeta(){
 META_BY_TEXT.clear();
 LEVELS.forEach(level=>(D.exams[level]||[]).forEach((q,i)=>META_BY_TEXT.set(norm(q[0]),{stableId:techId(level,i),revision:VERSION,difficulty:difficulty(level,i),competency:primaryCompetency(q[0],i),competencies:competencySet(q[0]),concept:concept(q[0]),level,kind:'technical',bankIndex:i})));
 REGIONS.forEach(region=>LEVELS.forEach(level=>(D.regionalQuestions[region]?.[level]||[]).forEach((q,i)=>META_BY_TEXT.set(norm(q[0]),{stableId:regId(region,level,i),revision:VERSION,difficulty:level==='Advanced'?'Expert safety':'Applied safety',competency:'safety',competencies:['safety'],concept:'safety-'+region.toLowerCase()+'-'+concept(q[0]),level,region,kind:'regional',bankIndex:i}))));
}
function normaliseTech(q,i,level){const m=META_BY_TEXT.get(norm(q[0]))||{stableId:techId(level,i),revision:VERSION,difficulty:difficulty(level,i),competency:primaryCompetency(q[0],i),competencies:competencySet(q[0]),concept:concept(q[0]),level,kind:'technical',bankIndex:i};return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:!!q[7],kind:'technical',...m}}
function normaliseReg(q,i,region,level){const m=META_BY_TEXT.get(norm(q[0]))||{stableId:regId(region,level,i),revision:VERSION,difficulty:level==='Advanced'?'Expert safety':'Applied safety',competency:'safety',competencies:['safety'],concept:'safety-'+region.toLowerCase()+'-'+concept(q[0]),level,region,kind:'regional',bankIndex:i};return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:q[7]!==false,kind:'regional',region,...m}}
function shuffleOptions(item){const mapped=item.options.map((text,oldIndex)=>({text,correct:oldIndex===item.correct,feedback:item.optionFeedback?.[oldIndex]||null}));const mixed=shuffle(mapped);return {...item,options:mixed.map(x=>x.text),optionFeedback:mixed.map(x=>x.feedback),correct:mixed.findIndex(x=>x.correct)}}

function selectBlueprint(level){
 const pool=(D.exams[level]||[]).map((q,i)=>normaliseTech(q,i,level));
 const unused=new Set(pool.map((_,i)=>i)),selected=[];
 for(const want of BLUEPRINT){
  let idx=[...unused].find(i=>pool[i].competencies.includes(want));
  if(idx==null)idx=[...unused].find(i=>pool[i].competency===want);
  if(idx==null)continue;
  selected.push(pool[idx]);unused.delete(idx);
 }
 while(selected.length<7&&unused.size){
  const usedConcepts=new Set(selected.map(x=>x.concept));
  let idx=[...unused].find(i=>!usedConcepts.has(pool[i].concept));if(idx==null)idx=[...unused][0];selected.push(pool[idx]);unused.delete(idx);
 }
 return shuffle(selected.slice(0,7));
}
function blueprintCoverage(items){const c=new Set();items.forEach(x=>(x.competencies||[x.competency]).forEach(k=>c.add(k)));return [...c]}

/* Replace random technical sampling with a competency-balanced blueprint while preserving the regional safety rules. */
window.getExamQuestions=function(level,region){
 rebuildMeta();
 const technical=selectBlueprint(level);let regs=[];
 if(region==='ALL')REGIONS.forEach(r=>regs.push(...(D.regionalQuestions[r]?.[level]||[]).map((q,i)=>normaliseReg(q,i,r,level))));
 else regs=shuffle((D.regionalQuestions[region]?.[level]||[]).map((q,i)=>normaliseReg(q,i,region,level))).slice(0,3);
 return shuffle(technical.concat(regs)).map(shuffleOptions);
};

function mergeReview(a,b){return {id:b.id||a.id,stage:Math.max(+a.stage||0,+b.stage||0),due:Math.min(+a.due||Date.now(),+b.due||Date.now()),wrong:(+a.wrong||0)+(+b.wrong||0),right:(+a.right||0)+(+b.right||0),last:Math.max(+a.last||0,+b.last||0),confidence:b.confidence||a.confidence||'medium'}}
function migrateStableReviewIds(){
 const st=read(REVIEW_KEY,{items:{}});if(!obj(st.items))return 0;let moved=0;
 for(const [id,x] of Object.entries({...st.items})){
  let m=/^tech:[^:]+:([^:]+):(\d+)$/.exec(id),stable=null;
  if(m)stable=techId(m[1],+m[2]);
  if(!stable){m=/^reg:[^:]+:([^:]+):([^:]+):(\d+)$/.exec(id);if(m)stable=regId(m[1],m[2],+m[3])}
  if(stable&&stable!==id){const v={...x,id:stable};st.items[stable]=st.items[stable]?mergeReview(st.items[stable],v):v;delete st.items[id];moved++}
 }
 if(moved)write(REVIEW_KEY,st);return moved;
}

const MORE_SCENARIOS=[
 ['Hot-runner heater duty rises','One hot-runner zone holds its displayed temperature, but heater output gradually rises and its cavity group begins to change mass.',['Increase hold pressure for all cavities','Compare that zone’s heater duty, thermocouple/heater condition and branch-specific cavity evidence with the warm baseline','Lower every manifold setpoint','Ignore heater output because displayed temperature is correct'],1,'A rising duty requirement can reveal changing heat loss, heater/sensor condition or leakage before displayed temperature moves.','tooling','Diagnostic','Hot-runner thermal-control evidence','https://doi.org/10.3390/polym16081057'],
 ['Cooling flow drops on one circuit','A mould cooling circuit shows lower flow and higher pressure drop while ejection temperature and warpage drift locally.',['Reduce total cycle time','Inspect the affected cooling circuit for restriction, fouling or connection problems before compensating globally','Increase packing pressure','Change injection speed'],1,'The hydraulic and thermal evidence points directly to the affected cooling circuit.','tooling','Diagnostic','Cooling-system condition and thermal balance','https://doi.org/10.1007/s00170-019-04697-9'],
 ['Check-ring sealing trend changes','Part mass and cushion become less repeatable while recovery is normal and material feed appears stable.',['Check non-return/check-ring sealing and shot-delivery repeatability','Increase mould temperature','Change robot take-out timing','Increase cooling time'],0,'Variation that links cushion and delivered mass with otherwise normal recovery supports a shot-sealing investigation.','machine','Diagnostic','Shot-delivery consistency','https://doi.org/10.3390/s22134792'],
 ['Black specks after a long shutdown','Black specks appear during restart after material remained hot in the barrel longer than the normal validated residence condition.',['Increase barrel temperature to flush faster','Follow the approved purge/startup procedure and investigate degraded hold-up or contamination sources','Increase packing pressure','Reduce clamp force'],1,'The timing supports degraded or stagnant material as a hypothesis; use the approved purge/startup method rather than adding heat.','materials','Applied','Thermal history and degradation investigation',null],
 ['End-of-fill burn repeats','A burn mark repeatedly appears at the same end-of-fill location while fill time remains stable.',['Investigate gas escape/vent condition and the local fill pattern','Increase hold time','Increase clamp force','Change cooling time'],0,'A repeatable end-of-fill burn strongly supports trapped/compressed gas or local venting evidence.','troubleshooting','Applied','Burn-mark and venting mechanism','https://doi.org/10.3390/POLYM13234087'],
 ['Weld line passes appearance but fails load','A reinforced part looks acceptable, but mechanical failures repeatedly start at a weld-line region.',['Approve it because the line is cosmetic','Investigate flow-front meeting conditions, fibre orientation, venting and load direction and validate mechanically','Increase clamp force','Polish the opposite mould half'],1,'Structural weld-line performance depends on local joining and reinforcement orientation, not appearance alone.','quality','Expert','Composite weld-line performance','https://doi.org/10.1007/S40684-020-00226-2'],
 ['One cavity flashes after tool service','After mould service, flash appears on one cavity while the other cavities and machine clamp behaviour remain stable.',['Increase clamp force for the mould','Inspect local parting-line seating, insert/shutoff condition and that cavity’s evidence first','Reduce shot size globally','Lower all mould temperatures'],1,'A one-cavity change immediately after tool work points first to a local tooling condition.','tooling','Applied','Local tooling fault isolation',null],
 ['Valve-gate cavity timing separates','Sequential valve-gate cavities begin showing different fill signatures although the machine recipe is unchanged.',['Change the main injection speed first','Verify valve-gate timing/actuation and cavity-specific pressure or fill evidence','Increase total hold time','Average all cavity traces and ignore identity'],1,'Sequential gating creates cavity-specific timing; preserve cavity identity and check the actuator/timing path.','tooling','Diagnostic','Sequential gate balance',null],
 ['Pressure area changes but peak is stable','Peak cavity pressure is similar to baseline, but pressure-time area and part dimension move together.',['Treat the cycle as unchanged because the peak is stable','Investigate the full pressure history, transfer/packing timing and sensor health','Increase clamp force','Ignore the dimension because pressure peak passed'],1,'A single peak value can miss meaningful changes in duration and pressure history.','process','Diagnostic','Pressure-curve feature monitoring','https://doi.org/10.1007/s00170-023-11100-1'],
 ['Vision rejects a new colour','Automated visual rejects rise immediately after an approved colour/gloss change while independent dimensional and visual audit samples remain acceptable.',['Change moulding pressure until the camera passes parts','Check lighting, exposure, training-domain coverage and the vision measurement system before changing the moulding process','Disable all rejects permanently','Increase cooling time'],1,'The inspection input distribution changed; verify the measurement/vision system before moving a stable process.','quality','Diagnostic','Vision domain shift and inspection validation','https://doi.org/10.1088/1361-6501/ad1c4c'],
 ['Cavity sensor becomes noisy after service','A cavity-pressure trace becomes noisy immediately after cable routing and connector service.',['Retrain every quality model first','Check sensor zero/calibration, connector condition, shielding/routing and signal acquisition before rebaselining','Increase injection pressure','Ignore the signal if part mass is stable'],1,'A change immediately after instrumentation work makes the measurement chain a primary hypothesis.','machine','Applied','Sensor measurement integrity','https://doi.org/10.1109/tim.2024.3522402'],
 ['Robot delay increases cycle only','Overall cycle time increases, but moulding phase times and part quality remain unchanged while robot-clear time is longer.',['Change cooling time','Investigate robot/EOAT sequence and safe-state handshake rather than the polymer process','Increase injection speed','Change hold pressure'],1,'The changed phase is automation time, so diagnose the automation sequence while preserving validated process phases.','machine','Applied','Automation cycle-state diagnosis',null],
 ['Energy per part rises with stable cycle','Cycle time and quality remain stable but energy per accepted part rises.',['Change injection speed immediately','Separate machine and auxiliary energy by phase and check base loads/heater/pump/TCU duty and the measurement boundary','Increase shot size','Reduce all heater setpoints'],1,'Locate the energy increase before changing a stable moulding process.','quality','Diagnostic','Energy KPI normalisation',null],
 ['Overmould bond weak far from gate','A hard/soft overmould joint has good bond near the gate but lower peel strength at the far end.',['Assume the material pair is incompatible everywhere','Map interface temperature/flow/pressure history and surface condition along the interface before changing the whole material system','Increase clamp force','Shorten cooling only'],1,'Position-dependent bond strength supports a local interface thermal/flow history investigation.','materials','Expert','Overmould interface qualification','https://doi.org/10.1002/APP.50294'],
 ['Insert temperature varies','Overmould bond results vary with the delay between insert heating and mould close.',['Record actual insert/interface thermal state and control the transfer delay','Increase injection speed without measuring insert temperature','Change part specification','Ignore the delay because heater setpoint is fixed'],0,'Heater setpoint does not prove the insert reaches the same interface temperature at injection.','materials','Diagnostic','Insert thermal-state control',null],
 ['Microfeature underfills while bulk part fills','Overall part mass and cavity fill are acceptable but microgrooves are incompletely replicated.',['Increase hold pressure globally first','Investigate local surface temperature, microventing/trapped gas, feature-scale rheology and metrology','Increase clamp force','Treat total part mass as proof the microfeatures are full'],1,'Microfeatures can be limited by local freeze-off, gas escape and scale-dependent flow even when the bulk part is full.','tooling','Expert','Microfeature replication','https://doi.org/10.3390/POLYM13193236'],
 ['Foamed part meets weight but loses stiffness','A microcellular part reaches its mass-reduction target but fails a stiffness requirement.',['Accept it because weight target is the process objective','Characterise cell morphology, skin thickness/local density and the relevant mechanical mode before further lightweighting','Increase gas dose automatically','Reduce clamp force'],1,'Foam acceptance needs structure/property evidence, not mass reduction alone.','materials','Expert','Microcellular structure-property response','https://doi.org/10.1002/pen.26700'],
 ['Foamed surface develops swirl','A foamed moulding has acceptable internal density but develops swirl/roughness on a cosmetic surface.',['Treat it as moisture splay automatically','Investigate skin formation, surface thermal history and the approved foaming/counter-pressure method','Increase hold pressure until the swirl disappears','Change the dimensional specification'],1,'Foam-related surface morphology can differ from moisture splay and should be diagnosed from the foaming/skin mechanism.','troubleshooting','Diagnostic','Foam surface formation','https://doi.org/10.3390/polym14061078'],
 ['Recycled PP has same MFR but fills differently','A new recycled-PP lot has a similar MFR result but needs a different pressure response to reach the same fill.',['Reject the MFR test as invalid','Compare full process pressure/flow evidence and consider rheology, composition and thermal history beyond the single MFR value','Copy the previous lot’s settings because MFR matches','Increase mould temperature until pressure matches'],1,'Similar MFR does not guarantee identical shear-dependent moulding rheology or composition.','materials','Diagnostic','MFR versus mouldability','https://doi.org/10.1007/s13367-023-00081-y'],
 ['Gate erosion changes balance','A fibre-filled multicavity mould slowly develops a branch imbalance and gate dimensions show measurable wear.',['Correct the imbalance permanently with cavity-independent machine settings','Restore/repair the worn flow geometry to the approved tooling condition and then reconfirm process balance','Increase cooling time','Ignore wear if average part mass passes'],1,'Abrasive wear can change local pressure drop; repair the physical cause before locking in compensation.','tooling','Diagnostic','Tool wear and maintenance','https://doi.org/10.1515/ipp-2022-0014'],
 ['Hot-runner leak suspected','Degraded material appears near a manifold/nozzle interface and a zone’s heater demand changes unexpectedly.',['Continue production until displayed temperature moves','Use the approved safe shutdown/isolation and inspect the hot-runner sealing/heating condition','Increase injection pressure','Open the hot runner while hot and pressurised'],1,'The evidence can indicate leakage or local thermal trouble and requires the supplier/site safe service procedure.','tooling','Applied','Hot-runner service evidence',null],
 ['Warm-up state changes first-off parts','Dimensions drift for early cycles after a long cold start and stabilise after the mould and hot runner reach equilibrium.',['Save a separate permanent packing correction for the first cycles','Characterise and control the approved warm-up/equilibration state rather than treating transient startup as steady production','Increase clamp force during startup','Ignore first-off parts without a defined startup plan'],1,'Thermal equilibrium is a process state; startup acceptance should be defined and controlled separately from steady production.','process','Applied','Commissioning/warm-up baseline',null],
 ['Mass prediction stays good but dimension model worsens','A quality model still predicts part mass accurately but its dimension prediction error increases after a material-lot change.',['Assume all model outputs remain valid because one target is accurate','Review target-specific model drift, material-domain coverage and independent dimensional ground truth','Change the dimension specification','Retrain using the failed predictions as ground truth'],1,'Different quality targets can depend on different signal features; one accurate output does not validate another.','quality','Expert','Model drift and external validation',null],
 ['Cooling change improves cycle but worsens warp','A cooling redesign reduces cycle time but increases a critical warpage mode.',['Keep the faster cycle because cooling improved','Re-validate thermal uniformity, ejection state, crystallisation/shrinkage response and the product quality window','Increase injection speed to counter warpage','Average the old and new cooling times'],1,'Cooling efficiency and thermal balance are not identical objectives; the redesigned condition must meet the actual part-quality boundary.','tooling','Expert','Cooling design validation','https://doi.org/10.4028/p-q2k0v8']
];
function scenarioFeedback(options,correct,why){return options.map((_,i)=>i===correct?'Correct. '+why:'Not the strongest first move. This option does not test the mechanism most directly supported by the stated evidence.')}
function addScenarios(){
 const have=new Set(D.scenarios.map(s=>norm(s.title)));
 for(const a of MORE_SCENARIOS){if(have.has(norm(a[0])))continue;D.scenarios.push({title:a[0],situation:a[1],choices:a[2],correct:a[3],why:a[4],feedback:scenarioFeedback(a[2],a[3],a[4]),category:a[5],difficulty:a[6],reference:a[7],sourceUrl:a[8]||null})}
 D.scenarios.forEach((s,i)=>{s.mmStableId=s.mmStableId||scenarioId(i);s.difficulty=s.difficulty|| (i<8?'Foundation':i<16?'Diagnostic':'Applied');s.category=s.category||primaryCompetency(s.title+' '+s.situation,i);s.revision=VERSION});
}

function analytics(){const a=read(ANALYTICS_KEY,{schema:1,version:VERSION,questions:{},scenarios:{},exams:{},started:0,graded:0});a.schema=1;a.version=VERSION;a.questions=obj(a.questions)?a.questions:{};a.scenarios=obj(a.scenarios)?a.scenarios:{};a.exams=obj(a.exams)?a.exams:{};return a}
function saveAnalytics(a){write(ANALYTICS_KEY,a)}
function updateQuestionAnalytics(q,selected,ok,ms){const a=analytics(),id=q.stableId||q.mmStableId||q.mmId||norm(q.q);const x=a.questions[id]||{stableId:id,attempts:0,correct:0,wrong:0,unanswered:0,totalResponseMs:0,optionSelections:{},difficulty:q.difficulty||'',competency:q.competency||'',concept:q.concept||'',stem:q.q||''};x.attempts++;if(selected==null)x.unanswered++;else{x.optionSelections[q.options[selected]]=(x.optionSelections[q.options[selected]]||0)+1;ok?x.correct++:x.wrong++}if(Number.isFinite(ms)&&ms>=0){x.totalResponseMs+=Math.min(ms,3600000);x.lastResponseMs=Math.min(ms,3600000)}x.last=Date.now();a.questions[id]=x;saveAnalytics(a)}
function updateExamAnalytics(level,region,pct,passed){const a=analytics(),key=level+'-'+region,x=a.exams[key]||{attempts:0,passes:0,best:0,totalScore:0};x.attempts++;x.passes+=passed?1:0;x.best=Math.max(x.best,pct);x.totalScore+=pct;x.last=Date.now();a.exams[key]=x;a.graded=(a.graded||0)+1;saveAnalytics(a)}
function updateScenarioAnalytics(s,selected,ok){const a=analytics(),id=s.mmStableId||norm(s.title),x=a.scenarios[id]||{stableId:id,title:s.title,attempts:0,correct:0,wrong:0,selections:{},category:s.category||'',difficulty:s.difficulty||''};x.attempts++;ok?x.correct++:x.wrong++;x.selections[s.choices[selected]]=(x.selections[s.choices[selected]]||0)+1;x.last=Date.now();a.scenarios[id]=x;saveAnalytics(a)}
function analyticsSummary(){const a=analytics(),qs=Object.values(a.questions),attempts=qs.reduce((n,x)=>n+x.attempts,0),correct=qs.reduce((n,x)=>n+x.correct,0),hard=qs.filter(x=>x.attempts>=1).sort((x,y)=>(x.correct/x.attempts)-(y.correct/y.attempts)||y.attempts-x.attempts).slice(0,3),slow=qs.filter(x=>x.totalResponseMs>0).sort((x,y)=>(y.totalResponseMs/y.attempts)-(x.totalResponseMs/x.attempts)).slice(0,3);return {attempts,accuracy:attempts?Math.round(correct/attempts*100):null,hard,slow,examAttempts:Object.values(a.exams).reduce((n,x)=>n+x.attempts,0)}}

let examSession=null;
function applyQuestionBadges(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;
 const cards=[...document.querySelectorAll('#examQuestions .question')];
 cards.forEach((card,i)=>{const q=activeExam.questions[i],b=card.querySelector('b');if(!q||!b||card.querySelector('.mm-qmeta'))return;const meta=document.createElement('div');meta.className='mm-qmeta';meta.innerHTML=`<span>${esc(q.difficulty||'Applied')}</span><span>${esc(LABELS[q.competency]||q.competency||'General')}</span><span>${esc(q.stableId||q.mmStableId||'')}</span>`;b.insertAdjacentElement('afterend',meta)});
}
function startTiming(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;
 const now=performance.now();examSession={started:now,firstResponse:{},graded:false};const a=analytics();a.started=(a.started||0)+1;saveAnalytics(a);
 document.querySelectorAll('#examQuestions input[type=radio]').forEach(input=>input.addEventListener('change',()=>{const m=/ex(\d+)/.exec(input.name);if(!m||!examSession)return;const i=+m[1];if(examSession.firstResponse[i]==null)examSession.firstResponse[i]=performance.now()-now},{passive:true}));
}
function sourceFreshness(q){if(!q?.sourceUrl)return 'No external URL on this item; use the cited engineering rationale and current controlled documents.';const today=new Date().toISOString().slice(0,10);return today>SOURCE_REVIEW_BY?`Source review due — last curated ${SOURCE_REVIEWED}. Recheck edition/status before formal use.`:`Source status/freshness reviewed ${SOURCE_REVIEWED}; next scheduled review by ${SOURCE_REVIEW_BY}.`}
function enhanceReview(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;const rows=[...document.querySelectorAll('#answerReview .answer-row')];rows.forEach((row,i)=>{if(row.querySelector('.mm-evidence')||!activeExam.questions[i])return;const q=activeExam.questions[i],url=q.sourceUrl?`<a class="standard-link" href="${esc(q.sourceUrl)}" target="_blank" rel="noopener">Open exact source ↗</a>`:'No external URL is assigned to this engineering-principle item.';row.insertAdjacentHTML('beforeend',`<details class="mm-evidence"><summary>Evidence, difficulty & revision</summary><div><b>${esc(LABELS[q.competency]||q.competency||'General')}</b> · ${esc(q.difficulty||'Applied')} · <code>${esc(q.stableId||q.mmStableId||q.mmId||'')}</code></div><p>${esc(q.reference||'Engineering principle')}</p><p>${url}</p><small>${esc(sourceFreshness(q))} · Question revision ${esc(q.revision||VERSION)}</small></details>`)});
}
function addStyles(){if(document.getElementById('mm-assessment-quality-style'))return;const s=document.createElement('style');s.id='mm-assessment-quality-style';s.textContent=`.mm-qmeta{display:flex;gap:5px;flex-wrap:wrap;margin:6px 0 8px}.mm-qmeta span{font-size:9.5px;border:1px solid #36506e;border-radius:999px;padding:3px 6px;color:#a9bdd6;background:#0b192a}.mm-evidence{margin-top:9px;padding-top:8px;border-top:1px solid #2a425e}.mm-evidence summary{cursor:pointer;color:#72e6cd;font-size:12px;font-weight:700}.mm-evidence p{margin:6px 0;font-size:11.5px}.mm-evidence code{font-size:10px;color:#a9bdd6}.mm-analytics{padding:16px;margin-top:14px}.mm-analytics-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.mm-analytics-grid>div{padding:10px;border:1px solid #2b405b;border-radius:9px;background:#0d1c30}.mm-analytics-grid b{display:block;font-size:20px}.mm-analytics ul{margin:8px 0 0;padding-left:18px;color:#b8c9dc;font-size:12px}@media(max-width:680px){.mm-analytics-grid{grid-template-columns:1fr}.mm-qmeta span{font-size:9px}}`;document.head.appendChild(s)}

const baseStart=typeof window.startExam==='function'?window.startExam:(typeof startExam==='function'?startExam:null);
if(baseStart)window.startExam=function(){const r=baseStart.apply(this,arguments);setTimeout(()=>{applyQuestionBadges();startTiming()},0);return r};
const baseGrade=typeof window.gradeExam==='function'?window.gradeExam:(typeof gradeExam==='function'?gradeExam:null);
if(baseGrade)window.gradeExam=function(level){
 if(typeof activeExam!=='undefined'&&activeExam?.level===level&&examSession&&!examSession.graded){let correct=0,criticalWrong=0;activeExam.questions.forEach((q,i)=>{const el=document.querySelector(`input[name=ex${i}]:checked`),selected=el?+el.value:null,ok=selected===q.correct;if(ok)correct++;if(q.critical&&!ok)criticalWrong++;updateQuestionAnalytics(q,selected,ok,examSession.firstResponse[i]??(performance.now()-examSession.started))});const pct=Math.round(correct/activeExam.questions.length*100),passed=pct>=80&&criticalWrong===0;updateExamAnalytics(level,activeExam.region,pct,passed);examSession.graded=true}
 const r=baseGrade.apply(this,arguments);setTimeout(enhanceReview,0);return r;
};
const baseAnswer=typeof window.answerScenario==='function'?window.answerScenario:(typeof answerScenario==='function'?answerScenario:null);
if(baseAnswer)window.answerScenario=function(i,ci,el){const s=D.scenarios[i],ok=!!s&&ci===s.correct;if(s)updateScenarioAnalytics(s,ci,ok);const r=baseAnswer.apply(this,arguments);if(s){const f=document.getElementById('sf'+i);if(f){const fb=s.feedback?.[ci]||s.why,src=s.sourceUrl?`<div class="ref"><a class="standard-link" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.reference||'Evidence source')} ↗</a></div>`:`<div class="ref">Reference: ${esc(s.reference||'Evidence-based injection-moulding principle')}</div>`;f.innerHTML=`<b>${ok?'Strong choice ✓':'Not the strongest first move'}</b><br>${esc(fb)}${src}<div class="tiny muted">${esc(s.difficulty||'Applied')} · ${esc(LABELS[s.category]||s.category||'General')} · ${esc(s.mmStableId||'')}</div>`}}return r};
const baseRenderExams=typeof window.renderExams==='function'?window.renderExams:(typeof renderExams==='function'?renderExams:null);
if(baseRenderExams)window.renderExams=function(){const r=baseRenderExams.apply(this,arguments);const host=document.getElementById('exams');if(host&&!host.querySelector('.mm-analytics')){const s=analyticsSummary(),hard=s.hard.map(x=>`<li>${esc(x.stem||x.stableId)} — ${Math.round(x.correct/x.attempts*100)}% correct</li>`).join('')||'<li>No graded question data yet.</li>',slow=s.slow.map(x=>`<li>${esc(x.stem||x.stableId)} — ${Math.round(x.totalResponseMs/x.attempts/1000)}s average</li>`).join('')||'<li>No response-time data yet.</li>';host.insertAdjacentHTML('beforeend',`<section class="card mm-analytics"><span class="eyebrow">Device-local learning analytics</span><h3>Question performance</h3><p class="muted">Stored only in this browser/device. It is not uploaded by MouldMaster.</p><div class="mm-analytics-grid"><div><span class="muted tiny">Question attempts</span><b>${s.attempts}</b></div><div><span class="muted tiny">Answer accuracy</span><b>${s.accuracy==null?'—':s.accuracy+'%'}</b></div><div><span class="muted tiny">Exam attempts</span><b>${s.examAttempts}</b></div></div><div class="grid2" style="margin-top:10px"><div><b>Hardest so far</b><ul>${hard}</ul></div><div><b>Slowest so far</b><ul>${slow}</ul></div></div><button class="ghost" type="button" style="margin-top:10px" onclick="MM_ASSESSMENT_ANALYTICS.reset()">Reset local analytics</button></section>`)}return r};

function nearDuplicates(){const rows=[];for(const level of LEVELS)for(const q of D.exams[level]||[])rows.push({id:META_BY_TEXT.get(norm(q[0]))?.stableId||'',text:q[0],level});const pairs=[];const tok=s=>new Set(norm(s).split(/[^a-z0-9]+/).filter(x=>x.length>3&&!['which','what','strongest','first','most','when','does','with','from','that','this'].includes(x)));for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){if(rows[i].level!==rows[j].level)continue;const a=tok(rows[i].text),b=tok(rows[j].text),inter=[...a].filter(x=>b.has(x)).length,uni=new Set([...a,...b]).size,score=uni?inter/uni:0;if(score>=.72)pairs.push({...rows[i],other:rows[j].id,score:+score.toFixed(2)})}return pairs}
function leakRisks(){const out=[];for(const level of LEVELS)(D.exams[level]||[]).forEach((q,i)=>{const lens=q[1].map(x=>String(x).length),c=lens[q[2]],others=lens.filter((_,j)=>j!==q[2]),med=others.sort((a,b)=>a-b)[1];if(c>med*1.85&&c-med>28)out.push({id:techId(level,i),type:'correct-option-length',correctLength:c,peerMedian:med})});return out}

addScenarios();rebuildMeta();const migrated=migrateStableReviewIds();addStyles();
D.assessmentQA=D.assessmentQA||{};
D.assessmentQA.qualitySuite={version:VERSION,reviewed:'24 August 2026',questionBankRevision:VERSION,stableQuestionIds:true,analytics:'device-local only',examBlueprint:['Materials & rheology','Machine & controls','Tooling & thermal','Process development','Quality & statistics','Troubleshooting','Safety & compliance'],technicalExamItems:30,regionalExamItems:27,totalExamItems:57,scenarioDrills:D.scenarios.length,sourceFreshnessReviewed:SOURCE_REVIEWED,sourceFreshnessReviewBy:SOURCE_REVIEW_BY,migratedLegacyReviewRecords:migrated};
if(D.assessmentQA.deepAudit)D.assessmentQA.deepAudit.scenarioDrills=D.scenarios.length;
D.assessmentQA.questionRevisionHistory=[
 {version:'2026.08.21.1',date:'21 August 2026',change:'Prior stable assessment bank identifier used by spaced review.'},
 {version:'2026.08.24',date:'24 August 2026',change:'100-pass structural/safety audit and deep question review.'},
 {version:VERSION,date:'24 August 2026',change:'Stable IDs, competency blueprint, local analytics, per-question evidence, difficulty calibration, scenario expansion, duplicate/leak checks and freshness monitoring.'}
];
window.MM_ASSESSMENT_ANALYTICS={version:VERSION,summary:analyticsSummary,export:()=>analytics(),reset:()=>{localStorage.removeItem(ANALYTICS_KEY);try{window.renderExams?.()}catch(_){}}};
window.MM_ASSESSMENT_QUALITY={version:VERSION,blueprint:BLUEPRINT.slice(),labels:{...LABELS},scenarioCount:D.scenarios.length,questionCount:57,nearDuplicates:nearDuplicates(),answerLeakRisks:leakRisks(),coverage:(level)=>blueprintCoverage(selectBlueprint(level)),sourceReview:{reviewed:SOURCE_REVIEWED,reviewBy:SOURCE_REVIEW_BY}};
})();

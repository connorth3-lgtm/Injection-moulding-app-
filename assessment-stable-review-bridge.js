/* MouldMaster stable spaced-review ID + blueprint guard — 2026-08-30 strict answer balance */
(function(){
'use strict';
const S=window.MM_ASSESSMENT_QUALITY,D=window.MM_DATA;
if(!S||!D||typeof window.getExamQuestions!=='function')throw new Error('Assessment quality suite must load before stable review bridge');

/* Keep the assessed mechanism and correct index unchanged. These concise keyed choices
   move explanation back into the existing rationale/feedback instead of telegraphing the
   answer by making it the longest option. Items absent from this map already passed the
   strict longest/tied-longest audit unchanged. */
const STRICT_ANSWER_BALANCE={
 'tech:Beginner:0':'Part-mass plateau supports gate seal for this condition',
 'tech:Beginner:1':'Insufficient evidence; trend repeated shot-delivery actuals first',
 'tech:Beginner:2':'The actual fill response changed; compare it with the known-good baseline',
 'tech:Beginner:3':'Shear, screw work, residence and throughput also affect actual melt temperature',
 'tech:Beginner:4':'Verify the exact grade’s approved moisture and drying requirement',
 'tech:Beginner:5':'Compare the physical fill-to-pack transition and pressure response first',
 'tech:Beginner:6':'Inspect the serviced local shutoff before changing global clamp force',
 'tech:Beginner:7':'Check the repaired runner/gate branch with cavity-specific fill evidence',
 'tech:Beginner:8':'Verify cooling flow, routing and local mould temperatures',
 'tech:Beginner:9':'Compare current process actuals and material condition with the known-good baseline',
 'tech:Intermediate:0':'A repeatable part-mass plateau as hold time increases',
 'tech:Intermediate:1':'Trapped gas at the end-of-fill vent',
 'tech:Intermediate:3':'Inspect the local insert/shutoff before global process changes',
 'tech:Intermediate:4':'Compare cavity-specific fill evidence with the lagging runner/gate branch',
 'tech:Intermediate:6':'Specks clear through the approved purge/start-up sequence',
 'tech:Intermediate:7':'Ejection, dimensions, warpage and function',
 'tech:Intermediate:8':'Check affected-circuit flow and local mould temperatures',
 'tech:Intermediate:9':'For a focused confirmation where interactions are not central',
 'tech:Advanced:0':'The process is relatively tight but poorly centred',
 'tech:Advanced:1':'Check cavity-specific or rational-subgroup capability, not only pooled Cpk',
 'tech:Advanced:2':'The factors interact; mould-temperature effect depends on packing pressure',
 'tech:Advanced:3':'Run order may confound the factor with time drift; randomise or block',
 'tech:Advanced:4':'Treat machine/nozzle and cavity pressure as different-location signals',
 'tech:Advanced:6':'Treat the failed confirmation as evidence the model does not yet generalise',
 'tech:Advanced:7':'Match validated physical process outputs on a capable receiving machine',
 'tech:Advanced:8':'MFR does not fully describe moulding rheology or mouldability',
 'tech:Advanced:9':'Insufficient evidence until location, units and timing are verified',

 'reg:UK:Beginner:0':'Prevent access or stop dangerous movement before access',
 'reg:UK:Beginner:1':'Stop normal use until the interlock is restored',
 'reg:UK:Beginner:2':'Assess the fume hazard and apply the relevant exposure controls',
 'reg:UK:Intermediate:0':'Use GB PUWER 1998 or NI 1999 rules according to jurisdiction',
 'reg:UK:Intermediate:1':'Isolate all energy and verify safe state before access',
 'reg:UK:Intermediate:2':'Incorrect: ISO 20430 does not replace workplace law',
 'reg:UK:Advanced:0':'Assess the integrated cell and all foreseeable access/tasks as one system',
 'reg:UK:Advanced:1':'Conformity evidence does not remove the employer’s workplace duties',
 'reg:UK:Advanced:2':'Redesign the DOE without defeating safeguards',
 'reg:US:Beginner:0':'Use effective point-of-operation guarding',
 'reg:US:Beginner:1':'Keep the gate/interlock effective in production',
 'reg:US:Beginner:2':'Use HazCom labels, SDS and training',
 'reg:US:Intermediate:0':'Apply LOTO before servicing access',
 'reg:US:Intermediate:1':'Emergency stop is not energy isolation; apply LOTO',
 'reg:US:Intermediate:2':'B151.1 informs controls; OSHA duties still apply',
 'reg:US:Advanced:0':'Apply the governing federal OSHA or State Plan rules',
 'reg:US:Advanced:1':'Only when narrow criteria and alternative protection are met',
 'reg:US:Advanced:2':'Assess and safeguard the integrated robot/moulding cell as one system',
 'reg:NZ:Beginner:0':'The PCBU holds the primary reasonably-practicable health and safety duty',
 'reg:NZ:Beginner:1':'Eliminate risk first; otherwise minimise it',
 'reg:NZ:Beginner:2':'Keep it out of use until the safeguard is restored',
 'reg:NZ:Intermediate:0':'Isolate all energy and verify safe state',
 'reg:NZ:Intermediate:1':'Use AS/NZS 4024 as safety evidence while still meeting legal duties',
 'reg:NZ:Intermediate:2':'Verify safeguards before authorised return to service',
 'reg:NZ:Advanced:0':'HSWA duties remain; standards inform controls',
 'reg:NZ:Advanced:1':'Assess the integrated system, interfaces, tasks and safeguards as a whole',
 'reg:NZ:Advanced:2':'Not yet in force; commencement is 1 April 2027',

 'scenario:01':'Check shot-delivery/NRV, feed and injection actuals',
 'scenario:02':'Inspect end-of-fill venting and test fill-speed sensitivity',
 'scenario:04':'Study cooling time against ejection and part quality',
 'scenario:05':'Verify drying history and actual material moisture',
 'scenario:06':'Run a cavity-balance study and inspect the repaired runner',
 'scenario:07':'Trend cooling, material, process and measurement evidence by shift',
 'scenario:08':'Check local gate, geometry and cooling after gate seal',
 'scenario:09':'Compare current fill/pressure, material and thermal actuals with baseline',
 'scenario:10':'Inspect the affected branch/gate using cavity-specific fill evidence',
 'scenario:11':'Check feed, recovery actuals and shot-delivery repeatability',
 'scenario:12':'Verify cooling routing, flow and thermal balance against baseline',
 'scenario:13':'Review draft, texture, cooling, ejection load and tooling condition',
 'scenario:14':'Verify the new measurement fixture before interpreting Cpk',
 'scenario:15':'Treat run order as a confounder; randomise/block the study',
 'scenario:16':'Treat pressures as different-location signals; check the cavity event and sensor',
 'scenario:17':'Compare heater duty and branch-specific cavity evidence',
 'scenario:18':'Check coolant flow',
 'scenario:19':'Test check-ring sealing',
 'scenario:20':'Purge safely and check degraded hold-up',
 'scenario:21':'Check local venting',
 'scenario:22':'Validate weld-line flow and mechanics',
 'scenario:23':'Inspect the local shutoff',
 'scenario:24':'Check valve-gate timing and cavity evidence',
 'scenario:25':'Review pressure history, transfer and sensor health',
 'scenario:26':'Verify vision metrology before changing moulding',
 'scenario:27':'Check sensor zero and acquisition path',
 'scenario:28':'Check robot handshake',
 'scenario:29':'Check energy phases and boundary',
 'scenario:30':'Map interface thermal and flow history first',
 'scenario:31':'Record insert/interface thermal state and transfer delay',
 'scenario:32':'Check local thermal, venting and microflow evidence',
 'scenario:33':'Check cell structure and relevant mechanical response',
 'scenario:34':'Check skin/thermal history and foaming method',
 'scenario:35':'Compare process actuals with rheology evidence',
 'scenario:36':'Restore worn flow geometry, then reconfirm process balance',
 'scenario:37':'Isolate safely and inspect the hot-runner',
 'scenario:38':'Control the approved warm-up state before production',
 'scenario:39':'Check target-specific model drift and independent dimensional truth',
 'scenario:40':'Revalidate thermal/ejection quality window'
};

function optionsOf(q){return q?.options??q?.[1]}
function correctOf(q){return Number(q?.correct??q?.[2])}
function applyBalance(){
 let applied=0;
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
  const id=`tech:${level}:${i}`,replacement=STRICT_ANSWER_BALANCE[id];if(!replacement)continue;
  const q=D.exams[level][i],opts=optionsOf(q),key=correctOf(q);if(!Array.isArray(opts)||opts.length!==4||key<0||key>3)throw new Error(`Strict answer-balance source invalid: ${id}`);opts[key]=replacement;applied++;
 }
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){
  const id=`reg:${region}:${level}:${i}`,replacement=STRICT_ANSWER_BALANCE[id];if(!replacement)continue;
  const q=D.regionalQuestions[region][level][i],opts=optionsOf(q),key=correctOf(q);if(!Array.isArray(opts)||opts.length!==4||key<0||key>3)throw new Error(`Strict answer-balance source invalid: ${id}`);opts[key]=replacement;applied++;
 }
 (D.scenarios||[]).forEach((s,i)=>{
  const id=s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,replacement=STRICT_ANSWER_BALANCE[id];if(!replacement)return;
  const opts=s.choices,key=Number(s.correct);if(!Array.isArray(opts)||opts.length!==4||key<0||key>3)throw new Error(`Strict answer-balance source invalid: ${id}`);opts[key]=replacement;applied++;
 });
 if(applied!==93)throw new Error(`Strict answer-balance coverage mismatch: ${applied}/93`);
}
applyBalance();

const base=window.getExamQuestions;
window.getExamQuestions=function(){
 const rows=base.apply(this,arguments);
 const technical=rows.filter(q=>q&&q.kind==='technical');
 const covered=new Set();
 technical.forEach(q=>(Array.isArray(q.competencies)&&q.competencies.length?q.competencies:[q.competency]).filter(Boolean).forEach(c=>covered.add(c)));
 const missing=(S.blueprint||[]).filter(c=>!covered.has(c));
 if(missing.length)throw new Error(`Assessment blueprint incomplete: missing ${missing.join(', ')}`);
 rows.forEach(q=>{if(q&&q.stableId)q.mmId=q.stableId});
 return rows;
};
window.MM_STABLE_REVIEW_BRIDGE={version:'2026.08.30.1',stableIdsPrimary:true,fullBlueprintRequired:true,requiredTechnicalDomains:(S.blueprint||[]).slice(),legacyRecordsMigratedBy:'assessment-quality-suite.js',strictAnswerBalance:{applied:93,policy:'correct option must be shorter than at least one distractor; key indexes unchanged'}};
})();
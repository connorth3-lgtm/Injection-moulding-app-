'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('research-evidence-microlearning.js','utf8');
const ids=[
  'ejection-demoulding-physics','residual-stress-birefringence','weld-line-mechanical-strength',
  'fibre-breakage-retained-length','runner-gate-multicavity-imbalance','hot-runner-actual-behaviour',
  'liquid-silicone-rubber','fluid-assisted-moulding','moisture-drying-degradation',
  'recyclate-process-variability','surface-replication-release','injection-compression-precision-optics'
];
function mechanism(id,i){return{
  id,title:`Mechanism ${i+1}: ${id.replace(/-/g,' ')}`,status:'promoted',applicability:{label:i%3===0?'high':'moderate'},
  claim:`Mechanism ${i+1} links a measured process response with a physical outcome under bounded context.`,
  supports:[`Signal pattern ${i+1} and physical outcome move together under a controlled comparison.`],
  weakens:[`Independent actual ${i+1} remains stable while the physical outcome changes.`],
  alternatives:[`Competing explanation ${i+1}`],
  nextEvidence:`Measure independent actual ${i+1} and compare it with physical outcome ${i+1} while holding the relevant context stable.`,
  limitation:`Material, machine, mould and sensor context ${i+1} limit transfer; this is not a universal production setting.`
}}
const mechanisms=ids.map(mechanism);
const sandbox={window:{}};sandbox.global=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'research-evidence-microlearning.js'});
sandbox.window.MM_RESEARCH_EVIDENCE={
  retrieve(input,limit=3){const i=Number(input.testIndex)||0;const first=mechanisms[i%mechanisms.length],second=mechanisms[(i+1)%mechanisms.length];return[first,second].slice(0,limit)},
  verificationPlan(input,id){const m=mechanisms.find(x=>x.id===id);return{strongestNextCheck:m.nextEvidence,recoveryCriterion:`Independent actual and physical outcome ${m.id} return toward the validated local reference together.`}}
};
const micro=sandbox.window.MM_RESEARCH_MICROLEARNING;assert(micro&&typeof micro.buildPractice==='function','microlearning API missing');
const stages=['evidence','falsification','recovery','integration'],challenges=['support','standard','stretch'];
const correctPositions=new Set(),baseIds=new Map();let generated=0,retentionGenerated=0;
for(let i=0;i<mechanisms.length;i++){
  for(const stage of stages){
    for(let ctx=0;ctx<2;ctx++){
      for(const challenge of challenges){
        const input={testIndex:i,materials:[`material-${ctx}`],process:['injection moulding'],tooling:[`tool-${i}`],sensors:[`sensor-${ctx}`],signals:[`signal-${i}-${ctx}`],outcomes:[`outcome-${i}`]};
        const observed=`Measured signal ${i+1} ${ctx?'fell':'rose'} from the selected known-good baseline.`;
        const q=micro.buildPractice(input,{stage,observed,challenge});generated++;
        assert(q,`no question for ${i}/${stage}/${ctx}/${challenge}`);assert.equal(q.stage,stage,'stage mismatch');assert.equal(q.challenge,challenge,'challenge mismatch');
        assert.equal(q.options.length,4,`expected four options for ${q.id}`);assert.equal(q.options.filter(x=>x.correct).length,1,`must have exactly one correct answer: ${q.id}`);
        assert(q.correctIndex>=0&&q.correctIndex<4,`invalid correctIndex: ${q.id}`);assert(q.options[q.correctIndex].correct===true,`correctIndex does not point to correct option: ${q.id}`);
        const normalized=q.options.map(x=>String(x.text).toLowerCase().replace(/\s+/g,' ').trim());assert.equal(new Set(normalized).size,4,`duplicate answer options: ${q.id}/${challenge}`);assert(normalized.every(x=>x.length>=28),`answer option too thin: ${q.id}/${challenge}`);
        for(const option of q.options){assert(String(option.feedback||'').length>=55,`feedback too shallow: ${q.id}/${challenge}/${option.key}`);if(!option.correct)assert(option.misconception,`wrong option lacks misconception tag: ${q.id}/${challenge}/${option.key}`)}
        assert(q.prompt.includes('Measured signal'),`run observation missing from prompt: ${q.id}`);assert(String(q.weakeningAnswer||'').length>=25,`weakening evidence missing: ${q.id}`);assert(String(q.recoveryAnswer||'').length>=25,`recovery evidence missing: ${q.id}`);assert(/formal assessment/i.test(q.boundary),`formal-assessment boundary missing: ${q.id}`);
        const identityKey=`${i}:${stage}:${ctx}`;if(baseIds.has(identityKey))assert.equal(q.id,baseIds.get(identityKey),'difficulty calibration must not fragment item/context identity');else baseIds.set(identityKey,q.id);
        correctPositions.add(q.correctIndex);q.options.forEach((_,index)=>assert(micro.choiceMeta(q.id,index),`choice metadata missing: ${q.id}/${index}`));
      }
    }
    const base={testIndex:i,materials:['same-material'],process:['injection moulding'],tooling:[`tool-${i}`],sensors:['same-sensor'],signals:['signal-a'],outcomes:[`outcome-${i}`]};
    const changed={...base,signals:['signal-b']};
    const a=micro.buildPractice(base,{stage,observed:'The same measured observation is shown.',challenge:'standard'});const b=micro.buildPractice(changed,{stage,observed:'The same measured observation is shown.',challenge:'standard'});assert.notEqual(a.contextKey,b.contextKey,`structured signal context did not change context identity: ${i}/${stage}`);
    const delayed=micro.buildPractice(base,{stage,observed:'The same measured observation is shown.',challenge:'standard',mode:'retention',retentionIntervalDays:7});retentionGenerated++;assert.equal(delayed.mode,'retention','retention mode missing');assert.equal(delayed.retentionIntervalDays,7,'retention interval missing');assert(/Delayed 7-day transfer check/i.test(delayed.prompt),'delayed-transfer prompt missing');
  }
}
assert(correctPositions.size===4,`all four correct-answer positions should be exercised: ${[...correctPositions].join(',')}`);
assert.equal(generated,ids.length*stages.length*2*challenges.length,'unexpected calibrated generated question count');assert.equal(retentionGenerated,ids.length*stages.length,'unexpected retention question count');
console.log(`Contextual learning runtime QA passed: ${generated} calibrated questions across ${ids.length} mechanisms × ${stages.length} stages × 2 contexts × ${challenges.length} challenge levels, plus ${retentionGenerated} delayed-transfer probes; all 4 answer positions used.`);

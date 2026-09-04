from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
ADAPTER = ROOT / "src/domains/engineering/research-context.js"
RESEARCH = ROOT / "src/domains/research/governed-mechanisms.js"


def need(cond, msg):
    if not cond:
        raise AssertionError(msg)


need(ADAPTER.exists(), "engineering research context adapter missing")
need(RESEARCH.exists(), "governed research runtime missing")
source = ADAPTER.read_text(encoding="utf-8")

for forbidden in ["localStorage", "sessionStorage", "indexedDB", "fetch(", "XMLHttpRequest", "WebSocket", "sendBeacon", ".saveCase(", ".linkCase(", ".deleteCase("]:
    need(forbidden not in source, f"engineering research context must stay read-only/offline: {forbidden}")
for required in [
    "MM_GOVERNED_RESEARCH",
    "MM_ENGINEERING_STORE",
    "contextFromCase",
    "analyzeCase",
    "analyzeCaseById",
    "evidencePlan",
    "evidencePlanById",
    "MIN_PLAN_MATCH_TERMS",
    "candidate.rank===1",
    "not-supported-by-case-context",
    "excludedReasoningFields",
    "not a diagnosis or local root-cause finding",
]:
    need(required in source, f"engineering research context marker missing: {required}")

syntax = subprocess.run(["node", "--check", str(ADAPTER)], capture_output=True, text=True)
need(syntax.returncode == 0, "engineering research context syntax failed: " + syntax.stderr)

script = r'''
const assert=require('assert');
const research=require('./src/domains/research/governed-mechanisms.js');
globalThis.MM_GOVERNED_RESEARCH=research;
let writes=0;
const cases=new Map();
globalThis.MM_ENGINEERING_STORE={
  getCase:async id=>cases.get(String(id))||null,
  saveCase:()=>{writes++;throw new Error('write path must not be called')},
  linkCase:()=>{writes++;throw new Error('write path must not be called')},
  deleteCase:()=>{writes++;throw new Error('write path must not be called')}
};
const adapter=require('./src/domains/engineering/research-context.js');
assert.strictEqual(adapter.minPlanMatchTerms,2);

const multicavity={
  id:'case-multi',
  title:'Cavity imbalance after runner repair',
  defect:'one cavity loses part mass and fills late',
  onset:'after runner repair',
  location:'cavity 3 gate branch',
  baseline:'other cavities and common machine actuals remain stable',
  evidence:'cavity-specific fill pressure rises while part mass falls',
  hypothesis:'liquid silicone rubber cure failure',
  controlledTest:'change every machine setting together',
  conclusion:'hot runner is definitely the root cause',
  material:'glass-filled polypropylene',
  mould:'four-cavity family mould'
};
const before=JSON.stringify(multicavity);
const context=adapter.contextFromCase(multicavity);
assert(context.hasContext===true);
assert(context.sourceFields.includes('evidence'));
assert(context.excludedFields.includes('hypothesis'));
assert(context.excludedFields.includes('controlledTest'));
assert(context.excludedFields.includes('conclusion'));
assert(!adapter.rankingFields.includes('hypothesis'));
assert(!adapter.rankingFields.includes('controlledTest'));
assert(!adapter.rankingFields.includes('conclusion'));

const multi=adapter.analyzeCase(multicavity,12);
assert.strictEqual(JSON.stringify(multicavity),before,'adapter mutated engineering case');
assert.strictEqual(multi.status,'candidates');
assert(multi.candidates.length>0);
assert.strictEqual(multi.candidates[0].rank,1);
assert.strictEqual(multi.candidates[0].mechanismId,'runner-gate-multicavity-imbalance');
assert(multi.candidates[0].applicability && typeof multi.candidates[0].applicability==='object');
assert(Array.isArray(multi.candidates[0].applicability.matchedTerms));
assert(multi.candidates[0].applicability.matchedTerms.length>=adapter.minPlanMatchTerms);
assert(multi.candidates.every(x=>x.evidenceState==='promoted'));
assert(/not a diagnosis/i.test(multi.boundary));
assert(/excluded from research ranking/i.test(multi.biasBoundary));
assert(/top governed research match/i.test(multi.planBoundary));
const lsr=multi.candidates.find(x=>x.mechanismId==='liquid-silicone-rubber');
assert(lsr,'expected LSR comparison candidate');
assert(lsr.rank>1,'LSR should not outrank observed multicavity evidence');

const moisture={
  id:'case-moisture',
  defect:'splay and brittle parts after dryer interruption',
  onset:'after material was exposed to humid air',
  evidence:'measured moisture and drying history changed with rheology and appearance',
  material:'hygroscopic engineering resin'
};
const wet=adapter.analyzeCase(moisture,4);
assert.strictEqual(wet.candidates[0].rank,1);
assert.strictEqual(wet.candidates[0].mechanismId,'moisture-drying-degradation');
assert(wet.candidates[0].applicability.matchedTerms.length>=adapter.minPlanMatchTerms);

const hypothesisOnly=adapter.analyzeCase({id:'case-empty',hypothesis:'weld line mechanical strength'},5);
assert.strictEqual(hypothesisOnly.status,'no-context');
assert.strictEqual(hypothesisOnly.candidates.length,0);
assert(hypothesisOnly.excludedFields.includes('hypothesis'));

const unrelated=adapter.analyzeCase({id:'case-unrelated',defect:'blue paint stain',location:'shipping carton'},5);
assert.strictEqual(unrelated.status,'no-governed-match');
assert.strictEqual(unrelated.candidates.length,0);

const plan=adapter.evidencePlan(multicavity,'runner-gate-multicavity-imbalance');
assert.strictEqual(plan.status,'candidate-plan');
assert.strictEqual(plan.rank,1);
assert(plan.matchedTermCount>=adapter.minPlanMatchTerms);
assert(plan.plan.collect.includes('cavity-specific pressure/fill response'));
assert(plan.plan.sources.length>=2);
assert(/not a diagnosis/i.test(plan.boundary));
const blockedAlternative=adapter.evidencePlan(multicavity,'liquid-silicone-rubber');
assert.strictEqual(blockedAlternative.status,'not-supported-by-case-context');
assert(blockedAlternative.rank>1);
assert.strictEqual(blockedAlternative.plan,null);

const oneTerm={id:'case-one-term',defect:'birefringence'};
const one=adapter.analyzeCase(oneTerm,3);
assert.strictEqual(one.candidates[0].mechanismId,'residual-stress-birefringence');
assert.strictEqual(one.candidates[0].rank,1);
assert.strictEqual(one.candidates[0].applicability.matchedTerms.length,1);
const onePlan=adapter.evidencePlan(oneTerm,'residual-stress-birefringence');
assert.strictEqual(onePlan.status,'not-supported-by-case-context');
assert.strictEqual(onePlan.matchedTermCount,1);
assert.strictEqual(onePlan.plan,null);

cases.set(multicavity.id,multicavity);
(async()=>{
  const byId=await adapter.analyzeCaseById('case-multi',3);
  assert.strictEqual(byId.caseId,'case-multi');
  assert.strictEqual(byId.candidates[0].mechanismId,'runner-gate-multicavity-imbalance');
  const planById=await adapter.evidencePlanById('case-multi','runner-gate-multicavity-imbalance');
  assert.strictEqual(planById.status,'candidate-plan');
  assert.strictEqual(await adapter.analyzeCaseById('missing',3),null);
  assert.strictEqual(writes,0,'adapter attempted to mutate engineering store');
  console.log('engineering research context runtime checks passed');
})().catch(err=>{console.error(err);process.exit(1)});
'''
run = subprocess.run(["node", "-"], input=script, cwd=ROOT, capture_output=True, text=True)
need(run.returncode == 0, "engineering research context runtime QA failed: " + (run.stderr or run.stdout))

print("MouldMaster engineering research context QA passed")

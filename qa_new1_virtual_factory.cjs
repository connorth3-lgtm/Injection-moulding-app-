'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const proposed=require('./src/experimental/new1-virtual-factory-case-one.js');
const contract=JSON.parse(fs.readFileSync(path.join(root,'data/new1-virtual-factory-case-one-v1.json'),'utf8'));
const book=JSON.parse(fs.readFileSync(path.join(root,'data/book-manifest-v1.json'),'utf8'));
const allIds=new Set();
(function walk(row){
  if(!row||typeof row!=='object')return;
  if(Array.isArray(row)){for(const item of row)walk(item);return}
  if(typeof row.id==='string')allIds.add(row.id);
  for(const item of Object.values(row))if(item&&typeof item==='object')walk(item);
})(book);
assert.equal(proposed.caseId,'VA-02');
assert.equal(contract.authoredCase,proposed.caseId);
assert.equal(contract.status,'development-only-not-deployed');
assert.deepEqual(proposed.stageFlow.map(s=>s.id),contract.stageFlow);
assert.deepEqual(proposed.bookLinks.map(s=>s.id),contract.bookModuleIds);
for(const link of proposed.bookLinks)assert.ok(allIds.has(link.id),'Book chapter must exist: '+link.id);
assert.deepEqual(Object.fromEntries(proposed.competencies.map(x=>[x.id,x.step])),contract.competencySteps);
assert.equal(contract.storagePolicy.newStoreCreated,false);
assert.equal(contract.assessmentPolicy.accreditation,false);
assert.equal(contract.experimentalControls.productionRuntimeLoaded,false);
const cases=[];
const answers={};
for(const [step,competency] of Object.entries(contract.competencySteps))assert.ok(competency);
const caseOne={id:'VA-02'};
for(const name of ['hypothesis','test','response','verify']){
  caseOne[name]={options:[['good-'+name,'A supported decision',true,'Good.'],['bad-'+name,'Unsupported',false,'No.']]};
  answers[name]='good-'+name;
}
cases.push({id:'VA-01'},caseOne,{id:'VA-03'});
const grading=(row,response)=>{
  const dimensions={};let total=0;
  for(const step of ['hypothesis','test','response','verify']){
    const selected=row[step].options.find(o=>o[0]===response[step]);
    const correct=selected?.[2]===true;dimensions[step]={correct};if(correct)total++;
  }
  return {total,max:4,dimensions};
};
const virtual={cases,scoreReasoning:grading,openCase(index){assert.equal(index,1);return true;}};
const perfect=proposed.assess(answers,virtual);
assert.equal(perfect.state,'formative-review');
assert.equal(perfect.total,4);
assert.deepEqual(perfect.gaps,[]);
assert.equal(perfect.credentialAwarded,false);
assert.equal(perfect.productionAuthority,false);
const wrong={...answers,test:'bad-test'};
const review=proposed.assess(wrong,virtual);
assert.equal(review.total,3);
assert.deepEqual(review.gaps,['evidence']);
assert.equal(review.recommendedBookId,'cavity-pressure');
assert.match(review.tutor,/cavity.pressure/i);
assert.equal(proposed.assess({},virtual).state,'incomplete');
assert.equal(proposed.assess(answers,{}).state,'unavailable');
let reads=0,writes=0,openedChapter=null,openedTwin=null;
const storage={get(key){reads++;assert.equal(key,'mm_virtual_apprenticeship_v1');return {completed:{'VA-02':{best:3,last:2,level:'developing'}}};},set(){writes++;throw Error('Read-only competency bridge must never write learner records.')}};
const bridge=proposed.createBridge({
  apprenticeship:virtual,book:{openChapter(id){openedChapter=id;return Promise.resolve(true);}},
  spatial:{open(options){openedTwin=options;return true;}},runtime:{storage}
});
assert.equal(bridge.openCase(),true);
assert.equal(bridge.openSpatial(),true);
assert.deepEqual(openedTwin,{caseIndex:1});
assert.equal(bridge.openBookChapter('multi-cavity') instanceof Promise,true);
assert.equal(openedChapter,'multi-cavity');
assert.equal(bridge.openBookChapter('not-an-approved-book-module'),false);
assert.deepEqual(bridge.getProgress(),{state:'formative-attempt',caseId:'VA-02',best:3,last:2,coachingLevel:'developing',credentialAwarded:false});
assert.ok(reads>0);assert.equal(writes,0);
const noProfile=proposed.readExistingProgress(null);
assert.equal(noProfile.state,'unavailable');
const otherLearner=proposed.readExistingProgress({get(){return {completed:{'VA-01':{best:4}}}}});
assert.equal(otherLearner.state,'not-attempted');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'runtime-domain-manifest.json'),'utf8'));
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const candidatePath='src/experimental/new1-virtual-factory-case-one.js';
assert.ok(!(manifest.assets||[]).includes('./'+candidatePath),'Experimental source must not be activated before governed release authorisation');
assert.ok(!sw.includes("'./"+candidatePath+"'"),'Experimental source must not be mixed into old offline cache');
assert.ok(!index.includes("'./"+candidatePath+"'"),'Experimental source must not be loaded by old PWA shell');
assert.match(proposed.boundary,/no parallel answer keys/);
assert.match(proposed.status,/not loaded/);
console.log('New1 Case One: canonical Book links, scoring, learner isolation and release-stage safety QA passed');


/* Integration against the real authored VA-02 record; avoid a second answer key. */
const vm=require('node:vm');
const canonicalSource=fs.readFileSync(path.join(root,'src/domains/engineering/virtual-apprenticeship.js'),'utf8');
const sandbox={
  window:{addEventListener(){}},
  document:{readyState:'loading',addEventListener(){}},
  setInterval(){return 0;},
  clearInterval(){},
  console
};
vm.runInNewContext(canonicalSource,sandbox,{filename:'virtual-apprenticeship.js'});
const canonical=sandbox.window.MM_VIRTUAL_APPRENTICESHIP;
const actual=canonical.cases.find(x=>x.id==='VA-02');
assert.ok(actual&&/cavity/i.test(actual.title));
assert.ok(actual.brief.includes('four-cavity'));
assert.equal(actual.observations.length,5);
for(const step of ['hypothesis','test','response','verify'])assert.equal(actual[step].options.filter(x=>x[2]===true).length,1);
const realAnswers=Object.fromEntries(['hypothesis','test','response','verify'].map(step=>[step,actual[step].options.find(x=>x[2]===true)[0]]));
assert.equal(proposed.assess(realAnswers,canonical).total,4);
assert.equal(proposed.assess({...realAnswers,verify:actual.verify.options.find(x=>x[2]===false)[0]},canonical).recommendedBookId,'multi-cavity');
assert.equal(proposed.assess({...realAnswers,hypothesis:actual.hypothesis.options.find(x=>x[2]===false)[0]},canonical).recommendedBookId,'diagnostic-method');

/* An ephemeral worksheet never leaks its draft answers after a learner swap. */
let learner='learner-A';
const guardedBridge=proposed.createBridge({
  apprenticeship:canonical,
  runtime:{storage:{learnerToken(){return learner;},get(){return {completed:{}};}}}
});
const journey=proposed.createJourney(guardedBridge);
assert.equal(journey.choose('hypothesis',realAnswers.hypothesis),true);
assert.equal(journey.choose('test',realAnswers.test),true);
assert.equal(journey.snapshot().answers.test,realAnswers.test);
learner='learner-B';
assert.deepEqual(journey.snapshot().answers,{});
assert.equal(journey.review().state,'incomplete');
assert.equal(journey.choose('test','untrusted-option'),false);
assert.equal(journey.choose('hypothesis',realAnswers.hypothesis),true);
learner=null;
assert.equal(journey.snapshot().state,'no-learner');
assert.deepEqual(journey.snapshot().answers,{});
assert.equal(journey.review().state,'no-learner');
// All presented snapshots are isolated immutable views; there is no way to
// rewrite a stored review or inject artificial learner performance via a
// reference returned by the provisional worksheet.
learner='learner-A';
const canonicalWorksheet=proposed.createJourney(guardedBridge);
for(const step of ['hypothesis','test','response','verify'])
 assert.equal(canonicalWorksheet.choose(step,realAnswers[step]),true);
const safeReview=canonicalWorksheet.review();
assert.equal(safeReview.state,'formative-review');
assert.equal(safeReview.total,4);
assert.equal(Object.isFrozen(safeReview),true);
assert.equal(Object.isFrozen(safeReview.gaps),true);
assert.equal(Object.isFrozen(safeReview.dimensions),true);
assert.equal(Object.isFrozen(safeReview.dimensions[0]),true);
const safeSnapshot=canonicalWorksheet.snapshot();
assert.equal(Object.isFrozen(safeSnapshot.answers),true);
assert.equal(Object.isFrozen(safeSnapshot.reviewed),true);
assert.equal(Object.isFrozen(safeSnapshot.reviewed.dimensions[0]),true);
assert.throws(()=>safeSnapshot.reviewed.dimensions.push({id:'forged'}),TypeError);
assert.equal(canonicalWorksheet.snapshot().reviewed.total,4);
learner='learner-B';
assert.equal(canonicalWorksheet.snapshot().reviewed,null);
learner='learner-A';
assert.equal(canonicalWorksheet.snapshot().reviewed,null,'A must not inherit its stale score after an A-B-A context transition');
// No previous-learner result may be displayed when learner identity changes
// *during* the score callback itself.
const midReviewBridge={
 ...guardedBridge,
 review(answers){const result=guardedBridge.review(answers);learner='learner-B';return result;}
};
learner='learner-A';
const midReviewJourney=proposed.createJourney(midReviewBridge);
for(const step of ['hypothesis','test','response','verify'])
 assert.equal(midReviewJourney.choose(step,realAnswers[step]),true);
assert.equal(midReviewJourney.review().state,'learner-changed');
assert.equal(midReviewJourney.snapshot().state,'ready');
assert.deepEqual(midReviewJourney.snapshot().answers,{});
assert.equal(midReviewJourney.snapshot().reviewed,null);
// A broken/forged canonical review never becomes saved worksheet state.
learner='learner-A';
const malformedBridge={...guardedBridge,
 review(){return {state:'formative-review',caseId:'VA-02',total:4,max:4,dimensions:[],gaps:[]}}
};
const malformed=proposed.createJourney(malformedBridge);
for(const step of ['hypothesis','test','response','verify'])
 assert.equal(malformed.choose(step,realAnswers[step]),true);
assert.equal(malformed.review().state,'unavailable');
assert.equal(malformed.snapshot().reviewed,null);
learner='learner-A';
let scoreCorrupt=false;
const flakyBridge={...guardedBridge,
 review(answers){return scoreCorrupt?
  {state:'formative-review',caseId:'VA-02',total:4,max:4,dimensions:[],gaps:[]}:
  guardedBridge.review(answers);}
};
const flakyJourney=proposed.createJourney(flakyBridge);
for(const step of ['hypothesis','test','response','verify'])
 assert.equal(flakyJourney.choose(step,realAnswers[step]),true);
assert.equal(flakyJourney.review().state,'formative-review');
assert.equal(flakyJourney.snapshot().reviewed.total,4);
scoreCorrupt=true;
assert.equal(flakyJourney.review().state,'unavailable');
assert.equal(flakyJourney.snapshot().reviewed,null,'malformed repeat review must invalidate prior score');
assert.match(fs.readFileSync(path.join(root,'src/experimental/new1-virtual-factory-case-one.js'),'utf8'),/Your evidence-to-recovery worksheet/);
assert.match(fs.readFileSync(path.join(root,'src/experimental/new1-virtual-factory-case-one.js'),'utf8'),/Refresh canonical case progress/);
console.log('New1 interactive evidence worksheet and real VA-02 scorer/isolation QA passed');

'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const analyticsSource=fs.readFileSync('src/domains/learning/learning-analytics-loader.js','utf8');
const trainingSource=fs.readFileSync('src/domains/learning/training-qa-fix.js','utf8');

// Learner-analytics cohort discovery must be derived from the current profile
// registry. A syntactically valid strong-token bucket left by a removed/imported
// profile must not count toward the minimum cohort or influence the aggregate.
for(const marker of [
  'scope.knownIds?.()',
  'strong.add(scope.tokenFor(id))',
  'known.strong.has(t)',
  'function liveToken(',
  'function clearAllAnalytics()',
  'orphaned strong-token buckets',
])assert(analyticsSource.includes(marker),`analytics lifecycle marker missing: ${marker}`);

// Reset/import cleanup is now a verified lifecycle boundary, not a best-effort
// side effect after the new learner registry has already become active.
for(const marker of [
  "const ANALYTICS_CLEANUP_CODE='MM_ANALYTICS_CLEANUP_FAILED'",
  'function clearMatchingStores(',
  'remaining key(s):',
  'clearAllAnalyticsStores();',
  "const existingAnalytics=matchingKeys(",
  "'mouldmasterProDB',...existingTraining,...existingAnalytics,...Object.keys(trainingWrites)",
  'const rolledBack=restoreSnapshot(before)',
  'db=proposed;user=db.users[db.activeUser];committed=true;cancelActiveExam();',
  'buildTrainingExtras',
  'trainingExtrasForImport',
  "ASSESSMENT_MEMBERSHIP_KEY='mm_assessment_membership_history_v2'",
  'function learnerRuntimeAssessmentKeys(learnerId)',
  'clearLearnerAnalyticsStores(active);clearLearnerTrainingExtras(active);',
  'proposed=JSON.parse(JSON.stringify(db));proposed.users[active]=cleanResetLearner(prior,active)',
  'Other local learner profiles',
])assert(trainingSource.includes(marker),`training analytics cleanup marker missing: ${marker}`);

// Cohort regression: 4 current profiles + 1 orphan must remain an undersized
// cohort, and clear-all must not touch unrelated application storage.
{
  const listeners={};
  const memory=new Map([
    ['mm_learning_analytics_v1::strong-a',JSON.stringify({schema:1,events:[{type:'practice_start',module:'diagnostic',id:'a'}]})],
    ['mm_learning_analytics_v1::strong-b',JSON.stringify({schema:1,events:[]})],
    ['mm_learning_analytics_v1::strong-c',JSON.stringify({schema:1,events:[]})],
    ['mm_learning_analytics_v1::strong-d',JSON.stringify({schema:1,events:[]})],
    ['mm_learning_analytics_v1::strong-orphan',JSON.stringify({schema:1,events:[{type:'practice_start',module:'diagnostic',id:'orphan'}]})],
    ['unrelated-app-key','keep-me'],
  ]);
  const localStorage={
    get length(){return memory.size},
    key(i){return [...memory.keys()][i]??null},
    getItem(k){return memory.has(k)?memory.get(k):null},
    setItem(k,v){memory.set(k,String(v))},
    removeItem(k){memory.delete(k)},
  };
  const exportNode={hidden:false,setAttribute(){},removeAttribute(){}};
  let sandbox;
  const document={
    addEventListener(type,fn,capture){listeners[type]={fn,capture}},
    querySelectorAll(sel){return sel==='[data-la-export]'?[exportNode]:[]},
    querySelector(){return null},getElementById(){return null},
    createElement(tag){return tag==='script'?{dataset:{},async:true,onload:null,onerror:null,src:'',setAttribute(){}}:{dataset:{},setAttribute(){},remove(){},click(){}}},
    body:{appendChild(script){sandbox.window.MM_LEARNING_ANALYTICS={version:'test',open(){}};script.onload?.()}},
  };
  const scope={
    token:()=> 'strong-a',storageKey:(prefix,token)=>`${prefix}${token}`,registerStoragePrefix:()=>{},includeStorageToken:()=>true,
    knownIds:()=>['a','b','c','d'],tokenFor:id=>`strong-${id}`,legacyTokenFor:id=>`legacy-${id}`,isLegacyToken:t=>String(t).startsWith('legacy-'),
  };
  sandbox={
    user:{role:'instructor'},document,localStorage,console,encodeURIComponent,
    queueMicrotask:fn=>fn(),Blob:function(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
    window:{MM_LEARNER_SCOPE:scope,addEventListener(){},dispatchEvent(){},toast(){}},
  };
  sandbox.window.window=sandbox.window;sandbox.window.document=document;
  vm.createContext(sandbox);vm.runInContext(analyticsSource,sandbox,{filename:'learning-analytics-loader.js'});
  const quality=sandbox.window.MM_LEARNING_ANALYTICS_QUALITY;
  assert(quality,'analytics quality API did not install');
  assert.deepStrictEqual([...quality.liveTokens()].sort(),['strong-a','strong-b','strong-c','strong-d'],'orphan strong-token analytics bucket counted as a live profile');
  const cohort=quality.cohortSummary();
  assert.strictEqual(cohort.anonymousProfiles,4,'cohort profile count included an orphan bucket');
  assert.strictEqual(cohort.aggregate.practiceAttempts,1,'orphan analytics contaminated cohort aggregate metrics');
  assert.throws(()=>quality.exportAnonymousSummary(),/at least 5 current local learner profiles/i,'four live profiles plus one orphan incorrectly satisfied minimum cohort');
  const removed=quality.clearAllAnalytics();
  assert.strictEqual(removed,5,'clear-all analytics did not remove every Learning Insights bucket');
  assert.strictEqual([...memory.keys()].some(k=>k.startsWith('mm_learning_analytics_v1::')),false,'Learning Insights bucket survived clear-all lifecycle cleanup');
  assert.strictEqual(memory.get('unrelated-app-key'),'keep-me','analytics cleanup removed unrelated local storage');
}

function trainingSandbox(removeMode='normal',writeMode='normal'){
  const oldDb={activeUser:'old',users:{
    old:{id:'old',name:'Old learner',role:'learner',completed:[1,2],bookmarks:[2],notes:{1:'old note'},examScores:{Beginner:90},certificates:['Beginner-ALL'],currentLesson:3},
    peer:{id:'peer',name:'Peer learner',role:'learner',completed:[9],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:9}
  }};
  const oldSerialized=JSON.stringify(oldDb);
  const memory=new Map([
    ['mouldmasterProDB',oldSerialized],
    ['mm_spaced_review_v2::legacy-old',JSON.stringify({items:{'tech:q1':{id:'tech:q1',stage:2}}})],
    ['mm_practical_signoff_v1::legacy-old',JSON.stringify({checks:{safe:true}})],
    ['mm_real_measured_assessment_v1::legacy-old',JSON.stringify({'avaps-delivered-traces':{best:75,last:50}})],
    ['mm_process_data_diagnostics_v1::legacy-old',JSON.stringify({'check-ring-leakage':{attempts:3,completed:true,bestScore:100}})],
    ['mm_diagnostic_labs_v1::legacy-old',JSON.stringify({'cavity-short-shot':{attempts:2,completed:true,bestScore:100,firstTry:true}})],
    ['mm_material_behaviour_labs_v1::strong-old',JSON.stringify({'pp-vs-pc-drying':{attempts:1,completed:true,bestScore:100,firstTry:true}})],
    ['mm_spaced_review_v2::legacy-peer',JSON.stringify({items:{'tech:q2':{id:'tech:q2',stage:1}}})],
    ['mm_practical_signoff_v1::legacy-peer',JSON.stringify({checks:{peer:true}})],
    ['mm_real_measured_assessment_v1::legacy-peer',JSON.stringify({'openmms-time-samples':{best:100,last:75}})],
    ['mm_process_data_diagnostics_v1::legacy-peer',JSON.stringify({'cooling-restriction':{attempts:2,completed:true,bestScore:75}})],
    ['mm_diagnostic_labs_v1::legacy-peer',JSON.stringify({'moisture-splay':{attempts:3,completed:true,bestScore:75,firstTry:false}})],
    ['mm_material_behaviour_labs_v1::strong-peer',JSON.stringify({'pc-moisture-verification':{attempts:2,completed:true,bestScore:75,firstTry:false}})],
    ['mm_assessment_analytics_v1::strong-old','assessment-old'],
    ['mm_assessment_analytics_v1::strong-peer','assessment-peer'],
    ['mm_assessment_membership_history_v2::legacy-old',JSON.stringify({schema:2,version:'2026.10.05.1',forms:{Beginner:4},items:{'tech:Beginner:0':{count:2,last:4}}})],
    ['mm_assessment_membership_history_v2::strong-peer',JSON.stringify({schema:2,version:'2026.10.05.1',forms:{Advanced:3},items:{'tech:Advanced:0':{count:1,last:3}}})],
    ['mm_learning_analytics_v1::strong-old','learning-old'],
    ['mm_learning_analytics_v1::strong-peer','learning-peer'],
    ['unrelated-app-key','keep-me'],
  ]);
  let failedDbWrite=false,failedTrainingWrite=false;
  const localStorage={
    get length(){return memory.size},key(i){return [...memory.keys()][i]??null},
    getItem(k){return memory.has(String(k))?memory.get(String(k)):null},
    setItem(k,v){
      k=String(k);
      if((writeMode==='fail-next-db'||writeMode==='fail-db-silent-rollback')&&k==='mouldmasterProDB'&&!failedDbWrite){failedDbWrite=true;throw new Error('simulated registry write failure')}
      if(writeMode==='silent-training'&&k.startsWith('mm_real_measured_assessment_v1::')&&!failedTrainingWrite){failedTrainingWrite=true;return}
      if(writeMode==='fail-db-silent-rollback'&&failedDbWrite&&k==='mm_learning_analytics_v1::strong-old')return
      memory.set(k,String(v))
    },
    removeItem(k){
      k=String(k);
      if(k.startsWith('mm_learning_analytics_v1::')&&removeMode==='throw')throw new Error('simulated delete failure');
      if(k.startsWith('mm_learning_analytics_v1::')&&removeMode==='silent')return;
      memory.delete(k)
    },
  };
  const alerts=[],toasts=[];
  class FileReader{readAsText(file){this.result=file.contents;this.onload?.()}}
  const learnerScope={
    tokenFor:id=>`strong-${id}`,legacyTokenFor:id=>`legacy-${id}`,
    storageKey:(prefix,token)=>`${prefix}${token}`,
    registerStoragePrefix(){},
    migrationPlan:id=>({uniqueOwner:true,legacyToken:`legacy-${id}`}),
    knownIds:()=>Object.keys(sandbox?.db?.users||oldDb.users),
    migrateStoragePrefix(prefix,id){
      const oldKey=`${prefix}legacy-${id}`,newKey=`${prefix}strong-${id}`,legacy=localStorage.getItem(oldKey),current=localStorage.getItem(newKey);
      if(legacy==null)return {status:'no-legacy'};
      if(current==null){localStorage.setItem(newKey,legacy);if(localStorage.getItem(newKey)===legacy)localStorage.removeItem(oldKey);return {status:'migrated'}}
      if(current===legacy){localStorage.removeItem(oldKey);return {status:'duplicate-removed'}}
      return {status:'conflict'}
    }
  };
  const assessmentScope={keysForLearner:id=>[`mm_assessment_analytics_v1::strong-${id}`]};
  const sandbox={
    console,localStorage,Date,Math,Object,String,Number,JSON,Blob:function(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
    FileReader,setTimeout:fn=>{if(typeof fn==='function')fn()},confirm:()=>true,
    alert:msg=>alerts.push(String(msg)),
    db:JSON.parse(oldSerialized),user:null,MM_LEARNER_SCOPE:learnerScope,MM_ASSESSMENT_STORAGE_SCOPE:assessmentScope,
    defaultDB:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Learner 1',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:'2026-09-05T00:00:00.000Z'}}},
    normaliseImportedUser:(u,id)=>({...u,id:String(id),completed:Array.isArray(u.completed)?u.completed:[]}),
    updateGlobalProgress(){},switchView(){},renderProfile(){},
    startExam:undefined,activeExam:null,resetData(){},toast:msg=>toasts.push(String(msg)),
  };
  sandbox.user=sandbox.db.users[sandbox.db.activeUser];sandbox.window=sandbox;
  vm.createContext(sandbox);vm.runInContext(trainingSource,sandbox,{filename:'src/domains/learning/training-qa-fix.js'});
  return {sandbox,memory,alerts,toasts,oldSerialized,bridge:sandbox.MM_TRAINING_DATA_BRIDGE}
}

// Thrown delete failure: an import may stage storage writes, but the imported
// profile registry must never become active; staged core/training writes roll back.
{
  const t=trainingSandbox('throw');
  const incoming={activeUser:'new',users:{new:{id:'new',name:'New learner',completed:[1,2]}},trainingExtras:{version:2,spacedReview:{items:{}},practicalSignoff:{checks:{}}}};
  t.sandbox.importData({size:500,contents:JSON.stringify(incoming)});
  assert.strictEqual(t.sandbox.db.activeUser,'old','import activated new learner registry after analytics cleanup failure');
  assert.strictEqual(t.memory.get('mouldmasterProDB'),t.oldSerialized,'failed import did not roll staged core storage back');
  assert(t.alerts.some(x=>/Import was not completed because local analytics\/training cleanup could not be fully verified/i.test(x)),'cleanup failure did not surface a specific blocking import warning');
  assert(!t.toasts.some(x=>/^Progress imported/i.test(x)),'failed cleanup falsely reported a successful import');
}

// A failure after analytics/training cleanup but before the replacement registry
// commits must restore the complete last-known-good local learner state, including
// derived analytics that were intentionally cleared as part of the staged import.
{
  const t=trainingSandbox('normal','fail-next-db');
  const incoming={activeUser:'new',users:{new:{id:'new',name:'New learner',completed:[1,2]}},trainingExtras:{version:2,spacedReview:{items:{}},practicalSignoff:{checks:{}}}};
  t.sandbox.importData({size:500,contents:JSON.stringify(incoming)});
  assert.strictEqual(t.sandbox.db.activeUser,'old','failed final registry write activated imported learner state');
  assert.strictEqual(t.memory.get('mouldmasterProDB'),t.oldSerialized,'failed final registry write did not restore learner registry');
  assert.strictEqual(t.memory.get('mm_assessment_analytics_v1::strong-old'),'assessment-old','failed import did not restore assessment analytics');
  assert(t.memory.has('mm_assessment_membership_history_v2::legacy-old')||t.memory.has('mm_assessment_membership_history_v2::strong-old'),'failed import did not restore assessment membership history');
  assert.strictEqual(t.memory.get('mm_learning_analytics_v1::strong-old'),'learning-old','failed import did not restore Learning Insights analytics');
  assert(t.memory.has('mm_spaced_review_v2::legacy-old')||t.memory.has('mm_spaced_review_v2::strong-old'),'failed import did not restore spaced-review state');
  assert(t.memory.has('mm_real_measured_assessment_v1::legacy-old')||t.memory.has('mm_real_measured_assessment_v1::strong-old'),'failed import did not restore measured-assessment state');
  assert(t.alerts.some(x=>/browser storage failed/i.test(x)),'storage write failure was misreported as an invalid backup');
  assert(!t.alerts.some(x=>/not a valid MouldMaster backup/i.test(x)),'storage write failure was incorrectly blamed on backup validity');
  assert(!t.toasts.some(x=>/^Progress imported/i.test(x)),'failed final registry write falsely reported successful import');
}

// Rollback verification must detect a storage layer that silently drops a restore
// write after the staged import has already cleared old learner-owned data.
{
  const t=trainingSandbox('normal','fail-db-silent-rollback');
  const incoming={activeUser:'new',users:{new:{id:'new',name:'New learner',completed:[1,2]}},trainingExtras:{version:2,spacedReview:{items:{}},practicalSignoff:{checks:{}}}};
  t.sandbox.importData({size:500,contents:JSON.stringify(incoming)});
  assert.strictEqual(t.sandbox.db.activeUser,'old','failed registry write activated imported learner state');
  assert.strictEqual(t.memory.get('mm_learning_analytics_v1::strong-old'),undefined,'silent rollback fixture unexpectedly restored the dropped analytics write');
  assert(t.alerts.some(x=>/rollback could not be fully verified/i.test(x)),'silent rollback loss was incorrectly reported as verified');
  assert(!t.toasts.some(x=>/^Progress imported/i.test(x)),'rollback verification failure falsely reported successful import');
}

// A silent failure while restoring one learner-owned training store must be detected
// before the replacement learner registry commits, and the prior state must roll back.
{
  const t=trainingSandbox('normal','silent-training');
  const incoming={activeUser:'new',users:{new:{id:'new',name:'New learner',completed:[1,2]}},trainingExtras:{version:4,scope:'learner-registry',learners:{new:{spacedReview:{items:{}},practicalSignoff:{checks:{}},measuredAssessment:{'case-a':{best:100,last:100}},processDiagnostics:{},diagnosticLabs:{},materialLabs:{}}}}};
  t.sandbox.importData({size:800,contents:JSON.stringify(incoming)});
  assert.strictEqual(t.sandbox.db.activeUser,'old','silent training restore failure activated imported learner state');
  assert.strictEqual(t.memory.get('mouldmasterProDB'),t.oldSerialized,'silent training restore failure did not restore learner registry');
  assert(t.memory.has('mm_real_measured_assessment_v1::legacy-old')||t.memory.has('mm_real_measured_assessment_v1::strong-old'),'silent training restore failure did not restore prior measured-assessment state');
  assert(t.alerts.some(x=>/browser storage failed/i.test(x)),'silent training restore failure did not surface a storage warning');
  assert(!t.toasts.some(x=>/^Progress imported/i.test(x)),'silent training restore failure falsely reported success');
}

// Silent removeItem failure is just as unsafe as a thrown exception. Re-enumeration
// must detect the retained key and fail closed.
{
  const t=trainingSandbox('silent');
  assert.throws(()=>t.bridge.clearAllAnalyticsStores(),e=>e&&e.code==='MM_ANALYTICS_CLEANUP_FAILED','silent analytics deletion failure was not detected by verification');
  assert(t.memory.has('mm_learning_analytics_v1::strong-old'),'silent-failure fixture unexpectedly deleted its retained analytics key');
}

// Full-registry import cleanup must remove derived generated-form membership
// history for every prior learner, just like the other assessment analytics.
{
  const t=trainingSandbox('normal');
  t.bridge.clearAllAnalyticsStores();
  assert.strictEqual([...t.memory.keys()].some(k=>k.startsWith('mm_assessment_membership_history_v2::')),false,'full learner-registry cleanup left assessment membership history behind');
  assert(t.memory.has('mm_spaced_review_v2::legacy-old'),'assessment cleanup incorrectly removed governed training backup state');
}

// Successful learner reset clears only the active learner's scoped state and
// preserves every peer profile/store plus unrelated application storage.
{
  const t=trainingSandbox('normal');
  const extras=t.bridge.buildTrainingExtras(t.sandbox.db.users);
  assert.strictEqual(extras.version,4);
  assert.deepStrictEqual(Object.keys(extras.learners).sort(),['old','peer']);
  assert(extras.learners.old.spacedReview.items['tech:q1'],'active learner review state missing from multi-profile backup payload');
  assert(extras.learners.peer.spacedReview.items['tech:q2'],'peer review state missing from multi-profile backup payload');
  assert.strictEqual(extras.learners.old.measuredAssessment['avaps-delivered-traces'].best,75,'active learner measured-assessment state missing from backup payload');
  assert.strictEqual(extras.learners.peer.measuredAssessment['openmms-time-samples'].last,75,'peer measured-assessment state missing from backup payload');
  assert.strictEqual(extras.learners.old.processDiagnostics['check-ring-leakage'].bestScore,100,'active learner process-diagnostics progress missing from backup payload');
  assert.strictEqual(extras.learners.peer.processDiagnostics['cooling-restriction'].attempts,2,'peer process-diagnostics progress missing from backup payload');
  assert.strictEqual(extras.learners.old.diagnosticLabs['cavity-short-shot'].bestScore,100,'active learner diagnostic-lab progress missing from backup payload');
  assert.strictEqual(extras.learners.peer.diagnosticLabs['moisture-splay'].attempts,3,'peer diagnostic-lab progress missing from backup payload');
  assert.strictEqual(extras.learners.old.materialLabs['pp-vs-pc-drying'].bestScore,100,'active learner material-lab progress missing from backup payload');
  assert.strictEqual(extras.learners.peer.materialLabs['pc-moisture-verification'].attempts,2,'peer material-lab progress missing from backup payload');
  t.sandbox.resetData();
  assert.strictEqual(t.sandbox.db.activeUser,'old','learner reset changed the active learner identity');
  assert.strictEqual(t.sandbox.db.users.old.completed.length,0,'active learner progress survived learner reset');
  assert.strictEqual(t.sandbox.db.users.old.certificates.length,0,'active learner certificates survived learner reset');
  assert.strictEqual(JSON.stringify(t.sandbox.db.users.peer.completed),'[9]','learner reset deleted or changed a peer profile');
  assert.strictEqual(t.memory.has('mm_assessment_analytics_v1::strong-old'),false,'active learner assessment analytics survived reset');
  assert.strictEqual(t.memory.has('mm_assessment_membership_history_v2::legacy-old'),false,'active learner legacy assessment membership history survived reset');
  assert.strictEqual(t.memory.has('mm_assessment_membership_history_v2::strong-old'),false,'active learner assessment membership history survived reset');
  assert.strictEqual(t.memory.has('mm_learning_analytics_v1::strong-old'),false,'active learner Learning Insights survived reset');
  assert.strictEqual(t.memory.has('mm_spaced_review_v2::legacy-old'),false,'active learner review state survived reset');
  assert.strictEqual(t.memory.has('mm_practical_signoff_v1::legacy-old'),false,'active learner legacy sign-off survived reset');
  assert.strictEqual(t.memory.has('mm_spaced_review_v2::strong-old'),false,'active learner strong review state survived reset');
  assert.strictEqual(t.memory.has('mm_practical_signoff_v1::strong-old'),false,'active learner strong sign-off survived reset');
  assert.strictEqual(t.memory.has('mm_real_measured_assessment_v1::strong-old'),false,'active learner measured-assessment state survived reset');
  assert.strictEqual(t.memory.has('mm_process_data_diagnostics_v1::strong-old'),false,'active learner process-diagnostics progress survived reset');
  assert.strictEqual(t.memory.has('mm_diagnostic_labs_v1::strong-old'),false,'active learner diagnostic-lab progress survived reset');
  assert.strictEqual(t.memory.has('mm_material_behaviour_labs_v1::strong-old'),false,'active learner material-lab progress survived reset');
  assert.strictEqual(t.memory.get('mm_assessment_analytics_v1::strong-peer'),'assessment-peer','learner reset removed peer assessment analytics');
  assert(t.memory.has('mm_assessment_membership_history_v2::strong-peer'),'learner reset removed peer assessment membership history');
  assert.strictEqual(t.memory.get('mm_learning_analytics_v1::strong-peer'),'learning-peer','learner reset removed peer Learning Insights');
  assert(t.memory.has('mm_spaced_review_v2::strong-peer'),'learner reset removed peer review state');
  assert(t.memory.has('mm_practical_signoff_v1::strong-peer'),'learner reset removed peer sign-off');
  assert(t.memory.has('mm_real_measured_assessment_v1::strong-peer'),'learner reset removed peer measured-assessment state');
  assert(t.memory.has('mm_process_data_diagnostics_v1::strong-peer'),'learner reset removed peer process-diagnostics progress');
  assert(t.memory.has('mm_diagnostic_labs_v1::strong-peer'),'learner reset removed peer diagnostic-lab progress');
  assert(t.memory.has('mm_material_behaviour_labs_v1::strong-peer'),'learner reset removed peer material-lab progress');
  assert.strictEqual(t.memory.get('unrelated-app-key'),'keep-me','learner reset removed unrelated local storage');
  assert(t.toasts.some(x=>/Other local learner profiles/i.test(x)),'learner reset did not report peer-profile preservation');
}

// If the final learner-registry write fails after scoped cleanup, the reset must
// restore the active learner registry and its learner-owned stores.
{
  const t=trainingSandbox('normal','fail-next-db');
  t.sandbox.resetData();
  assert.strictEqual(t.sandbox.db.activeUser,'old','failed reset mutated the in-memory learner registry');
  assert.strictEqual(t.memory.get('mouldmasterProDB'),t.oldSerialized,'failed reset did not restore the persisted learner registry');
  assert.strictEqual(t.memory.get('mm_assessment_analytics_v1::strong-old'),'assessment-old','failed reset did not restore assessment analytics');
  assert(t.memory.has('mm_assessment_membership_history_v2::strong-old'),'failed reset did not restore assessment membership history');
  assert.strictEqual(t.memory.get('mm_learning_analytics_v1::strong-old'),'learning-old','failed reset did not restore Learning Insights');
  assert(t.memory.has('mm_spaced_review_v2::strong-old'),'failed reset did not restore spaced review state');
  assert(t.memory.has('mm_practical_signoff_v1::strong-old'),'failed reset did not restore sign-off state');
  assert(t.memory.has('mm_real_measured_assessment_v1::strong-old'),'failed reset did not restore measured-assessment state');
  assert(t.memory.has('mm_process_data_diagnostics_v1::strong-old'),'failed reset did not restore process-diagnostics progress');
  assert(t.memory.has('mm_diagnostic_labs_v1::strong-old'),'failed reset did not restore diagnostic-lab progress');
  assert(t.memory.has('mm_material_behaviour_labs_v1::strong-old'),'failed reset did not restore material-lab progress');
  assert(t.alerts.some(x=>/Existing learner progress and scoped training state were restored/i.test(x)),'failed reset did not disclose verified rollback');
}

// Legacy material-lab keys used a lossy sanitized learner ID. Two valid IDs such
// as a.b and a@b both mapped to a_b; ambiguous legacy progress must be quarantined
// rather than assigned to either learner during backup/migration.
{
  const t=trainingSandbox('normal');
  t.sandbox.db={activeUser:'a.b',users:{
    'a.b':{id:'a.b',name:'Dot learner',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1},
    'a@b':{id:'a@b',name:'At learner',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1}
  }};
  t.sandbox.user=t.sandbox.db.users['a.b'];
  const legacyKey='mm_material_behaviour_labs_v1:a_b';
  t.memory.set(legacyKey,JSON.stringify({'pp-vs-pc-drying':{attempts:9,completed:true,bestScore:100}}));
  const extras=t.bridge.buildTrainingExtras(t.sandbox.db.users);
  assert.deepStrictEqual(Object.keys(extras.learners['a.b'].materialLabs),[],'ambiguous sanitized legacy material progress was assigned to a.b');
  assert.deepStrictEqual(Object.keys(extras.learners['a@b'].materialLabs),[],'ambiguous sanitized legacy material progress was assigned to a@b');
  assert.strictEqual(t.memory.has(legacyKey),false,'ambiguous sanitized legacy material key was not removed after quarantine');
  assert([...t.memory.keys()].some(k=>k.startsWith('mm_scope_quarantine_v1::material-labs::a_b')),'ambiguous sanitized legacy material progress was not quarantined');
  assert.strictEqual(t.memory.has('mm_material_behaviour_labs_v1::strong-a.b'),false,'ambiguous sanitized legacy material progress leaked to a.b strong store');
  assert.strictEqual(t.memory.has('mm_material_behaviour_labs_v1::strong-a@b'),false,'ambiguous sanitized legacy material progress leaked to a@b strong store');
}

console.log('Final audit lifecycle QA passed: orphan analytics excluded; assessment membership history and learner-owned training/lab stores are collision-safe; import cleanup is fail-closed with full last-known-good rollback; learner reset is scoped, peer-preserving and rollback-verified.');
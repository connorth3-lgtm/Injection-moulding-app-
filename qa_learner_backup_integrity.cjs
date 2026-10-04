'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {webcrypto}=require('crypto');
const {TextEncoder}=require('util');

const source=fs.readFileSync('src/domains/learning/backup-authority-notice.js','utf8');
const learningPack=fs.readFileSync('src/domains/runtime-packs/learning-foundation-runtime-pack.js','utf8');

async function waitFor(predicate,message,timeoutMs=2000){
  const started=Date.now();
  while(!predicate()){
    if(Date.now()-started>=timeoutMs)throw new Error(message);
    await new Promise(resolve=>setTimeout(resolve,10));
  }
}

function sandbox(){
  const memory=new Map([
    ['mm_spaced_review_v2',JSON.stringify({items:{'tech:q1':{stage:2,due:1800000000000,wrong:1,right:4,last:1700000000000,confidence:'high'}}})],
    ['mm_practical_signoff_v1',JSON.stringify({checks:{safe:true},supervisor:'Reviewer',date:'2026-09-18',notes:'Synthetic QA'})],
  ]);
  const localStorage={
    getItem:key=>memory.has(String(key))?memory.get(String(key)):null,
    setItem:(key,value)=>memory.set(String(key),String(value)),
    removeItem:key=>memory.delete(String(key)),
    key:index=>[...memory.keys()][index]??null,
    get length(){return memory.size},
  };
  const alerts=[],toasts=[],confirms=[],baseImports=[];
  let downloadedBlob=null,anchorClicks=0;
  const document={
    readyState:'complete',documentElement:{},
    querySelectorAll(){return []},
    addEventListener(){},
    createElement(tag){
      if(tag==='a')return {href:'',download:'',click(){anchorClicks++}};
      return {className:'',dataset:{},innerHTML:'',querySelector(){return null},insertBefore(){}};
    },
  };
  class MutationObserver{constructor(fn){this.fn=fn}observe(){}}
  const context={
    console,Date,Math,Object,String,Number,Boolean,JSON,Array,RegExp,Promise,Uint8Array,TextEncoder,Blob,
    crypto:webcrypto,localStorage,document,MutationObserver,
    URL:{createObjectURL(blob){downloadedBlob=blob;return 'blob:test'},revokeObjectURL(){}},
    setTimeout(fn){if(typeof fn==='function')fn()},
    alert(message){alerts.push(String(message))},
    confirm(message){confirms.push(String(message));return true},
    toast(message){toasts.push(String(message))},
    db:{activeUser:'learner-a',users:{
      'learner-a':{id:'learner-a',name:'Learner A',role:'learner',completed:[1,2],bookmarks:[2],notes:{'1':'note'},examScores:{final:88},certificates:['old-cert']},
      'learner-b':{id:'learner-b',name:'Learner B',role:'learner',completed:[3],bookmarks:[],notes:{},examScores:{},certificates:[]}
    }},
    MM_TRAINING_DATA_BRIDGE:{buildTrainingExtras(users){
      assert.deepStrictEqual(Object.keys(users).sort(),['learner-a','learner-b']);
      return {version:4,scope:'learner-registry',learners:{
        'learner-a':{spacedReview:{items:{'tech:q1':{id:'tech:q1',stage:2}}},practicalSignoff:{checks:{safe:true},supervisor:'Reviewer',date:'2026-09-18',notes:'Synthetic QA'}},
        'learner-b':{spacedReview:{items:{'tech:q2':{id:'tech:q2',stage:1}}},practicalSignoff:{checks:{peer:true},supervisor:'Reviewer B',date:'2026-09-19',notes:'Second learner QA'}}
      }}
    }},
    importData(file){baseImports.push(file)},
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:'backup-authority-notice.js'});
  return {context,memory,alerts,toasts,confirms,baseImports,getDownloaded:()=>downloadedBlob,getAnchorClicks:()=>anchorClicks};
}

(async()=>{
  const t=sandbox();
  const api=t.context.MM_LEARNER_BACKUP_INTEGRITY;
  assert(api,'backup integrity API did not install');
  assert.strictEqual(api.backupFormat,'mouldmaster-backup-v3');
  assert.strictEqual(api.legacyFormat,'mouldmaster-backup-v2');
  assert.strictEqual(api.algorithm,'SHA-256');
  assert.strictEqual(api.canonicalization,'json-stable-v1');

  assert.strictEqual(api.stableStringify({b:2,a:{d:4,c:3}}),api.stableStringify({a:{c:3,d:4},b:2}),'canonical serialization depends on object insertion order');

  const envelope=await api.buildEnvelope();
  assert.strictEqual(envelope.backupFormat,'mouldmaster-backup-v3');
  assert(/^[0-9a-f]{64}$/.test(envelope.integrity.digest),'export did not produce a SHA-256 digest');
  assert.strictEqual(envelope.payload.backupFormat,'mouldmaster-backup-v2','v3 envelope payload lost legacy importer compatibility');
  assert.strictEqual(envelope.payload.trainingExtras.version,4,'integrity wrapper regressed scoped training extras to legacy v2');
  assert.strictEqual(envelope.payload.trainingExtras.scope,'learner-registry');
  assert.deepStrictEqual(Object.keys(envelope.payload.trainingExtras.learners).sort(),['learner-a','learner-b'],'v3 envelope did not carry every local learner training scope');
  assert.strictEqual((await api.verifyEnvelope(envelope)).activeUser,'learner-a','valid envelope did not verify');

  const tampered=JSON.parse(JSON.stringify(envelope));
  tampered.payload.users['learner-a'].name='Tampered learner';
  await assert.rejects(()=>api.verifyEnvelope(tampered),error=>error&&error.code==='MM_BACKUP_INTEGRITY_MISMATCH','payload tampering did not fail the SHA-256 gate');

  const metadataTamper=JSON.parse(JSON.stringify(envelope));
  metadataTamper.integrity.algorithm='SHA-1';
  await assert.rejects(()=>api.verifyEnvelope(metadataTamper),/Unsupported backup integrity metadata/,'unsupported integrity algorithm was accepted');

  t.context.importData({size:JSON.stringify(tampered).length,text:async()=>JSON.stringify(tampered)});
  await waitFor(()=>t.alerts.some(message=>/failed its SHA-256 integrity check/i.test(message)),'tampered v3 import did not finish its integrity rejection');
  assert.strictEqual(t.baseImports.length,0,'tampered v3 backup reached the legacy restore path');

  t.context.importData({size:JSON.stringify(envelope).length,text:async()=>JSON.stringify(envelope)});
  await waitFor(()=>t.baseImports.length===1,'verified v3 backup did not reach the governed legacy restore transaction');
  assert(t.baseImports[0] instanceof Blob,'verified v3 backup was not unwrapped into an isolated payload blob');
  const unwrapped=JSON.parse(await t.baseImports[0].text());
  assert.strictEqual(unwrapped.backupFormat,'mouldmaster-backup-v2');
  assert.strictEqual(unwrapped.activeUser,'learner-a');
  assert.strictEqual(unwrapped.users['learner-a'].name,'Learner A');
  assert.strictEqual(unwrapped.users['learner-b'].name,'Learner B');
  assert.strictEqual(unwrapped.trainingExtras.version,4);
  assert(unwrapped.trainingExtras.learners['learner-b'],'verified envelope dropped non-active learner training extras');

  const legacy={activeUser:'legacy',users:{legacy:{id:'legacy',name:'Legacy learner'}},backupFormat:'mouldmaster-backup-v2'};
  const legacyFile={size:JSON.stringify(legacy).length,text:async()=>JSON.stringify(legacy)};
  t.context.importData(legacyFile);
  await waitFor(()=>t.baseImports.length===2,'explicitly accepted legacy backup did not reach the existing strict importer');
  assert.strictEqual(t.baseImports[1],legacyFile,'legacy compatibility path rewrote the original backup unexpectedly');
  assert(t.confirms.some(message=>/no cryptographic integrity checksum/i.test(message)),'legacy compatibility path did not disclose missing integrity evidence');

  t.context.importData({size:10*1024*1024+1,text:async()=>JSON.stringify(envelope)});
  assert.strictEqual(t.baseImports.length,2,'oversized backup bypassed the 10 MiB limit');

  await t.context.exportData();
  assert.strictEqual(t.getAnchorClicks(),1,'v3 export did not trigger one file download');
  const exported=JSON.parse(await t.getDownloaded().text());
  assert.strictEqual(exported.backupFormat,'mouldmaster-backup-v3');
  await api.verifyEnvelope(exported);
  assert(t.toasts.some(message=>/SHA-256 integrity checksum/i.test(message)),'v3 export did not disclose integrity protection');

  assert(source.includes('bridge.buildTrainingExtras(payload.users)'),'integrity wrapper must delegate scoped extras to the governed training bridge');
  for(const marker of ['measured-assessment','process-diagnostics','Diagnostic Learning Lab','Material Behaviour Lab']) assert(source.includes(marker),`backup authority disclosure missing ${marker}`);
  assert(!source.includes('payload.trainingExtras={\n  version:2'),'integrity wrapper reintroduced legacy unscoped training extras');
  assert(learningPack.includes('/* >>> backup-authority-notice.js */')&&learningPack.includes('MM_LEARNER_BACKUP_INTEGRITY'),'learner-facing runtime pack does not include backup integrity wrapper');
  assert(learningPack.indexOf('/* >>> training-qa-fix.js */')<learningPack.indexOf('/* >>> backup-authority-notice.js */'),'backup integrity wrapper loads before its base import/export bridge');
  console.log('Learner backup integrity QA passed: v3 SHA-256 envelope preserves multi-profile scoped training extras, verifies before restore, and tampering/unsupported metadata/oversize fail closed.');
})().catch(error=>{console.error(error);process.exitCode=1});

'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {webcrypto}=require('crypto');
const {TextEncoder}=require('util');

const source=fs.readFileSync('src/domains/learning/backup-authority-notice.js','utf8');

async function settle(){await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve))}

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
    db:{activeUser:'learner-a',users:{'learner-a':{id:'learner-a',name:'Learner A',role:'learner',completed:[1,2],bookmarks:[2],notes:{'1':'note'},examScores:{final:88},certificates:['old-cert']}}},
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
  assert.strictEqual((await api.verifyEnvelope(envelope)).activeUser,'learner-a','valid envelope did not verify');

  const tampered=JSON.parse(JSON.stringify(envelope));
  tampered.payload.users['learner-a'].name='Tampered learner';
  await assert.rejects(()=>api.verifyEnvelope(tampered),error=>error&&error.code==='MM_BACKUP_INTEGRITY_MISMATCH','payload tampering did not fail the SHA-256 gate');

  const metadataTamper=JSON.parse(JSON.stringify(envelope));
  metadataTamper.integrity.algorithm='SHA-1';
  await assert.rejects(()=>api.verifyEnvelope(metadataTamper),/Unsupported backup integrity metadata/,'unsupported integrity algorithm was accepted');

  t.context.importData({size:JSON.stringify(tampered).length,text:async()=>JSON.stringify(tampered)});
  await settle();
  assert.strictEqual(t.baseImports.length,0,'tampered v3 backup reached the legacy restore path');
  assert(t.alerts.some(message=>/failed its SHA-256 integrity check/i.test(message)),'tamper rejection did not explain the integrity failure');

  t.context.importData({size:JSON.stringify(envelope).length,text:async()=>JSON.stringify(envelope)});
  await settle();
  assert.strictEqual(t.baseImports.length,1,'verified v3 backup was not handed to the governed legacy restore transaction');
  assert(t.baseImports[0] instanceof Blob,'verified v3 backup was not unwrapped into an isolated payload blob');
  const unwrapped=JSON.parse(await t.baseImports[0].text());
  assert.strictEqual(unwrapped.backupFormat,'mouldmaster-backup-v2');
  assert.strictEqual(unwrapped.activeUser,'learner-a');

  const legacy={activeUser:'legacy',users:{legacy:{id:'legacy',name:'Legacy learner'}},backupFormat:'mouldmaster-backup-v2'};
  const legacyFile={size:JSON.stringify(legacy).length,text:async()=>JSON.stringify(legacy)};
  t.context.importData(legacyFile);
  await settle();
  assert.strictEqual(t.baseImports.length,2,'explicitly accepted legacy backup was not passed to the existing strict importer');
  assert.strictEqual(t.baseImports[1],legacyFile,'legacy compatibility path rewrote the original backup unexpectedly');
  assert(t.confirms.some(message=>/no cryptographic integrity checksum/i.test(message)),'legacy compatibility path did not disclose missing integrity evidence');

  t.context.importData({size:10*1024*1024+1,text:async()=>JSON.stringify(envelope)});
  await settle();
  assert.strictEqual(t.baseImports.length,2,'oversized backup bypassed the 10 MiB limit');

  await t.context.exportData();
  assert.strictEqual(t.getAnchorClicks(),1,'v3 export did not trigger one file download');
  const exported=JSON.parse(await t.getDownloaded().text());
  assert.strictEqual(exported.backupFormat,'mouldmaster-backup-v3');
  await api.verifyEnvelope(exported);
  assert(t.toasts.some(message=>/SHA-256 integrity checksum/i.test(message)),'v3 export did not disclose integrity protection');

  console.log('Learner backup integrity QA passed: v3 SHA-256 envelope verifies before restore, tampering/unsupported metadata/oversize fail closed, legacy v2 is explicitly disclosed, and export round-trips.');
})().catch(error=>{console.error(error);process.exitCode=1});

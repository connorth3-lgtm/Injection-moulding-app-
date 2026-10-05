const fs=require('fs'),vm=require('vm'),assert=require('assert');
const memory=new Map();
const localStorage={get length(){return memory.size},key(i){return [...memory.keys()][i]??null},getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
const sandbox={console,localStorage,confirm:()=>false,alert:()=>{},document:{querySelectorAll:()=>[]},window:null,db:{},user:{},defaultDB:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1'}}},normaliseImportedUser:(u,id)=>({...u,id}),updateGlobalProgress(){},switchView(){},renderProfile(){},resetData(){},activeExam:null,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},FileReader:function(){this.readAsText=()=>{}},Date,Math,JSON,Object,Number,String,Array,Map,Set};
sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync('src/domains/learning/training-qa-fix.js','utf8'),sandbox);
const fn=sandbox.MM_TRAINING_DATA_BRIDGE.canonicalLearnerId;
for(const good of ['learner-1','learner-1723456789012','learner-A','legacy.user:2','A_1','A+shift@cell'])assert.strictEqual(fn(good),good);
for(const bad of ['', ' learner-1','learner 1','learner\"x','learner<x','learner\nx','x/'.repeat(50),'A'.repeat(161)])assert.throws(()=>fn(bad));
const src=fs.readFileSync('src/domains/learning/training-qa-fix.js','utf8');
assert(src.includes('const entries=Object.entries(x.users);'));
assert(src.includes("if(!entries.length||entries.length>500)throw new Error('Invalid learner count in backup')"));
assert(!src.includes('Object.entries(x.users).slice(0,500)'));
assert(src.includes('const sid=canonicalLearnerId(id)'));assert(src.includes('canonicalLearnerId(u.id)!==sid'));assert(src.includes('const active=canonicalLearnerId(x.activeUser)'));
assert(src.includes('function pvNewLearnerId()'));
assert(src.includes('Object.prototype.hasOwnProperty.call(users,id)'));
assert(!src.includes('pvRequireLearnerId("learner-"+Date.now())'));
assert(src.includes('hasOwnLearner(x.users,x.activeUser)'));assert(src.includes('Reset learner data'));assert(src.includes('Other local learner profiles and saved process-data evidence will be kept'));assert(src.includes("version:4,scope:'learner-registry'"));

assert(src.includes("const IMPORT_META_KEYS=new Set(['__proto__','prototype','constructor'])"));
assert(src.includes("function importKey(v,max=160)"));

const hostileExtras=JSON.parse('{"version":3,"scope":"active-learner","learnerId":"learner-1","practicalSignoff":{"checks":{"__proto__":true,"constructor":true,"prototype":true,"safe":true}},"measuredAssessment":{"__proto__":{"best":99,"last":99},"constructor":{"best":88,"last":88},"prototype":{"best":77,"last":77},"safe-case":{"best":75,"last":50}},"processDiagnostics":{"__proto__":{"attempts":9,"completed":true,"bestScore":100},"safe-diag":{"attempts":2,"completed":true,"bestScore":80}},"diagnosticLabs":{"constructor":{"attempts":9,"completed":true,"bestScore":100},"safe-lab":{"attempts":1,"completed":true,"bestScore":90}},"materialLabs":{"prototype":{"attempts":9,"completed":true,"bestScore":100},"safe-material":{"attempts":1,"completed":true,"bestScore":95}}}');
const sanitized=sandbox.MM_TRAINING_DATA_BRIDGE.trainingExtrasForImport(hostileExtras,{'learner-1':{id:'learner-1'}},'learner-1').get('learner-1');
for(const row of [sanitized.practicalSignoff.checks,sanitized.measuredAssessment,sanitized.processDiagnostics,sanitized.diagnosticLabs,sanitized.materialLabs]){
  for(const key of ['__proto__','constructor','prototype'])assert.strictEqual(Object.prototype.hasOwnProperty.call(row,key),false,`unsafe imported meta-key survived: ${key}`);
  assert.strictEqual(Object.getPrototypeOf(row),Object.prototype,'sanitized imported map prototype was altered');
}
assert.strictEqual(sanitized.practicalSignoff.checks.safe,true);
assert.strictEqual(sanitized.measuredAssessment['safe-case'].best,75);
assert.strictEqual(sanitized.processDiagnostics['safe-diag'].attempts,2);
assert.strictEqual(sanitized.diagnosticLabs['safe-lab'].bestScore,90);
assert.strictEqual(sanitized.materialLabs['safe-material'].bestScore,95);

sandbox.importData=function(){};sandbox.window.importData=sandbox.importData;
vm.runInContext(fs.readFileSync('src/domains/learning/learner-model.js','utf8'),sandbox);
const validate=sandbox.MM_LEARNER_MODEL.validateBackupEnvelope;
const valid={activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Learner'}}};
assert.strictEqual(validate(JSON.stringify(valid)),true);
const tooMany={activeUser:'learner-0',users:{}};for(let i=0;i<501;i++)tooMany.users[`learner-${i}`]={id:`learner-${i}`};
assert.throws(()=>validate(JSON.stringify(tooMany)),/Too many learners/);
assert.throws(()=>validate(JSON.stringify({activeUser:'toString',users:{}})),/Missing active learner/);
assert.throws(()=>validate(JSON.stringify({activeUser:'learner-1',users:{'learner-1':{id:'different'}}})),/mismatch/);
const guardSrc=fs.readFileSync('src/domains/learning/learner-model.js','utf8');
assert(guardSrc.includes('__mmImportIntegrityGuard'));assert(guardSrc.includes('Object.prototype.hasOwnProperty.call(x.users,x.activeUser)'));
console.log('Import identity integrity QA passed: canonical IDs are aligned, oversized registries fail closed before mutation, prototype meta-keys are rejected from nested training maps, own-property activation is required, embedded IDs must match, and the final learning-domain runtime guard prevents packed legacy code from reintroducing truncation.');
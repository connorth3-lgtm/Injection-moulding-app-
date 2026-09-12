
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('MouldMaster_Core_App.html','utf8');
function extractFunction(name){
  const start=source.indexOf(`function ${name}(`);assert(start>=0,`missing ${name}`);
  const brace=source.indexOf('{',start);let depth=0,quote=null,escape=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(quote){if(escape){escape=false;continue}if(ch==='\\'){escape=true;continue}if(ch===quote)quote=null;continue}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`unterminated ${name}`);
}
const startupCanonicalSource=extractFunction('mmCanonicalStartupLearnerId');
const startupLessonIdsSource=extractFunction('mmStartupUniqueLessonIdsAreSafe');
const startupCertKeySource=extractFunction('mmStartupCertificateKeyIsSafe');
const startupCertsSource=extractFunction('mmStartupCertificatesAreSafe');
const startupRecordSource=extractFunction('mmStartupLearnerRecordIsSafe');
const startupSelectSource=extractFunction('mmSelectStartupDb');
const canonicalSource=extractFunction('pvCanonicalLearnerId');
const requireSource=extractFunction('pvRequireLearnerId');
const hasOwnSource=extractFunction('pvHasOwnLearner');
const buildSource=extractFunction('pvBuildImportedUsers');
const commitSource=extractFunction('pvCommitImportedUsers');
const resetCommitSource=extractFunction('pvCommitPristineReset');
const storageDurabilitySource=extractFunction('mmSetStorageDurability');
const persistCurrentSource=extractFunction('mmPersistCurrentState');
const api=new Function('normaliseImportedUser',`${canonicalSource}\n${requireSource}\n${hasOwnSource}\n${buildSource}\nreturn {pvCanonicalLearnerId,pvRequireLearnerId,pvHasOwnLearner,pvBuildImportedUsers};`)((u,id)=>({id,name:u?.name||'Learner',completed:[1],certificates:['Advanced-ALL'],certificateMeta:{'Advanced-ALL':{score:100}},examPassStatus:{'Advanced-ALL':true}}));

for(const id of ['learner-1','learner_2','legacy.ID-3','team:alpha+1','person@example'])assert.equal(api.pvCanonicalLearnerId(id),id,`benign legacy ID should survive unchanged: ${id}`);
const startupApi=new Function('D',`${startupCanonicalSource}\n${startupLessonIdsSource}\n${startupCertKeySource}\n${startupCertsSource}\n${startupRecordSource}\n${startupSelectSource}\nreturn {mmCanonicalStartupLearnerId,mmStartupUniqueLessonIdsAreSafe,mmStartupCertificateKeyIsSafe,mmStartupCertificatesAreSafe,mmStartupLearnerRecordIsSafe,mmSelectStartupDb};`)({lessons:Array.from({length:120},(_,i)=>({id:i+1}))});
for(const id of ['learner-1','learner_2','legacy.ID-3','team:alpha+1','person@example',"bad'id",'<tag>','bad\\id','bad/id','bad id','__proto__','constructor'])assert.equal(startupApi.mmCanonicalStartupLearnerId(id),api.pvCanonicalLearnerId(id),`startup/current learner-ID contracts must agree: ${JSON.stringify(id)}`);
const legacyRecord=(id='learner-1',name='Legacy')=>({id,name,completed:[],bookmarks:[],notes:{},examScores:{},certificates:[]});
const pristine={activeUser:'learner-1',users:{'learner-1':legacyRecord('learner-1','Pristine')}};
{
  const selected=startupApi.mmSelectStartupDb({activeUser:'__proto__',users:{}},pristine);
  assert.equal(selected.rejected,true,'legacy __proto__ active learner must fail closed');
  assert.equal(selected.db.activeUser,'learner-1');
  assert.equal(Object.prototype.hasOwnProperty.call(selected.db.users,'learner-1'),true);
}
{
  const selected=startupApi.mmSelectStartupDb({activeUser:'constructor',users:{'learner-1':legacyRecord()}},pristine);
  assert.equal(selected.rejected,true,'inherited constructor lookup must not satisfy startup active membership');
}
{
  const candidate={activeUser:'constructor',users:{constructor:legacyRecord('constructor','Owned legacy')}};
  const selected=startupApi.mmSelectStartupDb(candidate,pristine);
  assert.equal(selected.rejected,false,'explicitly owned canonical legacy ID remains valid at startup');
  assert.equal(selected.db,candidate);
}
{
  const selected=startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':legacyRecord(),"bad'id":legacyRecord("bad'id")}},pristine);
  assert.equal(selected.rejected,true,'unsafe inactive persisted learner IDs must also fail the startup registry boundary');
}
{
  const bad=legacyRecord(); bad.completed=[1,1];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'duplicate legacy completion IDs must not inflate overall progress');
}
{
  const bad=legacyRecord(); bad.completed=[121];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'out-of-range legacy completion IDs must not count as course progress');
}
{
  const bad=legacyRecord(); bad.bookmarks=[1,1];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'duplicate legacy bookmark IDs must fail the canonical startup boundary');
}
{
  const bad=legacyRecord(); bad.certificates=['Advanced-ALL','Advanced-ALL'];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'duplicate certificate keys must not inflate instructor certificate counts');
}
{
  const bad=legacyRecord(); bad.certificates=['Not-A-Certificate'];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'unknown legacy certificate keys must not count as earned credentials');
}
{
  const valid=legacyRecord(); valid.completed=[1,2,120];valid.bookmarks=[3,119];valid.certificates=['Beginner','Intermediate-US','Advanced-NZ'];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':valid}},pristine).rejected,false,'valid historical lesson IDs and legacy/current certificate formats must remain compatible');
}
assert.equal(startupApi.mmStartupCertificateKeyIsSafe('Advanced'),true);
assert.equal(startupApi.mmStartupCertificateKeyIsSafe('Advanced-NZ'),true);
assert.equal(startupApi.mmStartupCertificateKeyIsSafe('Advanced-XX'),false);
{
  const bad=legacyRecord(); bad.region='ZZ';
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'unknown persisted region must fail closed before assessment selection');
}
{
  const bad=legacyRecord(); bad.currentLesson='1';
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-integer persisted current lesson must fail closed before navigation');
}
{
  const bad=legacyRecord(); bad.currentLesson=121;
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'out-of-range persisted current lesson must fail closed before navigation');
}
{
  const bad=legacyRecord(); bad.materialScience={completed:[1,1],bestQuiz:80,quizAttempts:1,currentLesson:1};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'duplicate material lesson IDs must not inflate material progress or achievements');
}
{
  const bad=legacyRecord(); bad.completed={1:true};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-array completed state must fail closed before .includes() use');
}
{
  const bad=legacyRecord(); bad.bookmarks='1,2';
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-array bookmarks must fail closed before bookmark lookups');
}
{
  const bad=legacyRecord(); bad.certificates={Advanced:true};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-array certificate state must fail closed');
}
{
  const bad=legacyRecord(); bad.name=42;
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-string learner name must fail closed before string methods');
}
{
  const bad=legacyRecord(); bad.id='learner-2';
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'persisted embedded/key learner-ID mismatch must fail closed');
}
{
  const valid=legacyRecord(); delete valid.examPassStatus; delete valid.certificateMeta;
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':valid}},pristine).rejected,false,'valid historical core records may omit newer optional evidence maps');
}
{
  const bad=legacyRecord(); bad.examScores={'Beginner-ALL':'<img src=x onerror=alert(1)>'};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'string exam scores from permissive legacy imports must fail closed before HTML rendering');
}
{
  const bad=legacyRecord(); bad.examPassStatus={'Beginner-ALL':'false'};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-boolean pass status must not become truthy passed state');
}
{
  const bad=legacyRecord(); bad.fun={xp:'<svg/onload=alert(1)>',streak:1,achievements:[],rewarded:{}};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'string gamification counters must fail closed before dashboard HTML rendering');
}
{
  const bad=legacyRecord(); bad.materialScience={completed:[],bestQuiz:'<img src=x onerror=alert(1)>',quizAttempts:0,currentLesson:1};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'string material quiz state must fail closed before material HTML rendering');
}
{
  const valid=legacyRecord();
  valid.examScores={'Beginner-ALL':87.5};
  valid.examPassStatus={'Beginner-ALL':true};
  valid.fun={xp:120,rewarded:{lesson1:1700000000000,lesson2:'1700000000001'},achievements:['first-lesson'],sound:false,celebrations:true,scenarioCorrect:2,scenarioAttempts:3,bossWins:0,streak:4,lastLearningDate:'2026-09-11'};
  valid.materialScience={completed:[1,2],bestQuiz:80,quizAttempts:1,currentLesson:3};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':valid}},pristine).rejected,false,'valid historical assessment, gamification and material-science state must remain compatible');
}
assert(source.includes('<span class="pill">${esc(status)}</span>'),'exam status display must escape persisted-derived status text');
assert(source.includes('${esc(f.xp)} XP')&&source.includes('${esc(f.streak)}-day learning streak'),'gamification counters must be escaped at HTML sinks');
assert.equal((source.match(/m\.bestQuiz==null\?"—":esc\(m\.bestQuiz\)\+"%"/g)||[]).length,2,'both material best-quiz HTML sinks must escape persisted values');
assert(source.includes('Assessment selector rejected unknown level or region'),'standalone assessment selection must fail closed on unknown level or region');
assert(commitSource.includes('mmSetStorageDurability(true)')&&resetCommitSource.includes('mmSetStorageDurability(true)'),'successful storage-first import/reset must clear a stale session-only warning');
const assessmentV2Source=fs.readFileSync('assessment-runtime-v2.js','utf8');
assert(assessmentV2Source.includes("throw new Error('Assessment selector rejected unknown level or region')"),'hosted assessment selector must fail closed on unknown region/level');
assert(!assessmentV2Source.includes('return legacySelector.apply'),'hosted assessment selector must not delegate unknown region/level to the legacy selector');
function makePersistenceHarness(storage){
  const elements=new Map();
  const host={prepend(element){elements.set(element.id,element)}};
  const document={
    body:host,
    getElementById(id){return elements.get(id)||null},
    querySelector(selector){return selector==='#mainContent'?host:null},
    createElement(){return {id:'',className:'',textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v},remove(){elements.delete(this.id)}}}
  };
  const state={
    db:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Existing'}}},
    user:{id:'learner-1',name:'Existing'},
    progressCalls:0
  };
  const harness=new Function('state','localStorage','document','elements',`${storageDurabilitySource}\nlet db=state.db,user=state.user;const updateGlobalProgress=()=>{state.progressCalls++};\n${persistCurrentSource}\nreturn {persist:mmPersistCurrentState,elements,snapshot:()=>({db,user})};`)(state,storage,document,elements);
  return {state,harness};
}
{
  const {state,harness}=makePersistenceHarness({setItem(){throw new Error('quota exceeded')}});
  assert.equal(harness.persist(),false,'ordinary persistence must report storage failure instead of silently claiming durability');
  assert.equal(state.progressCalls,1,'storage failure must not prevent the current session UI from updating');
  const warning=harness.elements.get('mmStorageDurabilityWarning');
  assert(warning,'storage failure must render a persistent session-only warning');
  assert.match(warning.textContent,/only for this session/);
  assert.match(warning.textContent,/Export a backup/);
}
{
  let stored='';
  const storage={setItem(k,v){assert.equal(k,'mouldmasterProDB');stored=String(v)}};
  const {state,harness}=makePersistenceHarness(storage);
  assert.equal(harness.persist(),true,'ordinary persistence must report a successful durable write');
  assert.equal(JSON.parse(stored).activeUser,'learner-1');
  assert.equal(state.progressCalls,1);
  assert.equal(harness.elements.has('mmStorageDurabilityWarning'),false,'successful persistence must not leave a session-only warning');
}
assert(source.includes('toast(durable?"Notes saved":"Note updated for this session only — browser storage is unavailable.")'),'note save wording must distinguish durable and session-only state');
assert.equal((source.match(/toast\(durable\?"Preferences saved":"Preferences updated for this session only — browser storage is unavailable\."\)/g)||[]).length,2,'profile preference save wording must distinguish durable and session-only state');
assert.equal((source.match(/toast\(durable\?"Learner created":"Learner created for this session only — browser storage is unavailable\."\)/g)||[]).length,2,'learner creation wording must distinguish durable and session-only state');
assert(source.includes('mm-session-only-result')&&source.includes('This result and any certificate earned are available only for this session'),'assessment evidence must disclose non-durable certificate/result state');
for(const id of ['',"bad'id",'bad"id','<tag>','bad\\id','bad/id','bad\nid','bad\rid','bad id','bad;id','bad(id)','-leading'])assert.equal(api.pvCanonicalLearnerId(id),'',`unsafe learner ID must be rejected: ${JSON.stringify(id)}`);
assert.equal(api.pvCanonicalLearnerId('a'.repeat(160)),'a'.repeat(160));
assert.equal(api.pvCanonicalLearnerId('a'.repeat(161)),'');

let registry=api.pvBuildImportedUsers({activeUser:'learner-1',users:{'learner-1':{name:'A'},'legacy.ID-3':{name:'B'}}});
assert.equal(registry.activeUser,'learner-1');assert.deepEqual(Object.keys(registry.users),['learner-1','legacy.ID-3']);
assert.deepEqual(registry.users['learner-1'].completed,[1],'standalone import must preserve ordinary learning progress');
assert.deepEqual(registry.users['learner-1'].certificates,[],'standalone import must strip imported certificates');
assert.deepEqual(registry.users['learner-1'].certificateMeta,{},'standalone import must strip imported certificate metadata');
assert.deepEqual(registry.users['learner-1'].examPassStatus,{},'standalone import must strip imported pass assertions');

function makeStandaloneCommitHarness(storage){
  const existingDb={activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Existing'}}};
  const existingUser=existingDb.users['learner-1'];
  const harness=new Function('state','localStorage',`${hasOwnSource}\nlet db=state.db,user=state.user;\n${commitSource}\nreturn {commit:pvCommitImportedUsers,snapshot:()=>({db,user})};`)({db:existingDb,user:existingUser},storage);
  return {existingDb,existingUser,harness};
}
{
  const storage={setItem(){throw new Error('quota exceeded')}};
  const {existingDb,existingUser,harness}=makeStandaloneCommitHarness(storage);
  const proposed={activeUser:'learner-2',users:{'learner-2':{id:'learner-2',name:'Imported'}}};
  assert.throws(()=>harness.commit(proposed),/quota exceeded/,'storage failure must surface to the import boundary');
  const state=harness.snapshot();
  assert.equal(state.db,existingDb,'storage failure must leave the live learner registry unchanged');
  assert.equal(state.user,existingUser,'storage failure must leave the live learner unchanged');
}
{
  let savedKey='',savedValue='';
  const storage={setItem(k,v){savedKey=String(k);savedValue=String(v)}};
  const {harness}=makeStandaloneCommitHarness(storage);
  const proposed={activeUser:'learner-2',users:{'learner-2':{id:'learner-2',name:'Imported'}}};
  harness.commit(proposed);
  const state=harness.snapshot();
  assert.equal(savedKey,'mouldmasterProDB');
  assert.equal(JSON.parse(savedValue).activeUser,'learner-2','successful import must persist the proposed registry');
  assert.equal(state.db,proposed,'live registry must activate only after storage succeeds');
  assert.equal(state.user,proposed.users['learner-2'],'live learner must match the persisted active learner');
}
function makeStandaloneResetHarness(storage){
  const existingDb={activeUser:'learner-9',users:{'learner-9':{id:'learner-9',name:'Existing'}}};
  const existingUser=existingDb.users['learner-9'];
  const resetPristine={activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Learner 1',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:'old'}}};
  const harness=new Function('state','localStorage','PRISTINE_DB',`let db=state.db,user=state.user;\n${resetCommitSource}\nreturn {commit:pvCommitPristineReset,snapshot:()=>({db,user})};`)({db:existingDb,user:existingUser},storage,resetPristine);
  return {existingDb,existingUser,resetPristine,harness};
}
{
  const storage={setItem(){throw new Error('storage denied')}};
  const {existingDb,existingUser,harness}=makeStandaloneResetHarness(storage);
  assert.throws(()=>harness.commit(),/storage denied/,'reset storage failure must surface to resetData');
  const state=harness.snapshot();
  assert.equal(state.db,existingDb,'failed reset must leave the live registry unchanged');
  assert.equal(state.user,existingUser,'failed reset must leave the live learner unchanged');
}
{
  let saved='';
  const storage={setItem(k,v){assert.equal(k,'mouldmasterProDB');saved=String(v)}};
  const {harness}=makeStandaloneResetHarness(storage);
  const proposed=harness.commit();
  const state=harness.snapshot();
  const persisted=JSON.parse(saved);
  assert.equal(persisted.activeUser,'learner-1','successful reset must persist the pristine active learner');
  assert.equal(persisted.users['learner-1'].onboardingDone,false,'successful reset must persist initialized learner defaults');
  assert.equal(state.db,proposed,'live reset registry must activate only after storage succeeds');
  assert.equal(state.user,proposed.users['learner-1'],'live reset learner must match persisted pristine learner');
}
assert(source.includes('try{pvCommitPristineReset()}catch(e){alert("MouldMaster could not reset local data because browser storage is unavailable. Existing learner data was left unchanged.");return}'),'standalone reset must fail closed with an explicit storage warning');
assert(source.indexOf('localStorage.setItem("mouldmasterProDB",serialized);',source.indexOf('function pvCommitPristineReset'))<source.indexOf('db=proposed;user=nextUser;',source.indexOf('function pvCommitPristineReset')),'standalone reset must persist before live-memory activation');

for(const bad of ["bad'id",'<tag>','bad\\id','bad\nid','bad id']){
  assert.throws(()=>api.pvBuildImportedUsers({activeUser:bad,users:{[bad]:{}}}),/Invalid learner identifier/);
}
assert.throws(()=>api.pvBuildImportedUsers({activeUser:'missing',users:{'learner-1':{}}}),/Missing active learner/);
assert.throws(()=>api.pvBuildImportedUsers({activeUser:'constructor',users:{'learner-1':{}}}),/Missing active learner/,'prototype property names must not satisfy learner membership');
const prototypeNamed=api.pvBuildImportedUsers({activeUser:'constructor',users:{constructor:{name:'Legacy'}}});
assert.equal(prototypeNamed.activeUser,'constructor','an explicitly owned safe legacy prototype-name ID remains supported');
assert.equal(Object.prototype.hasOwnProperty.call(prototypeNamed.users,'constructor'),true);

assert(!source.includes(`onclick="switchUser('${'${u.id}'})"`),'learner IDs must never be interpolated into inline JavaScript handlers');
assert.equal((source.match(/data-mm-switch-user="\$\{userIndex\}"/g)||[]).length,2,'both instructor renderers must use inert index tokens');
assert.equal((source.match(/pvWireInstructorSwitches\(users\);/g)||[]).length,2,'both instructor renderers must wire DOM events after rendering');

const wireSource=extractFunction('pvWireInstructorSwitches');
let switchedTo='';
const clickHandlers=[];
const buttons=[
  {dataset:{mmSwitchUser:'1'},addEventListener:(type,handler)=>{assert.equal(type,'click');clickHandlers.push(handler)}},
  {dataset:{mmSwitchUser:'99'},addEventListener:(type,handler)=>{assert.equal(type,'click');clickHandlers.push(handler)}}
];
const host={querySelectorAll(selector){assert.equal(selector,'[data-mm-switch-user]');return buttons}};
const wire=new Function('$','switchUser',`${wireSource}\nreturn pvWireInstructorSwitches;`)(selector=>selector==='#instructor'?host:null,id=>{switchedTo=id});
wire([{id:'learner-1'},{id:'legacy.ID-3'}]);
assert.equal(clickHandlers.length,2,'both rendered switch controls must receive click handlers');
clickHandlers[0]();
assert.equal(switchedTo,'legacy.ID-3','inert index token must resolve to the intended learner ID at click time');
switchedTo='';clickHandlers[1]();
assert.equal(switchedTo,'','out-of-range inert index must not switch a learner');

const switchSource=extractFunction('switchUser');
let switchState={db:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1'}}},persistCalls:0,toasts:[]};
const guardedSwitch=new Function(`${canonicalSource}\n${hasOwnSource}\nlet db=arguments[0].db,user=db.users[db.activeUser];const persist=()=>arguments[0].persistCalls++;const updateGlobalProgress=()=>{};const renderInstructor=()=>{};const toast=m=>arguments[0].toasts.push(m);${switchSource}\nreturn switchUser;`)(switchState);
guardedSwitch('constructor');
assert.equal(switchState.db.activeUser,'learner-1','prototype property names must not switch without an owned learner record');
assert.equal(switchState.persistCalls,0,'rejected prototype-name switch must not persist');
assert.equal(switchState.toasts.at(-1),'Learner profile unavailable');

const strictStart=source.indexOf('/* ---------- Strict backup import allowlist ---------- */');assert(strictStart>=0);
const strict=source.slice(strictStart);
assert(strict.includes('const keyId=pvRequireLearnerId(id);'),'strict normaliser must validate the registry key');
assert(strict.includes('if(embeddedId!==keyId)throw new Error("Learner identifier mismatch");'),'strict normaliser must reject embedded/key identity mismatch');
assert(strict.includes('const proposed=pvBuildImportedUsers(x);'),'strict import must build through the canonical learner-ID contract');
assert(strict.includes('pvHasOwnLearner(users,active)'),'strict import must require own learner membership for the active ID');
assert(strict.includes('clean.certificates=[];'),'standalone import must strip certificate assertions');
assert(strict.includes('clean.certificateMeta={};'),'standalone import must strip certificate metadata assertions');
assert(strict.includes('clean.examPassStatus={};'),'standalone import must strip pass-status assertions');
assert(strict.includes('if(file.size>10*1024*1024)'),'standalone import must reject oversized backups before FileReader allocation');
assert(strict.includes('pvCommitImportedUsers(proposed);'),'standalone import must use storage-first commit helper');
assert(source.includes('Object.prototype.hasOwnProperty.call(candidate.users,active)'),'startup registry must require own active learner membership');
assert(source.includes('mmStartupLearnerDataRejected=true'),'unsafe persisted registries must fail closed before user activation');
assert(source.includes('function mmStartupLearnerRecordIsSafe(record,id)'),'startup must validate persisted learner record shapes before render-time dereferences');
assert(source.includes('mmStartupUniqueLessonIdsAreSafe(record.completed)')&&source.includes('mmStartupUniqueLessonIdsAreSafe(record.bookmarks)')&&source.includes('mmStartupCertificatesAreSafe(record.certificates)'),'startup must require canonical unique in-range progress fields and recognized certificate keys');
assert(strict.indexOf('localStorage.setItem("mouldmasterProDB",serialized)')<strict.indexOf('db=proposed;user=nextUser;'),'standalone import commit must persist before live-memory activation');
assert(!strict.includes('!x.users[x.activeUser]'),'strict structural gate must not use inherited learner lookup');
assert(!strict.includes('users[pvCleanString(id,160)]=normaliseImportedUser(u,id)'),'strict import must not truncate unsafe learner IDs into registry keys');
const vm=require('node:vm');
const bridgeSource=fs.readFileSync('training-qa-fix.js','utf8');
assert.equal(bridgeSource.split('mmSetStorageDurability?.(true)').length-1,2,'hosted import/reset must clear stale session-only storage warnings after successful writes');
assert(bridgeSource.includes("const sid=requireCoreLearnerId(id);"),'hosted import bridge must use the canonical core learner-ID validator');
assert(bridgeSource.includes("if(hasOwnCoreLearner(users,sid))"),'hosted import bridge must use own-property duplicate membership');
assert(bridgeSource.includes("if(!hasOwnCoreLearner(users,active))"),'hosted import bridge must use own-property active membership');
assert(!bridgeSource.includes("String(id).slice(0,160)"),'hosted import bridge must not truncate learner IDs');
assert(!bridgeSource.includes("!x.users[x.activeUser]"),'hosted import bridge must not trust inherited active-user lookup');
assert(!bridgeSource.includes("clean.id=sid"),'hosted import bridge must not rewrite an inconsistent embedded learner ID');

function runBridgeImport(payload){
  const storageMap=new Map([['mouldmasterProDB',JSON.stringify({activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Existing'}}})]]);
  const writes=[];
  const alerts=[];
  const toasts=[];
  const storage={
    get length(){return storageMap.size},
    key(i){return [...storageMap.keys()][i]??null},
    getItem(k){return storageMap.has(k)?storageMap.get(k):null},
    setItem(k,v){writes.push([String(k),String(v)]);storageMap.set(String(k),String(v))},
    removeItem(k){storageMap.delete(String(k))}
  };
  class FakeFileReader{
    readAsText(file){this.result=file.contents;this.onload()}
  }
  const sandbox={
    console,
    localStorage:storage,
    FileReader:FakeFileReader,
    alert:m=>alerts.push(String(m)),
    confirm:()=>true,
    setTimeout,
    clearTimeout,
    db:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Existing'}}},
    user:{id:'learner-1',name:'Existing'},
    updateGlobalProgress:()=>{},
    switchView:()=>{},
    normaliseImportedUser:(u,id)=>{
      const embedded=u&&u.id!=null&&String(u.id)!==''?api.pvRequireLearnerId(u.id):id;
      if(embedded!==id)throw new Error('Learner identifier mismatch');
      return {id,name:String(u?.name||'Learner'),certificates:['old'],certificateMeta:{old:true},examPassStatus:{Advanced:true}};
    }
  };
  sandbox.window=sandbox;
  sandbox.window.pvRequireLearnerId=api.pvRequireLearnerId;
  sandbox.window.pvHasOwnLearner=api.pvHasOwnLearner;
  sandbox.window.toast=m=>toasts.push(String(m));
  vm.createContext(sandbox);
  vm.runInContext(bridgeSource,sandbox,{filename:'training-qa-fix.js'});
  const beforeWrites=writes.length;
  sandbox.window.importData({size:JSON.stringify(payload).length,contents:JSON.stringify(payload)});
  return {sandbox,writes:writes.slice(beforeWrites),alerts,toasts,storageMap};
}

for(const badId of ["bad'id",'<tag>','bad\\id','bad\nid','bad id']){
  const result=runBridgeImport({activeUser:badId,users:{[badId]:{id:badId,name:'Bad'}}});
  assert.equal(result.writes.length,0,`unsafe hosted-bridge learner ID must be rejected before staged storage writes: ${JSON.stringify(badId)}`);
  assert.equal(result.sandbox.db.activeUser,'learner-1');
  assert.match(result.alerts.at(-1)||'',/not a valid MouldMaster backup/);
}
{
  const result=runBridgeImport({activeUser:'constructor',users:{'learner-1':{id:'learner-1',name:'Existing'}}});
  assert.equal(result.writes.length,0,'prototype property name must not satisfy hosted-bridge active learner membership');
  assert.equal(result.sandbox.db.activeUser,'learner-1');
}
{
  const result=runBridgeImport({activeUser:'legacy.ID-3',users:{'legacy.ID-3':{id:'learner-1',name:'Mismatch'}}});
  assert.equal(result.writes.length,0,'embedded/key learner-ID mismatch must be rejected before hosted-bridge storage writes');
  assert.equal(result.sandbox.db.activeUser,'learner-1');
}
{
  const result=runBridgeImport({activeUser:'constructor',users:{constructor:{id:'constructor',name:'Owned legacy'}}});
  assert.equal(result.alerts.length,0,'explicitly owned safe legacy prototype-name ID should remain importable');
  assert.equal(result.sandbox.db.activeUser,'constructor');
  assert(result.writes.some(([key])=>key==='mouldmasterProDB'),'valid hosted-bridge import must stage learner progress');
  const saved=JSON.parse(result.storageMap.get('mouldmasterProDB'));
  assert.equal(saved.activeUser,'constructor');
  assert.equal(Object.prototype.hasOwnProperty.call(saved.users,'constructor'),true);
  assert.deepEqual(saved.users.constructor.certificates,[],'imported certificates must still be stripped');
}

console.log('Standalone learner-ID QA passed: canonical IDs preserve benign legacy punctuation, reject JS/HTML metacharacters/separators, and instructor switching resolves inert index tokens without learner-ID inline-code sinks.');

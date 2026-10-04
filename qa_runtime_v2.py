from pathlib import Path
import subprocess,textwrap

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

src=(ROOT/'src/domains/shared/runtime-v2.js').read_text(encoding='utf-8')
for marker in ['one owner at a time','registerModule','setImplementation','beforeHooks','afterHooks','learnerToken','legacy-captured','strongTokenFor','legacyTokenFor','ambiguous-known-owners']:
    need(marker in src,f'runtime v2 marker missing: {marker}')

node=textwrap.dedent(r'''
 global.window=global;
 global.localStorage={x:{},getItem(k){return Object.prototype.hasOwnProperty.call(this.x,k)?this.x[k]:null},setItem(k,v){this.x[k]=String(v)},removeItem(k){delete this.x[k]},key(i){return Object.keys(this.x)[i]??null},get length(){return Object.keys(this.x).length}};
 global.user={id:'learner-A'};global.db={activeUser:'learner-A',users:{'learner-A':{},'learner-B':{}}};
 for(const n of ['renderLesson','renderDashboard','switchView','startExam','gradeExam','getExamQuestions'])global[n]=function(){return `legacy-${n}`};
 require('./src/domains/shared/runtime-v2.js');
 if(!global.MM_RUNTIME_V2)throw new Error('runtime missing');
 let before=0,after=0;
 MM_RUNTIME_V2.before('getExamQuestions',()=>before++);
 MM_RUNTIME_V2.after('getExamQuestions',()=>after++);
 MM_RUNTIME_V2.setImplementation('getExamQuestions',()=>['v2'],'qa-owner');
 const out=global.getExamQuestions();
 if(out[0]!=='v2'||before!==1||after!==1)throw new Error('dispatcher hooks/implementation failed');
 let blocked=false;try{MM_RUNTIME_V2.setImplementation('getExamQuestions',()=>[],'other-owner')}catch(_){blocked=true}
 if(!blocked)throw new Error('runtime allowed second owner to replace core implementation');
 const a=MM_RUNTIME_V2.storage.key('state');db.activeUser='learner-B';user.id='learner-B';const b=MM_RUNTIME_V2.storage.key('state');if(a===b)throw new Error('runtime storage is not learner scoped');
 require('./src/domains/shared/learner-scope.js');
 if(MM_RUNTIME_V2.storage.learnerToken()!==MM_LEARNER_SCOPE.tokenFor('learner-B'))throw new Error('runtime storage token differs from canonical learner scope');

 // Concrete historical FNV collision: both valid learner IDs resolve to legacy token 1w9oy6y.
 db.users={'u8jiUWwff':{},'uqX4l4UnV':{}};db.activeUser='u8jiUWwff';user.id='u8jiUWwff';
 localStorage.setItem('collision-state::1w9oy6y',JSON.stringify({owner:'ambiguous-legacy'}));
 const ca=MM_RUNTIME_V2.storage.key('collision-state');
 db.activeUser='uqX4l4UnV';user.id='uqX4l4UnV';
 const cb=MM_RUNTIME_V2.storage.key('collision-state');
 if(ca===cb)throw new Error('known legacy collision still maps two learners to one runtime-v2 key');
 if(MM_RUNTIME_V2.storage.get('collision-state',null)!==null)throw new Error('ambiguous legacy collision was assigned to a learner');
 db.activeUser='u8jiUWwff';user.id='u8jiUWwff';
 if(MM_RUNTIME_V2.storage.get('collision-state',null)!==null)throw new Error('ambiguous legacy collision leaked to the other learner');

 // A uniquely owned legacy bucket must migrate losslessly to the 128-bit token.
 db.users={'learner-A':{}};db.activeUser='learner-A';user.id='learner-A';
 const legacy=MM_LEARNER_SCOPE.legacyTokenFor('learner-A');
 localStorage.setItem('unique-state::'+legacy,JSON.stringify({ok:1}));
 const migrated=MM_RUNTIME_V2.storage.get('unique-state',null);
 if(!migrated||migrated.ok!==1)throw new Error('unique legacy runtime-v2 state did not migrate');
 if(localStorage.getItem('unique-state::'+legacy)!==null)throw new Error('unique legacy runtime-v2 bucket was not removed after verified migration');

 // Missing learner identity must never create a durable anonymous runtime bucket.
 db.activeUser='';user.id='';
 const beforeKeys=Object.keys(localStorage.x).slice().sort();
 if(MM_RUNTIME_V2.storage.key('missing-state')!==null)throw new Error('missing learner identity produced a runtime storage key');
 if(MM_RUNTIME_V2.storage.learnerToken()!==null)throw new Error('missing learner identity produced a runtime learner token');
 if(MM_RUNTIME_V2.storage.set('missing-state',{unsafe:true})!==false)throw new Error('missing learner identity accepted a runtime storage write');
 if(JSON.stringify(Object.keys(localStorage.x).slice().sort())!==JSON.stringify(beforeKeys))throw new Error('missing learner identity created durable runtime storage');
 console.log(JSON.stringify(MM_RUNTIME_V2.snapshot()));
''')
proc=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True)
need(proc.returncode==0,f'runtime v2 execution failed: {proc.stderr or proc.stdout}')
print('MouldMaster runtime v2 QA passed (single-owner dispatch, canonical 128-bit learner scope, collision-safe legacy migration)')
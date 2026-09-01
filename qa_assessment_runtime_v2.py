from pathlib import Path
import subprocess
import textwrap

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

src=(ROOT/'assessment-runtime-v2.js').read_text(encoding='utf-8')
for marker in [
    "STORAGE_BASE='mm_assessment_membership_history_v2'",
    "BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting']",
    'technicalPerExam:7','technicalBankPerLevel:10','least-exposed blueprint-preserving stable IDs',
    'each generated form advances exposure', 'x.version===VERSION', 'forms:{}',
    'coverageSimulation',"R.setImplementation('getExamQuestions',selector,'assessment-runtime-v2')"
]: need(marker in src,f'assessment runtime v2 marker missing: {marker}')
need('attempts:{}' not in src,'generated-form exposure history must not be mislabeled as submitted attempts')

node=textwrap.dedent(r'''
  global.window=global;
  let learner='A';
  global.user={get id(){return learner}};
  const backing={};
  global.localStorage={getItem:k=>backing[k]??null,setItem:(k,v)=>backing[k]=String(v),removeItem:k=>delete backing[k]};
  const mk=(level,i,text)=>[text,[`A${i}`,`B${i}`,`C${i}`,`D${i}`],0,'why','ref','https://example.com',[],false];
  const texts=[
    'Material moisture and drying evidence',
    'Machine screw cushion recovery actuals',
    'Mould cavity gate runner tooling evidence',
    'Fill pack hold pressure process response',
    'Capability measurement quality Cpk evidence',
    'Troubleshoot defect drift strongest investigation',
    'Material rheology viscosity comparison',
    'Machine setpoint actual controller response',
    'Cooling mould warpage local tooling diagnosis',
    'DOE validation measurement process window'
  ];
  global.MM_DATA={exams:{},regionalQuestions:{UK:{},US:{},NZ:{}}};
  for(const level of ['Beginner','Intermediate','Advanced']){
    MM_DATA.exams[level]=texts.map((t,i)=>mk(level,i,t));
    for(const r of ['UK','US','NZ'])MM_DATA.regionalQuestions[r][level]=[0,1,2].map(i=>[`Safety ${r} ${i}`,[1,2,3,4],0,'why','law','https://example.com',[],true]);
  }
  for(const n of ['renderLesson','renderDashboard','switchView','startExam','gradeExam'])global[n]=()=>{};
  global.getExamQuestions=()=>[];
  require('./runtime-v2.js');
  require('./assessment-runtime-v2.js');
  const keyA=MM_ASSESSMENT_RUNTIME_V2.storageKey();
  backing[keyA]=JSON.stringify({schema:2,version:'stale-bank-runtime',forms:{Beginner:99},items:{'tech:Beginner:0':{count:99,last:99}}});
  global.getExamQuestions('Beginner','NZ');
  let h=JSON.parse(backing[keyA]);
  if(h.forms.Beginner!==1)throw new Error('stale selection history was not reset when the assessment runtime/bank version changed');
  MM_ASSESSMENT_RUNTIME_V2.resetHistory();
  for(const level of ['Beginner','Intermediate','Advanced']){
    const seen=new Set();
    for(let form=0;form<3;form++){
      const rows=global.getExamQuestions(level,'NZ');
      const tech=rows.filter(x=>x.kind==='technical');
      if(tech.length!==7)throw new Error(`${level} did not select 7 technical items`);
      const covered=new Set(tech.flatMap(x=>x.competencies));
      for(const domain of MM_ASSESSMENT_RUNTIME_V2.blueprint)if(!covered.has(domain))throw new Error(`${level} missing ${domain}`);
      tech.forEach(x=>seen.add(x.stableId));
    }
    if(seen.size!==10)throw new Error(`${level} bank coverage ${seen.size}/10 after 3 generated forms`);
  }
  if(!backing[keyA])throw new Error('learner A membership history not persisted');
  h=JSON.parse(backing[keyA]);
  if(h.schema!==2||h.version!==MM_ASSESSMENT_RUNTIME_V2.version)throw new Error('current membership history schema/version not persisted');
  learner='B';
  const keyB=MM_ASSESSMENT_RUNTIME_V2.storageKey();
  if(keyA===keyB)throw new Error('membership history is not learner scoped');
  global.getExamQuestions('Beginner','NZ');
  if(!backing[keyB])throw new Error('learner B history not persisted');
  if(JSON.parse(backing[keyB]).forms.Beginner!==1)throw new Error('learner B inherited learner A generated-form history');
  const snap=MM_RUNTIME_V2.snapshot();
  if(snap.core.getExamQuestions.owner!=='assessment-runtime-v2')throw new Error('assessment selector does not own runtime v2 slot');
  console.log('assessment runtime v2 node QA passed');
''')
proc=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True)
need(proc.returncode==0,f'assessment runtime v2 execution failed: {proc.stderr or proc.stdout}')
print('MouldMaster assessment runtime v2 QA passed (six-domain blueprint each generated form; 10/10 technical stable IDs exposed within three forms; learner-scoped/versioned exposure history; single runtime owner)')

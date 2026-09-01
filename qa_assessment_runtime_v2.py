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
    'coverageSimulation','window.getExamQuestions=function'
]: need(marker in src,f'assessment runtime v2 marker missing: {marker}')

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
  global.getExamQuestions=()=>[];
  require('./assessment-runtime-v2.js');
  for(const level of ['Beginner','Intermediate','Advanced']){
    const seen=new Set();
    for(let attempt=0;attempt<3;attempt++){
      const rows=global.getExamQuestions(level,'NZ');
      const tech=rows.filter(x=>x.kind==='technical');
      if(tech.length!==7)throw new Error(`${level} did not select 7 technical items`);
      const covered=new Set(tech.flatMap(x=>x.competencies));
      for(const domain of MM_ASSESSMENT_RUNTIME_V2.blueprint)if(!covered.has(domain))throw new Error(`${level} missing ${domain}`);
      tech.forEach(x=>seen.add(x.stableId));
    }
    if(seen.size!==10)throw new Error(`${level} bank coverage ${seen.size}/10 after 3 attempts`);
  }
  const keyA=MM_ASSESSMENT_RUNTIME_V2.storageKey();
  if(!backing[keyA])throw new Error('learner A membership history not persisted');
  learner='B';
  const keyB=MM_ASSESSMENT_RUNTIME_V2.storageKey();
  if(keyA===keyB)throw new Error('membership history is not learner scoped');
  global.getExamQuestions('Beginner','NZ');
  if(!backing[keyB])throw new Error('learner B history not persisted');
  if(JSON.parse(backing[keyB]).attempts.Beginner!==1)throw new Error('learner B inherited learner A attempts');
  console.log('assessment runtime v2 node QA passed');
''')
proc=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True)
need(proc.returncode==0,f'assessment runtime v2 execution failed: {proc.stderr or proc.stdout}')
print('MouldMaster assessment runtime v2 QA passed (six-domain blueprint each attempt; 10/10 technical stable IDs exposed within three attempts; learner-scoped history)')

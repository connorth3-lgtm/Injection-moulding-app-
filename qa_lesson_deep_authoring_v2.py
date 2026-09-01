from pathlib import Path
import subprocess
import textwrap

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

src=(ROOT/'lesson-deep-authoring-v2.js').read_text(encoding='utf-8')
for marker in ['requires the canonical 120-lesson pathway','Mechanism → evidence → decision','Misconception check','Teach-back','duplicate lesson records','substantively identical','pedagogicalPayload','Engineering boundary','Safety boundary',"R.after('renderLesson'","R.registerModule('lesson-deep-authoring-v2'"]:
    need(marker in src,f'lesson deep authoring marker missing: {marker}')
need('window.renderLesson=function' not in src,'v2 lesson layer must use runtime hooks instead of another renderLesson wrapper')

node=textwrap.dedent(r'''
  global.window=global;
  global.document={documentElement:null,querySelector:()=>null,getElementById:()=>null,createElement:()=>({}),head:{appendChild:()=>{}}};
  global.MutationObserver=function(){this.observe=()=>{}};
  global.requestAnimationFrame=fn=>fn();
  global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
  global.MM_DATA={lessons:Array.from({length:120},(_,i)=>({id:i+1,title:`Lesson ${i+1} topic ${i%12}`,courseName:`Course ${1+(i%12)}`,summary:`Unique mechanism summary ${i+1}`,objectives:[`Identify evidence ${i+1}`,`Explain decision ${i+1}`],keypoints:[`Key mechanism ${i+1}`,`Boundary evidence ${i+1}`],exercise:`Apply controlled case ${i+1}`,mmGuide:{evidence:`Compare actual ${i+1}`,mistake:`Do not guess ${i+1}`}}))};
  for(const n of ['renderLesson','renderDashboard','switchView','startExam','gradeExam','getExamQuestions'])global[n]=()=>{};
  global.currentLesson=()=>MM_DATA.lessons[0];
  require('./runtime-v2.js');
  require('./lesson-deep-authoring-v2.js');
  const a=global.MM_LESSON_DEEP_AUTHORING_V2;
  if(a.total!==120)throw new Error(`expected 120 records, got ${a.total}`);
  const fps=new Set(a.records.map(x=>x.fingerprint));
  if(fps.size!==120)throw new Error(`expected 120 unique substantive fingerprints, got ${fps.size}`);
  for(const r of a.records){
    if(!r.mechanism||!r.decision||!r.misconception||!r.teachBack)throw new Error(`incomplete record ${r.id}`);
    if(!Array.isArray(r.evidence)||r.evidence.length<2)throw new Error(`weak evidence chain ${r.id}`);
  }
  const snap=MM_RUNTIME_V2.snapshot();
  if(!snap.modules.some(x=>x.id==='lesson-deep-authoring-v2'))throw new Error('lesson authoring module not registered in runtime v2');
  if(snap.core.renderLesson.afterHooks<1)throw new Error('lesson authoring after-render hook not registered');
  console.log('lesson authoring v2 node QA passed');
''')
proc=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True)
need(proc.returncode==0,f'lesson deep authoring runtime QA failed: {proc.stderr or proc.stdout}')

# Negative regression: identity metadata must not hide duplicate pedagogical content.
duplicate_node=textwrap.dedent(r'''
  global.window=global;
  global.document={documentElement:null,querySelector:()=>null,getElementById:()=>null,createElement:()=>({}),head:{appendChild:()=>{}}};
  global.MutationObserver=function(){this.observe=()=>{}};
  global.requestAnimationFrame=fn=>fn();
  global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
  const lessons=Array.from({length:120},(_,i)=>({id:i+1,title:`Distinct title ${i+1}`,courseName:`Course ${1+(i%12)}`,summary:`Unique substantive mechanism ${i+1}`,objectives:[`Evidence ${i+1}`,`Decision ${i+1}`],keypoints:[`Mechanism ${i+1}`],exercise:`Apply ${i+1}`,mmGuide:{evidence:`Compare ${i+1}`,mistake:`Mistake ${i+1}`}}));
  lessons[1]={...lessons[0],id:2,title:'Different identity and title',courseName:'Different course'};
  global.MM_DATA={lessons};
  for(const n of ['renderLesson','renderDashboard','switchView','startExam','gradeExam','getExamQuestions'])global[n]=()=>{};
  require('./runtime-v2.js');
  require('./lesson-deep-authoring-v2.js');
''')
dup=subprocess.run(['node','-e',duplicate_node],cwd=ROOT,text=True,capture_output=True)
need(dup.returncode!=0,'substantively duplicate lesson content was accepted because identity metadata differed')
need('substantively identical' in (dup.stderr+dup.stdout),'duplicate-content failure did not identify the substantive collision')
print('MouldMaster lesson deep authoring v2 QA passed (120/120 substantively unique lesson-specific records through canonical runtime hook; duplicate identity masking rejected)')

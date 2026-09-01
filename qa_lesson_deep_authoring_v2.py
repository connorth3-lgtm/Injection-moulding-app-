from pathlib import Path
import subprocess
import textwrap

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

src=(ROOT/'lesson-deep-authoring-v2.js').read_text(encoding='utf-8')
for marker in ['requires the canonical 120-lesson pathway','Mechanism → evidence → decision','Misconception check','Teach-back','duplicate lesson records','Engineering boundary','Safety boundary']:
    need(marker in src,f'lesson deep authoring marker missing: {marker}')

node=textwrap.dedent(r'''
  global.window=global;
  global.document={documentElement:null,querySelector:()=>null,getElementById:()=>null,createElement:()=>({}),head:{appendChild:()=>{}}};
  global.MutationObserver=function(){this.observe=()=>{}};
  global.requestAnimationFrame=fn=>fn();
  global.MM_DATA={lessons:Array.from({length:120},(_,i)=>({id:i+1,title:`Lesson ${i+1} topic ${i%12}`,courseName:`Course ${1+(i%12)}`,summary:`Unique mechanism summary ${i+1}`,objectives:[`Identify evidence ${i+1}`,`Explain decision ${i+1}`],keypoints:[`Key mechanism ${i+1}`,`Boundary evidence ${i+1}`],exercise:`Apply controlled case ${i+1}`,mmGuide:{evidence:`Compare actual ${i+1}`,mistake:`Do not guess ${i+1}`}}))};
  global.renderLesson=()=>{};
  global.currentLesson=()=>MM_DATA.lessons[0];
  require('./lesson-deep-authoring-v2.js');
  const a=global.MM_LESSON_DEEP_AUTHORING_V2;
  if(a.total!==120)throw new Error(`expected 120 records, got ${a.total}`);
  const fps=new Set(a.records.map(x=>x.fingerprint));
  if(fps.size!==120)throw new Error(`expected 120 unique fingerprints, got ${fps.size}`);
  for(const r of a.records){
    if(!r.mechanism||!r.decision||!r.misconception||!r.teachBack)throw new Error(`incomplete record ${r.id}`);
    if(!Array.isArray(r.evidence)||r.evidence.length<2)throw new Error(`weak evidence chain ${r.id}`);
  }
  console.log('lesson authoring v2 node QA passed');
''')
proc=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True)
need(proc.returncode==0,f'lesson deep authoring runtime QA failed: {proc.stderr or proc.stdout}')
print('MouldMaster lesson deep authoring v2 QA passed (120/120 unique lesson-specific mechanism/evidence/decision/teach-back records)')

from pathlib import Path
import subprocess,textwrap

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

src=(ROOT/'runtime-v2.js').read_text(encoding='utf-8')
for marker in ['one owner at a time','registerModule','setImplementation','beforeHooks','afterHooks','learnerToken','legacy-captured']:
    need(marker in src,f'runtime v2 marker missing: {marker}')

node=textwrap.dedent(r'''
 global.window=global;
 global.localStorage={x:{},getItem(k){return this.x[k]??null},setItem(k,v){this.x[k]=String(v)},removeItem(k){delete this.x[k]}};
 global.user={id:'learner-A'};
 for(const n of ['renderLesson','renderDashboard','switchView','startExam','gradeExam','getExamQuestions'])global[n]=function(){return `legacy-${n}`};
 require('./runtime-v2.js');
 if(!global.MM_RUNTIME_V2)throw new Error('runtime missing');
 let before=0,after=0;
 MM_RUNTIME_V2.before('getExamQuestions',()=>before++);
 MM_RUNTIME_V2.after('getExamQuestions',()=>after++);
 MM_RUNTIME_V2.setImplementation('getExamQuestions',()=>['v2'],'qa-owner');
 const out=global.getExamQuestions();
 if(out[0]!=='v2'||before!==1||after!==1)throw new Error('dispatcher hooks/implementation failed');
 let blocked=false;try{MM_RUNTIME_V2.setImplementation('getExamQuestions',()=>[],'other-owner')}catch(_){blocked=true}
 if(!blocked)throw new Error('runtime allowed second owner to replace core implementation');
 const a=MM_RUNTIME_V2.storage.key('state');user.id='learner-B';const b=MM_RUNTIME_V2.storage.key('state');if(a===b)throw new Error('runtime storage is not learner scoped');
 console.log(JSON.stringify(MM_RUNTIME_V2.snapshot()));
''')
proc=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True)
need(proc.returncode==0,f'runtime v2 execution failed: {proc.stderr or proc.stdout}')
print('MouldMaster runtime v2 QA passed (single-owner core dispatch, named hooks, learner-scoped storage)')

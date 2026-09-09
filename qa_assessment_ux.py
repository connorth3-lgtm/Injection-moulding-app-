from pathlib import Path
import json
import re
import subprocess
import textwrap

ROOT = Path(__file__).resolve().parent


def require(condition, message):
    if not condition:
        raise AssertionError(message)


ux = (ROOT / 'assessment-ux.js').read_text(encoding='utf-8')
runtime = (ROOT / 'runtime-v2.js').read_text(encoding='utf-8')
index = (ROOT / 'index.html').read_text(encoding='utf-8')
sw = (ROOT / 'service-worker.js').read_text(encoding='utf-8')
integrity = (ROOT / 'desktop/electron/scripts/generate-integrity.cjs').read_text(encoding='utf-8')
pkg = json.loads((ROOT / 'desktop/electron/package.json').read_text(encoding='utf-8'))

for marker in [
    'mm-focus-mode','mm-option-selected','mm-step-answered','aria-live','Review unanswered','grade.disabled','mm-exam-reviewed',
    'FIRST_HISTORY_LIMIT=3',"HISTORY_KEY='mm_assessment_opening_history_v2'",'rotateOpeningQuestion','firstQuestionHistory','readQuestionHistory','persistQuestionHistory',
    'R.storage.get(HISTORY_KEY','R.storage.set(HISTORY_KEY','R.storage.remove(HISTORY_KEY)',"R.transform('getExamQuestions'","R.after('startExam'","R.after('gradeExam'",
    'recent.includes(current)','!recent.includes(questionIdentity(item))',"scope:'learner + level + region'",
]:
    require(marker in ux, f'assessment UX safeguard missing: {marker}')

for forbidden in ['window.getExamQuestions=function','window.startExam=function','window.gradeExam=function','localStorage.setItem(HISTORY_KEY','localStorage.getItem(HISTORY_KEY)']:
    require(forbidden not in ux, f'assessment UX must use runtime-v2 rather than global/unscoped legacy behavior: {forbidden}')
require('D.exams' not in ux, 'assessment UX layer must not rewrite the exam question bank')
require('activeExam.questions=' not in ux, 'assessment UX layer must not rewrite active assessment questions')
require("transform:new Set()" in runtime and 'function transform(name,fn)' in runtime, 'runtime-v2 transform hook is required for assessment rotation')
require("['./assessment-ux.js','<script src=\"./assessment-ux.js\">']" in index, 'assessment UX must load from the runtime bootstrap')
require(index.find('runtime-v2.js') < index.find('assessment-ux.js'), 'assessment UX must load after runtime-v2')
require("'./assessment-ux.js'" in sw, 'assessment UX must be available offline')
require("'assessment-ux.js'" in integrity, 'desktop integrity manifest must include assessment UX')
extra = pkg['build']['extraResources']
from_paths = {x.get('from') for x in extra if isinstance(x, dict)}
require('../../assessment-ux.js' in from_paths, 'desktop bundle must include assessment UX')

shell_release = re.search(r'const SHELL_RELEASE="([^"]+)"', index)
cache = re.search(r"const CACHE_REVISION='([^']+)'", sw)
require(shell_release is not None and re.fullmatch(r'\d{4}\.\d{2}\.\d{2}\.\d+', shell_release.group(1)), 'canonical browser release must use YYYY.MM.DD.N')
require('const RUNTIME_ASSET_VERSION=SHELL_RELEASE;' in index, 'assessment runtime asset identity must derive from canonical shell/web release')
require(cache is not None and bool(cache.group(1).strip()), 'offline cache must retain an explicit independent revision token')

node_test = textwrap.dedent(r'''
  global.window=global;
  const backing={};
  global.localStorage={
    getItem:key=>Object.prototype.hasOwnProperty.call(backing,key)?backing[key]:null,
    setItem:(key,value)=>{backing[key]=String(value)},
    removeItem:key=>{delete backing[key]}
  };
  global.document={
    documentElement:{},
    getElementById:()=>null,
    createElement:()=>({id:'',textContent:'',appendChild:()=>{},setAttribute:()=>{}}),
    head:{appendChild:()=>{}},
    querySelector:()=>null,
    querySelectorAll:()=>[]
  };
  global.requestAnimationFrame=fn=>fn();
  global.matchMedia=()=>({matches:false});
  global.db={activeUser:'A'};
  const baseQuestions=()=>[
    {stableId:'q1',q:'Q1'},{stableId:'q2',q:'Q2'},{stableId:'q3',q:'Q3'},{stableId:'q4',q:'Q4'},{stableId:'q5',q:'Q5'}
  ];
  function install(){
    global.getExamQuestions=baseQuestions;
    global.startExam=()=>{};global.gradeExam=()=>{};global.renderLesson=()=>{};global.renderDashboard=()=>{};global.switchView=()=>{};global.answerScenario=()=>{};
    delete global.MM_RUNTIME_V2;delete global.MM_ASSESSMENT_UX;
    delete require.cache[require.resolve('./runtime-v2.js')];delete require.cache[require.resolve('./assessment-ux.js')];
    require('./runtime-v2.js');require('./assessment-ux.js');
  }

  install();
  const openings=[];
  for(let i=0;i<3;i++) openings.push(global.getExamQuestions('Beginner','NZ')[0].stableId);
  const aKey=global.MM_ASSESSMENT_UX.questionRotation.storageKey();
  const storedBeforeReload=JSON.parse(backing[aKey]||'{}');
  if((storedBeforeReload['Beginner::NZ']||[]).length!==3) throw new Error('opening history was not persisted before reload');
  const recentBeforeReload=openings.slice(-3);

  install();
  const afterReload=global.getExamQuestions('Beginner','NZ')[0].stableId;
  openings.push(afterReload);
  if(recentBeforeReload.includes(afterReload)) throw new Error(`opening question repeated across reload boundary: ${openings.join(',')}`);

  global.db.activeUser='B';
  const learnerBFirst=global.getExamQuestions('Beginner','NZ')[0].stableId;
  if(learnerBFirst!=='q1') throw new Error(`learner B inherited learner A history: ${learnerBFirst}`);
  const bKey=global.MM_ASSESSMENT_UX.questionRotation.storageKey();
  if(aKey===bKey||!backing[bKey]) throw new Error('learner B opening history was not stored in a distinct runtime-v2 scope');

  global.db.activeUser='A';
  const aRecent=JSON.parse(backing[aKey]||'{}')['Beginner::NZ']||[];
  const afterLearnerReturn=global.getExamQuestions('Beginner','NZ')[0].stableId;
  openings.push(afterLearnerReturn);
  if(aRecent.includes(afterLearnerReturn)) throw new Error('learner A history was not restored after switching back');

  for(let i=openings.length;i<12;i++) openings.push(global.getExamQuestions('Beginner','NZ')[0].stableId);
  for(let i=1;i<openings.length;i++){
    const recent=openings.slice(Math.max(0,i-3),i);
    if(recent.includes(openings[i])) throw new Error(`opening question repeated inside history window: ${openings.join(',')}`);
  }
  const usFirst=global.getExamQuestions('Beginner','US')[0].stableId;
  if(usFirst!=='q1') throw new Error('rotation history leaked between region scopes');
  if(global.MM_ASSESSMENT_UX?.questionRotation?.historyLimit!==3) throw new Error('rotation metadata missing');
  if(!/learner-scoped localStorage/.test(global.MM_ASSESSMENT_UX?.questionRotation?.persistence||'')) throw new Error('rotation persistence metadata missing learner scope');
  if(global.MM_RUNTIME_V2.assertBound().ok!==true) throw new Error('runtime-v2 dispatcher lost ownership during assessment UX installation');

  global.MM_ASSESSMENT_UX.resetQuestionRotation();
  if(backing[aKey]!==undefined) throw new Error('rotation reset did not clear active learner persisted history');
  if(backing[bKey]===undefined) throw new Error('active learner reset incorrectly cleared another learner history');
  if(global.getExamQuestions('Beginner','NZ')[0].stableId!=='q1') throw new Error('rotation reset did not restore a clean active learner history');
  console.log(openings.join(','));
''')
proc = subprocess.run(['node', '-e', node_test],cwd=ROOT,text=True,capture_output=True)
require(proc.returncode == 0, f'assessment opening-question rotation runtime test failed: {proc.stderr or proc.stdout}')

print('MouldMaster assessment UX QA passed (Runtime V2 transform hook; persistent learner-scoped 3-item opening history across starts, reloads and learner switches)')

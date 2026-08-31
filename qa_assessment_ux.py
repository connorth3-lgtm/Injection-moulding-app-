from pathlib import Path
import json
import subprocess
import textwrap

ROOT = Path(__file__).resolve().parent


def require(condition, message):
    if not condition:
        raise AssertionError(message)


ux = (ROOT / 'assessment-ux.js').read_text(encoding='utf-8')
index = (ROOT / 'index.html').read_text(encoding='utf-8')
sw = (ROOT / 'service-worker.js').read_text(encoding='utf-8')
integrity = (ROOT / 'desktop/electron/scripts/generate-integrity.cjs').read_text(encoding='utf-8')
pkg = json.loads((ROOT / 'desktop/electron/package.json').read_text(encoding='utf-8'))

for marker in [
    'mm-focus-mode',
    'mm-option-selected',
    'mm-step-answered',
    'aria-live',
    'Review unanswered',
    'grade.disabled',
    'mm-exam-reviewed',
    'window.startExam=function',
    'window.gradeExam=function',
    'FIRST_HISTORY_LIMIT=3',
    "HISTORY_KEY='mm_assessment_opening_history_v1'",
    'rotateOpeningQuestion',
    'firstQuestionHistory',
    'readQuestionHistory',
    'persistQuestionHistory',
    'localStorage.getItem(HISTORY_KEY)',
    'localStorage.setItem(HISTORY_KEY',
    'window.getExamQuestions=function',
    'recent.includes(current)',
    '!recent.includes(questionIdentity(item))',
    "scope:'learner + level + region'",
]:
    require(marker in ux, f'assessment UX safeguard missing: {marker}')

require('D.exams' not in ux, 'assessment UX layer must not rewrite the exam question bank')
require('activeExam.questions=' not in ux, 'assessment UX layer must not rewrite active assessment questions')
require("['./assessment-ux.js','<script src=\"./assessment-ux.js\">']" in index, 'assessment UX must load from the runtime bootstrap')
require(index.find('assessment-final-hardening.js') < index.find('assessment-ux.js'), 'assessment UX must load after final assessment hardening')
require("'./assessment-ux.js'" in sw, 'assessment UX must be available offline')
require("'assessment-ux.js'" in integrity, 'desktop integrity manifest must include assessment UX')
extra = pkg['build']['extraResources']
from_paths = {x.get('from') for x in extra if isinstance(x, dict)}
require('../../assessment-ux.js' in from_paths, 'desktop bundle must include assessment UX')
require('assessment-question-rotation-20260831' in index, 'runtime bundle must be cache-bumped for the rotation fix')
require("CACHE_REVISION='assessment-question-rotation-20260831'" in sw, 'offline cache must be bumped for the rotation fix')

# Execute the real browser layer in Node with a minimal DOM shim. The underlying generator
# deliberately returns the same order every time. Storage is learner-scoped in the shim so
# the test covers same-page starts, a full reload/reopen, and switching learners without
# reloading the module. The wrapper must resynchronise from the active learner's history.
node_test = textwrap.dedent(r'''
  global.window=global;
  global.document={
    documentElement:{},
    getElementById:()=>null,
    createElement:()=>({id:'',textContent:''}),
    head:{appendChild:()=>{}}
  };
  const backing={};
  let learner='A';
  const scopedKey=key=>key==='mm_assessment_opening_history_v1'?`${key}::${learner}`:key;
  global.localStorage={
    getItem:key=>{const k=scopedKey(key);return Object.prototype.hasOwnProperty.call(backing,k)?backing[k]:null},
    setItem:(key,value)=>{backing[scopedKey(key)]=String(value)},
    removeItem:key=>{delete backing[scopedKey(key)]}
  };
  const baseQuestions=()=>[
    {stableId:'q1',q:'Q1'},
    {stableId:'q2',q:'Q2'},
    {stableId:'q3',q:'Q3'},
    {stableId:'q4',q:'Q4'},
    {stableId:'q5',q:'Q5'}
  ];
  function install(){
    global.getExamQuestions=baseQuestions;
    global.startExam=()=>{};
    global.gradeExam=()=>{};
    global.answerScenario=()=>{};
    delete require.cache[require.resolve('./assessment-ux.js')];
    require('./assessment-ux.js');
  }

  install();
  const openings=[];
  for(let i=0;i<3;i++) openings.push(global.getExamQuestions('Beginner','NZ')[0].stableId);
  const aKey='mm_assessment_opening_history_v1::A';
  const storedBeforeReload=JSON.parse(backing[aKey]||'{}');
  if((storedBeforeReload['Beginner::NZ']||[]).length!==3) throw new Error('opening history was not persisted before reload');
  const recentBeforeReload=openings.slice(-3);

  install();
  const afterReload=global.getExamQuestions('Beginner','NZ')[0].stableId;
  openings.push(afterReload);
  if(recentBeforeReload.includes(afterReload)) throw new Error(`opening question repeated across reload boundary: ${openings.join(',')}`);

  learner='B';
  const learnerBFirst=global.getExamQuestions('Beginner','NZ')[0].stableId;
  if(learnerBFirst!=='q1') throw new Error(`learner B inherited learner A in-memory history: ${learnerBFirst}`);
  if(!backing['mm_assessment_opening_history_v1::B']) throw new Error('learner B opening history was not stored in its own scope');

  learner='A';
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

  global.MM_ASSESSMENT_UX.resetQuestionRotation();
  if(backing[aKey]!==undefined) throw new Error('rotation reset did not clear active learner persisted history');
  if(backing['mm_assessment_opening_history_v1::B']===undefined) throw new Error('active learner reset incorrectly cleared another learner history');
  if(global.getExamQuestions('Beginner','NZ')[0].stableId!=='q1') throw new Error('rotation reset did not restore a clean active learner history');
  console.log(openings.join(','));
''')
proc = subprocess.run(
    ['node', '-e', node_test],
    cwd=ROOT,
    text=True,
    capture_output=True,
)
require(proc.returncode == 0, f'assessment opening-question rotation runtime test failed: {proc.stderr or proc.stdout}')

print('MouldMaster assessment UX QA passed (persistent learner-scoped 3-item opening history across starts, reloads and learner switches)')

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
    'rotateOpeningQuestion',
    'firstQuestionHistory',
    'window.getExamQuestions=function',
    'recent.includes(current)',
    '!recent.includes(questionIdentity(item))',
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
# deliberately returns the same order every time; the UX wrapper must still rotate the
# opening item and keep the last three opening questions out of the next opening slot.
node_test = textwrap.dedent(r'''
  global.window=global;
  global.document={
    documentElement:{},
    getElementById:()=>null,
    createElement:()=>({id:'',textContent:''}),
    head:{appendChild:()=>{}}
  };
  global.getExamQuestions=()=>[
    {stableId:'q1',q:'Q1'},
    {stableId:'q2',q:'Q2'},
    {stableId:'q3',q:'Q3'},
    {stableId:'q4',q:'Q4'},
    {stableId:'q5',q:'Q5'}
  ];
  global.startExam=()=>{};
  global.gradeExam=()=>{};
  global.answerScenario=()=>{};
  require('./assessment-ux.js');
  const openings=[];
  for(let i=0;i<12;i++) openings.push(global.getExamQuestions('Beginner','NZ')[0].stableId);
  for(let i=1;i<openings.length;i++){
    const recent=openings.slice(Math.max(0,i-3),i);
    if(recent.includes(openings[i])) throw new Error(`opening question repeated inside history window: ${openings.join(',')}`);
  }
  const usFirst=global.getExamQuestions('Beginner','US')[0].stableId;
  if(usFirst!=='q1') throw new Error('rotation history leaked between region scopes');
  if(global.MM_ASSESSMENT_UX?.questionRotation?.historyLimit!==3) throw new Error('rotation metadata missing');
  console.log(openings.join(','));
''')
proc = subprocess.run(
    ['node', '-e', node_test],
    cwd=ROOT,
    text=True,
    capture_output=True,
)
require(proc.returncode == 0, f'assessment opening-question rotation runtime test failed: {proc.stderr or proc.stdout}')

print('MouldMaster assessment UX QA passed (opening-question repeat guard: 3-item history)')

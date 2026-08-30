from pathlib import Path
import json
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
JS = (ROOT / 'diagnostic-learning-labs.js').read_text(encoding='utf-8')
INDEX = (ROOT / 'index.html').read_text(encoding='utf-8')
SW = (ROOT / 'service-worker.js').read_text(encoding='utf-8')
PKG = (ROOT / 'desktop' / 'electron' / 'package.json').read_text(encoding='utf-8')
INTEGRITY = (ROOT / 'desktop' / 'electron' / 'scripts' / 'generate-integrity.cjs').read_text(encoding='utf-8')
LOWER_JS = JS.lower()


def need(condition, message):
    if not condition:
        raise AssertionError(message)


need("MM_DIAGNOSTIC_LABS" in JS, 'diagnostic lab public metadata missing')
need("learner-scoped local progress only" in JS, 'diagnostic progress must remain local/learner scoped')
need("Training boundary:" in JS, 'educational/production boundary missing')
need("not universal production recipes" in JS, 'universal-recipe warning missing')
need("Verify the exact resin grade" in JS, 'grade/machine/mould verification warning missing')
need("Diagnostic Learning Labs" in JS and "Evidence-first practice" in JS, 'diagnostic learning UI missing')
need("Observe" in JS and "Best next test" in JS and "Controlled response" in JS and "Explain" in JS, 'learning-loop stages incomplete')

ids = re.findall(r"\n\s*id:'([a-z0-9-]+)'", JS)
need(len(ids) == 9, f'expected exactly 9 diagnostic labs, found {len(ids)}')
need(len(ids) == len(set(ids)), 'diagnostic lab IDs must be unique')
for expected in [
    'cavity-short-shot',
    'splay-moisture',
    'pressure-limited-fill',
    'check-ring-repeatability',
    'cooling-warpage',
    'gate-seal-study',
    'measurement-noise',
    'hot-runner-imbalance',
    'local-flash',
]:
    need(expected in ids, f'missing diagnostic lab: {expected}')

for concept in [
    'Cavity-to-cavity imbalance',
    'Material moisture actual',
    'Pressure-limited fill detection',
    'Check-ring repeatability study',
    'Cooling-circuit baseline',
    'Gate-seal study',
    'Measurement system analysis',
    'Hot-runner branch balance check',
    'Parting line',
]:
    need(concept in JS, f'reference-data concept not connected to labs: {concept}')

# Execute the authored LABS constant without opening the UI. This validates every
# optional diagnostic question rather than merely checking that the lab names exist.
node = r'''
const fs=require('fs'),vm=require('vm');
let src=fs.readFileSync('diagnostic-learning-labs.js','utf8');
src=src.replace(
  "install();window.addEventListener('load',schedule);",
  "window.__QA_DIAGNOSTIC_LABS=LABS;window.addEventListener('load',schedule);"
);
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]};
const document={documentElement:null,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),head:{appendChild(){}},body:{appendChild(){}}};
function MutationObserver(){this.observe=()=>{};this.disconnect=()=>{}}
const window={addEventListener(){},requestAnimationFrame:fn=>fn&&fn(),scrollTo(){}};
const sandbox={window,document,localStorage,MutationObserver,console,setTimeout:fn=>fn&&fn(),clearTimeout(){},JSON,Math,Date};
window.window=window;window.document=document;window.localStorage=localStorage;window.MutationObserver=MutationObserver;
vm.createContext(sandbox);vm.runInContext(src,sandbox,{filename:'diagnostic-learning-labs.js'});
const labs=window.__QA_DIAGNOSTIC_LABS;
if(!Array.isArray(labs))throw new Error('LABS exposure failed');
process.stdout.write(JSON.stringify(labs.map(l=>({
 id:l.id,title:l.title,level:l.level,focus:l.focus,
 steps:(l.steps||[]).map(s=>({stage:s.stage,question:s.question,choices:(s.choices||[]).map(c=>({text:c.text,correct:c.correct===true,feedback:c.feedback}))}))
}))));
'''
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
    h.write(node)
    node_path=Path(h.name)
try:
    p=subprocess.run(['node',str(node_path)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
finally:
    node_path.unlink(missing_ok=True)
need(p.returncode==0,f'diagnostic question runtime QA failed: {p.stderr or p.stdout}')
labs=json.loads(p.stdout)
need(len(labs)==9,'runtime diagnostic lab count must be exactly 9')
expected_stages=['Observe','Best next test','Controlled response','Explain']
question_count=0
for lab in labs:
    steps=lab.get('steps',[])
    need(len(steps)==4,f"{lab['id']} must contain exactly four keyed decisions")
    need([s.get('stage') for s in steps]==expected_stages,f"{lab['id']} learning stages must be Observe -> Best next test -> Controlled response -> Explain")
    for step in steps:
        question_count+=1
        choices=step.get('choices',[])
        need(len(str(step.get('question','')).strip())>=12,f"{lab['id']} / {step.get('stage')} question is too shallow")
        need(len(choices)==4,f"{lab['id']} / {step.get('stage')} must have four choices")
        texts=[str(c.get('text','')).strip() for c in choices]
        need(all(texts),f"{lab['id']} / {step.get('stage')} has an empty choice")
        need(len({t.lower() for t in texts})==4,f"{lab['id']} / {step.get('stage')} has duplicate choices")
        keyed=[i for i,c in enumerate(choices) if c.get('correct') is True]
        need(len(keyed)==1,f"{lab['id']} / {step.get('stage')} must have exactly one correct choice")
        for c in choices:
            fb=str(c.get('feedback','')).strip()
            need(len(fb)>=20,f"{lab['id']} / {step.get('stage')} feedback is too shallow")
        correct_feedback=str(choices[keyed[0]].get('feedback','')).lower()
        need('correct' in correct_feedback or 'exactly' in correct_feedback,f"{lab['id']} / {step.get('stage')} keyed feedback must explicitly affirm the answer")
        keyed_text=texts[keyed[0]].lower()
        need(not re.search(r'\b(bypass|defeat|disable)\b.{0,35}\b(guard|interlock|safeguard|protection)\b',keyed_text),f"{lab['id']} / {step.get('stage')} unsafe action is keyed correct")
need(question_count==36,f'expected exactly 36 optional diagnostic decisions, got {question_count}')

need('disable mould protection so the tool closes harder' in LOWER_JS, 'expected safety distractor missing')
need('safeguards must never be bypassed' in LOWER_JS, 'safety distractor must be explicitly rejected')
need('bypass guards' not in LOWER_JS, 'unsafe bypass instruction detected')
need('defeat interlocks' not in LOWER_JS, 'unsafe interlock-defeat instruction detected')

asset = './diagnostic-learning-labs.js'
need(asset in INDEX, 'browser shell does not load diagnostic learning labs')
need(asset in SW, 'diagnostic learning labs missing from offline cache')
need('../../diagnostic-learning-labs.js' in PKG, 'desktop package does not include diagnostic learning labs')
need("'diagnostic-learning-labs.js'" in INTEGRITY, 'desktop integrity manifest generator does not cover diagnostic learning labs')

need('mmDiagnosticLabs' in JS, 'desktop/sidebar launcher missing')
need('mmDiagnosticMenu' in JS, 'mobile More-menu launcher missing')
need("button[data-view=\"scenarios\"]" in JS, 'practice-area return path missing')
need('localStorage' in JS and 'fetch(' not in JS, 'diagnostic progress must not upload or fetch production data')

print(f'MouldMaster diagnostic learning QA passed (9 labs / {question_count} optional evidence-first decisions)')

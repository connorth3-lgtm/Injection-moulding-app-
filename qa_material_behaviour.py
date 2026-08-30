from pathlib import Path
import json, re, subprocess, tempfile

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def text(path): return (ROOT/path).read_text(encoding='utf-8')
def option_len(value): return len(re.sub(r'\s+',' ',str(value or '').strip()))

js=text('material-behaviour-labs.js')
need("const VERSION='2026.08.25.1'" in js,'material lab version marker missing')
need('Scenario-specific education; verify exact grade' in js,'material lab training boundary missing')
need('fetch(' not in js,'material labs must remain local-only')
need("typeof db!=='undefined'" in js and "STORAGE_BASE='mm_material_behaviour_labs_v1'" in js,'learner-scoped local storage handling missing')
for material in ['PP','PC','PA66-GF30','ABS','POM','Recycled PP']:
    need(material in js,f'material coverage missing: {material}')
for lab_id in ['pp-vs-pc-drying','pc-wet-vs-dry','pa66-gf30-dry-conditioned','abs-thermal-history','pom-thermal-safety','recycled-pp-lot-rheology']:
    need(f"id:'{lab_id}'" in js,f'material lab missing: {lab_id}')
for source_id in ['exxon-pp-processing','covestro-drying','basf-pa66-gf30','basf-ultramid','sabic-cycolac','celanese-pom-processing','krantz-rpp-2024','iso-1133','iso-15512']:
    need(source_id in js,f'material lab source mapping missing: {source_id}')
need('formaldehyde' in js.lower() and 'pvc' in js.lower(),'POM safety case must cover thermal decomposition and incompatible contamination')
need('safeguards and approved procedures must not be bypassed' in js.lower(),'material safety distractor must explicitly reject safeguard bypass')
need('universal production recipes' in js.lower(),'material labs must reject universal recipes')

node=r'''
const fs=require('fs'),vm=require('vm');
const store={};
const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=String(v)};
const makeEl=()=>({textContent:'',innerHTML:'',className:'',dataset:{},style:{},appendChild(){},insertAdjacentElement(){},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},hasAttribute(){return false},classList:{add(){},remove(){}}});
const document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,createElement:makeEl,head:{appendChild(){}},documentElement:{}};
function MutationObserver(){this.observe=()=>{}}
const sandbox={window:{addEventListener(){},requestAnimationFrame:fn=>fn(),scrollTo(){}},document,localStorage,MutationObserver,console,setTimeout:(fn)=>fn&&fn(),JSON,Math,Date};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.MutationObserver=MutationObserver;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('material-behaviour-labs.js','utf8'),sandbox);
const M=sandbox.window.MM_MATERIAL_BEHAVIOUR_LABS;
process.stdout.write(JSON.stringify({version:M.version,labs:M.labs.map(l=>({id:l.id,title:l.title,materials:l.materials,sources:l.sourceIds,steps:l.steps.map(s=>({stage:s.stage,question:s.question,choices:s.choices.map(c=>({text:c.text,correct:c.correct===true,feedback:c.feedback}))}))}))}));
'''
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
    h.write(node); pth=Path(h.name)
try:
    p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
finally:
    pth.unlink(missing_ok=True)
need(p.returncode==0,f'material lab runtime failed: {p.stderr or p.stdout}')
data=json.loads(p.stdout)
need(len(data['labs'])==6,'exactly six initial material behaviour labs required')
need(sum(len(l['steps']) for l in data['labs'])==24,'material labs must contain 24 keyed decisions')
need(len({l['id'] for l in data['labs']})==6,'material lab IDs must be unique')
length_flags=[]
for lab in data['labs']:
    need(len(lab['steps'])==4,f"{lab['id']} must have four reasoning stages")
    need(lab['sources'],f"{lab['id']} needs explicit evidence sources")
    for step_index,step in enumerate(lab['steps']):
        choices=step['choices']
        keyed=[i for i,c in enumerate(choices) if c.get('correct') is True]
        need(len(choices)==4 and len(keyed)==1,f"{lab['id']} / {step['stage']} must have exactly one correct answer among four choices")
        texts=[str(c.get('text','')).strip() for c in choices]
        key=keyed[0]
        lengths=[option_len(t) for t in texts]
        longest_distractor=max(lengths[:key]+lengths[key+1:])
        if lengths[key]>=longest_distractor:
            length_flags.append({'id':f"material:{lab['id']}:{step_index}",'lab':lab['id'],'stage':step['stage'],'correct_index':key,'correct_length':lengths[key],'longest_distractor_length':longest_distractor,'lengths':lengths,'options':texts})
need(not length_flags,'correct answer is longest/tied-longest in material labs: '+json.dumps(length_flags,ensure_ascii=False))

idx=text('index.html'); sw=text('service-worker.js'); pkg=text('desktop/electron/package.json'); integ=text('desktop/electron/scripts/generate-integrity.cjs')
need("['./material-behaviour-labs.js'" in idx,'browser shell does not load material labs')
need(idx.index('material-behaviour-labs.js')<idx.index('assessment-evidence-sources.js'),'material labs must load before evidence approval')
need("'./material-behaviour-labs.js'" in sw,'material labs missing from offline cache')
need('../../material-behaviour-labs.js' in pkg,'material labs missing from desktop package')
need("'material-behaviour-labs.js'" in integ,'material labs missing from desktop integrity manifest')
source_map=text('assessment-evidence-sources.js')
fresh=text('sources/SOURCE_FRESHNESS.json')
for source_id in ['exxon-pp-processing','sabic-cycolac','basf-ultramid','basf-pa66-gf30','celanese-pom-processing']:
    need(f"'{source_id}'" in source_map,f'evidence source registry missing {source_id}')
    need(source_id in fresh,f'source freshness registry missing {source_id}')
need("'krantz-rpp-2024'" in source_map and '10.1002/pen.26836' in source_map,'recycled-PP research source missing')

print('MouldMaster material behaviour QA passed: 6 labs / 24 evidence-approved material decisions / strict longest-answer flags=0')
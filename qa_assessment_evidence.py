from pathlib import Path
import ast, json, re, subprocess, tempfile

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def text(path): return (ROOT/path).read_text(encoding='utf-8')

def git_blob_sha(path):
    p=subprocess.run(['git','rev-parse',f'HEAD:{path}'],cwd=ROOT,capture_output=True,text=True)
    need(p.returncode==0,f'cannot resolve committed Git blob for {path}: {p.stderr.strip()}')
    return p.stdout.strip()

for path in ['assessment-evidence-sources.js','assessment-evidence-approval.js','sources/QUESTION_APPROVAL_POLICY.md','material-behaviour-labs.js']:
    need((ROOT/path).exists(),f'missing evidence approval asset: {path}')

approval=text('assessment-evidence-approval.js')
sources=text('assessment-evidence-sources.js')
need("const VERSION='2026.08.25.3'" in approval,'approval version missing')
need("version:'2026.08.25.3'" in sources,'evidence source version missing')
need("summary.total!==157" in approval and "summary.labs!==36" in approval and "summary.materialLabs!==24" in approval,'157-question coverage guard missing')
need('blockedIds' in approval,'blocked evidence IDs must be reported on failure')
need('direct-question-source' in approval and 'mapped-authoritative-source' in approval,'source modes missing')
need('external accreditation or independent third-party SME endorsement is not implied' in approval,'approval scope disclaimer missing')
need('https://' in sources and 'http://' not in sources,'evidence source map must use HTTPS')
need('if(!ids.length)' not in sources,'generic evidence fallback is forbidden; unmatched questions must fail closed')
need('approveExplicit' in approval and 'forMaterialLab' in approval,'material lab explicit approval API missing')

approved_inputs=dict(re.findall(r"'([^']+\.(?:html|js))':'([0-9a-f]{40})'",approval))
need(len(approved_inputs)==7,f'expected 7 approval-pinned content inputs, got {len(approved_inputs)}')
for path,sha in approved_inputs.items():
    need((ROOT/path).exists(),f'approved content input missing: {path}')
    actual=git_blob_sha(path)
    need(actual==sha,f'evidence approval stale for {path}: approved {sha}, current {actual}; re-review evidence and update approval')

core=text('MouldMaster_Core_App.html'); marker='window.MM_DATA = '
need(marker in core,'MM_DATA marker missing')
D,_=json.JSONDecoder().raw_decode(core[core.index(marker)+len(marker):])
need(sum(len(v) for v in D['exams'].values())==30,'technical bank must contain 30 items')
need(sum(len(v) for r in D['regionalQuestions'].values() for v in r.values())==27,'regional bank must contain 27 items')

training=text('training-upgrade.js')
m=re.search(r"const EXTRA=(\[[\s\S]*?\n\]);",training)
need(m is not None,'training EXTRA scenario bank could not be parsed')
extra=ast.literal_eval(m.group(1))
need(len(extra)==8,'guided training must contribute exactly 8 scenarios')
for a in extra:
    D['scenarios'].append({'title':a[0],'situation':a[1],'choices':a[2],'correct':a[3],'why':a[4],'feedback':[a[4] if i==a[3] else 'This does not directly test the mechanism best supported by the evidence.' for i in range(4)]})

lab_js=text('diagnostic-learning-labs.js')
lab_rows=re.findall(r"\n\s*id:'([^']+)',\n\s*title:'([^']+)',\n\s*level:'([^']+)',\n\s*focus:'([^']+)'",lab_js)
need(len(lab_rows)==9,f'expected 9 diagnostic labs, got {len(lab_rows)}')
labs=[{'id':a,'title':b,'level':c,'focus':d} for a,b,c,d in lab_rows]

node=r'''
const fs=require('fs'),vm=require('vm');
const D=%s,LABS=%s;
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
const makeEl=()=>({textContent:'',innerHTML:'',className:'',dataset:{},style:{},appendChild(){},insertAdjacentHTML(){},insertAdjacentElement(){},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},hasAttribute(){return false},classList:{add(){},remove(){},contains(){return false}}});
const document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,createElement:makeEl,head:{appendChild(){}},body:{appendChild(){}},documentElement:{},readyState:'complete'};
function MutationObserver(){this.observe=()=>{};this.disconnect=()=>{}}
const sandbox={window:{MM_DATA:D,MM_DIAGNOSTIC_LABS:{version:'2026.08.25.1',labs:LABS},requestAnimationFrame:fn=>fn(),addEventListener(){},scrollTo(){}},document,localStorage,performance:{now:()=>1000},console,setTimeout:(fn)=>{if(typeof fn==='function')fn()},clearTimeout(){},Date,Math,JSON,Map,Set,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},MutationObserver};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.MutationObserver=MutationObserver;sandbox.window.URL=sandbox.URL;sandbox.window.setTimeout=sandbox.setTimeout;
vm.createContext(sandbox);
for(const file of ['material-behaviour-labs.js','assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-quality-suite.js','assessment-evidence-sources.js','assessment-evidence-approval.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const A=sandbox.window.MM_EVIDENCE_APPROVAL;
process.stdout.write(JSON.stringify({summary:A.summary,blockedIds:A.blockedIds,records:A.records,qa:D.assessmentQA.evidenceApproval,material:sandbox.window.MM_MATERIAL_BEHAVIOUR_LABS}));
'''%(json.dumps(D),json.dumps(labs))
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
    h.write(node); node_path=Path(h.name)
try:
    p=subprocess.run(['node',str(node_path)],cwd=ROOT,capture_output=True,text=True)
finally:
    node_path.unlink(missing_ok=True)
need(p.returncode==0,f'evidence approval runtime failed: {p.stderr or p.stdout}')
runtime=json.loads(p.stdout)
s=runtime['summary']; records=runtime['records']
need(runtime.get('blockedIds')==[],'no keyed question may remain blocked')
need(s=={'total':157,'approved':157,'technical':30,'regional':27,'scenarios':40,'labs':36,'materialLabs':24,'direct':s['direct'],'mapped':s['mapped']},f'unexpected approval summary: {s}')
need(len(records)==157 and len({r['id'] for r in records})==157,'approval record IDs must be complete and unique')
need(all(r['status']=='approved' for r in records),'every keyed question must be approved')
need(all(r.get('reviewer') and r.get('reviewedOn')=='2026-08-25' for r in records),'reviewer/date metadata incomplete')
need(all(re.fullmatch(r'fnv1a-[0-9a-f]{8}',r.get('fingerprint','')) for r in records),'fingerprint missing or malformed')
need(all(r.get('sources') and r.get('sourceIds') for r in records),'every keyed question needs evidence sources')
need(all(all(str(x.get('url','')).startswith('https://') for x in r['sources']) for r in records),'all evidence links must be direct HTTPS URLs')
need(all(r['sourceMode']=='direct-question-source' for r in records if r['kind']=='regional-exam'),'regional safety/compliance items must retain direct question sources')
need(all(0<=int(r['answerKey'])<4 for r in records if r['kind'] in ('technical-exam','regional-exam','scenario','material-lab-question')),'answer keys invalid')
need(len({r['fingerprint'] for r in records if r['kind']!='diagnostic-lab-question'})==121,'exam/scenario/material fingerprints must be unique')
need(runtime['qa']['approvedQuestions']==157,'assessment QA metadata must expose 157 approved questions')
need(len(runtime['material']['labs'])==6 and sum(len(x['steps']) for x in runtime['material']['labs'])==24,'material lab runtime must expose 6 labs / 24 steps')

regional_domains=('legislation.gov.uk','hse.gov.uk','osha.gov','plasticsindustry.org','worksafe.govt.nz','legislation.govt.nz','knowledge.bsigroup.com')
for r in records:
    if r['kind']=='regional-exam':
        need(any(any(d in s['url'] for d in regional_domains) for s in r['sources']),f"regional item lacks recognised official/standards source: {r['id']}")

required_scenario_sources={
 'Black specks after a long shutdown':'basf-troubleshooter',
 'One cavity flashes after tool service':'autodesk-flash',
 'Valve-gate cavity timing separates':'autodesk-valve-gate',
 'Robot delay increases cycle only':'euromap-79',
 'Energy per part rises with stable cycle':'euromap-60',
 'Insert temperature varies':'overmould-2020',
 'Hot-runner leak suspected':'hotrunner-2024',
 'Warm-up state changes first-off parts':'hotrunner-2024',
 'Mass prediction stays good but dimension model worsens':'nist-ai-drift'
}
scenario_by_title={r.get('title'):r for r in records if r['kind']=='scenario'}
for title,source_id in required_scenario_sources.items():
    r=scenario_by_title.get(title)
    need(r is not None,f'missing reviewed scenario: {title}')
    need(source_id in r['sourceIds'],f'scenario {title} lacks topic-appropriate evidence {source_id}: {r["sourceIds"]}')

material_required={
 'pp-vs-pc-drying':{'exxon-pp-processing','covestro-drying'},
 'pc-wet-vs-dry':{'covestro-drying','iso-15512'},
 'pa66-gf30-dry-conditioned':{'basf-pa66-gf30','basf-ultramid','iso-15512'},
 'abs-thermal-history':{'sabic-cycolac','basf-troubleshooter'},
 'pom-thermal-safety':{'celanese-pom-processing'},
 'recycled-pp-lot-rheology':{'krantz-rpp-2024','iso-1133','exxon-pp-processing'}
}
for lab_id,required in material_required.items():
    rs=[r for r in records if r.get('materialLabId')==lab_id]
    need(len(rs)==4,f'material lab {lab_id} must have four approved questions')
    for r in rs: need(required.issubset(set(r['sourceIds'])),f'material lab {r["id"]} lacks required evidence: {r["sourceIds"]}')

idx=text('index.html')
for asset in ['./material-behaviour-labs.js','./assessment-evidence-sources.js','./assessment-evidence-approval.js']:
    need(asset in idx,f'browser shell missing {asset}')
need(idx.index('material-behaviour-labs.js')<idx.index('assessment-evidence-sources.js')<idx.index('assessment-evidence-approval.js'),'material labs and evidence assets load in wrong order')
sw=text('service-worker.js'); need("'./material-behaviour-labs.js'" in sw and "'./assessment-evidence-sources.js'" in sw and "'./assessment-evidence-approval.js'" in sw,'evidence/material assets missing from offline cache')
pkg=text('desktop/electron/package.json'); need('../../material-behaviour-labs.js' in pkg and '../../assessment-evidence-sources.js' in pkg and '../../assessment-evidence-approval.js' in pkg,'evidence/material assets missing from desktop package')
integ=text('desktop/electron/scripts/generate-integrity.cjs'); need("'material-behaviour-labs.js'" in integ and "'assessment-evidence-sources.js'" in integ and "'assessment-evidence-approval.js'" in integ,'evidence/material assets missing from integrity manifest')
workflow=text('.github/workflows/qa.yml'); need('node --check material-behaviour-labs.js' in workflow,'workflow must syntax-check material labs'); need('python qa_assessment_evidence.py' in workflow,'workflow must enforce evidence approval gate')

print(f"MouldMaster evidence approval QA passed: {s['approved']}/{s['total']} keyed questions approved, including {s['materialLabs']} material-lab decisions")
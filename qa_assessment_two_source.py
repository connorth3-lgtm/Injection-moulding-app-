from pathlib import Path
import ast, json, re, subprocess, tempfile

ROOT=Path(__file__).resolve().parent
REPORT=ROOT/'question-two-source-report.json'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def text(path): return (ROOT/path).read_text(encoding='utf-8')

core=text('MouldMaster_Core_App.html'); marker='window.MM_DATA = '
need(marker in core,'MM_DATA marker missing')
D,_=json.JSONDecoder().raw_decode(core[core.index(marker)+len(marker):])

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
const sandbox={window:{MM_DATA:D,MM_DIAGNOSTIC_LABS:{version:'qa',labs:LABS},requestAnimationFrame:fn=>fn(),addEventListener(){},scrollTo(){}},document,localStorage,performance:{now:()=>1000},console,setTimeout:(fn)=>{if(typeof fn==='function')fn()},clearTimeout(){},Date,Math,JSON,Map,Set,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},MutationObserver};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.MutationObserver=MutationObserver;sandbox.window.URL=sandbox.URL;sandbox.window.setTimeout=sandbox.setTimeout;
vm.createContext(sandbox);
for(const file of ['material-behaviour-labs.js','assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-quality-suite.js','assessment-evidence-sources.js','assessment-evidence-approval.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const A=sandbox.window.MM_EVIDENCE_APPROVAL,E=sandbox.window.MM_EVIDENCE_SOURCES;
process.stdout.write(JSON.stringify({records:A.records,summary:A.summary,policy:E.secondSourcePolicy,version:E.version}));
'''%(json.dumps(D),json.dumps(labs))

with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
    h.write(node); node_path=Path(h.name)
try:
    p=subprocess.run(['node',str(node_path)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
finally:
    node_path.unlink(missing_ok=True)
need(p.returncode==0,f'two-source evidence runtime failed: {p.stderr or p.stdout}')
runtime=json.loads(p.stdout); records=runtime['records']
need(runtime.get('policy',{}).get('minimumDistinctSources')==2,'runtime second-source policy marker missing')
need(len(records)==157 and len({r['id'] for r in records})==157,'expected 157 unique keyed question records')

weak=[]
for r in records:
    urls=[str(s.get('url','')).strip() for s in r.get('sources',[]) if str(s.get('url','')).strip()]
    unique=[]
    for u in urls:
        if u not in unique: unique.append(u)
    if len(unique)<2: weak.append({'id':r['id'],'kind':r['kind'],'label':r.get('stem') or r.get('title') or r.get('labTitle') or r['id'],'sourceIds':r.get('sourceIds',[]),'urls':unique})
    need(all(u.startswith('https://') for u in unique),f"non-HTTPS evidence URL on {r['id']}")
need(not weak,'questions below two distinct sources: '+', '.join(x['id'] for x in weak))

by_kind={}
for r in records:
    by_kind.setdefault(r['kind'],[]).append(r)
expected={'technical-exam':30,'regional-exam':27,'scenario':40,'diagnostic-lab-question':36,'material-lab-question':24}
need({k:len(v) for k,v in by_kind.items()}==expected,f'unexpected keyed-question composition: { {k:len(v) for k,v in by_kind.items()} }')

regional_domains=('legislation.gov.uk','hse.gov.uk','osha.gov','plasticsindustry.org','worksafe.govt.nz','legislation.govt.nz','knowledge.bsigroup.com','iso.org')
for r in by_kind['regional-exam']:
    urls=[]
    for s in r['sources']:
        u=s['url']
        if any(d in u for d in regional_domains) and u not in urls: urls.append(u)
    need(len(urls)>=2,f"regional question needs two official/standards sources: {r['id']} -> {r['sourceIds']}")

required_pairs={
 'nrv-wear-2023':'check-ring/non-return-valve evidence',
 'energy-review-2017':'energy evidence',
 'hotrunner-manifold-2023':'hot-runner evidence',
 'overmould-2023':'overmould evidence',
 'delrin-pom-molding':'POM safety evidence',
 'autodesk-clamp-modeling':'clamp-force evidence'
}
all_ids={sid for r in records for sid in r.get('sourceIds',[])}
for sid,label in required_pairs.items(): need(sid in all_ids,f'{label} source is not attached to any keyed question')

pom=[r for r in records if r.get('materialLabId')=='pom-thermal-safety']
need(len(pom)==4,'POM material lab must expose four keyed questions')
for r in pom:
    need({'celanese-pom-processing','delrin-pom-molding'}.issubset(set(r['sourceIds'])),f"POM question lacks two supplier sources: {r['id']} -> {r['sourceIds']}")

counts=[len({s['url'] for s in r['sources']}) for r in records]
report={
 'schema':1,
 'scope':'157 keyed learner questions',
 'minimum_distinct_sources':2,
 'total_questions':len(records),
 'minimum_observed':min(counts),
 'maximum_observed':max(counts),
 'average_sources':round(sum(counts)/len(counts),2),
 'by_kind':{k:{'questions':len(v),'minimum':min(len({s['url'] for s in r['sources']}) for r in v)} for k,v in by_kind.items()},
 'weak_questions':weak
}
REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"MouldMaster two-source question QA passed: {len(records)}/{len(records)} questions have >=2 distinct evidence sources; minimum observed={report['minimum_observed']}; average={report['average_sources']}")

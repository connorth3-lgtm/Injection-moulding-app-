from pathlib import Path
import ast, json, re, subprocess, tempfile
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parent
REPORT=ROOT/'evidence-maturity-report.json'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def text(name): return (ROOT/name).read_text(encoding='utf-8')

required=[
 'MouldMaster_Core_App.html','training-upgrade.js','assessment-deep-dive.js','assessment-answer-cue-fix.js',
 'assessment-quality-suite.js','diagnostic-learning-labs.js','material-behaviour-labs.js','assessment-evidence-sources.js',
 'assessment-evidence-approval.js','source-library.js','reference-data.js','reference-deep-dive.js','reference-research-extension.js',
 'reference-20x-extension.js','reference-2026-expansion.js','evidence-maturity-deep-dive.js','lesson-evidence-depth.js'
]
for name in required: need((ROOT/name).exists(),f'missing evidence-maturity dependency: {name}')

core=text('MouldMaster_Core_App.html'); marker='window.MM_DATA = '
need(marker in core,'MM_DATA marker missing')
D,_=json.JSONDecoder().raw_decode(core[core.index(marker)+len(marker):])
need(len(D.get('lessons',[]))==120,'canonical lesson count changed')
training=text('training-upgrade.js'); m=re.search(r"const EXTRA=(\[[\s\S]*?\n\]);",training); need(m is not None,'training EXTRA scenarios missing')
extra=ast.literal_eval(m.group(1)); need(len(extra)==8,'expected eight training-upgrade scenarios')
for a in extra:
    D['scenarios'].append({'title':a[0],'situation':a[1],'choices':a[2],'correct':a[3],'why':a[4],'feedback':[a[4] if i==a[3] else 'Not strongest.' for i in range(4)],'category':a[5] if len(a)>5 else ''})
lab_js=text('diagnostic-learning-labs.js')
lab_rows=re.findall(r"\n\s*id:'([^']+)',\n\s*title:'([^']+)',\n\s*level:'([^']+)',\n\s*focus:'([^']+)'",lab_js)
need(len(lab_rows)==9,f'expected 9 diagnostic labs, got {len(lab_rows)}')
labs=[{'id':a,'title':b,'level':c,'focus':d} for a,b,c,d in lab_rows]

node=r'''
const fs=require('fs'),vm=require('vm');
const D=%s,LABS=%s;
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
const makeEl=()=>({textContent:'',innerHTML:'',className:'',hidden:false,dataset:{},style:{},href:'',download:'',appendChild(){},prepend(){},insertBefore(){},insertAdjacentHTML(){},insertAdjacentElement(){},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},hasAttribute(){return false},remove(){},click(){},classList:{add(){},remove(){},contains(){return false}}});
const document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,createElement:makeEl,head:{appendChild(){}},body:{append(){},appendChild(){},prepend(){}},documentElement:{},readyState:'loading',addEventListener(){}};
function MutationObserver(){this.observe=()=>{};this.disconnect=()=>{}}
const URLObj=function(u,b){return new (global.URL)(u,b)}; URLObj.createObjectURL=()=>'';URLObj.revokeObjectURL=()=>{};
const sandbox={window:{MM_DATA:D,MM_DIAGNOSTIC_LABS:{version:'qa',labs:LABS},requestAnimationFrame:fn=>fn(),addEventListener(){},scrollTo(){}},document,localStorage,performance:{now:()=>1000},console,setTimeout:(fn)=>{if(typeof fn==='function')fn()},clearTimeout(){},Date,Math,JSON,Map,Set,Blob:function(){},URL:URLObj,MutationObserver};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.MutationObserver=MutationObserver;sandbox.window.URL=URLObj;sandbox.window.setTimeout=sandbox.setTimeout;
vm.createContext(sandbox);
// Match production dependency order: the reference deep-dive appends source rows as it appends reference rows.
vm.runInContext(fs.readFileSync('source-library.js','utf8'),sandbox,{filename:'source-library.js'});
for(const file of ['reference-data.js','reference-deep-dive.js','reference-research-extension.js','reference-20x-extension.js','reference-2026-expansion.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
document.readyState='complete';
for(const file of ['material-behaviour-labs.js','assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-quality-suite.js','assessment-evidence-sources.js','evidence-maturity-deep-dive.js','lesson-evidence-depth.js','assessment-evidence-approval.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const A=sandbox.window.MM_EVIDENCE_APPROVAL;
const L=sandbox.window.MM_LESSON_EVIDENCE_AUDIT.auditAll(D.lessons);
const R=sandbox.window.MM_REFERENCE_TRACEABILITY.audit();
const P=sandbox.window.MM_MATERIAL_PRACTICE_EXTENSIONS;
const DS=sandbox.window.MM_PROCESS_EVIDENCE_DATASETS;
const PB=sandbox.window.MM_ASSESSMENT_PSYCHOMETRICS.benchmark();
process.stdout.write(JSON.stringify({approval:{records:A.records,summary:A.summary,coverageOk:A.coverageOk},lessons:L,reference:R,practice:P,datasets:DS.datasets.map(d=>({id:d.id,title:d.title,kind:d.kind,sourceIds:d.sourceIds,rowCount:d.rows.length,phaseCounts:d.phaseCounts,signalCount:Object.keys(d.signals).length})),psych:PB,evidenceVersion:sandbox.window.MM_EVIDENCE_SOURCES.version,independencePolicy:sandbox.window.MM_EVIDENCE_SOURCES.independencePolicy}));
'''%(json.dumps(D),json.dumps(labs))
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as f:
    f.write(node); path=Path(f.name)
try:
    p=subprocess.run(['node',str(path)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
finally:
    path.unlink(missing_ok=True)
need(p.returncode==0,'evidence maturity runtime failed: '+(p.stderr or p.stdout)[:5000])
data=json.loads(p.stdout)

# 1 + 3: formal assessment evidence count + independent authority families.
records=data['approval']['records']; need(data['approval']['coverageOk'],'formal 157-question evidence approval lost coverage')
need(len(records)==157,'formal keyed bank must remain 157 while practice extensions stay separate')

def authority_family(src):
    a=str(src.get('authority','')).strip().lower()
    if a and a!='question-linked source':
        if a.startswith('peer-reviewed'): return 'peer-reviewed research'
        return a.split('/')[0].strip()
    host=urlparse(str(src.get('url',''))).hostname or ''
    host=host.lower().removeprefix('www.')
    return host

weak_urls=[]; weak_auth=[]
for r in records:
    urls=[]
    for s in r.get('sources',[]):
        u=str(s.get('url','')).strip()
        if u.startswith('https://') and u not in urls: urls.append(u)
    auth={authority_family(s) for s in r.get('sources',[]) if authority_family(s)}
    if len(urls)<2: weak_urls.append(r['id'])
    if len(auth)<2: weak_auth.append((r['id'],sorted(auth),r.get('sourceIds',[])))
need(not weak_urls,'formal questions below two distinct URLs: '+', '.join(weak_urls))
need(not weak_auth,'formal questions below two authority families: '+', '.join(x[0] for x in weak_auth))

# 2: all lessons now strong (2+ topic-specific sources), not merely fallback-filled.
L=data['lessons']; need(L['total']==120,'lesson evidence audit lost canonical scope')
need(L['counts'].get('strong')==120 and L['counts'].get('supported')==0 and L['counts'].get('fallback-only')==0,f"lesson evidence still weak: {L['counts']}")
for row in L['lessons']:
    need(row.get('topicCount',0)>=2,f"lesson {row['title']} has fewer than two topic sources")
    urls=[s['url'] for s in row.get('topicSources',[])]; need(len(urls)==len(set(urls)),f"lesson {row['title']} has duplicate topic URLs")

# 4: broad material practice, deliberately beyond the initial six formal labs.
P=data['practice']; labs2=P['labs']; need(len(labs2)>=10,'need at least ten extended material practice labs')
need(sum(len(l['steps']) for l in labs2)>=40,'extended material practice must contain at least 40 decisions')
materials={m for l in labs2 for m in l.get('materials',[])}
for m in ['PBT','PET','Copolyester','TPU','PMMA','PEEK','PPS','LCP','PC/ABS','HDPE','TPE']:
    need(m in materials,f'extended material practice missing {m}')
for lab in labs2:
    need(len(lab.get('sourceIds',[]))>=2,f"practice lab {lab['id']} needs >=2 sources")
    for step in lab['steps']:
        need(len(step['choices'])==4 and sum(1 for c in step['choices'] if c.get('correct'))==1,f"practice lab {lab['id']} step malformed")

# 1 + 5: large synthetic evidence pack, including machine/tooling faults.
DS=data['datasets']; need(len(DS)>=14,'synthetic process dataset pack unexpectedly small')
need(sum(x['rowCount'] for x in DS)>=1000,'synthetic process data must exceed 1000 shot/cycle rows')
for d in DS:
    need(d['rowCount']>=72 and d['phaseCounts']=={'baseline':24,'fault':24,'recovery':24},f"dataset {d['id']} phase coverage weak")
    need(d['signalCount']>=4,f"dataset {d['id']} needs at least four signals")
    need(len(d['sourceIds'])>=2,f"dataset {d['id']} needs at least two evidence sources")
need(sum(1 for d in DS if d['kind']=='machine')>=4,'machine fault dataset coverage too shallow')
need(sum(1 for d in DS if d['kind']=='tooling')>=4,'tooling fault dataset coverage too shallow')

# 6: one-to-one reference traceability across the live reference object.
R=data['reference']; need(R['total']>=247,f"reference traceability scope too small: {R['total']}")
need(R['counts'].get('weak',0)==0,'reference entries remain without two-source traceability')
need(len({r['id'] for r in R['records']})==R['total'],'reference traceability IDs must be unique')
for r in R['records']:
    need(len({s['url'] for s in r.get('sources',[])})>=2,f"reference {r['id']} has fewer than two URLs")
    need(r.get('reviewedOn')=='2026-08-26' and r.get('reviewBy')=='2026-11-26',f"reference {r['id']} review metadata missing")

# 7: psychometric analysis machinery exists, is privacy-preserving, and produces a sane benchmark.
PB=data['psych']; need(PB['learners']==240 and PB['itemCount']==30,'psychometric benchmark scope changed')
need(PB['attempts']==7200,'psychometric benchmark attempt count changed')
need(PB['kr20'] is not None and 0.6<=PB['kr20']<=0.98,f"psychometric benchmark KR-20 implausible: {PB['kr20']}")
need(sum(1 for x in PB['items'] if x['discrimination']>0.15)>=20,'psychometric benchmark discrimination implementation looks weak')
need('fetch(' not in text('evidence-maturity-deep-dive.js'),'evidence maturity layer must not upload cohort or process data')

# Integration markers.
idx=text('index.html'); sw=text('service-worker.js'); pkg=text('desktop/electron/package.json'); integ=text('desktop/electron/scripts/generate-integrity.cjs')
for asset in ['evidence-maturity-deep-dive.js','lesson-evidence-depth.js']:
    need(asset in idx,f'browser shell missing {asset}')
    need(f"'./{asset}'" in sw,f'offline cache missing {asset}')
    need(f'../../{asset}' in pkg,f'desktop package missing {asset}')
    need(f"'{asset}'" in integ,f'desktop integrity missing {asset}')
need(idx.index('assessment-evidence-sources.js')<idx.index('evidence-maturity-deep-dive.js')<idx.index('assessment-evidence-approval.js'),'evidence maturity module must run after base sources and before approval')
need(idx.index('evidence-maturity-deep-dive.js')<idx.index('lesson-evidence-depth.js'),'lesson depth must see deep-dive sources')

report={
 'schema':1,'version':'2026.08.26.2','formal_questions':157,'formal_min_urls':2,'formal_min_authorities':2,
 'lessons':L['counts'],'material_practice_labs':len(labs2),'material_practice_decisions':sum(len(l['steps']) for l in labs2),
 'synthetic_datasets':len(DS),'synthetic_rows':sum(x['rowCount'] for x in DS),'machine_datasets':sum(1 for d in DS if d['kind']=='machine'),'tooling_datasets':sum(1 for d in DS if d['kind']=='tooling'),
 'reference_records':R['total'],'reference_counts':R['counts'],'psychometric_benchmark':{'learners':PB['learners'],'attempts':PB['attempts'],'items':PB['itemCount'],'kr20':PB['kr20']}
}
REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('MouldMaster evidence maturity deep-dive QA passed:',json.dumps(report,sort_keys=True))

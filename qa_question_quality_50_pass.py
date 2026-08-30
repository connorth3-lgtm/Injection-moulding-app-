from pathlib import Path
import ast
import hashlib
import json
import random
import re
import subprocess
import tempfile
from collections import Counter

ROOT=Path(__file__).resolve().parent
REPORT=ROOT/'question-quality-50-pass-report.json'
PASS_COUNT=50
EXPECTED={
    'technical-exam':30,
    'regional-exam':27,
    'scenario':40,
    'diagnostic-lab':36,
    'material-lab':24,
    'optional-material-practice':40,
}
EXPECTED_TOTAL=sum(EXPECTED.values())


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)


def text(path):
    return (ROOT/path).read_text(encoding='utf-8')


def norm(value):
    return re.sub(r'\s+',' ',str(value or '').strip())


def norm_lower(value):
    return norm(value).lower()


def words(value):
    return re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?",norm(value))


def char_len(value):
    return len(norm(value))


def load_runtime_bank():
    core=text('MouldMaster_Core_App.html')
    marker='window.MM_DATA = '
    need(marker in core,'MM_DATA marker missing')
    D,_=json.JSONDecoder().raw_decode(core[core.index(marker)+len(marker):])

    training=text('training-upgrade.js')
    m=re.search(r"const EXTRA=(\[[\s\S]*?\n\]);",training)
    need(m is not None,'training EXTRA scenario bank could not be parsed')
    extra=ast.literal_eval(m.group(1))
    need(len(extra)==8,'guided training must contribute exactly 8 scenarios')
    for a in extra:
        D['scenarios'].append({
            'title':a[0],'situation':a[1],'choices':a[2],'correct':a[3],'why':a[4],
            'feedback':[a[4] if i==a[3] else 'This does not directly test the mechanism best supported by the evidence.' for i in range(4)],
            'category':a[5] if len(a)>5 else '',
        })

    node=r'''
const fs=require('fs'),vm=require('vm');
const D=%s;
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
const makeEl=()=>({textContent:'',innerHTML:'',className:'',hidden:false,dataset:{},style:{},href:'',download:'',appendChild(){},prepend(){},insertBefore(){},insertAdjacentHTML(){},insertAdjacentElement(){},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},hasAttribute(){return false},remove(){},click(){},classList:{add(){},remove(){},contains(){return false}}});
const document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,createElement:makeEl,head:{appendChild(){}},body:{append(){},appendChild(){},prepend(){}},documentElement:{},readyState:'complete',addEventListener(){}};
function MutationObserver(){this.observe=()=>{};this.disconnect=()=>{}}
const URLObj=function(u,b){return new (global.URL)(u,b)};URLObj.createObjectURL=()=>'';URLObj.revokeObjectURL=()=>{};
const sandbox={window:{MM_DATA:D,requestAnimationFrame:fn=>fn(),addEventListener(){},scrollTo(){}},document,localStorage,performance:{now:()=>1000},console,setTimeout:(fn)=>{if(typeof fn==='function')fn()},clearTimeout(){},Date,Math,JSON,Map,Set,Blob:function(){},URL:URLObj,MutationObserver};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.MutationObserver=MutationObserver;sandbox.window.URL=URLObj;sandbox.window.setTimeout=sandbox.setTimeout;
vm.createContext(sandbox);
for(const file of ['assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-quality-suite.js','assessment-stable-review-bridge.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const out=[];
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams[level]||[]).length;i++){
 const q=D.exams[level][i];out.push({id:`tech:${level}:${i}`,kind:'technical-exam',scope:'formal',level,stem:q.q??q[0],options:q.options??q[1],correct:Number(q.correct??q[2]),rationale:q.explanation??q.why??q[3]??'',feedback:q.optionFeedback??q[6]??[],reference:q.reference??q[4]??'',sourceUrl:q.sourceUrl??q[5]??null,critical:!!(q.critical??q[7])});
}
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){
 const q=D.regionalQuestions[region][level][i];out.push({id:`reg:${region}:${level}:${i}`,kind:'regional-exam',scope:'formal',region,level,stem:q.q??q[0],options:q.options??q[1],correct:Number(q.correct??q[2]),rationale:q.explanation??q.why??q[3]??'',feedback:q.optionFeedback??q[6]??[],reference:q.reference??q[4]??'',sourceUrl:q.sourceUrl??q[5]??null,critical:q.critical??q[7]??true});
}
for(let i=0;i<(D.scenarios||[]).length;i++){
 const s=D.scenarios[i];out.push({id:s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,kind:'scenario',scope:'formal',level:s.difficulty||'',category:s.category||'',stem:`${s.title}: ${s.situation}`,options:s.choices||[],correct:Number(s.correct),rationale:s.why||'',feedback:s.feedback||[],reference:s.reference||'',sourceUrl:s.sourceUrl||null,critical:false});
}
process.stdout.write(JSON.stringify({items:out,bridge:sandbox.window.MM_STABLE_REVIEW_BRIDGE,scenarioCount:D.scenarios.length}));
'''%json.dumps(D)
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node); pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,'formal/scenario runtime failed: '+(p.stderr or p.stdout)[:5000])
    data=json.loads(p.stdout)
    need(data.get('scenarioCount')==40,f"expected 40 scenarios, got {data.get('scenarioCount')}")
    need(data.get('bridge',{}).get('strictAnswerBalance',{}).get('applied')==93,'strict answer-balance bridge did not reach 93/93 before audit')
    return data['items']


def load_lab_file(path,global_name,kind,prefix):
    node=r'''
const fs=require('fs'),vm=require('vm');
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>delete store[k],key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
const makeEl=()=>({textContent:'',innerHTML:'',className:'',dataset:{},style:{},appendChild(){},insertAdjacentElement(){},insertAdjacentHTML(){},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},hasAttribute(){return false},classList:{add(){},remove(){},contains(){return false}}});
const document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,createElement:makeEl,head:{appendChild(){}},body:{appendChild(){},prepend(){}},documentElement:{},readyState:'complete',addEventListener(){}};
function MutationObserver(){this.observe=()=>{};this.disconnect=()=>{}}
const sandbox={window:{addEventListener(){},requestAnimationFrame:fn=>fn(),scrollTo(){}},document,localStorage,MutationObserver,console,setTimeout:(fn)=>fn&&fn(),clearTimeout(){},JSON,Math,Date};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.MutationObserver=MutationObserver;sandbox.window.setTimeout=sandbox.setTimeout;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:%s});
const M=sandbox.window[%s];
if(!M||!Array.isArray(M.labs))throw new Error('lab runtime missing');
const out=[];
for(const lab of M.labs)for(let i=0;i<(lab.steps||[]).length;i++){
 const step=lab.steps[i],choices=step.choices||[],correct=choices.findIndex(c=>c&&c.correct===true);
 out.push({id:%s+lab.id+':'+i,kind:%s,scope:'formal',labId:lab.id,level:lab.level||'',stage:step.stage||'',stem:step.question||'',options:choices.map(c=>c.text),correct,feedback:choices.map(c=>c.feedback||''),rationale:correct>=0?(choices[correct].feedback||''):'',sourceIds:lab.sourceIds||[],focus:lab.focus||'',critical:/safety|isolation|guard|interlock/i.test((lab.focus||'')+' '+(step.question||''))});
}
process.stdout.write(JSON.stringify(out));
'''%(json.dumps(path),json.dumps(path),json.dumps(global_name),json.dumps(prefix),json.dumps(kind))
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node); pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,f'{path} runtime failed: '+(p.stderr or p.stdout)[:5000])
    return json.loads(p.stdout)


def load_optional_material_practice():
    src=text('evidence-maturity-deep-dive.js')
    start=src.find('const MATERIAL_PRACTICE=[')
    end=src.find('\n];\nfunction normalisePractice',start)
    need(start>=0 and end>start,'extended MATERIAL_PRACTICE block missing')
    block=src[start:end+3]
    node=block+r'''
const out=[];
for(const lab of MATERIAL_PRACTICE)for(let i=0;i<(lab.steps||[]).length;i++){
 const s=lab.steps[i],opts=s.slice(2);
 out.push({id:`optional-material:${lab.id}:${i}`,kind:'optional-material-practice',scope:'optional',labId:lab.id,level:lab.level||'',stage:s[0]||'',stem:s[1]||'',options:opts,correct:0,rationale:opts[0]||'',feedback:[],sourceIds:lab.sourceIds||[],focus:lab.focus||'',critical:/safety|isolation|guard|interlock|shutdown|high-temperature/i.test((lab.focus||'')+' '+(s[1]||''))});
}
process.stdout.write(JSON.stringify(out));
'''
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node); pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,'optional material practice parse failed: '+(p.stderr or p.stdout)[:5000])
    return json.loads(p.stdout)


def evaluate_item(item):
    hard=[]
    warnings=[]
    stem=norm(item.get('stem'))
    options=[norm(x) for x in item.get('options',[])]
    correct=item.get('correct')
    rationale=norm(item.get('rationale'))
    feedback=[norm(x) for x in item.get('feedback',[])]

    if len(stem)<12: hard.append('stem-too-short')
    if len(options)!=4: hard.append('option-count')
    if len(options)==4:
        if any(not x for x in options): hard.append('empty-option')
        if len({x.lower() for x in options})!=4: hard.append('duplicate-options')
    if not isinstance(correct,int) or not 0<=correct<4: hard.append('invalid-answer-key')

    if len(options)==4 and isinstance(correct,int) and 0<=correct<4:
        lens=[char_len(x) for x in options]
        keyed=lens[correct]
        distractor_lens=[x for i,x in enumerate(lens) if i!=correct]
        if keyed>=max(distractor_lens): hard.append('correct-longest-or-tied')
        if min(lens)<4: warnings.append('very-short-option')
        if max(lens)>max(140,3.5*max(1,min(lens))): warnings.append('extreme-option-length-spread')
        if keyed>1.8*(sorted(distractor_lens)[1] if len(distractor_lens)==3 else max(distractor_lens)): warnings.append('correct-length-salience')

        c=norm_lower(options[correct])
        wrong=[norm_lower(x) for i,x in enumerate(options) if i!=correct]
        absolute=re.compile(r'\b(always|never|only|automatically|guarantees?|proves?|identical|every|all)\b')
        wrong_abs=sum(bool(absolute.search(x)) for x in wrong)
        if wrong_abs>=2 and not absolute.search(c): warnings.append('absolute-language-distractor-pattern')
        unsafe=re.compile(r'\b(bypass|defeat|disable|remove)\b.{0,45}\b(guard|interlock|safeguard|protection|lockout)\b')
        if unsafe.search(c): hard.append('unsafe-action-keyed-correct')
        noneall=re.compile(r'^(all|none) of (the )?above\.?$')
        if any(noneall.match(x) for x in [norm_lower(o) for o in options]): warnings.append('all-none-of-above')

    if item['kind'] in ('technical-exam','regional-exam','scenario'):
        if len(rationale)<28: hard.append('rationale-too-shallow')
        if feedback:
            if len(feedback)!=4: hard.append('feedback-count')
            elif min(map(char_len,feedback))<18: warnings.append('shallow-option-feedback')
            if len({norm_lower(x) for x in feedback if x})<min(3,len([x for x in feedback if x])): warnings.append('repetitive-option-feedback')
    elif item['kind'] in ('diagnostic-lab','material-lab'):
        if len(feedback)!=4: hard.append('feedback-count')
        elif min(map(char_len,feedback))<20: hard.append('lab-feedback-too-shallow')
        if len({norm_lower(x) for x in feedback if x})<3: warnings.append('repetitive-option-feedback')
        if len(rationale)<20: hard.append('rationale-too-shallow')
    elif item['kind']=='optional-material-practice':
        if len(item.get('sourceIds',[]))<2: hard.append('optional-source-depth')
        if len(rationale)<20: hard.append('rationale-too-shallow')
        if not feedback:
            warnings.append('optional-feedback-generated-at-runtime')

    if len(words(stem))>38: warnings.append('long-stem')
    if re.search(r'\b(obviously|clearly|simply|just)\b',stem,re.I): warnings.append('leading-wording')
    if stem.count('?')>1: warnings.append('multi-question-stem')

    score=100
    score-=25*len(hard)
    score-=4*len(set(warnings))
    return {'hard':sorted(set(hard)),'warnings':sorted(set(warnings)),'score':max(0,score)}


def main():
    for p in ['MouldMaster_Core_App.html','training-upgrade.js','assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-quality-suite.js','assessment-stable-review-bridge.js','diagnostic-learning-labs.js','material-behaviour-labs.js','evidence-maturity-deep-dive.js']:
        need((ROOT/p).exists(),f'missing question-quality dependency: {p}')

    items=[]
    items.extend(load_runtime_bank())
    items.extend(load_lab_file('diagnostic-learning-labs.js','MM_DIAGNOSTIC_LABS','diagnostic-lab','lab:'))
    items.extend(load_lab_file('material-behaviour-labs.js','MM_MATERIAL_BEHAVIOUR_LABS','material-lab','material:'))
    items.extend(load_optional_material_practice())

    counts=Counter(x['kind'] for x in items)
    need(dict(counts)==EXPECTED,f'question surface changed: expected {EXPECTED}, got {dict(counts)}')
    need(len(items)==EXPECTED_TOTAL,f'expected {EXPECTED_TOTAL} total decisions, got {len(items)}')
    ids=[x['id'] for x in items]
    need(len(ids)==len(set(ids)),'question IDs must be globally unique')

    first={x['id']:evaluate_item(x) for x in items}
    hard_by_id={i:r['hard'] for i,r in first.items() if r['hard']}
    warning_by_id={i:r['warnings'] for i,r in first.items() if r['warnings']}

    pass_summaries=[]
    digest_ref=None
    for pass_no in range(1,PASS_COUNT+1):
        order=list(items)
        random.Random(20260830+pass_no*7919).shuffle(order)
        hard=0;warnings=0;score_sum=0
        stable=[]
        for item in order:
            r=evaluate_item(item)
            hard+=len(r['hard']);warnings+=len(r['warnings']);score_sum+=r['score']
            stable.append((item['id'],tuple(r['hard']),tuple(r['warnings']),r['score']))
        stable.sort()
        digest=hashlib.sha256(json.dumps(stable,separators=(',',':')).encode()).hexdigest()
        if digest_ref is None:digest_ref=digest
        need(digest==digest_ref,f'pass {pass_no} produced non-deterministic quality result')
        pass_summaries.append({'pass':pass_no,'items':len(order),'hard_findings':hard,'warning_findings':warnings,'mean_score':round(score_sum/len(order),2),'digest':digest})

    scores=[r['score'] for r in first.values()]
    by_kind={}
    for kind in EXPECTED:
        rows=[first[x['id']] for x in items if x['kind']==kind]
        by_kind[kind]={
            'items':len(rows),
            'mean_score':round(sum(r['score'] for r in rows)/len(rows),2),
            'hard_items':sum(bool(r['hard']) for r in rows),
            'warning_items':sum(bool(r['warnings']) for r in rows),
        }

    warning_types=Counter(w for r in first.values() for w in r['warnings'])
    hard_types=Counter(h for r in first.values() for h in r['hard'])
    item_kind={x['id']:x['kind'] for x in items}
    worst=sorted(({'id':i,'kind':item_kind[i],'score':r['score'],'hard':r['hard'],'warnings':r['warnings']} for i,r in first.items()),key=lambda x:(x['score'],x['id']))[:25]

    report={
        'schema':1,
        'version':'2026.08.30.1',
        'passes':PASS_COUNT,
        'question_decisions_per_pass':EXPECTED_TOTAL,
        'total_item_evaluations':PASS_COUNT*EXPECTED_TOTAL,
        'scope_counts':dict(counts),
        'formal_decisions':EXPECTED_TOTAL-EXPECTED['optional-material-practice'],
        'optional_decisions':EXPECTED['optional-material-practice'],
        'hard_finding_types':dict(hard_types),
        'warning_types':dict(warning_types),
        'hard_items':hard_by_id,
        'warning_items':warning_by_id,
        'mean_quality_score':round(sum(scores)/len(scores),2),
        'minimum_quality_score':min(scores),
        'by_kind':by_kind,
        'worst_items':worst,
        'pass_summaries':pass_summaries,
        'rubric':{
            'hard_gates':['complete/unique four-option structure','valid single keyed answer','correct option is not longest or tied-longest','substantive rationale/feedback','no unsafe safeguard-bypass action keyed correct','two-source minimum for optional material practice'],
            'warning_checks':['option-length spread','absolute-language distractor pattern','repetitive feedback','stem length/wording','all/none-of-above','generated optional feedback'],
            'semantic_boundary':'Heuristics flag review candidates; evidence correctness remains governed by the reviewed evidence-approval and source-maturity layers.'
        }
    }
    REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')

    need(not hard_by_id,'50-pass question-quality audit found hard failures: '+json.dumps({'count':len(hard_by_id),'types':dict(hard_types),'sample':worst[:12]},ensure_ascii=False))
    need(min(scores)>=76,f'question quality score floor breached: {min(scores)}')
    need(pass_summaries[-1]['items']==EXPECTED_TOTAL and len(pass_summaries)==50,'50-pass execution incomplete')
    print(f"MouldMaster 50-pass question-quality audit passed: {EXPECTED_TOTAL} decisions x {PASS_COUNT} passes = {EXPECTED_TOTAL*PASS_COUNT:,} evaluations; hard=0; warnings={sum(warning_types.values())}; mean={report['mean_quality_score']}")


if __name__=='__main__':
    main()

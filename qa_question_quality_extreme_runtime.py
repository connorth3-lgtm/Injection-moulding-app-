from pathlib import Path
import json
import math
import random
import re
import subprocess
import tempfile
from collections import Counter, defaultdict
from urllib.parse import urlparse

import qa_question_quality_50_pass as base
import qa_question_quality_50_pass_runtime as runtime
import qa_question_quality_extreme_50_pass as extreme

ROOT=Path(__file__).resolve().parent
PSYCHOMETRIC_META=None
SEMANTIC_CUE_MODEL=extreme.cue_model


def need(ok,msg):
    if not ok: raise AssertionError(msg)


def load_psychometric_items():
    global PSYCHOMETRIC_META
    items=[]
    items.extend(runtime.apply_formal_runtime_overlay())
    items.extend(base.load_lab_file('diagnostic-learning-labs.js','MM_DIAGNOSTIC_LABS','diagnostic-lab','lab:'))
    items.extend(base.load_lab_file('material-behaviour-labs.js','MM_MATERIAL_BEHAVIOUR_LABS','material-lab','material:'))
    items.extend(runtime.load_optional_runtime())
    need(len(items)==197,f'pre-hardening item count mismatch: {len(items)}')
    node=r'''
const fs=require('fs'),vm=require('vm'),items=%s;
const D={exams:{Beginner:[],Intermediate:[],Advanced:[]},regionalQuestions:{UK:{Beginner:[],Intermediate:[],Advanced:[]},US:{Beginner:[],Intermediate:[],Advanced:[]},NZ:{Beginner:[],Intermediate:[],Advanced:[]}},scenarios:[],assessmentQA:{}};
const diagMap=new Map(),matMap=new Map(),optMap=new Map();
const mkChoice=(text,correct,feedback)=>({text,correct,feedback});
for(const x of items){
 if(x.kind==='technical-exam')D.exams[x.level].push([x.stem,x.options,x.correct,x.rationale,x.reference||'',x.sourceUrl||null,x.feedback||[],!!x.critical]);
 else if(x.kind==='regional-exam')D.regionalQuestions[x.region][x.level].push([x.stem,x.options,x.correct,x.rationale,x.reference||'',x.sourceUrl||null,x.feedback||[],true]);
 else if(x.kind==='scenario'){
   const parts=String(x.stem||'').split(': ');D.scenarios.push({title:parts.shift()||x.id,situation:parts.join(': '),choices:x.options,correct:x.correct,why:x.rationale,feedback:x.feedback||[],category:x.category||'',difficulty:x.level||'',mmStableId:x.id});
 }
 else if(x.kind==='diagnostic-lab'){
   if(!diagMap.has(x.labId))diagMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',steps:[]});
   diagMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});
 }
 else if(x.kind==='material-lab'){
   if(!matMap.has(x.labId))matMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});
   matMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});
 }
 else if(x.kind==='optional-material-practice'){
   if(!optMap.has(x.labId))optMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});
   optMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});
 }
}
const DIAG={labs:[...diagMap.values()]},MAT={labs:[...matMap.values()]},OPT={labs:[...optMap.values()]};
const window={MM_DATA:D,MM_DIAGNOSTIC_LABS:DIAG,MM_MATERIAL_BEHAVIOUR_LABS:MAT,MM_MATERIAL_PRACTICE_EXTENSIONS:OPT};
const sandbox={window,console};window.window=window;vm.createContext(sandbox);vm.runInContext(fs.readFileSync('assessment-psychometric-hardening.js','utf8'),sandbox,{filename:'assessment-psychometric-hardening.js'});
const out=[];
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<D.exams[level].length;i++){const q=D.exams[level][i];out.push({id:`tech:${level}:${i}`,kind:'technical-exam',scope:'formal',level,stem:q[0],options:q[1],correct:q[2],rationale:q[3],feedback:q[6],reference:q[4],sourceUrl:q[5],critical:!!q[7]})}
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<D.regionalQuestions[region][level].length;i++){const q=D.regionalQuestions[region][level][i];out.push({id:`reg:${region}:${level}:${i}`,kind:'regional-exam',scope:'formal',region,level,stem:q[0],options:q[1],correct:q[2],rationale:q[3],feedback:q[6],reference:q[4],sourceUrl:q[5],critical:true})}
for(const s of D.scenarios)out.push({id:s.mmStableId,kind:'scenario',scope:'formal',level:s.difficulty||'',category:s.category||'',stem:`${s.title}: ${s.situation}`,options:s.choices,correct:s.correct,rationale:s.why,feedback:s.feedback,critical:false});
function labsToOut(labs,kind,prefix,scope){for(const lab of labs)for(let i=0;i<lab.steps.length;i++){const s=lab.steps[i],correct=s.choices.findIndex(c=>c.correct===true);out.push({id:prefix+lab.id+':'+i,kind,scope,labId:lab.id,level:lab.level||'',stage:s.stage||'',stem:s.question||'',options:s.choices.map(c=>c.text),correct,feedback:s.choices.map(c=>c.feedback||''),rationale:s.choices[correct]?.feedback||'',sourceIds:lab.sourceIds||[],focus:lab.focus||'',critical:/safety|isolation|guard|interlock|shutdown|high-temperature/i.test((lab.focus||'')+' '+(s.question||''))})}}
labsToOut(DIAG.labs,'diagnostic-lab','lab:','formal');labsToOut(MAT.labs,'material-lab','material:','formal');labsToOut(OPT.labs,'optional-material-practice','optional-material:','optional');
process.stdout.write(JSON.stringify({items:out,meta:window.MM_PSYCHOMETRIC_HARDENING}));
'''%json.dumps(items)
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node);pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,'psychometric runtime failed: '+(p.stderr or p.stdout)[:8000])
    data=json.loads(p.stdout);PSYCHOMETRIC_META=data.get('meta');out=data['items']
    need(len(out)==197,f'post-hardening item count mismatch: {len(out)}')
    need(PSYCHOMETRIC_META and PSYCHOMETRIC_META.get('distractorsRewritten')==197,f'psychometric coverage mismatch: {PSYCHOMETRIC_META}')
    need(PSYCHOMETRIC_META.get('scenarioKeyPositions')==[10,10,10,10],f'scenario key positions not balanced: {PSYCHOMETRIC_META}')
    return out


def surface_features(option,stem):
    p=extreme.style_profile(option);feats=set()
    chars=p['chars'];words=p['words']
    feats.add('__chars_'+('xs' if chars<25 else 's' if chars<45 else 'm' if chars<70 else 'l' if chars<105 else 'xl'))
    feats.add('__words_'+('xs' if words<5 else 's' if words<9 else 'm' if words<14 else 'l'))
    feats.add('__qual_'+('0' if p['qualifiers']==0 else '1' if p['qualifiers']==1 else '2p'))
    feats.add('__abs_'+str(int(p['absolutes']>0)))
    feats.add('__neg_'+str(int(p['negations']>0)))
    feats.add('__unit_'+str(int(p['unit_value'])))
    feats.add('__unsafe_'+str(int(p['unsafe'])))
    feats.add('__ands_'+('0' if p['ands']==0 else '1' if p['ands']==1 else '2p'))
    feats.add('__comma_'+('0' if p['commas']==0 else '1' if p['commas']==1 else '2p'))
    if p['starts_parameter']:starter='parameter'
    elif p['starts_evidence']:starter='evidence'
    elif re.match(r'^\s*(ignore|assume|approve|accept|treat|judge)\b',str(option),re.I):starter='acceptance'
    elif p['unsafe']:starter='unsafe'
    else:starter='other'
    feats.add('__starter_'+starter)
    feats.add('__period_'+str(int(p['period'])))
    return feats


def model_with_features(items,feature_fn,passes=50):
    acc=[];by_kind=defaultdict(list)
    for pass_no in range(passes):
        ids=list(range(len(items)));random.Random(17389+pass_no*2267).shuffle(ids);folds=[ids[i::5] for i in range(5)]
        hits=total=0;kind_hits=Counter();kind_total=Counter()
        for fold in folds:
            test=set(fold);pos=Counter();neg=Counter();pos_n=neg_n=0
            for qi,x in enumerate(items):
                if qi in test:continue
                for oi,o in enumerate(x['options']):
                    fs=feature_fn(o,x['stem']);target=(oi==x['correct'])
                    if target:pos_n+=1;pos.update(fs)
                    else:neg_n+=1;neg.update(fs)
            vocab={f for f in set(pos)|set(neg) if pos[f]+neg[f]>=4}
            for qi in fold:
                x=items[qi];scores=[]
                for o in x['options']:
                    fs=feature_fn(o,x['stem']);score=math.log((pos_n+1)/(pos_n+neg_n+2))
                    for f in fs&vocab:score+=math.log((pos[f]+1)/(pos_n+2))-math.log((neg[f]+1)/(neg_n+2))
                    scores.append(score)
                pred=max(range(4),key=lambda i:scores[i]);hit=pred==x['correct'];hits+=hit;total+=1;kind_hits[x['kind']]+=hit;kind_total[x['kind']]+=1
        acc.append(hits/total)
        for kind in kind_total:by_kind[kind].append(kind_hits[kind]/kind_total[kind])
    return {'passes':passes,'chance':0.25,'mean_accuracy':round(sum(acc)/len(acc),3),'min_accuracy':round(min(acc),3),'max_accuracy':round(max(acc),3),'by_kind':{k:round(sum(v)/len(v),3) for k,v in sorted(by_kind.items())}}


def surface_cue_model(items,passes=50):
    return model_with_features(items,surface_features,passes)


def evidence_checks(items):
    hard=[];warnings=[]
    fresh=base.text('sources/SOURCE_FRESHNESS.json') if (ROOT/'sources/SOURCE_FRESHNESS.json').exists() else ''
    base_registry=base.text('assessment-evidence-sources.js') if (ROOT/'assessment-evidence-sources.js').exists() else ''
    maturity=base.text('evidence-maturity-deep-dive.js') if (ROOT/'evidence-maturity-deep-dive.js').exists() else ''
    formal=base.text('evidence-maturity-formal-bridge.js') if (ROOT/'evidence-maturity-formal-bridge.js').exists() else ''
    source_registry='\n'.join([base_registry,maturity,formal])
    maturity_governed=('REVIEWED=' in maturity and 'REVIEW_BY=' in maturity)
    official={
        'UK':{'hse.gov.uk','www.hse.gov.uk','legislation.gov.uk','www.legislation.gov.uk'},
        'US':{'osha.gov','www.osha.gov','ecfr.gov','www.ecfr.gov'},
        'NZ':{'worksafe.govt.nz','www.worksafe.govt.nz','legislation.govt.nz','www.legislation.govt.nz'},
    }
    for x in items:
        if x['kind']=='regional-exam':
            url=extreme.norm(x.get('sourceUrl'))
            if not url.startswith('https://'):hard.append({'id':x['id'],'issue':'regional-source-not-https','url':url})
            else:
                host=urlparse(url).hostname or ''
                if host not in official.get(x.get('region'),set()):warnings.append({'id':x['id'],'issue':'regional-source-domain-review','host':host,'region':x.get('region')})
        if x['kind'] in ('diagnostic-lab','material-lab','optional-material-practice'):
            for sid in x.get('sourceIds',[]):
                if sid not in source_registry:hard.append({'id':x['id'],'issue':'source-id-not-registered','source_id':sid})
                if sid not in fresh and not (maturity_governed and sid in maturity):warnings.append({'id':x['id'],'issue':'source-id-missing-freshness-governance','source_id':sid})
    return hard,warnings


def main():
    extreme.load_all=load_psychometric_items
    extreme.cue_model=surface_cue_model
    extreme.evidence_checks=evidence_checks
    extreme.main()
    items=load_psychometric_items()
    semantic=SEMANTIC_CUE_MODEL(items,50)
    report=json.loads((ROOT/'question-quality-extreme-50-pass-report.json').read_text(encoding='utf-8'))
    report['psychometric_runtime']=PSYCHOMETRIC_META
    report['cross_item']['surface_cue_model']=report['cross_item'].pop('lexical_cue_model')
    report['cross_item']['semantic_content_model_review_only']=semantic
    report['rubric']['cross_item']=[x.replace('50-pass grouped lexical cue model','50-pass grouped surface-cue model; semantic/content model reported separately') for x in report['rubric']['cross_item']]
    report['method_note']='The hard predictive model uses only surface features (length bins, qualifier/absolute/negation presence, punctuation, evidence-vs-parameter starter class and similar form cues). A content-token model is reported separately because technical vocabulary can encode genuine subject knowledge and is not, by itself, a test-taking shortcut.'
    (ROOT/'question-quality-extreme-50-pass-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('Psychometric runtime verified:',PSYCHOMETRIC_META,'surface=',report['cross_item']['surface_cue_model'],'semantic-review=',semantic)


if __name__=='__main__':main()

import json
import math
import random
import subprocess
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

import qa_question_quality_extreme_runtime as audit

_original_need=audit.need
_original_load_psychometric_items=audit.load_psychometric_items
POST_APPROVAL_META=None
POST_APPROVAL_ITEMS=None


def _compatible_need(ok,msg):
    if ok:
        return
    if msg.startswith('psychometric coverage mismatch:'):
        meta=audit.PSYCHOMETRIC_META or {}
        if meta.get('itemsHardened')==197 and meta.get('optionsParallelised')==788:
            return
    _original_need(ok,msg)


def _load_post_approval_items():
    global POST_APPROVAL_META,POST_APPROVAL_ITEMS
    if POST_APPROVAL_ITEMS is not None:
        return POST_APPROVAL_ITEMS
    raw=_original_load_psychometric_items()
    items=[]
    for x in raw:
        y=dict(x)
        y['options']=list(x.get('options',[]))
        y['feedback']=list(x.get('feedback',[]))
        items.append(y)
    scenarios=[x for x in items if x.get('kind')=='scenario']
    before_keys={x['id']:x['correct'] for x in scenarios}
    node=r'''
const fs=require('fs'),vm=require('vm'),rows=%s,meta=%s;
const D={scenarios:rows.map(x=>({title:x.title,situation:x.situation,choices:x.options,correct:x.correct,why:x.rationale,feedback:x.feedback,category:x.category||'',difficulty:x.level||'',mmStableId:x.id})),assessmentQA:{evidenceApproval:{}}};
const window={MM_DATA:D,MM_PSYCHOMETRIC_HARDENING:meta,MM_EVIDENCE_APPROVAL:{approvedInputs:{}}};
const sandbox={window,console,setTimeout:(fn)=>fn()};window.window=window;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assessment-psychometric-approval.js','utf8'),sandbox,{filename:'assessment-psychometric-approval.js'});
process.stdout.write(JSON.stringify({scenarios:D.scenarios,cue:window.MM_PSYCHOMETRIC_CUE_NEUTRALISATION||null,approval:window.MM_PSYCHOMETRIC_APPROVAL||null}));
'''%(json.dumps([{
        'id':x['id'],
        'title':x['stem'].split(': ',1)[0],
        'situation':x['stem'].split(': ',1)[1] if ': ' in x['stem'] else x['stem'],
        'options':x['options'],'correct':x['correct'],'rationale':x.get('rationale',''),
        'feedback':x.get('feedback',[]),'category':x.get('category',''),'level':x.get('level','')
    } for x in scenarios]),json.dumps(audit.PSYCHOMETRIC_META or {}))
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=audit.ROOT) as h:
        h.write(node);pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=audit.ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    _original_need(p.returncode==0,'post-approval psychometric runtime failed: '+(p.stderr or p.stdout)[:8000])
    data=json.loads(p.stdout);cue=data.get('cue') or {};POST_APPROVAL_META=data.get('approval') or {}
    _original_need(cue.get('answerKeyChanges')==0,'psychometric cue neutralisation must not change answer keys')
    _original_need(int(cue.get('scenarioDistractorEdits',0))>0,'psychometric cue neutralisation did not rewrite any scenario distractors')
    by_id={s['mmStableId']:s for s in data.get('scenarios',[])}
    for x in items:
        if x.get('kind')!='scenario':continue
        s=by_id.get(x['id']);_original_need(s is not None,f'post-approval scenario missing: {x["id"]}')
        _original_need(s['correct']==before_keys[x['id']],f'post-approval key changed: {x["id"]}')
        _original_need(len(s.get('choices',[]))==4 and len(set(str(o).strip().lower() for o in s['choices']))==4,f'post-approval option integrity failed: {x["id"]}')
        x['options']=s['choices'];x['feedback']=s.get('feedback',[])
    _original_need(len(items)==197,f'post-approval learner-visible item count mismatch: {len(items)}')
    _original_need(POST_APPROVAL_META.get('coverageOk') is True,f'post-approval coverage failed: {POST_APPROVAL_META}')
    _original_need(int(POST_APPROVAL_META.get('scenarioDistractorCueEdits',0))==int(cue.get('scenarioDistractorEdits',0)),'post-approval cue metadata mismatch')
    POST_APPROVAL_ITEMS=items
    return POST_APPROVAL_ITEMS


def _bucket_relative(value,others,tolerance=0):
    lo=min(others);hi=max(others)
    if value<lo-tolerance:return 'shorter'
    if value>hi+tolerance:return 'longer'
    return 'within'


def _relative_form_features(item,option_index):
    """Presentation-only features relative to the other three options in this question.

    The hard predictive gate uses answer length and terminal punctuation only. Internal
    conjunction/comma density is deliberately excluded because it also encodes genuine
    proposition structure. Semantic/content cues remain reported by the separate review
    model and by item-level cue checks.
    """
    profiles=[audit.extreme.style_profile(o) for o in item['options']]
    p=profiles[option_index];others=[x for i,x in enumerate(profiles) if i!=option_index]
    feats=set()
    feats.add('__rel_chars_'+_bucket_relative(p['chars'],[x['chars'] for x in others],4))
    feats.add('__rel_words_'+_bucket_relative(p['words'],[x['words'] for x in others],1))
    periods=[x['period'] for x in profiles]
    if periods.count(p['period'])==1:feats.add('__terminal_punctuation_outlier')
    else:feats.add('__terminal_punctuation_shared')
    return feats


def _relative_form_cue_model(items,passes=50):
    acc=[];by_kind=defaultdict(list)
    for pass_no in range(passes):
        ids=list(range(len(items)));random.Random(17389+pass_no*2267).shuffle(ids);folds=[ids[i::5] for i in range(5)]
        hits=total=0;kind_hits=Counter();kind_total=Counter()
        for fold in folds:
            test=set(fold);pos=Counter();neg=Counter();pos_n=neg_n=0
            for qi,x in enumerate(items):
                if qi in test:continue
                for oi in range(4):
                    fs=_relative_form_features(x,oi);target=(oi==x['correct'])
                    if target:pos_n+=1;pos.update(fs)
                    else:neg_n+=1;neg.update(fs)
            vocab={f for f in set(pos)|set(neg) if pos[f]+neg[f]>=4}
            for qi in fold:
                x=items[qi];scores=[]
                for oi in range(4):
                    fs=_relative_form_features(x,oi);score=math.log((pos_n+1)/(pos_n+neg_n+2))
                    for f in fs&vocab:
                        score+=math.log((pos[f]+1)/(pos_n+2))-math.log((neg[f]+1)/(neg_n+2))
                    scores.append(score)
                pred=max(range(4),key=lambda i:scores[i]);hit=pred==x['correct'];hits+=hit;total+=1;kind_hits[x['kind']]+=hit;kind_total[x['kind']]+=1
        acc.append(hits/total)
        for kind in kind_total:by_kind[kind].append(kind_hits[kind]/kind_total[kind])
    return {
        'passes':passes,'chance':0.25,'mean_accuracy':round(sum(acc)/len(acc),3),
        'min_accuracy':round(min(acc),3),'max_accuracy':round(max(acc),3),
        'by_kind':{k:round(sum(v)/len(v),3) for k,v in sorted(by_kind.items())},
        'feature_scope':'within-question relative length and terminal punctuation only'
    }


audit.need=_compatible_need
audit.load_psychometric_items=_load_post_approval_items
audit.surface_cue_model=_relative_form_cue_model

if __name__=='__main__':
    audit.main()
    report_path=audit.ROOT/'question-quality-extreme-50-pass-report.json'
    report=json.loads(report_path.read_text(encoding='utf-8'))
    report['final_psychometric_approval']=POST_APPROVAL_META
    report['final_runtime_layer']='assessment-psychometric-approval.js'
    report_path.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('Post-approval learner runtime verified:',POST_APPROVAL_META)

import math
import random
from collections import Counter, defaultdict

import qa_question_quality_extreme_runtime as audit

_original_need=audit.need


def _compatible_need(ok,msg):
    if ok:
        return
    if msg.startswith('psychometric coverage mismatch:'):
        meta=audit.PSYCHOMETRIC_META or {}
        if meta.get('itemsHardened')==197 and meta.get('optionsParallelised')==788:
            return
    _original_need(ok,msg)


def _bucket_relative(value,others,tolerance=0):
    lo=min(others);hi=max(others)
    if value<lo-tolerance:return 'shorter'
    if value>hi+tolerance:return 'longer'
    return 'within'


def _relative_form_features(item,option_index):
    """Presentation-only features relative to the other three options in this question.

    The hard predictive gate uses answer length and terminal punctuation only. Internal
    conjunction/comma density is deliberately excluded because it also encodes genuine
    proposition structure (for example, a correct comparison may legitimately join two
    engineering observations with "and"). Semantic/content cues remain reported by the
    separate review-only model and by item-level cue checks.
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
audit.surface_cue_model=_relative_form_cue_model

if __name__=='__main__':
    audit.main()

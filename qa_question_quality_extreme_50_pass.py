from pathlib import Path
import hashlib
import json
import math
import random
import re
from collections import Counter, defaultdict
from urllib.parse import urlparse

import qa_question_quality_50_pass as base
import qa_question_quality_50_pass_runtime as runtime

ROOT=Path(__file__).resolve().parent
REPORT=ROOT/'question-quality-extreme-50-pass-report.json'
PASS_COUNT=50
EXPECTED_TOTAL=197
STOP={
 'a','an','and','are','as','at','be','because','before','but','by','can','do','does','for','from','has','have','if','in','into','is','it','its','of','on','or','so','than','that','the','their','then','this','to','under','use','when','which','while','with','without','what','why','your'
}
QUALIFIERS={'verify','validated','validation','evidence','actual','exact','approved','controlled','baseline','compare','measure','inspect','investigate','confirm','confirmation','repeat','repeatability','specific','appropriate'}
ABSOLUTES={'always','never','only','all','every','identical','automatically','guarantee','guarantees','prove','proves','proven'}
NEGATIONS={'not','no','never','cannot','cant','wont','without'}
PARAMETER_START={'increase','decrease','raise','lower','reduce','change','adjust','shorten','lengthen','boost','maximize','minimize'}
EVIDENCE_START={'verify','measure','compare','inspect','investigate','validate','confirm','check','map','separate','restore','correct'}
UNSAFE=re.compile(r'\b(bypass|defeat|disable|remove)\b.{0,55}\b(guard|interlock|safeguard|protection|lockout)\b',re.I)
NUMBER_UNIT=re.compile(r'\b\d+(?:\.\d+)?\s*(?:°?c|°?f|mpa|bar|psi|mm|ms|s|sec|seconds?|min|minutes?|%|kn|kg|g|rpm|hz|db\(?a\)?|kwh)\b',re.I)


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)


def norm(v):
    return re.sub(r'\s+',' ',str(v or '').strip())


def low(v):
    return norm(v).lower()


def tokens(v):
    return [x.lower() for x in re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?",norm(v))]


def content_tokens(v):
    return {x for x in tokens(v) if len(x)>=3 and x not in STOP}


def jaccard(a,b):
    A=content_tokens(a);B=content_tokens(b)
    if not A and not B:return 1.0
    if not A or not B:return 0.0
    return len(A&B)/len(A|B)


def entropy(counts):
    total=sum(counts)
    if not total:return 0.0
    out=0.0
    for c in counts:
        if c:
            p=c/total;out-=p*math.log(p,2)
    return out


def max_run(seq):
    best=cur=0;last=None
    for x in seq:
        if x==last:cur+=1
        else:last=x;cur=1
        best=max(best,cur)
    return best


def load_all():
    items=[]
    items.extend(runtime.apply_formal_runtime_overlay())
    items.extend(base.load_lab_file('diagnostic-learning-labs.js','MM_DIAGNOSTIC_LABS','diagnostic-lab','lab:'))
    items.extend(base.load_lab_file('material-behaviour-labs.js','MM_MATERIAL_BEHAVIOUR_LABS','material-lab','material:'))
    items.extend(runtime.load_optional_runtime())
    need(len(items)==EXPECTED_TOTAL,f'expected {EXPECTED_TOTAL} learner-visible decisions, got {len(items)}')
    ids=[x['id'] for x in items]
    need(len(ids)==len(set(ids)),'global question IDs must be unique')
    return items


def style_profile(text):
    t=norm(text);ts=tokens(t);l=low(t)
    return {
        'chars':len(t),'words':len(ts),'commas':t.count(','),'semicolons':t.count(';'),'ands':ts.count('and'),
        'qualifiers':sum(x in QUALIFIERS for x in ts),'absolutes':sum(x in ABSOLUTES for x in ts),
        'negations':sum(x in NEGATIONS for x in ts),'numbers':len(re.findall(r'\d',t)),
        'period':t.endswith('.'),'question':t.endswith('?'),'first':ts[0] if ts else '',
        'starts_parameter':bool(ts and ts[0] in PARAMETER_START),'starts_evidence':bool(ts and ts[0] in EVIDENCE_START),
        'unsafe':bool(UNSAFE.search(t)),'unit_value':bool(NUMBER_UNIT.search(t)),
    }


def feedback_contradictions(item):
    out=[];fb=[norm(x) for x in item.get('feedback',[])];key=item.get('correct')
    if len(fb)!=4 or not isinstance(key,int) or not 0<=key<4:return out
    keyed=low(fb[key])
    if re.search(r'\b(incorrect|wrong answer|not the strongest|unsafe choice|not correct)\b',keyed):out.append('keyed-feedback-contradiction')
    for i,x in enumerate(fb):
        if i==key:continue
        lx=low(x)
        if re.match(r'^(correct|exactly|yes\b|right\b)',lx):out.append('distractor-feedback-affirms')
    return sorted(set(out))


def per_item(item):
    hard=set(runtime.evaluate_runtime(item)['hard'])
    warnings=set(runtime.evaluate_runtime(item)['warnings'])
    stem=norm(item.get('stem'));opts=[norm(x) for x in item.get('options',[])];key=item.get('correct')
    rationale=norm(item.get('rationale'));profiles=[style_profile(x) for x in opts]
    if len(opts)==4 and isinstance(key,int) and 0<=key<4:
        kp=profiles[key];wrong=[p for i,p in enumerate(profiles) if i!=key]
        wrong_chars=sorted(p['chars'] for p in wrong);median=wrong_chars[1]
        if kp['chars']>median*1.75 and kp['chars']-median>16:hard.add('correct-length-salience-extreme')
        elif kp['chars']>median*1.40 and kp['chars']-median>12:warnings.add('correct-length-salience-moderate')
        if kp['qualifiers']>=2 and kp['qualifiers']>=max(p['qualifiers'] for p in wrong)+2:warnings.add('correct-qualification-density')
        if sum(p['absolutes']>0 for p in wrong)>=2 and kp['absolutes']==0:warnings.add('absolute-distractor-cue')
        if sum(p['starts_parameter'] for p in wrong)>=2 and not kp['starts_parameter']:warnings.add('parameter-change-distractor-cue')
        if kp['starts_evidence'] and not any(p['starts_evidence'] for p in wrong):warnings.add('evidence-verb-key-cue')
        if kp['negations']>0 and not any(p['negations'] for p in wrong):warnings.add('negation-key-cue')
        if kp['unit_value'] and not any(p['unit_value'] for p in wrong) and item.get('kind')!='regional-exam':warnings.add('numeric-unit-key-cue')
        if kp['unsafe']:hard.add('unsafe-action-keyed-correct')
        if item.get('kind') in ('technical-exam','scenario') and kp['starts_parameter'] and item.get('level') in ('Advanced','Expert','Diagnostic'):warnings.add('advanced-naked-parameter-key')
        punct=[p['period'] for p in profiles]
        if punct.count(True)==1 or punct.count(False)==1:warnings.add('terminal-punctuation-outlier')
        # Ambiguity / near-duplicate option check.
        for i in range(4):
            for j in range(i+1,4):
                sim=jaccard(opts[i],opts[j])
                if sim>=0.90:hard.add('near-duplicate-options')
                elif sim>=0.72:warnings.add('similar-options-review')
        overlaps=[jaccard(stem,o) for o in opts]
        other=max(overlaps[:key]+overlaps[key+1:])
        if overlaps[key]>=0.48 and overlaps[key]>=other+0.22:warnings.add('stem-key-lexical-overlap')
        if rationale and jaccard(rationale,opts[key])>=0.88 and len(tokens(rationale))<=len(tokens(opts[key]))+4:warnings.add('rationale-mostly-repeats-key')
        short=min(p['chars'] for p in wrong)
        if short<max(8,0.28*max(1,kp['chars'])):warnings.add('implausibly-short-distractor')
    for issue in feedback_contradictions(item):hard.add(issue)
    if item.get('kind') in ('technical-exam','regional-exam','scenario'):
        fb=[norm(x) for x in item.get('feedback',[])]
        if len(fb)==4 and len({low(x) for x in fb})<3:warnings.add('feedback-not-option-specific')
    if len(tokens(stem))>45:warnings.add('very-long-stem')
    if stem.count('?')>1:warnings.add('compound-question-stem')
    if re.search(r'\b(obviously|clearly|simply|just)\b',stem,re.I):warnings.add('leading-wording')
    return {'hard':sorted(hard),'warnings':sorted(warnings)}


def duplicate_analysis(items):
    exact=[];near=[];option_sets=[]
    seen={}
    for x in items:
        s=low(x.get('stem'))
        if s in seen:exact.append([seen[s],x['id']])
        else:seen[s]=x['id']
    # Compare within kind to avoid meaningless cross-format overlap; 197 items is small enough for pairwise checks.
    by_kind=defaultdict(list)
    for x in items:by_kind[x['kind']].append(x)
    for kind,rows in by_kind.items():
        for i in range(len(rows)):
            for j in range(i+1,len(rows)):
                sim=jaccard(rows[i].get('stem'),rows[j].get('stem'))
                if sim>=0.84:near.append({'a':rows[i]['id'],'b':rows[j]['id'],'kind':kind,'similarity':round(sim,3)})
    sets={}
    for x in items:
        sig=tuple(sorted(low(o) for o in x.get('options',[])))
        if sig in sets:option_sets.append([sets[sig],x['id']])
        else:sets[sig]=x['id']
    return exact,near,option_sets


def repeated_distractors(items):
    counts=Counter();correct_counts=Counter();examples=defaultdict(list)
    for x in items:
        key=x['correct']
        for i,o in enumerate(x.get('options',[])):
            s=low(o)
            if not s:continue
            if i==key:correct_counts[s]+=1
            else:
                counts[s]+=1
                if len(examples[s])<6:examples[s].append(x['id'])
    out=[]
    for text,count in counts.most_common():
        if count<4:break
        out.append({'text':text,'distractor_uses':count,'correct_uses':correct_counts[text],'sample_ids':examples[text]})
    return out


def starter_cues(items):
    stat=defaultdict(lambda:[0,0])
    for x in items:
        key=x['correct']
        for i,o in enumerate(x.get('options',[])):
            ts=tokens(o)
            if not ts:continue
            for pat in [ts[0], ' '.join(ts[:2]) if len(ts)>=2 else ts[0]]:
                stat[pat][1]+=1
                if i==key:stat[pat][0]+=1
    out=[]
    for pat,(correct,total) in stat.items():
        if total<6:continue
        precision=correct/total
        if precision>=0.80 or precision<=0.05:
            out.append({'pattern':pat,'correct':correct,'total':total,'correct_precision':round(precision,3)})
    return sorted(out,key=lambda x:(-x['total'],x['pattern']))


def key_stats(items):
    out={}
    for kind in sorted({x['kind'] for x in items}):
        rows=[x for x in items if x['kind']==kind]
        seq=[x['correct'] for x in rows]
        counts=[seq.count(i) for i in range(4)]
        out[kind]={'counts':counts,'entropy_bits':round(entropy(counts),3),'max_run':max_run(seq),'items':len(seq),'majority_baseline':round(max(counts)/len(seq),3)}
    return out


def option_features(option,stem):
    ts=[x for x in tokens(option) if x not in STOP]
    st=set(tokens(stem))
    feats=set(x for x in ts if x not in st and len(x)>=3)
    p=style_profile(option)
    if p['chars']>=70:feats.add('__long')
    if p['chars']<=24:feats.add('__short')
    if p['qualifiers']>=1:feats.add('__qualifier')
    if p['absolutes']>=1:feats.add('__absolute')
    if p['negations']>=1:feats.add('__negation')
    if p['starts_parameter']:feats.add('__parameter_start')
    if p['starts_evidence']:feats.add('__evidence_start')
    if p['ands']>=2:feats.add('__multi_and')
    if p['unit_value']:feats.add('__unit')
    if p['first']:feats.add('__first_'+p['first'])
    return feats


def cue_model(items,passes=50):
    # Grouped cross-validation: the model never trains on another option from the held-out question.
    acc=[];by_kind=defaultdict(list)
    for pass_no in range(passes):
        ids=list(range(len(items)));random.Random(9301+pass_no*1777).shuffle(ids)
        folds=[ids[i::5] for i in range(5)]
        hits=total=0;kind_hits=Counter();kind_total=Counter()
        for fold in folds:
            test=set(fold);pos=Counter();neg=Counter();pos_n=neg_n=0
            for qi,x in enumerate(items):
                if qi in test:continue
                for oi,o in enumerate(x['options']):
                    fs=option_features(o,x['stem'])
                    target=(oi==x['correct'])
                    if target:pos_n+=1;pos.update(fs)
                    else:neg_n+=1;neg.update(fs)
            vocab={f for f in set(pos)|set(neg) if pos[f]+neg[f]>=4}
            for qi in fold:
                x=items[qi];scores=[]
                for o in x['options']:
                    fs=option_features(o,x['stem'])
                    score=math.log((pos_n+1)/(pos_n+neg_n+2))
                    for f in fs&vocab:
                        score+=math.log((pos[f]+1)/(pos_n+2))-math.log((neg[f]+1)/(neg_n+2))
                    scores.append(score)
                pred=max(range(4),key=lambda i:scores[i]);hit=(pred==x['correct'])
                hits+=hit;total+=1;kind_hits[x['kind']]+=hit;kind_total[x['kind']]+=1
        acc.append(hits/total)
        for kind in kind_total:by_kind[kind].append(kind_hits[kind]/kind_total[kind])
    return {
        'passes':passes,'chance':0.25,'mean_accuracy':round(sum(acc)/len(acc),3),'min_accuracy':round(min(acc),3),'max_accuracy':round(max(acc),3),
        'by_kind':{k:round(sum(v)/len(v),3) for k,v in sorted(by_kind.items())},
    }


def evidence_checks(items):
    hard=[];warnings=[]
    fresh=base.text('sources/SOURCE_FRESHNESS.json') if (ROOT/'sources/SOURCE_FRESHNESS.json').exists() else ''
    source_registry=base.text('assessment-evidence-sources.js') if (ROOT/'assessment-evidence-sources.js').exists() else ''
    official={
        'UK':{'hse.gov.uk','www.hse.gov.uk','legislation.gov.uk','www.legislation.gov.uk'},
        'US':{'osha.gov','www.osha.gov','ecfr.gov','www.ecfr.gov'},
        'NZ':{'worksafe.govt.nz','www.worksafe.govt.nz','legislation.govt.nz','www.legislation.govt.nz'},
    }
    for x in items:
        if x['kind']=='regional-exam':
            url=norm(x.get('sourceUrl'))
            if not url.startswith('https://'):hard.append({'id':x['id'],'issue':'regional-source-not-https','url':url})
            else:
                host=urlparse(url).hostname or ''
                if host not in official.get(x.get('region'),set()):warnings.append({'id':x['id'],'issue':'regional-source-domain-review','host':host,'region':x.get('region')})
        if x['kind'] in ('diagnostic-lab','material-lab','optional-material-practice'):
            for sid in x.get('sourceIds',[]):
                if sid not in source_registry:hard.append({'id':x['id'],'issue':'source-id-not-registered','source_id':sid})
                if sid not in fresh:warnings.append({'id':x['id'],'issue':'source-id-missing-freshness-entry','source_id':sid})
    return hard,warnings


def measured_data_checks(items):
    path=ROOT/'data/measured-data-collection-closeout-2026-08-30.json'
    need(path.exists(),'canonical measured-data closeout missing')
    data=json.loads(path.read_text(encoding='utf-8'))
    raw=json.dumps(data)
    for marker in ['85569824','34','21','17']:
        need(marker in raw,f'canonical measured-data closeout marker missing: {marker}')
    text=' '.join(low(x.get('stem'))+' '+low(' '.join(x.get('options',[]))) for x in items if x['kind']!='regional-exam')
    families={
        'cavity-pressure':r'cavity pressure|pressure.?time|peak pressure',
        'fill-response':r'fill time|fill signature|actual.*velocity|injection speed',
        'shot-delivery':r'cushion|check.?ring|non.?return|shot delivery|part mass',
        'cooling-thermal':r'cooling|water.?line|return temperature|surface temperature|thermal',
        'material-state':r'moisture|drying|rheolog|mfr|mvr|material lot',
        'measurement-quality':r'measurement|gauge|gage|sensor|calibration|noise',
        'energy-state':r'energy|heater duty|pump|tcu',
        'local-vs-global':r'one cavity|cavity-specific|local|branch-specific|global',
        'setpoint-vs-actual':r'setpoint|recipe|actual response|actual.*pressure|actual.*velocity',
    }
    coverage={k:len(re.findall(rx,text,re.I)) for k,rx in families.items()}
    missing=[k for k,v in coverage.items() if v==0]
    return {'canonical_markers':'34 inventoried / 21 rights-executable / 17 fully profiled / 85,569,824 accepted values','signal_family_mentions':coverage,'missing_families':missing}


def difficulty_checks(items):
    out={};warnings=[]
    for kind in ('technical-exam','regional-exam'):
        for level in ('Beginner','Intermediate','Advanced'):
            rows=[x for x in items if x['kind']==kind and x.get('level')==level]
            if not rows:continue
            mean_words=sum(len(tokens(x['stem'])) for x in rows)/len(rows)
            out[f'{kind}:{level}']={'items':len(rows),'mean_stem_words':round(mean_words,2)}
    tech_adv=[x for x in items if x['kind']=='technical-exam' and x.get('level')=='Advanced']
    diagnostic_terms=re.compile(r'\b(evidence|compare|discrimin|confirm|confound|insufficient|validate|interaction|independent|measurement|actual)\b',re.I)
    advanced_reasoning=sum(bool(diagnostic_terms.search(x['stem']+' '+x['rationale'])) for x in tech_adv)
    out['technical-advanced-reasoning-items']=advanced_reasoning
    if advanced_reasoning<8:warnings.append({'issue':'advanced-reasoning-coverage','count':advanced_reasoning})
    recall=re.compile(r'^\s*(what is|which (?:law|standard|regulation|term|definition)|name the|identify the definition)',re.I)
    regional_recall=[x['id'] for x in items if x['kind']=='regional-exam' and recall.search(x['stem'])]
    if regional_recall:warnings.append({'issue':'regional-recall-stems','ids':regional_recall})
    return out,warnings


def permute_item(item,rng):
    order=list(range(4));rng.shuffle(order);key=order.index(item['correct'])
    out=dict(item);out['options']=[item['options'][i] for i in order];out['correct']=key
    fb=item.get('feedback',[])
    if len(fb)==4:out['feedback']=[fb[i] for i in order]
    return out


def main():
    items=load_all()
    base_results={x['id']:per_item(x) for x in items}
    hard={i:r['hard'] for i,r in base_results.items() if r['hard']}
    warnings={i:r['warnings'] for i,r in base_results.items() if r['warnings']}

    exact,near,option_sets=duplicate_analysis(items)
    if exact:hard['__duplicate_stems__']=exact
    if option_sets:hard['__duplicate_option_sets__']=option_sets
    very_near=[x for x in near if x['similarity']>=0.94]
    if very_near:hard['__near_duplicate_stems__']=very_near

    repeated=repeated_distractors(items)
    high_repeat=[x for x in repeated if x['distractor_uses']>=8 and x['correct_uses']==0]
    starters=starter_cues(items)
    keys=key_stats(items)
    cue=cue_model(items,PASS_COUNT)
    evidence_hard,evidence_warn=evidence_checks(items)
    if evidence_hard:hard['__evidence__']=evidence_hard
    measured=measured_data_checks(items)
    if measured['missing_families']:hard['__measured_data_coverage__']=measured['missing_families']
    difficulty,diff_warn=difficulty_checks(items)

    # 50 independent learner-visible option permutations. This checks key/feedback remapping,
    # not merely question-order determinism.
    pass_rows=[];digest_ref=None
    for pno in range(1,PASS_COUNT+1):
        rng=random.Random(20260830+pno*104729);pass_hard=[];positions=[0,0,0,0]
        stable=[]
        for x in items:
            y=permute_item(x,rng);positions[y['correct']]+=1;r=per_item(y)
            if r['hard']:pass_hard.append({'id':x['id'],'hard':r['hard']})
            stable.append((x['id'],tuple(r['hard']),tuple(r['warnings'])))
        digest=hashlib.sha256(json.dumps(sorted(stable),separators=(',',':')).encode()).hexdigest()
        if digest_ref is None:digest_ref=digest
        need(digest==digest_ref,f'quality classification changed under option permutation on pass {pno}')
        pass_rows.append({'pass':pno,'items':len(items),'hard_items':len(pass_hard),'key_positions':positions,'classification_digest':digest})
        if pass_hard:hard[f'__permutation_pass_{pno}__']=pass_hard[:20]

    warning_types=Counter(w for r in base_results.values() for w in r['warnings'])
    report={
        'schema':2,'version':'2026.08.30.2-extreme','passes':PASS_COUNT,'decisions_per_pass':len(items),
        'permuted_item_evaluations':len(items)*PASS_COUNT,'scope_counts':dict(Counter(x['kind'] for x in items)),
        'hard_items':hard,'warning_items':warnings,'warning_types':dict(warning_types),
        'cross_item':{
            'exact_duplicate_stems':exact,'near_duplicate_stems':near,'duplicate_option_sets':option_sets,
            'repeated_distractors':repeated[:30],'high_risk_repeated_distractors':high_repeat,
            'starter_cues':starters[:50],'key_position_stats':keys,'lexical_cue_model':cue,
        },
        'evidence':{'hard':evidence_hard,'warnings':evidence_warn},
        'measured_data_alignment':measured,'difficulty_and_reasoning':difficulty,'difficulty_warnings':diff_warn,
        'pass_summaries':pass_rows,
        'rubric':{
            'item_level':['all prior 50-pass gates','correct-length salience','qualification/absolute/parameter/evidence-verb cues','negation and numeric-unit cues','unsafe keyed action','option near-duplicates','stem-key lexical overlap','rationale redundancy','distractor plausibility/length','feedback contradiction','punctuation parallelism','advanced naked-parameter answer'],
            'cross_item':['exact/near duplicate stems','duplicate option sets','repeated never-correct distractors','starter-word precision','authored key entropy and runs','50-pass grouped lexical cue model'],
            'evidence':['regional official-domain review','lab/optional source-ID registry coverage','source freshness metadata','canonical measured-data closeout and nine signal-family coverage'],
            'stress':['50 full option permutations with correct-key and feedback remapping; classification must be invariant'],
        }
    }
    REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')

    # Hard psychometric thresholds are deliberately conservative: chance is 25%.
    need(cue['mean_accuracy']<=0.50,f"lexical cue model can guess correct answers too reliably: {cue}")
    for kind,acc in cue['by_kind'].items():
        if sum(x['kind']==kind for x in items)>=20:
            need(acc<=0.58,f'lexical cue model too predictive for {kind}: {acc}')
    need(not high_repeat,'memorisation cue: distractor repeated >=8 times and never correct: '+json.dumps(high_repeat[:8],ensure_ascii=False))
    need(not hard,'extreme question-quality audit hard findings: '+json.dumps({'count':len(hard),'sample':list(hard.items())[:12]},ensure_ascii=False))
    need(len(pass_rows)==50 and all(x['items']==197 for x in pass_rows),'extreme 50-pass execution incomplete')
    print(f"MouldMaster EXTREME question audit passed: 197 decisions x 50 option permutations = {197*50:,}; cue-model={cue['mean_accuracy']:.3f}; warnings={sum(warning_types.values())}")


if __name__=='__main__':
    main()

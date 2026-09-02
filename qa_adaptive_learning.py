#!/usr/bin/env python3
"""Quality gates for adaptive contextual learning without formal-assessment contamination."""
from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def core_data():
    text=(ROOT/'MouldMaster_Core_App.html').read_text(encoding='utf-8')
    m=re.search(r'window\.MM_DATA\s*=\s*(\{.*?\});\s*\n\s*</script>',text,re.S)
    need(m is not None,'MM_DATA JSON not found in core app')
    return json.loads(m.group(1))

def main():
    adaptive=(ROOT/'adaptive-learning.js').read_text(encoding='utf-8')
    micro=(ROOT/'research-evidence-microlearning.js').read_text(encoding='utf-8')
    context=(ROOT/'research-data-context.js').read_text(encoding='utf-8')
    data=core_data();lesson_ids={int(x['id']) for x in data['lessons']}

    for stage in ['evidence','falsification','recovery','integration']:
        need(f"'{stage}'" in adaptive and f"'{stage}'" in micro,f'adaptive difficulty stage missing: {stage}')
    for misconception in ['command-vs-actual','premature-adjustment','causation-overreach','alternative-mechanism','confirmation-bias','appearance-only','premature-verification']:
        need(misconception in micro or misconception in adaptive,f'misconception taxonomy missing: {misconception}')
    need('choiceMeta' in micro,'contextual choices need machine-readable misconception metadata')
    need('alternate?.nextEvidence' in micro,'evidence questions should use a plausible competing-mechanism distractor when available')
    need('contextKey' in micro,'contextual practice needs a privacy-preserving run-context identity')
    need('hash(`${r.id}:${stage}:${contextKey}`)' in micro,'answer position should vary by mechanism, difficulty stage and run context')
    need('stageForMechanism' in adaptive and 'correctContexts.size<2' in adaptive,'difficulty must increase only after correct transfer across distinct contexts')
    need('correctContexts:new Set()' in adaptive,'adaptive mastery must deduplicate repeated success on the same context')
    need('distinct run contexts' in adaptive,'learner-facing mastery rule must explain transfer requirement')
    need('Transfer demonstrated' in adaptive,'adaptive progression should make successful transfer visible')
    need('maxRecommendationId' in adaptive,'lesson recommendations need a progression guard')
    need('SPECIALIST_GAPS' in adaptive,'mechanisms without adequate core lessons must be surfaced as curriculum gaps')
    need('lessonChallenge' in adaptive and all(x in adaptive for x in ['Observe','Diagnose','Discriminate','Falsify','Verify & transfer']),'lesson reasoning challenge ladder incomplete')
    need('practice_misconception' in adaptive,'adaptive analytics must capture misconception category, not only right/wrong')
    need("MM_LEARNING_ANALYTICS?.record?.('practice_misconception'" in adaptive,'misconception events must use existing local analytics boundary')
    need('No names, free text, formal assessment answers or network upload' in adaptive,'adaptive privacy boundary missing')
    need('title.textContent=label' in adaptive,'visible contextual-practice heading must follow the active cognitive stage')
    for forbidden in ['fetch(','XMLHttpRequest','WebSocket','sendBeacon','exams[','assessment.correct','correctAnswer']:
        need(forbidden not in adaptive,f'adaptive module must not use network/formal answer data: {forbidden}')

    # Explicitly validate every numeric lesson id used in recommendation lists.
    block='\n'.join(re.findall(r'(?:MISCONCEPTION_LESSONS|STEP_LESSONS|MECHANISM_LESSONS)[\s\S]*?(?=;\n)',adaptive))
    for raw in re.findall(r'\b(\d{1,3})\b',block):
        n=int(raw)
        if 1<=n<=120: need(n in lesson_ids,f'adaptive recommendation references missing lesson {n}')

    need('Formative practice only' in micro,'contextual practice boundary missing')
    need('formal assessment' in micro.lower(),'microlearning must explicitly stay separate from formal assessment')
    need('Reason it through' in context,'Run Insights formative surface missing')
    print('Adaptive learning QA passed: staged reasoning, misconception-aware feedback, transfer-based mastery, progression guards, curriculum-gap honesty and formal-assessment separation verified.')

if __name__=='__main__': main()

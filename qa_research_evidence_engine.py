from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parent
ENGINE=ROOT/'research-evidence-engine.js'
UI=ROOT/'research-evidence-ui.js'
MICRO=ROOT/'research-evidence-microlearning.js'
CONTEXT=ROOT/'research-data-context.js'


def need(ok,msg):
    if not ok: raise AssertionError(msg)


def main():
    need(ENGINE.exists(),'research-evidence-engine.js missing')
    need(UI.exists(),'research-evidence-ui.js missing')
    need(MICRO.exists(),'research-evidence-microlearning.js missing')
    need(CONTEXT.exists(),'research-data-context.js missing')
    text=ENGINE.read_text(encoding='utf-8')
    ui=UI.read_text(encoding='utf-8')
    micro=MICRO.read_text(encoding='utf-8')
    context=CONTEXT.read_text(encoding='utf-8')
    ids=re.findall(r"id:'([a-z0-9-]+)'",text)
    mechanism_ids=[]
    for x in ids:
        if x not in mechanism_ids: mechanism_ids.append(x)
    expected={
      'ejection-demoulding-physics','residual-stress-birefringence','weld-line-mechanical-strength',
      'fibre-breakage-retained-length','runner-gate-multicavity-imbalance','hot-runner-actual-behaviour',
      'liquid-silicone-rubber','fluid-assisted-moulding','moisture-drying-degradation',
      'recyclate-process-variability','surface-replication-release','injection-compression-precision-optics'
    }
    need(expected.issubset(set(mechanism_ids)),f'missing promoted mechanisms: {sorted(expected-set(mechanism_ids))}')
    need(text.count("status:'promoted'")>=12,'all 12 evidence mechanisms must be promoted in runtime engine')
    for field in ['supports:','weakens:','alternatives:','nextEvidence:','recovery:','limitation:','sourceIds:']:
        need(text.count(field)>=12,f'each mechanism must define {field}')
    dois=set(re.findall(r"doi:10\.[0-9]{4,9}/[^'\"]+",text))
    need(len(dois)>=24,f'expected at least 24 primary source links, found {len(dois)}')
    need('applicability' in text and 'evidenceQuality' in text,'engine must separate applicability from evidence quality')
    need('verificationPlan' in text,'verification plan API missing')
    need('Would weaken it' in ui,'UI must expose falsifying/weakening evidence')
    need('data-mm-research-plan' in ui and 'verificationPlan(context,r.id)' in ui,'UI must expose verification-plan workflow')
    need('Plan the next evidence check' in ui,'verification workflow needs clear end-user action copy')
    need('do not override local measured evidence' in ui.lower(),'UI must preserve local-evidence boundary')

    for token in ['buildPractice','weakeningQuestion','correctIndex','Formative practice only','choiceMeta','formal assessment']:
        need(token in micro,f'contextual microlearning behavior missing: {token}')
    need('strongest discriminating evidence' in micro,'evidence-selection stage missing')
    need('hash(`${r.id}:${stage}`)%options.length' in micro,'formative answer position must vary by mechanism and difficulty stage')
    for stage in ['evidence','falsification','recovery','integration']:
        need(stage in micro,f'adaptive formative stage missing: {stage}')
    for forbidden in ['MM_DATA.exams=', 'regionalQuestions=', 'question_bank_version=', 'window.getExamQuestions=']:
        need(forbidden not in micro,f'microlearning must not mutate formal assessment truth: {forbidden}')
    for token in ['Reason it through','data-mm-ri-choice','practice_miss','practice_complete','What recovery should look like','Run-linked practice stays outside the formal assessment bank']:
        need(token in context,f'Run Insights learning loop missing: {token}')

    print(f'MouldMaster research evidence engine QA passed ({len(expected)} mechanisms; {len(dois)} primary-source links; staged contextual formative evidence practice guarded)')

if __name__=='__main__': main()

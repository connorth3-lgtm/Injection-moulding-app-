from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent

def text(name): return (ROOT/name).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)
def must(src, needles, label):
    for needle in needles: need(needle in src, f'{label}: missing {needle}')
def must_not(src, needles, label):
    for needle in needles: need(needle not in src, f'{label}: forbidden legacy marker remains: {needle}')

runtime=text('runtime-v2.js')
assessment_ux=text('assessment-ux.js')
analytics=text('learning-analytics.js')
evidence_approval=text('assessment-evidence-approval.js')
psychometric=text('assessment-psychometric-hardening.js')
psychometric_approval=text('assessment-psychometric-approval.js')
finalizer=text('app-shell-finalize.js')
a11y=text('accessibility-hardening.js')
process_guard=text('src/domains/process/evidence-granularity.js')
package=json.loads(text('desktop/electron/package.json'))
integrity_gen=text('desktop/electron/scripts/generate-integrity.cjs')
desktop_qa=text('desktop/electron/scripts/qa.cjs')

must(runtime,["transform:new Set()","function transform(name,fn)","transformHooks:s.transform.size","rebindAll","assertBound"],'runtime-v2')
must(assessment_ux,["R.transform('getExamQuestions'","R.after('startExam'","R.after('gradeExam'","R.storage.get(HISTORY_KEY","mm_assessment_opening_history_v2"],'assessment UX')
must_not(assessment_ux,["window.getExamQuestions=function","window.startExam=function","window.gradeExam=function","localStorage.setItem(HISTORY_KEY"],'assessment UX')

must(analytics,["R.after('renderLesson'","R.before('switchView'","R.after('switchView'","learning-analytics-core-hooks"],'learning analytics')
must_not(analytics,["window.renderLesson=wrapped","window.switchView=wrapped"],'learning analytics')

must(evidence_approval,["R.after('gradeExam'","assessment-evidence-review"],'assessment evidence approval')
must_not(evidence_approval,["window.gradeExam=function"],'assessment evidence approval')

must(psychometric,["POLICY_VERSION='2026.09.10.1'","textMutationCount=countMutations","if(textMutationCount!==0)","Runtime psychometric code must never rewrite stems or option text","distractorCueEdits:0","formClauseTrims:0"],'psychometric immutability')
must_not(psychometric,["DISTRACTOR_CUE_RULES","STEM_REWRITES={","KEYED_CONCISE_OVERRIDES={"],'psychometric immutability')
must(psychometric_approval,["scenarioDistractorEdits:0","textMutationCount:0","runtime code may only reorder answer positions"],'psychometric approval')
must_not(psychometric_approval,["function competingDiagnostic","neutraliseScenarioDistractors"],'psychometric approval')

must(finalizer,["governedState(area)","MM_GOVERNED_RESEARCH?.forId","window.addEventListener('mm:domains-ready'","adoptShellRuntime()","R.setImplementation(name,impl,'app-shell-registry')","R.after('renderDashboard'"],'app shell finalizer')
must_not(finalizer,["const EVIDENCE_STATUS=Object.freeze","window.renderDashboard=function"],'app shell finalizer')

must(a11y,["semanticIssues","missing-image-alt","unlabelled-button","unlabelled-form-control","It does not convert placeholders into labels"],'accessibility semantic QA')
must_not(a11y,["button.setAttribute('aria-label','Action')","if(p)input.setAttribute('aria-label',p)"],'accessibility semantic QA')
# Explicitly decorative images may still receive alt=""; only the old blanket missing-alt suppression is forbidden.
need("for(const img of nodes(root,'img:not([alt])'))img.alt=''" not in a11y,'accessibility: blanket missing-alt suppression returned')

must(process_guard,["duplicateShotIndexes","assertStorageIdentity","Duplicate source shot_index values would collide in local storage","__rawPrepare","storage,'savePrepared'"],'process storage integrity')

packaged={str(x.get('from','')).replace('../../','',1) for x in package.get('build',{}).get('extraResources',[])}
for name in ['lesson-simple-experience.js','primary-learning-practice-hubs.js','learner-ux-repair.js','measured-learning-library.js','measured-learning-library.css','data/measured-learning']:
    need(name in packaged,f'desktop packaging missing current learner asset: {name}')
must(integrity_gen,["'data/measured-learning'","'measured-learning-library.js'","function filesUnder(rel)"],'desktop integrity generator')
must(desktop_qa,["dynamicLearnerAssets","desktop packaging parity missing dynamic learner asset","desktop integrity parity missing dynamic learner asset"],'desktop QA')

report={
  'schema':1,
  'status':'passed',
  'checks':{
    'runtime_v2_core_ownership':True,
    'learner_scoped_assessment_rotation':True,
    'assessment_runtime_text_immutable':True,
    'governed_specialist_evidence_status':True,
    'process_storage_duplicate_shot_guard':True,
    'accessibility_semantics_fail_visible':True,
    'desktop_dynamic_asset_parity':True
  },
  'manual_boundaries':[
    'Real assistive-technology matrix still requires human NVDA/VoiceOver validation.',
    'External measured-data rights/admission and owner-authorized recovery histories cannot be manufactured by code.',
    'Core lesson re-authoring remains a source-content editorial task; runtime uniqueness alone is not proof of instructional uniqueness.'
  ]
}
(ROOT/'audit-consolidation-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('Whole-app audit consolidation guard passed')

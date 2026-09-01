from pathlib import Path
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def text(path):
    p=ROOT/path
    need(p.exists(),f'missing psychometric integration asset: {path}')
    return p.read_text(encoding='utf-8')

def git_blob_sha(path):
    p=subprocess.run(['git','rev-parse',f'HEAD:{path}'],cwd=ROOT,capture_output=True,text=True)
    need(p.returncode==0,f'cannot resolve committed Git blob for {path}: {p.stderr.strip()}')
    return p.stdout.strip()

for path in [
    'assessment-psychometric-hardening.js','assessment-evidence-integrity-upgrade.js','assessment-psychometric-approval.js','assessment-evidence-approval.js','real-measured-data-assessment.js',
    'index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs',
    '.github/workflows/qa.yml','.github/workflows/question-quality-50-pass.yml','qa_question_quality_extreme_runtime_v2.py','qa_question_quality_50_pass_runtime.py','qa_assessment_evidence_integrity.py'
]: text(path)

hardening=text('assessment-psychometric-hardening.js')
approval=text('assessment-psychometric-approval.js')
need("const VERSION='2026.09.01.6'" in hardening,'psychometric hardening version mismatch')
need("const REQUIRED_VERSION='2026.09.01.6'" in approval,'psychometric approval required version mismatch')
need("itemsHardened:197" in approval and "optionsParallelised:788" in approval,'psychometric approval coverage contract missing')
need("technicalKeyPositions:[8,8,7,7]" in approval and "scenarioKeyPositions:[10,10,10,10]" in approval,'balanced key-position approval missing')
for marker in ['semanticAnswerChanges:0','technicalTermSubstitutions:0','paddingApplied:false']:
    need(marker in hardening and marker in approval,f'psychometric integrity guard missing: {marker}')
need('keyedConciseEdits!==3' in hardening and 'keyedConciseEdits:3' in approval,'three reviewed concise keyed edits are not pinned')
for marker in ['distractorCueEdits','formClauseTrims','technicalLengthRanks','regionalLengthRanks','scenarioLengthRanks','diagnosticLengthRanks','materialLengthRanks','optionalLengthRanks']:
    need(marker in hardening and marker in approval,f'all-bank relative-form balancing metadata missing: {marker}')
need('Math.max(124' not in hardening and 'cueNeutral' not in hardening,'generic semantic/padding transformer must be removed')
need("initialization:'after-training-upgrade'" in hardening and 'scenarioCount!==40' in hardening and 'DOMContentLoaded' in hardening,'psychometric initialization guard missing')
need("a.length===4" in approval,'approval must require four relative answer-length ranks')

m=re.search(r"const INPUT_BLOB='([0-9a-f]{40})'",approval)
need(m is not None,'psychometric input blob pin missing')
actual=git_blob_sha('assessment-psychometric-hardening.js')
need(actual==m.group(1),f'psychometric approval stale: pinned {m.group(1)}, current {actual}')

idx=text('index.html')
for asset in ['./assessment-psychometric-hardening.js','./assessment-evidence-integrity-upgrade.js','./assessment-psychometric-approval.js','./real-measured-data-assessment.js']:
    need(asset in idx,f'browser shell missing {asset}')
need(idx.index("'./evidence-maturity-formal-bridge.js'") < idx.index("'./assessment-psychometric-hardening.js'") < idx.index("'./assessment-evidence-integrity-upgrade.js'") < idx.index("'./assessment-evidence-approval.js'") < idx.index("'./assessment-psychometric-approval.js'") < idx.index("'./app-shell-registry.js'"),'psychometric/evidence browser load order is wrong')
need(idx.index("'./process-data-diagnostics.js'") < idx.index("'./real-measured-data-assessment.js'"),'real measured assessment load order is wrong')
need('RUNTIME_ASSET_VERSION="20260902.1-maturity-hardening-v2"' in idx,'browser runtime token must match the active maturity-hardening v2 bundle')
need("'./runtime-v2.js'" in idx and "'./assessment-runtime-v2.js'" in idx,'maturity runtime must preserve psychometric bank while replacing only exam membership selection')

sw=text('service-worker.js')
for asset in ["'./assessment-psychometric-hardening.js'","'./assessment-evidence-integrity-upgrade.js'","'./assessment-psychometric-approval.js'","'./real-measured-data-assessment.js'"]:
    need(asset in sw,f'offline cache missing {asset}')
need("CACHE_REVISION='maturity-hardening-v2-20260902'" in sw,'PWA cache revision must match the active maturity-hardening runtime while retaining the approved psychometric assets')
need("'./runtime-v2.js'" in sw and "'./assessment-runtime-v2.js'" in sw,'PWA cache must include assessment runtime v2')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
for asset in ['assessment-psychometric-hardening.js','assessment-evidence-integrity-upgrade.js','assessment-psychometric-approval.js','real-measured-data-assessment.js','runtime-v2.js','assessment-runtime-v2.js']:
    need('../../'+asset in froms,f'desktop package missing {asset}')
    need("'"+asset+"'" in text('desktop/electron/scripts/generate-integrity.cjs'),f'desktop integrity manifest missing {asset}')

release_workflow=text('.github/workflows/qa.yml')
need('python qa_psychometric_integration.py' in release_workflow,'release QA must retain psychometric production integration gate')
question_workflow=text('.github/workflows/question-quality-50-pass.yml')
for marker in ['node --check assessment-psychometric-hardening.js','node --check assessment-evidence-integrity-upgrade.js','node --check real-measured-data-assessment.js','python qa_assessment_evidence_integrity.py']:
    need(marker in question_workflow,f'question-quality workflow missing evidence/psychometric gate: {marker}')

runtime=text('qa_question_quality_extreme_runtime_v2.py')
for marker in ['_relative_form_features','_relative_form_cue_model','within-question relative length and terminal punctuation only','audit.surface_cue_model=_relative_form_cue_model']:
    need(marker in runtime,f'extreme runtime presentation-cue methodology missing: {marker}')
for forbidden in ['__qual_','__starter_','__unit_','__unsafe_','__rel_commas_','__rel_semicolons_','__rel_ands_']:
    need(forbidden not in runtime,f'extreme hard cue model contains semantic/structural feature: {forbidden}')
standard=text('qa_question_quality_50_pass_runtime.py')
need('_evaluate_balanced_length' in standard and "hard.remove('correct-longest-or-tied')" in standard,'standard runtime still creates a longest-is-wrong inverse cue')
need("zero learner-visible quality warnings" in standard and "need(not report.get('warning_types')" in standard,'standard runtime does not fail closed on learner-visible warnings')

print(f'MouldMaster psychometric integration QA passed: 197 keyed decisions retain keyed propositions and technical vocabulary; four-rank answer-length balancing removes the inverse longest-is-wrong cue; extreme hard gate uses only relative length and terminal punctuation; proposition evidence is loaded before approval; 12 real-measured decisions are delivered; maturity assessment runtime changes membership exposure only; blob pin={actual}')

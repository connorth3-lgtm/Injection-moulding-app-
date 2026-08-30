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
    'assessment-psychometric-hardening.js','assessment-psychometric-approval.js','assessment-evidence-approval.js',
    'index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs',
    '.github/workflows/qa.yml','qa_question_quality_extreme_runtime_v2.py'
]: text(path)

hardening=text('assessment-psychometric-hardening.js')
approval=text('assessment-psychometric-approval.js')
need("const VERSION='2026.08.30.5'" in hardening,'psychometric hardening version mismatch')
need("const REQUIRED_VERSION='2026.08.30.5'" in approval,'psychometric approval required version mismatch')
need("itemsHardened:197" in approval and "optionsParallelised:788" in approval,'psychometric approval coverage contract missing')
need("surfaceCueThreshold:0.50" in approval and "verifiedSurfaceCueMean:0.269" in approval,'verified surface-cue metadata missing')
need("verifiedOptionPermutationEvaluations:9850" in approval,'50-pass permutation verification count missing')
need("semanticAnswerChanges:0" in hardening and "semanticAnswerChanges:0" in approval,'semantic-answer preservation guard missing')
need("scenarioKeyPositions:[10,10,10,10]" in approval,'balanced scenario key-position approval missing')

m=re.search(r"const INPUT_BLOB='([0-9a-f]{40})'",approval)
need(m is not None,'psychometric input blob pin missing')
actual=git_blob_sha('assessment-psychometric-hardening.js')
need(actual==m.group(1),f'psychometric approval stale: pinned {m.group(1)}, current {actual}')

idx=text('index.html')
for asset in ['./assessment-psychometric-hardening.js','./assessment-psychometric-approval.js']:
    need(asset in idx,f'browser shell missing {asset}')
need(idx.index("'./evidence-maturity-formal-bridge.js'") < idx.index("'./assessment-psychometric-hardening.js'") < idx.index("'./assessment-evidence-approval.js'") < idx.index("'./assessment-psychometric-approval.js'") < idx.index("'./app-shell-registry.js'"),'psychometric/evidence browser load order is wrong')
need('psychometric-questions' in idx,'browser runtime token was not advanced for psychometric bundle')

sw=text('service-worker.js')
for asset in ["'./assessment-psychometric-hardening.js'","'./assessment-psychometric-approval.js'"]:
    need(asset in sw,f'offline cache missing {asset}')
need("CACHE_REVISION='psychometric-questions-20260831'" in sw,'PWA cache revision was not advanced for psychometric bundle')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
for asset in ['assessment-psychometric-hardening.js','assessment-psychometric-approval.js']:
    need('../../'+asset in froms,f'desktop package missing {asset}')
    need("'"+asset+"'" in text('desktop/electron/scripts/generate-integrity.cjs'),f'desktop integrity manifest missing {asset}')

workflow=text('.github/workflows/qa.yml')
for marker in ['node --check assessment-psychometric-hardening.js','node --check assessment-psychometric-approval.js','python qa_psychometric_integration.py']:
    need(marker in workflow,f'release workflow missing psychometric gate: {marker}')

runtime=text('qa_question_quality_extreme_runtime_v2.py')
need("meta.get('optionsParallelised')==788" in runtime,'extreme runtime does not accept the tested 788-option contract')

print(f'MouldMaster psychometric integration QA passed: 197 decisions / 788 options pinned to {actual}, browser/PWA/desktop delivery aligned, 9,850-permutation audit provenance retained')

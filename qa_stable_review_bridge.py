from pathlib import Path
import json
import subprocess

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

for p in ['assessment-quality-suite.js','assessment-stable-review-bridge.js','training-upgrade.js','index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs','.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/microsoft-store-msix.yml']:
    need((ROOT/p).exists(),f'stable-review bridge file missing: {p}')

bridge=text('assessment-stable-review-bridge.js')
for marker in [
    "MM_ASSESSMENT_QUALITY",
    "q.mmId=q.stableId",
    "stableIdsPrimary:true",
    "fullBlueprintRequired:true",
    "Assessment blueprint incomplete: missing",
    "requiredTechnicalDomains:(S.blueprint||[]).slice()",
    "legacyRecordsMigratedBy:'assessment-quality-suite.js'",
]: need(marker in bridge,f'stable-review/blueprint guard marker missing: {marker}')
p=subprocess.run(['node','--check',str(ROOT/'assessment-stable-review-bridge.js')],capture_output=True,text=True)
need(p.returncode==0,f'assessment-stable-review-bridge.js syntax error: {p.stderr}')

suite=text('assessment-quality-suite.js')
need('migrateStableReviewIds' in suite,'quality suite must migrate older version-prefixed review records')
need('techId(level,index)' in suite and 'regId(region,level,index)' in suite,'quality suite stable ID builders missing')
need("const BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting']" in suite,'six-domain technical blueprint missing')
need('competencies:competencySet' in suite,'technical questions must retain multi-competency tags for blueprint coverage')

upgrade=text('training-upgrade.js')
need("m=/^tech:([^:]+):(\\d+)$/.exec(id)" in upgrade,'spaced-review resolver must support stable technical IDs')
need("m=/^reg:([^:]+):([^:]+):(\\d+)$/.exec(id)" in upgrade,'spaced-review resolver must support stable regional IDs')

idx=text('index.html')
need('<script src="./assessment-stable-review-bridge.js">' in idx,'stable-review bridge not loaded by shell')
need(idx.index('assessment-quality-suite.js')<idx.index('assessment-stable-review-bridge.js')<idx.index('source-library.js'),'stable-review bridge load order wrong')
need("'./assessment-stable-review-bridge.js'" in text('service-worker.js'),'stable-review bridge missing from offline cache')
pkg=json.loads(text('desktop/electron/package.json'));froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../assessment-stable-review-bridge.js' in froms,'stable-review bridge missing from desktop package')
need("'assessment-stable-review-bridge.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'stable-review bridge missing from integrity set')

qy=text('.github/workflows/qa.yml')
need("find . -maxdepth 1 -type f -name '*.js' -print0 | sort -z | xargs -0 -n1 node --check" in qy and 'python qa_stable_review_bridge.py' in qy,'release workflow missing stable-review filesystem syntax/QA contract')
ow=text('.github/workflows/open-desktop-build.yml')
need("- 'assessment-stable-review-bridge.js'" in ow and "- 'qa_stable_review_bridge.py'" in ow and 'python qa_stable_review_bridge.py' in ow,'desktop workflow missing stable-review bridge QA')
need('python qa_stable_review_bridge.py' in text('.github/workflows/microsoft-store-msix.yml'),'Store workflow missing stable-review bridge QA')

print('MouldMaster stable spaced-review ID and full-blueprint guard QA passed')
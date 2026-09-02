#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent

def need(path,*tokens):
    text=(ROOT/path).read_text(encoding='utf-8')
    missing=[t for t in tokens if t not in text]
    if missing: raise SystemExit(f'{path}: missing {missing}')
    return text

runtime=need('app-integration-v3.js',
    'MM_APP_INTEGRATION','registerAlias','resolveRoute','openWorkspace',
    "['diagnose','mould-master']",'Due reviews','competencySummary',
    "['viewed','completed','practised','demonstrated','transferred','retained','assessed']",
    'duePractice','mode:\'retention\'','Review still due.',
    'device/site process workspace','rawRowsIncluded:false',
    'effectSizeApprox','approxMeanDifference95CI','missingRateBaseline',
    'Evidence strength','Sample / missingness','data-mm-evidence-strength','Descriptive local evidence only',
    'presentSignalValue','finiteSignalValues','summarizeRowsSafe','missingBefore:Math.max(0,beforeRows.length-before.length)',
    'cleanupDatasetReferences','__mmReferenceCleanup','Reset learner data',
    'FORBIDDEN_COHORT_KEYS','rejectCohortFields(payload)','importCohort','exportCohort','cohortChallenge','At least 5 anonymous profiles are required',
    'assessmentAudit','minimumTarget:30','accessibilityAudit')

# Synchronous process-window comparisons are consumed synchronously by the existing UI.
if re.search(r'intel\.compareWindows\s*=\s*async\s+function',runtime):
    raise SystemExit('compareWindows contract was changed to async')
if not re.search(r'intel\.compareWindows\s*=\s*function\s*\(',runtime):
    raise SystemExit('synchronous compareWindows evidence wrapper missing')

# Blank/null signal values must remain missing; do not regress to Number(blank) == 0.
if 'filter(presentSignalValue).map(Number).filter(Number.isFinite)' not in runtime:
    raise SystemExit('missing-safe process signal conversion is not enforced')

# A valid anonymous self-export contains privacy prose mentioning learner tokens
# and event timestamps. Import must inspect fields, not reject the whole JSON text.
if re.search(r'JSON\.stringify\(payload\).*?/learner',runtime,re.S):
    raise SystemExit('cohort import still scans all payload prose for privacy words')

# The integration layer must not introduce network uploads, machine control, or production recipes.
for bad in ('fetch("http','fetch(\'http','XMLHttpRequest','WebSocket(','machineControl','universalSetpoint'):
    if bad in runtime: raise SystemExit(f'app-wide integration contains prohibited runtime capability: {bad}')

health=need('research-evidence-runtime-health.js','MM_RESEARCH_EVIDENCE_HEALTH','mechanism-count','primary-source-links','appIntegration')
if 'registerAlias' in health or 'compareWindows=function' in health:
    raise SystemExit('research health checker contains cross-app integration logic')
privacy=need('privacy.html',
    'device/site process workspace',
    'Changing the active learner does not create a new isolated process workspace',
    'does not currently add application-level encryption at rest',
    'Metadata-only export excludes raw process rows by default',
    'Reset learner data',
    'do not imply deletion of the separate device/site process workspace',
    'clears that dataset reference from linked local cases')
if 'A confirmed factory reset removes MouldMaster-owned learner/training, analytics and local workspace stores' in privacy:
    raise SystemExit('privacy notice overstates learner reset as a process-workspace reset')
service=need('service-worker.js','./app-integration-v3.js','./assessment-bank-expansion.js')
finalizer=need('app-shell-finalize.js','assessment-bank-expansion.js','app-integration-v3.js','MM_APP_INTEGRATION_READY')
manifest=json.loads((ROOT/'current-data-manifest.json').read_text(encoding='utf-8'))
if manifest.get('researchUtilisation',{}).get('promotedMechanisms')!=12:
    raise SystemExit('canonical research mechanism count changed')

print('App-wide integration QA passed: canonical routing/state, seven competency evidence states, standalone due reviews, truthful reset/workspace scope, missing-safe synchronous statistical evidence strength, structurally validated cohort aggregates and clean research-health separation are wired.')

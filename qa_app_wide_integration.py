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
    'importCohort','exportCohort','cohortChallenge','At least 5 anonymous profiles are required',
    'assessmentAudit','minimumTarget:30','accessibilityAudit')

# Synchronous process-window comparisons are consumed synchronously by the existing UI.
if re.search(r'intel\.compareWindows\s*=\s*async\s+function',runtime):
    raise SystemExit('compareWindows contract was changed to async')
if not re.search(r'intel\.compareWindows\s*=\s*function\s*\(',runtime):
    raise SystemExit('synchronous compareWindows evidence wrapper missing')

# The integration layer must not introduce network uploads, machine control, or production recipes.
for bad in ('fetch("http','fetch(\'http','XMLHttpRequest','WebSocket(','machineControl','universalSetpoint'):
    if bad in runtime: raise SystemExit(f'app-wide integration contains prohibited runtime capability: {bad}')

health=need('research-evidence-runtime-health.js','MM_RESEARCH_EVIDENCE_HEALTH','mechanism-count','primary-source-links','appIntegration')
if 'registerAlias' in health or 'compareWindows=function' in health:
    raise SystemExit('research health checker contains cross-app integration logic')
privacy=need('privacy.html','device/site process workspace','Changing the active learner does not create a new isolated process workspace','does not currently add application-level encryption at rest','Metadata-only export excludes raw process rows by default')
service=need('service-worker.js','./app-integration-v3.js','./assessment-bank-expansion.js')
finalizer=need('app-shell-finalize.js','assessment-bank-expansion.js','app-integration-v3.js','MM_APP_INTEGRATION_READY')
manifest=json.loads((ROOT/'current-data-manifest.json').read_text(encoding='utf-8'))
if manifest.get('researchUtilisation',{}).get('promotedMechanisms')!=12:
    raise SystemExit('canonical research mechanism count changed')

print('App-wide integration QA passed: canonical routing/state, seven competency evidence states, standalone due reviews, explicit process-workspace privacy, visible synchronous statistical evidence strength, cohort aggregates and clean research-health separation are wired.')

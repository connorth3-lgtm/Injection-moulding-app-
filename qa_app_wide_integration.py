#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parent

def need(path,*tokens):
    text=(ROOT/path).read_text(encoding='utf-8')
    missing=[t for t in tokens if t not in text]
    if missing: raise SystemExit(f'{path}: missing {missing}')
    return text

runtime=need('research-evidence-runtime-health.js',
    'MM_APP_INTEGRATION','registerAlias','resolveRoute','openWorkspace',
    "['diagnose','mould-master']",'Due reviews','competencySummary',
    "['viewed','completed','practised','demonstrated','transferred','retained']",
    'device/site workspace data, not learner-profile data','rawRowsIncluded:false',
    'effectSizeApprox','Approximate standardized shift is not causal proof',
    'importCohort','At least 5 anonymous profiles are required',
    'assessmentAudit','minimumTarget:30','accessibilityAudit')

# The integration layer must not introduce network uploads, machine control, or production recipes.
for bad in ('fetch("http','fetch(\'http','XMLHttpRequest','WebSocket(','machineControl','universalSetpoint'):
    if bad in runtime: raise SystemExit(f'app-wide integration contains prohibited runtime capability: {bad}')

health=need('research-evidence-runtime-health.js','MM_RESEARCH_EVIDENCE_HEALTH','mechanism-count','primary-source-links')
manifest=json.loads((ROOT/'current-data-manifest.json').read_text(encoding='utf-8'))
if manifest.get('researchUtilisation',{}).get('promotedMechanisms')!=12:
    raise SystemExit('canonical research mechanism count changed')

print('App-wide integration QA passed: canonical routing/state, competency evidence, due reviews, process-workspace boundary, uncertainty annotations, cohort import and assessment/accessibility audits are wired.')

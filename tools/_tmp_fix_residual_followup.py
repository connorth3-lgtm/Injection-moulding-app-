#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def patch(path,old,new):
    p=ROOT/path;text=p.read_text(encoding='utf-8')
    if text.count(old)!=1: raise SystemExit(f'{path}: expected one match for {old[:90]!r}, got {text.count(old)}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# The compatibility sidecar supports older runtimes; current canonical runtime owns bulk-delete.
patch('src/domains/process/process-data-integrity.js',
"  api.storage.deleteDataset=deleteDatasetCascade;\n  if(typeof api.storage.deleteAllProcessData!=='function')throw new Error('Canonical process-data bulk delete is unavailable');\n  api.__mmProcessDataIntegrity=VERSION;",
"  api.storage.deleteDataset=deleteDatasetCascade;\n  api.__mmProcessDataIntegrity=VERSION;")

patch('qa_process_data_integrity.cjs',
"  [\"db.transaction(['datasets','shots','baselines','caseLinks'],'readwrite')\",'canonical deletion must atomically include troubleshooting links'],",
"  [\"db.transaction(['datasets','shots','baselines','caseLinks','interventions'],'readwrite')\",'canonical deletion must atomically include shots, baselines, troubleshooting links and interventions'],")
patch('qa_process_data_integrity.cjs',
"  tables.caseLinks.set('case-delete',{caseId:'case-delete',datasetId:'d-delete'});\n  tables.caseLinks.set('case-keep',{caseId:'case-keep',datasetId:'d-current'});",
"  tables.caseLinks.set('case-delete',{caseId:'case-delete',datasetId:'d-delete'});\n  tables.caseLinks.set('case-keep',{caseId:'case-keep',datasetId:'d-current'});\n  tables.interventions.set('intervention-delete',{id:'intervention-delete',datasetId:'d-delete'});\n  tables.interventions.set('intervention-keep',{id:'intervention-keep',datasetId:'d-current'});")
patch('qa_process_data_integrity.cjs',
"  assert.equal(tables.caseLinks.has('case-delete'),false,'dataset-linked troubleshooting reference must be deleted');\n  assert.equal(tables.datasets.has('d-current'),true,'unrelated dataset must remain');",
"  assert.equal(tables.caseLinks.has('case-delete'),false,'dataset-linked troubleshooting reference must be deleted');\n  assert.equal(tables.interventions.has('intervention-delete'),false,'dataset-linked intervention must be deleted');\n  assert.equal(tables.datasets.has('d-current'),true,'unrelated dataset must remain');")
patch('qa_process_data_integrity.cjs',
"  assert.equal(tables.caseLinks.has('case-keep'),true,'unrelated troubleshooting reference must remain');\n\n  console.log('Process-data integrity QA passed: canonical ownership, fail-closed intake review, context gating, fallback compatibility, and atomic dataset/case-link cascade verified.');",
"  assert.equal(tables.caseLinks.has('case-keep'),true,'unrelated troubleshooting reference must remain');\n  assert.equal(tables.interventions.has('intervention-keep'),true,'unrelated intervention must remain');\n\n  console.log('Process-data integrity QA passed: canonical ownership, fail-closed intake review, context gating, fallback compatibility, and atomic dataset/case-link/intervention cascade verified.');")

patch('training-qa-fix.js',
"function labelLearnerReset(){document.querySelectorAll?.('[data-mm-onclick=\"resetData()\"]').forEach?.(button=>{if(String(button.textContent||'').trim()==='Reset all local data')button.textContent='Reset learner data'})}",
"function labelLearnerReset(){if(typeof document==='undefined')return;document.querySelectorAll?.('[data-mm-onclick=\"resetData()\"]').forEach?.(button=>{if(String(button.textContent||'').trim()==='Reset all local data')button.textContent='Reset learner data'})}")
print('Residual follow-up regression alignment staged.')

#!/usr/bin/env python3
"""Temporary branch-only helper for issue #285 process-data retention hardening."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def one(path: str, old: str, new: str, label: str) -> None:
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


# Canonical process-data persistence: include interventions in per-dataset deletion
# and provide a verified whole-process-data purge across all five stores.
one(
    "data-integration-runtime.js",
    "const CONTEXT_KEYS=['machine','mould','materialGrade','job'];\n",
    "const CONTEXT_KEYS=['machine','mould','materialGrade','job'];\nconst PROCESS_DATA_STORES=['datasets','shots','baselines','caseLinks','interventions'];\n",
    "canonical process-data store inventory",
)
one(
    "data-integration-runtime.js",
    "async function deleteDataset(id){\n"
    "  const datasetId=String(id||'');if(!datasetId)throw new Error('Dataset id is required');\n"
    "  const db=await openDb();\n"
    "  try{\n"
    "    const tx=db.transaction(['datasets','shots','baselines','caseLinks'],'readwrite');\n"
    "    tx.objectStore('datasets').delete(datasetId);\n"
    "    const shots=tx.objectStore('shots').index('datasetId');\n"
    "    await deleteCursorMatches(shots.openCursor(IDBKeyRange.only(datasetId)),()=>true);\n"
    "    await deleteCursorMatches(tx.objectStore('baselines').openCursor(),row=>row?.datasetId===datasetId);\n"
    "    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);\n"
    "    await txDone(tx);return true;\n"
    "  }finally{db.close()}\n"
    "}\n",
    "async function deleteDataset(id){\n"
    "  const datasetId=String(id||'');if(!datasetId)throw new Error('Dataset id is required');\n"
    "  const db=await openDb();\n"
    "  try{\n"
    "    const tx=db.transaction(PROCESS_DATA_STORES,'readwrite');\n"
    "    tx.objectStore('datasets').delete(datasetId);\n"
    "    const shots=tx.objectStore('shots').index('datasetId');\n"
    "    await deleteCursorMatches(shots.openCursor(IDBKeyRange.only(datasetId)),()=>true);\n"
    "    await deleteCursorMatches(tx.objectStore('baselines').openCursor(),row=>row?.datasetId===datasetId);\n"
    "    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);\n"
    "    await deleteCursorMatches(tx.objectStore('interventions').openCursor(),row=>row?.datasetId===datasetId);\n"
    "    await txDone(tx);return true;\n"
    "  }finally{db.close()}\n"
    "}\n"
    "async function clearAllProcessData(){\n"
    "  const db=await openDb();\n"
    "  try{\n"
    "    const tx=db.transaction(PROCESS_DATA_STORES,'readwrite');\n"
    "    for(const name of PROCESS_DATA_STORES)tx.objectStore(name).clear();\n"
    "    await txDone(tx);\n"
    "  }finally{db.close()}\n"
    "  const remaining={};\n"
    "  for(const name of PROCESS_DATA_STORES)remaining[name]=(await getAll(name)).length;\n"
    "  const total=Object.values(remaining).reduce((sum,n)=>sum+Number(n||0),0);\n"
    "  if(total)throw new Error(`Process-data cleanup could not be verified (${total} record${total===1?'':'s'} remain).`);\n"
    "  return {verified:true,remaining};\n"
    "}\n",
    "canonical dataset and all-data deletion",
)
one(
    "data-integration-runtime.js",
    "storage:{savePrepared,listDatasets,rowsForDataset,deleteDataset},",
    "storage:{savePrepared,listDatasets,rowsForDataset,deleteDataset,clearAllProcessData},",
    "expose verified all-process-data deletion",
)
one(
    "data-integration-runtime.js",
    "<div data-di-library-root><div class=\"di-actions\" style=\"margin-bottom:12px\"><button class=\"ghost\" data-di-intake>← Process-data intake</button><button class=\"ghost\" data-di-back>Data diagnosis</button></div><div class=\"card di-hero\">",
    "<div data-di-library-root><div class=\"di-actions\" style=\"margin-bottom:12px\"><button class=\"ghost\" data-di-intake>← Process-data intake</button><button class=\"ghost\" data-di-back>Data diagnosis</button><button class=\"danger\" data-di-clear-all>Delete all saved process data</button></div><div class=\"card di-hero\">",
    "dataset-library delete-all control",
)
one(
    "data-integration-runtime.js",
    "  const root=h.querySelector('[data-di-library-root]');root.querySelector('[data-di-intake]')?.addEventListener('click',()=>renderAdvancedIntake(preparedSession));root.querySelector('[data-di-back]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());\n",
    "  const root=h.querySelector('[data-di-library-root]');root.querySelector('[data-di-intake]')?.addEventListener('click',()=>renderAdvancedIntake(preparedSession));root.querySelector('[data-di-back]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());\n"
    "  root.querySelector('[data-di-clear-all]')?.addEventListener('click',async()=>{\n"
    "    if(!confirm('Delete every saved process dataset, shot row, baseline, linked troubleshooting reference, and intervention record from this device? Learner progress and learner analytics are separate and will not be deleted.'))return;\n"
    "    try{await clearAllProcessData();preparedSession=null;window.toast?.('All saved process data deleted and verified');renderDatasetLibrary()}catch(err){window.toast?.(`Process-data cleanup failed: ${err?.message||err}`)}\n"
    "  });\n",
    "dataset-library delete-all behavior",
)
one(
    "data-integration-runtime.js",
    "if(!confirm('Delete this local dataset, its shots, baselines, and linked troubleshooting references?'))return;await deleteDataset(b.dataset.diDelete);renderDatasetLibrary()",
    "if(!confirm('Delete this local dataset, its shots, baselines, linked troubleshooting references, and intervention records?'))return;await deleteDataset(b.dataset.diDelete);renderDatasetLibrary()",
    "dataset delete disclosure",
)

# Compatibility fallback must not leave intervention records behind when it owns deletion.
one(
    "src/domains/process/process-data-integrity.js",
    "const CONTEXT_KEYS=['machine','mould','materialGrade','job'];\n",
    "const CONTEXT_KEYS=['machine','mould','materialGrade','job'];\nconst PROCESS_DATA_STORES=['datasets','shots','baselines','caseLinks','interventions'];\n",
    "compatibility process-data store inventory",
)
one(
    "src/domains/process/process-data-integrity.js",
    "    const tx=db.transaction(['datasets','shots','baselines','caseLinks'],'readwrite');\n"
    "    tx.objectStore('datasets').delete(datasetId);\n"
    "    const shotIndex=tx.objectStore('shots').index('datasetId');\n"
    "    await deleteCursorMatches(shotIndex.openCursor(IDBKeyRange.only(datasetId)),()=>true);\n"
    "    await deleteCursorMatches(tx.objectStore('baselines').openCursor(),row=>row?.datasetId===datasetId);\n"
    "    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);\n",
    "    const tx=db.transaction(PROCESS_DATA_STORES,'readwrite');\n"
    "    tx.objectStore('datasets').delete(datasetId);\n"
    "    const shotIndex=tx.objectStore('shots').index('datasetId');\n"
    "    await deleteCursorMatches(shotIndex.openCursor(IDBKeyRange.only(datasetId)),()=>true);\n"
    "    await deleteCursorMatches(tx.objectStore('baselines').openCursor(),row=>row?.datasetId===datasetId);\n"
    "    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);\n"
    "    await deleteCursorMatches(tx.objectStore('interventions').openCursor(),row=>row?.datasetId===datasetId);\n",
    "compatibility intervention deletion",
)
one(
    "src/domains/process/process-data-integrity.js",
    "if(!window.confirm?.('Delete this local dataset, its shots, baselines, and linked troubleshooting references?'))return;",
    "if(!window.confirm?.('Delete this local dataset, its shots, baselines, linked troubleshooting references, and intervention records?'))return;",
    "compatibility dataset delete disclosure",
)

# Learner reset is intentionally separate from saved engineering process data.
one(
    "training-qa-fix.js",
    "const baseReset=window.resetData;if(typeof baseReset==='function')window.resetData=function(){\n if(!confirm('Reset all local MouldMaster users and progress?'))return;",
    "function relabelLearnerResetControls(root=document){\n"
    " try{root.querySelectorAll?.('button[onclick*=\\\"resetData\\\"]')?.forEach(button=>{if(button.textContent.trim()==='Reset all local data')button.textContent='Reset learner data'})}catch(_){}\n"
    "}\n"
    "relabelLearnerResetControls();\n"
    "try{new MutationObserver(()=>relabelLearnerResetControls()).observe(document.documentElement,{childList:true,subtree:true})}catch(_){}\n\n"
    "const baseReset=window.resetData;if(typeof baseReset==='function')window.resetData=function(){\n"
    " if(!confirm('Reset learner profiles, progress, notes, assessment/Learning Insights analytics, and training extras? Saved process-data datasets are separate and will not be deleted.'))return;",
    "learner reset scope and relabel",
)
one(
    "training-qa-fix.js",
    " window.toast?.('Data reset. Local assessment and Learning Insights analytics were cleared and verified.');",
    " window.toast?.('Learner data reset. Assessment and Learning Insights analytics were cleared and verified; saved process-data datasets were left unchanged.');",
    "learner reset completion disclosure",
)

# Privacy/support must disclose persistence and the separate deletion controls.
one(
    "privacy.html",
    "<h2>Local process-data files</h2><p>The Process Data area can prepare a CSV that you explicitly choose from a machine, cavity-sensing, quality or auxiliary system. The current intake module reads that selected file locally in the browser/desktop session and does not intentionally upload the raw file or save the raw file into MouldMaster learner storage.",
    "<h2>Local process-data files</h2><p>The Process Data area can prepare a CSV that you explicitly choose from a machine, cavity-sensing, quality or auxiliary system. The current intake module reads that selected file locally in the browser/desktop session and does not intentionally upload the raw file or save the raw source file into MouldMaster learner storage. If you explicitly save a prepared dataset from the Process Data area, the prepared rows, semantic metadata, baselines, troubleshooting links and related intervention evidence are stored separately in the device's local IndexedDB process-data store until you delete that dataset, use <b>Delete all saved process data</b> in the Dataset Library, or clear the app/site data through the browser or operating system.",
    "process-data persistence privacy disclosure",
)
one(
    "privacy.html",
    "A confirmed factory reset first removes and re-checks MouldMaster-owned assessment analytics, Learning insights analytics and training extras; only after that verified cleanup does it replace the learner registry with the clean default profile.",
    "A confirmed learner-data reset first removes and re-checks MouldMaster-owned assessment analytics, Learning insights analytics and training extras; only after that verified cleanup does it replace the learner registry with the clean default profile. Saved process-data datasets are a separate engineering-evidence store and are not removed by learner reset; delete them from the Process Data Dataset Library or clear the app/site data if you need the whole local application footprint removed.",
    "learner reset privacy scope",
)
one(
    "support.html",
    "A confirmed factory reset likewise verifies analytics/training cleanup before replacing the learner registry. If that cleanup warning persists before another learner uses the same browser/app profile, clear MouldMaster site/app data using the browser or operating-system controls.",
    "A confirmed learner-data reset likewise verifies analytics/training cleanup before replacing the learner registry. Saved process-data datasets are stored separately and are not removed by learner reset; use <b>Delete all saved process data</b> in the Process Data Dataset Library when those engineering records must also be removed. If a cleanup warning persists before another learner uses the same browser/app profile, clear MouldMaster site/app data using the browser or operating-system controls.",
    "support reset and process-data retention disclosure",
)

# Extend the existing IndexedDB behavior harness.
one(
    "qa_process_data_integrity.cjs",
    "  [\"db.transaction(['datasets','shots','baselines','caseLinks'],'readwrite')\",'canonical deletion must atomically include troubleshooting links'],\n",
    "  [\"const PROCESS_DATA_STORES=['datasets','shots','baselines','caseLinks','interventions']\",'canonical process-data cleanup must own every IndexedDB store'],\n  [\"db.transaction(PROCESS_DATA_STORES,'readwrite')\",'canonical deletion must atomically include all process-data stores'],\n  [\"clearAllProcessData\",'canonical runtime must expose verified whole-process-data cleanup'],\n",
    "integrity source tokens",
)
one(
    "qa_process_data_integrity.cjs",
    "        get:key=>makeRequest(()=>map.get(key),tx),\n        delete:key=>{map.delete(key)},\n        openCursor:()=>cursorRequest([...map.entries()],map,tx),\n",
    "        get:key=>makeRequest(()=>map.get(key),tx),\n        getAll:()=>makeRequest(()=>[...map.values()],tx),\n        delete:key=>{map.delete(key)},\n        clear:()=>{map.clear()},\n        openCursor:()=>cursorRequest([...map.entries()],map,tx),\n",
    "IndexedDB mock clear/getAll support",
)
one(
    "qa_process_data_integrity.cjs",
    "  tables.caseLinks.set('case-delete',{caseId:'case-delete',datasetId:'d-delete'});\n  tables.caseLinks.set('case-keep',{caseId:'case-keep',datasetId:'d-current'});\n\n  await window.MM_CONNECTED_PROCESS_DATA.storage.deleteDataset('d-delete');\n",
    "  tables.caseLinks.set('case-delete',{caseId:'case-delete',datasetId:'d-delete'});\n  tables.caseLinks.set('case-keep',{caseId:'case-keep',datasetId:'d-current'});\n  tables.interventions.set('intervention-delete',{id:'intervention-delete',datasetId:'d-delete'});\n  tables.interventions.set('intervention-keep',{id:'intervention-keep',datasetId:'d-current'});\n\n  await window.MM_CONNECTED_PROCESS_DATA.storage.deleteDataset('d-delete');\n",
    "seed intervention cascade QA",
)
one(
    "qa_process_data_integrity.cjs",
    "  assert.equal(tables.caseLinks.has('case-delete'),false,'dataset-linked troubleshooting reference must be deleted');\n  assert.equal(tables.datasets.has('d-current'),true,'unrelated dataset must remain');\n",
    "  assert.equal(tables.caseLinks.has('case-delete'),false,'dataset-linked troubleshooting reference must be deleted');\n  assert.equal(tables.interventions.has('intervention-delete'),false,'dataset-linked intervention record must be deleted');\n  assert.equal(tables.datasets.has('d-current'),true,'unrelated dataset must remain');\n",
    "assert intervention cascade deletion",
)
one(
    "qa_process_data_integrity.cjs",
    "  assert.equal(tables.caseLinks.has('case-keep'),true,'unrelated troubleshooting reference must remain');\n\n  console.log('Process-data integrity QA passed: canonical ownership, fail-closed intake review, missing-value statistics, context gating, fallback compatibility, and atomic dataset/case-link cascade verified.');\n",
    "  assert.equal(tables.caseLinks.has('case-keep'),true,'unrelated troubleshooting reference must remain');\n  assert.equal(tables.interventions.has('intervention-keep'),true,'unrelated intervention record must remain');\n\n  const cleanup=await window.MM_CONNECTED_PROCESS_DATA.storage.clearAllProcessData();\n  assert.equal(cleanup.verified,true,'whole-process-data cleanup must verify the post-delete state');\n  for(const [name,map] of Object.entries(tables))assert.equal(map.size,0,`whole-process-data cleanup must empty ${name}`);\n\n  console.log('Process-data integrity QA passed: canonical ownership, fail-closed intake review, missing-value statistics, context gating, fallback compatibility, per-dataset five-store cascade, and verified whole-process-data cleanup.');\n",
    "whole-process-data cleanup QA",
)

print('Applied deterministic process-data retention remediation for issue #285.')

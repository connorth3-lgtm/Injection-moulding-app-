#!/usr/bin/env python3
"""Apply the 2026-09-10 audit hardening migration deterministically.

This migration is intentionally narrow:
- optional material-practice answer semantics remain source-authored;
- key-position balancing happens in the source normalizer without rewriting text;
- the formal bridge validates optional practice instead of mutating it;
- generated evidence runtime packs are rebuilt from reviewed source parts;
- the connected-data HTML escape typo introduced during the row-identity fix is corrected.

The script is idempotent and fails closed if the expected source anchors move.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_section(path: Path, start: str, end: str, replacement: str) -> None:
    text = path.read_text(encoding="utf-8")
    if replacement in text:
        return
    a = text.find(start)
    b = text.find(end)
    if a < 0 or b < 0 or b <= a:
        raise SystemExit(f"Could not locate hardening section in {path.relative_to(ROOT)}")
    path.write_text(text[:a] + replacement.rstrip() + "\n\n" + text[b:], encoding="utf-8")


def harden_optional_practice_source() -> None:
    path = ROOT / "evidence-maturity-deep-dive.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("/* MouldMaster evidence maturity deep dive — 2026.08.26.2 */", "/* MouldMaster evidence maturity deep dive — 2026.09.10.1 */", 1)
    text = text.replace("const VERSION='2026.08.26.2';", "const VERSION='2026.09.10.1';", 1)
    old = "function normalisePractice(){return MATERIAL_PRACTICE.map(l=>({...l,steps:l.steps.map(s=>({stage:s[0],question:s[1],choices:s.slice(2).map((text,i)=>({text,correct:i===0,feedback:i===0?'Correct. This choice tests the mechanism with the strongest evidence.':'Not the strongest evidence-first response for this scenario.'}))}))}))}"
    new = """function normalisePractice(){
 return MATERIAL_PRACTICE.map((l,labIndex)=>{
   const steps=l.steps.map((s,stepIndex)=>{
     const targetPosition=(labIndex*4+stepIndex)%4;
     const correctChoice={text:s[2],correct:true,feedback:'Correct. This choice tests the mechanism with the strongest evidence.'};
     const wrongChoices=s.slice(3).map(text=>({text,correct:false,feedback:'Not the strongest evidence-first response for this scenario.'}));
     const choices=wrongChoices.slice();choices.splice(targetPosition,0,correctChoice);
     return {id:`optional:${l.id}:${stepIndex}`,revision:1,stage:s[0],question:s[1],answerIndex:targetPosition,choices};
   });
   return {...l,steps};
 });
}"""
    if new not in text:
        if text.count(old) != 1:
            raise SystemExit("Optional-practice source normalizer anchor moved")
        text = text.replace(old, new, 1)
    text = text.replace(
        "scope:'Extended scenario-specific practice; not part of the formal 157 keyed approval bank and not a universal production recipe.'",
        "scope:'Extended scenario-specific practice with source-authored answer semantics, stable step IDs and deterministic balanced key positions; not part of the formal 157 keyed approval bank and not a universal production recipe.'",
        1,
    )
    path.write_text(text, encoding="utf-8")


def make_bridge_read_only() -> None:
    path = ROOT / "evidence-maturity-formal-bridge.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("/* MouldMaster formal evidence triangulation bridge — 2026.08.26.6 */", "/* MouldMaster formal evidence triangulation bridge — 2026.09.10.1 */", 1)
    text = text.replace("const VERSION='2026.08.26.6';", "const VERSION='2026.09.10.1';", 1)
    text = text.replace("const QUALITY_VERSION='2026.08.30.1';", "const QUALITY_VERSION='2026.09.10.1';", 1)
    path.write_text(text, encoding="utf-8")

    replacement = r"""/* The 40 extended material-practice decisions sit outside the formal 157-keyed bank.
   Their stems, answer text, answer key and choice order are source-authored by
   evidence-maturity-deep-dive.js. This bridge is deliberately read-only: it validates the
   published contract and must never repair, shorten, lengthen or reorder learner answers. */
const PRACTICE=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
let optionalChoicesValidated=0;
const optionalKeyPositions=[0,0,0,0];
if(PRACTICE?.labs){
 PRACTICE.labs.forEach((lab,labIndex)=>(lab.steps||[]).forEach((step,stepIndex)=>{
   const expectedId=`optional:${lab.id}:${stepIndex}`;
   const choices=Array.isArray(step.choices)?step.choices:[];
   if(step.id!==expectedId)throw new Error(`Optional-practice stable ID mismatch: ${step.id||'(missing)'} != ${expectedId}`);
   if(Number(step.revision)!==1)throw new Error(`Optional-practice revision missing for ${expectedId}`);
   if(choices.length!==4)throw new Error(`Optional-practice choice count mismatch for ${expectedId}: ${choices.length}/4`);
   const keys=choices.map((c,i)=>c?.correct===true?i:-1).filter(i=>i>=0);
   if(keys.length!==1)throw new Error(`Optional-practice answer-key count mismatch for ${expectedId}: ${keys.length}`);
   const keyIndex=keys[0];
   if(Number(step.answerIndex)!==keyIndex)throw new Error(`Optional-practice answerIndex mismatch for ${expectedId}: ${step.answerIndex} != ${keyIndex}`);
   if(keyIndex!==(labIndex*4+stepIndex)%4)throw new Error(`Optional-practice key-position contract mismatch for ${expectedId}: ${keyIndex}`);
   if(choices.some(c=>!String(c?.text||'').trim()))throw new Error(`Optional-practice empty choice text for ${expectedId}`);
   optionalKeyPositions[keyIndex]++;optionalChoicesValidated++;
 }));
 if(optionalChoicesValidated!==40)throw new Error(`Optional-practice quality coverage mismatch: ${optionalChoicesValidated}/40`);
 if(optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional-practice key positions are unbalanced: ${optionalKeyPositions.join(',')}`);
}
window.MM_QUESTION_QUALITY_OVERLAY={
 version:QUALITY_VERSION,
 scenarioFeedbackUpgraded,
 optionalChoicesUpgraded:0,
 optionalChoicesValidated,
 optionalKeyPositions:optionalKeyPositions.slice(),
 optionalAnswerSemanticMutationPolicy:'forbidden',
 optionalKeyPositionPolicy:'10 source-authored keyed decisions in each of four positions',
 stableOptionalItemIdPolicy:'optional:<lab-id>:<step-index> with explicit revision',
 evidenceMechanismsPreserved:true
};"""
    replace_section(
        path,
        "/* The 40 extended material-practice decisions sit outside the formal 157-keyed bank.",
        "// Reference extensions can legitimately contain repeated display names.",
        replacement,
    )


def fix_connected_data_escape() -> None:
    path = ROOT / "data-integration-runtime.js"
    text = path.read_text(encoding="utf-8")
    if "'\"':'&quot;'" in text:
        return
    if "'\"':'&quot'" not in text:
        raise SystemExit("Connected-data quote escape anchor moved")
    path.write_text(text.replace("'\"':'&quot'", "'\"':'&quot;'", 1), encoding="utf-8")


def write_assessment_inventory() -> None:
    path = ROOT / "data" / "assessment-inventory-v1.json"
    payload = {
        "schemaVersion": 1,
        "version": "2026.09.10.1",
        "title": "MouldMaster assessment inventory and answer-governance contract",
        "counts": {
            "formalEvidenceApproved": 157,
            "formalBreakdown": {
                "technicalExam": 30,
                "regionalExam": 27,
                "scenario": 40,
                "diagnosticLab": 36,
                "materialLab": 24
            },
            "measuredEvidenceDecisions": 12,
            "decisionManifestTotal": 169,
            "optionalMaterialPractice": 40,
            "learnerVisiblePsychometricInventory": 197,
            "allGovernedDecisionSurfaces": 209
        },
        "scopeEquations": [
            "157 = 30 technical + 27 regional + 40 scenarios + 36 diagnostic labs + 24 material labs",
            "169 = 157 formal evidence-approved + 12 measured-evidence decisions",
            "197 = 157 formal evidence-approved + 40 optional material-practice decisions",
            "209 = 157 formal evidence-approved + 12 measured-evidence + 40 optional material-practice decisions"
        ],
        "governance": {
            "answerSemantics": "source-authored; runtime semantic answer mutation is forbidden",
            "optionalMaterialPractice": "stable item id, explicit revision, explicit answerIndex and exactly one correct:true choice required",
            "choiceOrder": "may be deterministically balanced by the source authoring layer without rewriting answer text",
            "formalApprovalBoundary": "the 40 optional material-practice decisions are learner-visible but remain outside the formal 157 keyed approval bank",
            "measuredEvidenceBoundary": "the 12 measured-evidence decisions are governed separately and are excluded from the 197 psychometric inventory",
            "competencyMetadataTarget": "explicit authored item metadata is authoritative; text-regex inference is a legacy fallback/lint only until migration is complete"
        },
        "sources": {
            "decisionManifest": "data/assessment-decision-manifest-v1.json",
            "formalApprovalRuntime": "assessment-evidence-approval.js",
            "technicalRegionalRuntime": "assessment-runtime-v2.js",
            "optionalMaterialPracticeSource": "evidence-maturity-deep-dive.js",
            "optionalMaterialPracticeValidator": "evidence-maturity-formal-bridge.js",
            "psychometricQa": "qa_question_quality_50_pass_runtime.py"
        },
        "migration": {
            "optionalMaterialPracticeStableIds": "complete",
            "optionalMaterialPracticeRuntimeSemanticMutationRemoval": "complete",
            "allFormalItemsStableSourceAuthoredIds": "in-progress",
            "allFormalItemsExplicitCompetencyConceptTags": "in-progress"
        },
        "boundary": "Inventory counts describe governed application decision surfaces. They do not imply external accreditation, regulatory approval, certification authority, or universal production-process validity."
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def run(*args: str) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def verify() -> None:
    run(sys.executable, "tools/build_runtime_packs.py")
    run(sys.executable, "tools/build_runtime_packs.py", "--check")
    for js in (
        "evidence-maturity-deep-dive.js",
        "evidence-maturity-formal-bridge.js",
        "data-integration-runtime.js",
        "src/domains/runtime-packs/evidence-runtime-pack.js"
    ):
        run("node", "--check", js)

    source = (ROOT / "evidence-maturity-deep-dive.js").read_text(encoding="utf-8")
    bridge = (ROOT / "evidence-maturity-formal-bridge.js").read_text(encoding="utf-8")
    data_runtime = (ROOT / "data-integration-runtime.js").read_text(encoding="utf-8")
    assert "answerIndex:targetPosition" in source
    assert "id:`optional:${l.id}:${stepIndex}`" in source
    assert "OPTIONAL_CORRECT" not in bridge
    assert "ensureBalancedDistractors" not in bridge
    assert "optionalAnswerSemanticMutationPolicy:'forbidden'" in bridge
    assert "id:`${id}:row:${String(rowOrdinal).padStart(9,'0')}`" in data_runtime
    assert "sourceShotIndex" in data_runtime
    assert "'\"':'&quot;'" in data_runtime


if __name__ == "__main__":
    harden_optional_practice_source()
    make_bridge_read_only()
    fix_connected_data_escape()
    write_assessment_inventory()
    verify()
    print("Audit hardening migration applied and verified.")

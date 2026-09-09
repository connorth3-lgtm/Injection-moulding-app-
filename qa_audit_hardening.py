#!/usr/bin/env python3
"""Permanent regression checks for the 2026-09-10 whole-app hardening audit."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def load(path: str):
    return json.loads(read(path))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"AUDIT HARDENING FAIL: {message}")


def check_assessment_inventory() -> None:
    inv = load("data/assessment-inventory-v1.json")
    c = inv["counts"]
    formal = c["formalBreakdown"]
    require(sum(formal.values()) == c["formalEvidenceApproved"] == 157, "formal assessment inventory must total 157")
    require(c["decisionManifestTotal"] == c["formalEvidenceApproved"] + c["measuredEvidenceDecisions"] == 169, "decision-manifest scope must total 169")
    require(c["learnerVisiblePsychometricInventory"] == c["formalEvidenceApproved"] + c["optionalMaterialPractice"] == 197, "psychometric learner-visible scope must total 197")
    require(c["allGovernedDecisionSurfaces"] == c["formalEvidenceApproved"] + c["measuredEvidenceDecisions"] + c["optionalMaterialPractice"] == 209, "all governed decision surfaces must total 209")
    require(inv["governance"]["answerSemantics"].startswith("source-authored"), "answer semantics must remain source-authored")


def check_optional_practice_governance() -> None:
    source = read("evidence-maturity-deep-dive.js")
    bridge = read("evidence-maturity-formal-bridge.js")
    for marker in (
        "id:`optional:${l.id}:${stepIndex}`",
        "revision:1",
        "answerIndex:targetPosition",
        "choices.splice(targetPosition,0,correctChoice)",
    ):
        require(marker in source, f"optional-practice source contract missing {marker}")
    for forbidden in (
        "OPTIONAL_CORRECT",
        "ensureBalancedDistractors",
        "choices[keyIndex].text=",
        "step.choices=reordered",
    ):
        require(forbidden not in bridge, f"optional-practice validator must not mutate answer semantics/order: {forbidden}")
    for marker in (
        "optionalChoicesValidated!==40",
        "optionalKeyPositions.some(x=>x!==10)",
        "optionalAnswerSemanticMutationPolicy:'forbidden'",
        "Number(step.answerIndex)!==keyIndex",
    ):
        require(marker in bridge, f"optional-practice read-only validation missing {marker}")


def check_process_data_identity() -> None:
    runtime = read("data-integration-runtime.js")
    require("scheme:'immutable-row-ordinal-v1'" in runtime, "process-data storage identity scheme is missing")
    require("id:`${id}:row:${String(rowOrdinal).padStart(9,'0')}`" in runtime, "shot rows must use immutable ingestion-row storage keys")
    require("sourceShotIndex" in runtime, "source shot index must be preserved as engineering metadata")
    require("id:`${id}:${shotIndex}`" not in runtime, "source shot counters must never be IndexedDB primary keys")
    require("Number(a.rowOrdinal||0)-Number(b.rowOrdinal||0)" in runtime, "duplicate/reset shot counters require deterministic row-ordinal tie breaking")


def check_runtime_v2_ownership() -> None:
    analytics = read("learning-analytics.js")
    require("renderLesson=wrapped;window.renderLesson=wrapped" not in analytics, "learning analytics must not replace Runtime V2 renderLesson")
    require("switchView=wrapped;window.switchView=wrapped" not in analytics, "learning analytics must not replace Runtime V2 switchView")
    for marker in (
        "runtime.after('renderLesson'",
        "runtime.before('switchView'",
        "runtime.after('switchView'",
        "runtime.rebind('renderLesson')",
        "runtime.rebind('switchView')",
    ):
        require(marker in analytics, f"learning analytics Runtime V2 hook missing {marker}")


def check_html_escape_integrity() -> None:
    bad = "'\"':'&quot'"
    offenders = []
    for path in ROOT.rglob("*.js"):
        if ".git" in path.parts or "node_modules" in path.parts:
            continue
        if bad in path.read_text(encoding="utf-8"):
            offenders.append(str(path.relative_to(ROOT)))
    require(not offenders, "malformed HTML quote entities remain: " + ", ".join(offenders))


def check_accessibility_claim_integrity() -> None:
    data = load("data/accessibility-real-at-validation-v1.json")
    rows = data.get("requiredMatrix", [])
    require(len(rows) == 4, "real-AT validation matrix must retain all four required combinations")
    validated = data.get("status") in {"validated", "complete", "passed", "real-at-validated"}
    if not validated:
        return
    for row in rows:
        require(row.get("status") in {"passed", "validated", "complete"}, f"validated accessibility state has incomplete row {row.get('id')}")
        require(bool(row.get("testedAt")), f"validated accessibility row lacks testedAt: {row.get('id')}")
        require(bool(row.get("reviewer")), f"validated accessibility row lacks reviewer: {row.get('id')}")
        require(bool(row.get("evidenceRef")), f"validated accessibility row lacks evidenceRef: {row.get('id')}")


def main() -> None:
    check_assessment_inventory()
    check_optional_practice_governance()
    check_process_data_identity()
    check_runtime_v2_ownership()
    check_html_escape_integrity()
    check_accessibility_claim_integrity()
    print("Audit hardening QA passed: assessment semantics, storage identity, Runtime V2 ownership, escape integrity, accessibility claim integrity.")


if __name__ == "__main__":
    main()

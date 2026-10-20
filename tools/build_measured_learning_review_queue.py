#!/usr/bin/env python3
"""Build a deterministic, non-promotional review queue for the 70-case measured curriculum.

The queue is an index over transient, source-derived authoring candidates produced in the
same workflow. It deliberately contains no approval, reviewer identity or learner-visible
promotion state. A human engineering reviewer still has to assess case wording, evidence
bounds, novelty and the final case-specific promotion window.
"""
from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / "measured-source-proof"
MANIFEST = ROOT / "data/measured-learning/manifest-v1.json"
REQUIREMENTS = ROOT / "data/measured-learning/case-requirements-v2.json"
COVERAGE = PROOF / "measured-learning-authoring-coverage-v2.json"
OUT = PROOF / "measured-learning-review-queue-v2.json"

CANDIDATE_FILES = [
    "mendeley-unreviewed-learning-candidates.json",
    "4h98-direct-unreviewed-learning-candidate.json",
    "6k8-pressure-unreviewed-learning-candidate.json",
    "gtnb-unreviewed-learning-candidates.json",
    "gtnb-rejection-unreviewed-learning-candidate.json",
    "sustainability-unreviewed-learning-candidates.json",
    "openmms-unreviewed-learning-candidates.json",
    "avaps-unreviewed-learning-candidates.json",
    "impure-unreviewed-learning-candidates.json",
    "forinfpro-unreviewed-learning-candidates.json",
    "rebalanced-unreviewed-learning-candidates.json",
    "pmc-unreviewed-learning-candidates.json",
]

# Multiple valid authoring representations are useful during source recovery, but review
# must start from one explicit evidence bundle. These choices are pedagogical, not claims
# that the alternative candidates are invalid.
PREFERRED = {
    "MLM-019": "GTNB-PROCESS-WINDOW-01",
    "MLM-030": "MEND-4H98-DIRECT-REPLICATES-01",
    "MLM-038": "GTNB-PROCESS-WINDOW-01",
    "MLM-049": "MEND-4H98-DIRECT-REPLICATES-01",
    "MLM-056": "MEND-4H98-DIRECT-REPLICATES-01",
    "MLM-058": "OPENMMS-PRESSURE-EVENT-01",
    "MLM-067": "GTNB-PROCESS-WINDOW-01",
}

CHECKLIST = [
    {"id":"measurement-support","prompt":"Do the displayed measurements directly support every learner observation proposed for this case?"},
    {"id":"claim-boundary","prompt":"Are unsupported conclusions and causal/root-cause claims explicitly excluded?"},
    {"id":"channel-semantics","prompt":"Do source-channel semantics, units and X-axis meaning match the learning task?"},
    {"id":"window-identity","prompt":"Is the final promotion window independently identifiable and reproducible from the registered source artifact(s)?"},
    {"id":"novelty","prompt":"Does this case teach a distinct evidence skill rather than re-label an existing case or substantially reused window?"},
    {"id":"rights","prompt":"Is the licence/access scope appropriate for learner-facing product use?"},
    {"id":"next-measurement","prompt":"Where evidence is insufficient, is the next discriminating measurement or investigation framed appropriately?"},
]


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def catalogue_rows() -> list[dict]:
    manifest = load(MANIFEST)
    fields = manifest["fields"]
    return [dict(zip(fields, row)) for row in manifest["cases"]]


def required_channels(case_id: str) -> set[str]:
    return set(load(REQUIREMENTS).get("requiredSourceChannelsByCase", {}).get(case_id, []))


def selected_artifacts(candidate: dict) -> list[dict]:
    if candidate.get("sourceArtifacts") is not None:
        return sorted(
            [{"name": item["name"], "sha256": item["sha256"]} for item in candidate["sourceArtifacts"]],
            key=lambda item: item["name"],
        )
    return [{"name": candidate["sourceArtifact"], "sha256": candidate["sourceFingerprint"]}]


def signal_summary(signal: dict) -> dict:
    rep = signal["representation"]
    xs = [float(v) for v in rep["x"]]
    ys = [float(v) for v in rep["y"]]
    if not xs or not ys or not all(math.isfinite(v) for v in xs + ys):
        raise AssertionError(f"{signal.get('id')}: non-finite or empty review signal")
    result = {
        "id": signal["id"],
        "sourceChannel": signal["sourceChannel"],
        "semantic": signal["semantic"],
        "unit": signal["unit"],
        "xSemantic": rep["xSemantic"],
        "xUnit": rep["xUnit"],
        "displayedPointCount": len(xs),
        "originalPointCount": rep["originalPointCount"],
        "xRange": [min(xs), max(xs)],
        "yRange": [min(ys), max(ys)],
        "representationFingerprint": signal["representationFingerprint"],
    }
    if signal.get("sourceArtifact"):
        result["sourceArtifact"] = signal["sourceArtifact"]
    return result


def main() -> int:
    catalogue = catalogue_rows()
    by_case = {case["id"]: case for case in catalogue}
    if list(by_case) != [f"MLM-{i:03d}" for i in range(1, 71)]:
        raise AssertionError("review queue requires the ordered 70-case release catalogue")

    coverage = load(COVERAGE)
    if coverage.get("status") != "authoring-coverage-qa-passed" or coverage.get("directBindingShapeCatalogueCoverage") != 70:
        raise AssertionError("review queue may only be built after 70/70 direct-binding authoring QA")
    direct_ids = {
        item["candidateId"]
        for item in coverage.get("candidates", [])
        if item.get("directBindingShapeReady") is True
    }

    candidates: dict[str, dict] = {}
    candidate_file: dict[str, str] = {}
    candidate_boundary: dict[str, str] = {}
    case_candidates: dict[str, list[str]] = defaultdict(list)
    for filename in CANDIDATE_FILES:
        doc = load(PROOF / filename)
        if doc.get("promotionEligible") is not False:
            raise AssertionError(f"{filename}: review input must remain non-promotional")
        document_boundary = str(doc.get("boundary") or "").strip()
        for candidate in doc.get("candidates", []):
            cid = candidate["candidateId"]
            if cid in candidates:
                raise AssertionError(f"duplicate review candidate id: {cid}")
            candidates[cid] = candidate
            candidate_file[cid] = filename
            candidate_boundary[cid] = str(candidate.get("evidenceBoundary") or document_boundary).strip()
            if not candidate_boundary[cid]:
                raise AssertionError(f"{cid}: neither candidate nor document provides an evidence boundary")
            for case_id in candidate.get("suggestedCatalogueCases", []):
                if cid in direct_ids:
                    case_candidates[case_id].append(cid)

    entries = []
    for case in catalogue:
        case_id = case["id"]
        eligible = sorted(case_candidates.get(case_id, []))
        if not eligible:
            raise AssertionError(f"{case_id}: no direct-binding review candidate")
        if len(eligible) == 1:
            chosen_id = eligible[0]
        else:
            chosen_id = PREFERRED.get(case_id)
            if chosen_id not in eligible:
                raise AssertionError(f"{case_id}: multiple review candidates require an explicit preferred selection: {eligible}")
        candidate = candidates[chosen_id]
        if candidate["datasetId"] != case["sourceFamily"]:
            raise AssertionError(f"{case_id}: candidate source-family mismatch")
        required = required_channels(case_id)
        bound = {signal["sourceChannel"] for signal in candidate.get("signals", [])}
        if not required <= bound:
            raise AssertionError(f"{case_id}: review candidate misses required channels {sorted(required-bound)}")
        if "multi-signal" in case.get("coverageTags", []) and len(candidate.get("signals", [])) < 2:
            raise AssertionError(f"{case_id}: multi-signal review case has fewer than two signals")

        entries.append({
            "caseId": case_id,
            "title": case["title"],
            "difficulty": case["difficulty"],
            "analysisLens": case["analysisLens"],
            "coverageTags": case["coverageTags"],
            "sourceFamily": case["sourceFamily"],
            "candidate": {
                "candidateId": chosen_id,
                "candidateArtifactFile": candidate_file[chosen_id],
                "candidateFingerprint": candidate["candidateFingerprint"],
                "sourceArtifacts": selected_artifacts(candidate),
                "sourceScope": candidate.get("sourceScope", {}),
                "requiredSourceChannels": sorted(required),
                "signalSummaries": [signal_summary(signal) for signal in candidate["signals"]],
                "evidenceBoundary": candidate_boundary[chosen_id],
            },
            "review": {
                "state": "unreviewed",
                "authorId": None,
                "reviewerId": None,
                "reviewerRole": None,
                "reviewRecord": None,
                "reviewedAt": None,
                "decision": None,
                "notes": None,
            },
        })

    selected_ids = {entry["candidate"]["candidateId"] for entry in entries}
    queue = {
        "schemaVersion": 1,
        "queueId": "measured-learning-independent-review-v2",
        "status": "independent-review-required",
        "promotionEligible": False,
        "releaseCaseCount": 70,
        "selectedCandidateCount": len(selected_ids),
        "sourceAuthoringCoverageReport": COVERAGE.name,
        "selectionPolicy": {
            "onePinnedCandidatePerCase": True,
            "ambiguousCandidateSelectionMustBeExplicit": True,
            "preferredCandidateOverrides": PREFERRED,
            "selectionDoesNotApproveOrPromote": True,
        },
        "reviewChecklist": CHECKLIST,
        "cases": entries,
        "boundary": "This queue is a review worklist, not evidence of human review and not a promotion mechanism. All approval identity/timestamp/decision fields are deliberately null. Final learner promotion still requires a case-specific governed binding, novelty/window-reuse checks and an independent engineering reviewer whose identity differs from the author.",
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": queue["status"],
        "releaseCaseCount": queue["releaseCaseCount"],
        "selectedCandidateCount": queue["selectedCandidateCount"],
        "unreviewedCases": sum(entry["review"]["state"] == "unreviewed" for entry in entries),
    }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

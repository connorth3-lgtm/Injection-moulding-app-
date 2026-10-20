#!/usr/bin/env python3
"""Evaluate whether a public measured-data candidate can satisfy issue #50.

This deliberately does not replace the authorised-site evaluator. It prevents an open
benchmark from being relabelled as a completed site pilot unless every stronger pilot
gate is explicitly evidenced.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

REQUIRED_FOR_ISSUE_50 = (
    "baselineKnownGoodPeriodEstablishedForIssue50",
    "faultOrDriftPeriodEstablishedForIssue50",
    "interventionAlignedToShotSequenceForIssue50",
    "recoveryOrVerificationPeriodEstablishedForIssue50",
    "independentlyInvestigatedEngineeringCauseAvailable",
    "siteAuthorisationForMouldMasterPilotRecorded",
    "approvedPilotEvidenceRetentionOwnerRecorded",
    "mouldMasterDiagnosticComparedWithIndependentFinding",
)


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def evaluate(data: dict) -> dict:
    need(data.get("schema") == 1, "public pilot candidate schema must be 1")
    need(data.get("issue") == 50, "candidate must be scoped to issue #50")
    source = data.get("source") or {}
    need(source.get("realInjectionMouldingData") is True, "candidate must be real injection-moulding data")
    need(source.get("publicReuseAllowed") is True, "candidate must have an explicit public reuse basis")
    evidence = data.get("evidence") or {}
    missing = [key for key in REQUIRED_FOR_ISSUE_50 if evidence.get(key) is not True]
    eligible = not missing
    decision = data.get("decision") or {}
    need(decision.get("mayExercisePublicBenchmarkPipeline") is True, "public benchmark use should remain distinguishable from pilot completion")
    need(decision.get("mayCloseIssue50") is eligible, "mayCloseIssue50 must exactly reflect the stronger pilot gates")
    need(decision.get("mayClaimValidatedOnRealProductionData") is eligible, "real-production validation claim must exactly follow pilot completion gates")
    expected_status = "eligible-authorised-site-pilot-evidence" if eligible else "not-eligible-to-close-authorised-site-pilot"
    need(data.get("status") == expected_status, "candidate status does not match evidence gates")
    return {
        "candidateId": data.get("candidateId"),
        "status": expected_status,
        "eligibleToCloseIssue50": eligible,
        "missingGateCount": len(missing),
        "missingGates": missing,
        "rawValuesEmitted": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=Path("data/real-pilot-public-candidate-review-2026-09-05.json"))
    parser.add_argument("--require-eligible", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = evaluate(json.loads(args.manifest.read_text(encoding="utf-8")))
    if args.output:
        args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Public pilot candidate: {report['status']} ({report['missingGateCount']} unresolved gate(s))")
    if args.require_eligible and not report["eligibleToCloseIssue50"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()

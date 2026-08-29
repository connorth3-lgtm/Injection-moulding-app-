from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
PATH = ROOT / "data/cross-process-upper-pressure-state-clarification-2026-08-30.json"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


x = json.loads(PATH.read_text(encoding="utf-8"))
need(x.get("datasetId") == "cross-process-chain-17240390", "cross-process dataset id drifted")
need(x.get("streamId") == "upper-workpiece-injection-moulding", "upper stream id drifted")
need(x.get("status") == "blocked-pending-source-author-pressure-unit-and-state-definition", "upper clarification state drifted")
need((x.get("source") or {}).get("license") == "CC BY 4.0", "cross-process licence drifted")

auth = x.get("authoritativeEvidence") or {}
loader = auth.get("authorLoader") or {}
need(loader.get("exactUpperColumns") == [
    "time",
    "injection_pressure_target",
    "injection_pressure_actual",
    "melt_volume",
    "injection_velocity",
    "state",
], "upper delivered schema drifted")
need(loader.get("upperCsvColumnsReadDirectlyWithoutUnitConversion") is True, "source loader mapping boundary missing")
need(loader.get("pressureActualSourceRole") == "actual", "pressure actual role drifted")
need(loader.get("pressureTargetSourceRole") == "target/command", "pressure target role drifted")
need(loader.get("pressureUnitDefinedInLoader") is False, "upper pressure unit must remain unresolved")
need(loader.get("stateMeaningDefinedInLoader") is False, "upper state meaning must remain unresolved")
need(auth.get("publicAuthorRepositoryIssueAnswerLocated") is False, "unexpected public source-author clarification captured")

support = (x.get("supportingButNonAuthoritativeEvidence") or {}).get("machineFamilyDocumentation") or {}
need("p301I -> current injection/holding pressure, bar" in (support.get("observedMappings") or []), "supporting ARBURG mapping evidence missing")
need(len(support.get("whyNotSufficientForPromotion") or []) >= 3, "machine-family evidence boundary too weak")

unsafe = x.get("unsafeInferencesExplicitlyRejected") or []
need(any("lower-workpiece" in s for s in unsafe), "lower-workpiece unit inference must be rejected")
need(any("numeric range" in s for s in unsafe), "numeric-range unit inference must be rejected")
need(any("state codes" in s for s in unsafe), "state-code inference must be rejected")

request = x.get("clarificationRequest") or {}
need("Nikolai West" in str(request.get("preferredRoute")), "source-author clarification route missing")
questions = request.get("questions") or []
need(len(questions) >= 4, "clarification request is under-specified")
need(any("engineering unit" in q for q in questions), "pressure-unit clarification question missing")
need(any("p301I" in q for q in questions), "raw pressure-tag mapping question missing")
need(any("state codes" in q for q in questions), "state-code question missing")
need("subject" in (request.get("readyOutreachDraft") or {}), "ready outreach subject missing")
need("body" in (request.get("readyOutreachDraft") or {}), "ready outreach body missing")

gate = x.get("acceptanceGate") or {}
need(len(gate.get("pressureActualMayBePromotedOnlyIf") or []) >= 3, "pressure promotion gate incomplete")
need(gate.get("pressureTargetAlwaysNonCounting") is True, "pressure target must stay non-counting")
need(gate.get("stateAlwaysNonCountingAsNumericMeasurement") is True, "state must stay outside numeric measured totals")

count = x.get("countingBoundary") or {}
need(count.get("upperRows") == 21907374, "upper row count drifted")
need(count.get("currentlyAcceptedUpperMeasuredChannelsPerRow") == 2, "upper accepted-channel baseline drifted")
need(count.get("currentlyAcceptedUpperMeasuredTimeSeriesSamples") == 43814748, "upper accepted sample baseline drifted")
need(count.get("pressureActualAdditionalValuesIfResolved") == 21907374, "pressure unlock impact drifted")
need(count.get("pressureActualCurrentlyAccepted") is False, "upper pressure cannot be accepted yet")
need(count.get("stateCurrentlyAccepted") is False, "upper state cannot be accepted")
need(count.get("acceptedCountChangeFromThisReview") == 0, "clarification review cannot change counts")
need(count.get("projectAcceptedMeasuredBaselineRemains") == 65171059, "project baseline must not change in clarification-only review")
need(count.get("fullyProfiledFamiliesRemain") == 7, "family baseline must not change")

print("Cross-process upper clarification QA passed (pressure/state remain fail-closed pending source-author definitions)")

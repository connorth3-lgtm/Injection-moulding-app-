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
need(x.get("status") == "blocked-pending-source-specific-pressure-unit-and-state-definition", "upper clarification state drifted")
need(x.get("reviewed") == "2026-09-05", "upper public-source recheck date drifted")
need((x.get("source") or {}).get("license") == "CC BY 4.0", "cross-process licence drifted")

auth = x.get("authoritativeEvidence") or {}
loader = auth.get("authorLoader") or {}
need(loader.get("exactUpperColumns") == [
    "time", "injection_pressure_target", "injection_pressure_actual",
    "melt_volume", "injection_velocity", "state",
], "upper delivered schema drifted")
need(loader.get("upperCsvColumnsReadDirectlyWithoutUnitConversion") is True, "source loader mapping boundary missing")
need(loader.get("pressureActualSourceRole") == "actual", "pressure actual role drifted")
need(loader.get("pressureTargetSourceRole") == "target/command", "pressure target role drifted")
need(loader.get("pressureUnitDefinedInLoader") is False, "upper pressure unit must remain unresolved")
need(loader.get("stateMeaningDefinedInLoader") is False, "upper state meaning must remain unresolved")
need(auth.get("publicAuthorRepositoryIssueAnswerLocated") is False, "unexpected public source clarification captured")

support = (x.get("supportingButNonAuthoritativeEvidence") or {}).get("machineFamilyDocumentation") or {}
need("p301I -> current injection/holding pressure, bar" in (support.get("observedMappings") or []), "supporting ARBURG mapping evidence missing")
need(len(support.get("whyNotSufficientForPromotion") or []) >= 2, "machine-family evidence boundary too weak")

public = x.get("publicSourceOnlyRecheck") or {}
need(public.get("emailSent") is False, "no email may be claimed or required by the public-source pass")
need(public.get("contactAttempted") is False, "no direct contact may be claimed by the public-source pass")
need(len(public.get("methods") or []) >= 4, "public-source recheck coverage is incomplete")
need("No source-specific" in str(public.get("result")), "public-source exhaustion result missing")

unsafe = x.get("unsafeInferencesExplicitlyRejected") or []
need(any("lower-workpiece" in s for s in unsafe), "lower-workpiece unit inference must be rejected")
need(any("numeric range" in s for s in unsafe), "numeric-range unit inference must be rejected")
need(any("state codes" in s for s in unsafe), "state-code inference must be rejected")

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
need(count.get("canonicalEffectiveProjectAcceptedMeasuredBaseline") == 85569824, "canonical measured baseline drifted")
need(count.get("canonicalEffectiveFullyProfiledFamilies") == 17, "canonical family baseline drifted")

print("Cross-process upper clarification QA passed (public-source/no-contact pass exhausted; pressure/state remain fail-closed pending source-specific definitions)")

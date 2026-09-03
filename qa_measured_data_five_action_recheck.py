from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
REPORT = ROOT / "data" / "measured-data-five-action-recheck-2026-09-03.json"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


report = json.loads(REPORT.read_text(encoding="utf-8"))
need(report["schema"] == 1, "five-action recheck schema drifted")
need(report["reviewed"] == "2026-09-03", "five-action recheck date drifted")
need(len(report["actions"]) == 5, "all five requested actions must be represented")
need([item["number"] for item in report["actions"]] == [1, 2, 3, 4, 5], "five-action ordering drifted")

by_id = {item["number"]: item for item in report["actions"]}
need(by_id[1]["status"] == "blocked-source-author-clarification-required", "cross-process evidence gate drifted")
need(by_id[2]["status"] == "not-promoted-fail-closed", "cross-process promotion gate drifted")
need(by_id[3]["status"] == "blocked-origin-environment-unavailable", "Warwick export gate drifted")
need(by_id[4]["status"] == "retrieval-blocked-source-response", "RWTH retrieval gate drifted")
need(by_id[5]["status"] == "partial-mapping-complete-four-columns-blocked", "ImPure mapping gate drifted")

need(by_id[1]["potentialAdditionalMeasuredValuesIfPressureIsAuthoritativelyResolved"] == 21_907_374,
     "cross-process potential pressure count drifted")
need(by_id[5]["maximumAdditionalProfiledNumericValuesPotentiallyResolvable"] == 1_188_348,
     "ImPure unresolved value count drifted")
need(all(item["acceptedMeasuredValuesAdded"] == 0 for item in report["actions"]),
     "a blocked recheck must not add accepted measurements")
need(report["baselineAcceptedInjectionProcessTimeSeriesValues"] == 85_569_824,
     "baseline accepted total drifted")
need(report["finalAcceptedInjectionProcessTimeSeriesValues"] == 85_569_824,
     "final accepted total drifted")
need(report["acceptedMeasuredValuesDelta"] == 0, "blocked recheck count delta must remain zero")
need(report["rawThirdPartyPayloadCommitted"] is False, "raw third-party payload must not be committed")
need(len(report["nextExternalInputs"]) == 4, "external-input handoff must remain complete")

print("MouldMaster five-action measured-data recheck QA passed (all actions executed or fail-closed with exact external gates)")

#!/usr/bin/env python3
"""Fail-closed QA for the Universidad de León embargo activation contract."""

import datetime as dt
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTRACT_PATH = ROOT / "data/leon-embargo-activation-contract-2026-08-30.json"
CHECKER_PATH = ROOT / "tools/check_leon_embargo_state.py"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


def load_checker():
    spec = importlib.util.spec_from_file_location("leon_embargo_checker", CHECKER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


contract = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
checker = load_checker()

need(contract["reviewed"] == "2026-08-30", "León contract review date drifted")
need(contract["campaign"]["recordsDescribeSame1000BatchCampaign"] is True, "Companion records must remain one campaign")
need(contract["campaign"]["independentExperimentFamilies"] == 1, "León companion records must not create two experiment families")
need(contract["campaign"]["doubleCountCompanionRecords"] is False, "León companion records must remain non-double-counting")
need(contract["policy"]["rawFileRetrievalAllowedWhileEmbargoed"] is False, "Embargoed León files must not be retrieved")
need(contract["policy"]["automatedIngestionAllowedWhileEmbargoed"] is False, "Embargoed León records must not be ingested")
need(contract["policy"]["releaseDoesNotAutomaticallyChangeAcceptedCounts"] is True, "Release must trigger profiling, not automatic counting")
need(contract["releaseWatch"]["expectedPublicAvailabilityDate"] == "2027-12-31", "León planned release date drifted")
need(contract["releaseWatch"]["earlyReleaseAllowedByDepositor"] is True, "Early-release path must remain monitored")

records = {item["datasetId"]: item for item in contract["records"]}
need(set(records) == {"leon-process-20309380", "leon-defects-20322729"}, "León record set drifted")
for record in records.values():
    need(record["currentAccessState"] == "embargoed", f"{record['datasetId']} must remain embargoed in the pinned review")
    need(record["license"] == "CC BY 4.0", f"{record['datasetId']} licence drifted")
    need(record["embargoUntil"] == "2027-12-31", f"{record['datasetId']} embargo date drifted")
    need(record["automatedIngestionAllowed"] is False, f"{record['datasetId']} ingestion must remain disabled")
    need(record["rawRedistributionAllowed"] is False, f"{record['datasetId']} raw redistribution must remain disabled while embargoed")
    need(record["acceptedMeasuredValues"] == 0, f"{record['datasetId']} must remain non-counting while embargoed")

process = records["leon-process-20309380"]
defects = records["leon-defects-20322729"]
need(process["describedStructure"]["batches"] == 1000, "León process batch count drifted")
need(process["describedStructure"]["injectionCycleCountAcceptedBeforeFileProfiling"] is None, "Do not infer León process cycles from metadata")
need(defects["describedStructure"]["batches"] == 1000, "León defect batch count drifted")
need(defects["describedStructure"]["shotsPerBatch"] == 5, "León defect shot count drifted")
need(defects["describedStructure"]["partsPerShot"] == 2, "León defect cavity/part count drifted")
need(defects["describedStructure"]["feasibleImagesReported"] == 14620, "León feasible-image count drifted")
need(len(contract["activationChecklist"]) >= 7, "León release activation checklist is incomplete")
need(contract["projectCountingBoundary"]["acceptedMeasuredValuesAddedByThisContract"] == 0, "Contract must not add measured values")
need(contract["projectCountingBoundary"]["fullyProfiledFamiliesAddedByThisContract"] == 0, "Contract must not add profiled families")

embargo_payload = {
    "access": {"record": "public", "files": "restricted", "embargo": {"active": True, "until": "2027-12-31"}},
    "metadata": {"rights": [{"id": "cc-by-4.0"}]},
}
open_payload = {
    "access": {"record": "public", "files": "public", "embargo": {"active": False, "until": "2027-12-31"}},
    "metadata": {"rights": [{"id": "cc-by-4.0"}]},
}
open_wrong_license = {
    "access": {"record": "public", "files": "public"},
    "metadata": {"rights": [{"id": "cc0-1.0"}]},
}

before = dt.date(2026, 8, 30)
after = dt.date(2028, 1, 1)
need(checker.classify_record(process, embargo_payload, before)["result"] == "expected-embargo-active", "Active embargo classification failed")
need(checker.classify_record(process, open_payload, before)["result"] == "release-detected", "Early open release must be detected")
need(checker.classify_record(process, embargo_payload, after)["result"] == "embargo-past-planned-date", "Past-date embargo must require review")
need(checker.classify_record(process, open_wrong_license, before)["result"] == "release-license-review", "Open record with changed licence must remain fail closed")

print("León embargo activation contract QA passed")

#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIOUS_PATH = Path(__file__).with_name("compile_master_data_wave2_xrd_xps.py")
spec = importlib.util.spec_from_file_location("mouldmaster_compile_wave2_xrd_xps", PREVIOUS_PATH)
previous = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(previous)
base = previous.base
PREVIOUS_COMPILE_MEASURED = base.compile_measured


def load_json(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def compile_measured_with_batch4():
    measured = PREVIOUS_COMPILE_MEASURED()
    ext = load_json("data/measured-dataset-wave2-batch4-extension-v1.json")
    need(measured["datasetInventory"]["summary"]["datasets"] == 31, "batch-4 base effective inventory drifted")
    need(measured["datasetInventory"]["summary"]["automatedIngestionAllowed"] == 19, "batch-4 base executable count drifted")
    need(measured["datasetExecutionLedger"]["summary"]["acceptedProfiled"] == 14, "batch-4 base family count drifted")

    inventory = deepcopy(measured["datasetInventory"])
    by_id = {x["datasetId"]: i for i, x in enumerate(inventory["datasets"])}
    for update in ext["inventoryUpdates"]:
        did = update["datasetId"]
        need(did in by_id, f"batch-4 inventory update target missing: {did}")
        inventory["datasets"][by_id[did]] = deepcopy(update["replacement"])
    for rec in ext["inventoryAdditions"]:
        need(rec["datasetId"] not in by_id, f"batch-4 inventory addition duplicates source: {rec['datasetId']}")
        inventory["datasets"].append(deepcopy(rec))
    inventory["summary"] = deepcopy(ext["effectiveInventorySummary"])
    need(len(inventory["datasets"]) == 32, "batch-4 effective inventory must contain 32 families")
    need(sum(1 for x in inventory["datasets"] if x.get("automatedIngestionAllowed") is True) == 19, "batch-4 effective automated-ingestion count must be 19")

    execution = deepcopy(measured["datasetExecutionLedger"])
    ex_by_id = {x["datasetId"]: i for i, x in enumerate(execution["sources"])}
    for update in ext["executionUpdates"]:
        did = update["datasetId"]
        need(did in ex_by_id, f"batch-4 execution update target missing: {did}")
        execution["sources"][ex_by_id[did]] = deepcopy(update["replacement"])
    for rec in ext["executionAdditions"]:
        need(rec["datasetId"] not in ex_by_id, f"batch-4 execution addition duplicates source: {rec['datasetId']}")
        execution["sources"].append(deepcopy(rec))
    execution["summary"] = deepcopy(ext["effectiveExecutionSummary"])
    need(len(execution["sources"]) == 32 and execution["summary"]["acceptedProfiled"] == 16, "batch-4 effective execution reconciliation drifted")

    targets = deepcopy(measured["targetLedger"])
    targets["version"] = "2026.08.30.5-wave2-batch4-extension"
    profiled = targets["targets"]["fully_profiled_measured_datasets"]
    profiled["currentAccepted"] = 16
    profiled["currentDiscovered"] = 32
    profiled["notes"] = "Sixteen exact-source measured dataset families satisfy the profiling definition. Fresh-main batch 4 adds 666 direct injection-operation duration measurements from ypf95p4bs4 and recovers the already-inventoried SiC/Nylon-6 family via alternate release 47k6jswwg7 with 40 direct tribology measurements under CC BY-NC 3.0. The alternate DOI does not create a second family. These are record-level measurements, so accepted injection-process waveform values remain 66,521,519."

    ypf_contract = load_json("data/public-benchmark-contracts/ypf95p4bs4-v1.json")
    ypf_result = load_json("data/public-benchmark-results/ypf95p4bs4-v1.json")
    sic_contract = load_json("data/public-benchmark-contracts/sic-nylon6-alt-release-v1.json")
    sic_result = load_json("data/public-benchmark-results/sic-nylon6-alt-v1.json")
    need(ypf_result["acceptance"]["acceptedRecordLevelMeasuredValues"] == 666, "ypf accepted value count drifted")
    need(sic_result["acceptance"]["acceptedRecordLevelMeasuredValues"] == 40, "SiC/Nylon-6 accepted value count drifted")
    need(sic_result["acceptance"]["recoversPreviouslyBlockedDatasetFamily"] is True and sic_result["acceptance"]["createsNewSecondFamilyForAlternateDoi"] is False, "SiC alternate-release family-dedup boundary drifted")
    need(ypf_result["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == sic_result["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "batch-4 records must add zero process waveform samples")

    contracts = deepcopy(measured["specializedMeasuredBenchmarkContracts"])
    results = deepcopy(measured["specializedMeasuredBenchmarkResults"])
    contracts["mendeley-ypf95p4bs4-v1"] = ypf_contract
    results["mendeley-ypf95p4bs4-v1"] = ypf_result
    contracts["mendeley-ztkc87d6sr-v1"] = sic_contract
    results["mendeley-ztkc87d6sr-v1"] = sic_result
    need(len(results) == 8, "batch-4 effective specialized measured benchmark set must contain eight families")

    reviews = deepcopy(measured["publicBenchmarkReviewResults"])
    reviews.pop("mendeley-ztkc87d6sr-v1", None)

    measured["targetLedger"] = targets
    measured["datasetInventory"] = inventory
    measured["datasetExecutionLedger"] = execution
    measured["specializedMeasuredBenchmarkContracts"] = contracts
    measured["specializedMeasuredBenchmarkResults"] = results
    measured["publicBenchmarkReviewResults"] = reviews
    measured["wave2Batch4Extension"] = ext
    return measured


base.compile_measured = compile_measured_with_batch4

if __name__ == "__main__":
    base.main()

#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIOUS_PATH = Path(__file__).with_name("compile_master_data_wave2_batch4.py")
spec = importlib.util.spec_from_file_location("mouldmaster_compile_wave2_batch4", PREVIOUS_PATH)
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


def compile_measured_with_batch5():
    measured = PREVIOUS_COMPILE_MEASURED()
    ext = load_json("data/measured-dataset-wave2-batch5-extension-v1.json")
    need(measured["datasetInventory"]["summary"]["datasets"] == 32, "batch-5 base effective inventory drifted")
    need(measured["datasetInventory"]["summary"]["automatedIngestionAllowed"] == 19, "batch-5 base executable count drifted")
    need(measured["datasetExecutionLedger"]["summary"]["acceptedProfiled"] == 16, "batch-5 base family count drifted")
    need(measured["targetLedger"]["targets"]["measured_time_series_samples"]["currentAccepted"] == 66_521_519, "batch-5 base waveform total drifted")

    inventory = deepcopy(measured["datasetInventory"])
    existing = {x["datasetId"] for x in inventory["datasets"]}
    for rec in ext["inventoryAdditions"]:
        need(rec["datasetId"] not in existing, f"batch-5 inventory addition duplicates source: {rec['datasetId']}")
        inventory["datasets"].append(deepcopy(rec))
        existing.add(rec["datasetId"])
    inventory["summary"] = deepcopy(ext["effectiveInventorySummary"])
    need(len(inventory["datasets"]) == 34, "batch-5 effective inventory must contain 34 sources")
    need(sum(1 for x in inventory["datasets"] if x.get("automatedIngestionAllowed") is True) == 21, "batch-5 effective automated-ingestion count must be 21")

    execution = deepcopy(measured["datasetExecutionLedger"])
    ex_ids = {x["datasetId"] for x in execution["sources"]}
    for rec in ext["executionAdditions"]:
        need(rec["datasetId"] not in ex_ids, f"batch-5 execution addition duplicates source: {rec['datasetId']}")
        execution["sources"].append(deepcopy(rec))
        ex_ids.add(rec["datasetId"])
    execution["summary"] = deepcopy(ext["effectiveExecutionSummary"])
    need(len(execution["sources"]) == 34 and execution["summary"]["acceptedProfiled"] == 17, "batch-5 effective execution reconciliation drifted")

    targets = deepcopy(measured["targetLedger"])
    targets["version"] = "2026.08.30.6-wave2-batch5-extension"
    profiled = targets["targets"]["fully_profiled_measured_datasets"]
    profiled["currentAccepted"] = 17
    profiled["currentDiscovered"] = 34
    profiled["notes"] = "Seventeen exact-source measured families satisfy the profiling definition. Fresh-main batch 5 promotes Zenodo 20338544 with 19,048,305 direct production-energy measurements and carries AD-STGN 6f9x8yg8nj as a CC BY 4.0 retrieval blocker with zero accepted values because the publisher currently exposes no files."
    waveform = targets["targets"]["measured_time_series_samples"]
    waveform["currentAccepted"] = 85_569_824
    waveform["notes"] = "Accepted direct measured process values total 85,569,824 after adding 19,048,305 direct phase electrical measurements from the checksum-verified Zenodo 20338544 raw February/March injection-production streams. Derived totals/power factor and the curated test subset are excluded; AD-STGN metadata adds zero values."

    zen_contract = load_json("data/public-benchmark-contracts/zenodo-energy-20338544-v1.json")
    zen_result = load_json("data/public-benchmark-results/zenodo-energy-20338544-v1.json")
    ad_result = load_json("data/public-benchmark-results/ad-stgn-injection-moulding-v1-stage1.json")
    need(zen_result["status"] == "completed-public-measured-timeseries-benchmark", "Zenodo energy accepted status drifted")
    need(zen_result["acceptedMeasuredTimeSeriesSamples"] == 19_048_305, "Zenodo energy sample count drifted")
    need(zen_result["rawProductionRowsAccepted"] == 1_269_887, "Zenodo energy row count drifted")
    need((zen_result["source"].get("license") or "").lower() == "cc-by-4.0", "Zenodo energy licence drifted")
    need(ad_result["status"] == "publisher-record-no-files-exposed", "AD-STGN blocker status drifted")
    need(ad_result["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False and ad_result["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "AD-STGN must remain non-counting")

    public_contracts = deepcopy(measured["publicBenchmarkContracts"])
    public_results = deepcopy(measured["publicBenchmarkResults"])
    need("zenodo-energy-20338544" not in public_results, "Zenodo energy already present in public benchmark results")
    public_contracts["zenodo-energy-20338544"] = zen_contract
    public_results["zenodo-energy-20338544"] = zen_result

    reviews = deepcopy(measured["publicBenchmarkReviewResults"])
    reviews["ad-stgn-injection-moulding-v1"] = ad_result

    measured["targetLedger"] = targets
    measured["datasetInventory"] = inventory
    measured["datasetExecutionLedger"] = execution
    measured["publicBenchmarkContracts"] = public_contracts
    measured["publicBenchmarkResults"] = public_results
    measured["publicBenchmarkReviewResults"] = reviews
    measured["wave2Batch5Extension"] = ext
    return measured


base.compile_measured = compile_measured_with_batch5

if __name__ == "__main__":
    base.main()

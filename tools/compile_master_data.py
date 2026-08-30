#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_PATH = Path(__file__).with_name("compile_master_data_base.py")

spec = importlib.util.spec_from_file_location("mouldmaster_compile_base", BASE_PATH)
base = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(base)

BASE_COMPILE_MEASURED = base.compile_measured


def load_json(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def compile_measured_with_wave2_extension():
    measured = BASE_COMPILE_MEASURED()
    ext = load_json("data/measured-dataset-wave2-extension-v1.json")

    checkpoint = ext["baseCheckpoint"]
    need(checkpoint["inventoriedMeasuredSources"] == 25, "Wave-2 extension base inventory drifted")
    need(checkpoint["automatedIngestionAllowed"] == 14, "Wave-2 extension base executable count drifted")
    need(checkpoint["fullyProfiledMeasuredFamilies"] == 12, "Wave-2 extension base family count drifted")
    need(checkpoint["acceptedInjectionProcessTimeSeriesValues"] == 66_521_519, "Wave-2 extension base waveform count drifted")

    inventory = deepcopy(measured["datasetInventory"])
    base_ids = {x["datasetId"] for x in inventory["datasets"]}
    extension_ids = [x["datasetId"] for x in ext["inventoryEntries"]]
    need(len(extension_ids) == len(set(extension_ids)) == 6, "Wave-2 extension inventory IDs must be six unique sources")
    need(not (base_ids & set(extension_ids)), "Wave-2 extension duplicates a base inventory source")
    inventory["datasets"].extend(deepcopy(ext["inventoryEntries"]))
    inventory["summary"] = deepcopy(ext["effectiveInventorySummary"])
    need(len(inventory["datasets"]) == inventory["summary"]["datasets"] == 31, "effective measured inventory must contain 31 sources")
    need(sum(1 for x in inventory["datasets"] if x.get("automatedIngestionAllowed") is True) == 19, "effective executable-source count must be 19")

    execution = deepcopy(measured["datasetExecutionLedger"])
    execution_ids = {x["datasetId"] for x in execution["sources"]}
    need(not (execution_ids & {x["datasetId"] for x in ext["executionEntries"]}), "Wave-2 extension duplicates a base execution source")
    execution["sources"].extend(deepcopy(ext["executionEntries"]))
    execution["summary"] = deepcopy(ext["effectiveExecutionSummary"])
    need(len(execution["sources"]) == execution["summary"]["total"] == 31, "effective execution ledger must contain 31 sources")
    need(execution["summary"]["acceptedProfiled"] == 14, "effective accepted-profiled count must be 14")

    targets = deepcopy(measured["targetLedger"])
    targets["version"] = "2026.08.30.4-wave2-extension"
    profiled = targets["targets"]["fully_profiled_measured_datasets"]
    profiled["currentAccepted"] = 14
    profiled["currentDiscovered"] = 31
    profiled["notes"] = "Fourteen exact-source measured dataset families satisfy the profiling definition. The fresh-main Wave-2 extension promotes route-explicit injection-moulded Nylon-12 XRD (6,588 intensity values) and XPS material/tool-interface characterization (71,868 detector Counts values). Four companion records are retained as non-counting or access-blocked evidence. None of these additions is an injection-machine/cavity process waveform source, so the process-waveform total remains 66,521,519."

    xrd_contract = load_json("data/public-benchmark-contracts/8c8fjwcw86-v1.json")
    xrd_result = load_json("data/public-benchmark-results/8c8fjwcw86-v1.json")
    xps_contract = load_json("data/public-benchmark-contracts/crmb7xjymg-v1.json")
    xps_result = load_json("data/public-benchmark-results/crmb7xjymg-v1.json")
    need(xrd_result["status"] == "accepted-profiled-injection-moulded-xrd-characterization", "XRD accepted result status drifted")
    need(xrd_result["acceptance"]["acceptedMaterialCharacterizationTraceValues"] == 6_588, "XRD accepted trace count drifted")
    need(xps_result["status"] == "completed-profiled-xps-vamas-material-tool-interface", "XPS accepted result status drifted")
    need(xps_result["acceptance"]["acceptedMaterialCharacterizationTraceValues"] == 71_868, "XPS accepted trace count drifted")
    need(xrd_result["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == xps_result["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "material-characterisation additions must add zero process waveform samples")

    specialized_contracts = deepcopy(measured["specializedMeasuredBenchmarkContracts"])
    specialized_results = deepcopy(measured["specializedMeasuredBenchmarkResults"])
    specialized_contracts["mendeley-8c8fjwcw86-v1"] = xrd_contract
    specialized_contracts["mendeley-crmb7xjymg-v1"] = xps_contract
    specialized_results["mendeley-8c8fjwcw86-v1"] = xrd_result
    specialized_results["mendeley-crmb7xjymg-v1"] = xps_result
    need(len(specialized_results) == 6, "effective specialized measured benchmark set must contain six sources")

    review_results = deepcopy(measured["publicBenchmarkReviewResults"])
    review_results["mendeley-597jrsm9zm-v1"] = load_json("data/public-benchmark-results/597jrsm9zm-v1.json")
    review_results["mendeley-c3pt29jt7c-v1"] = load_json("data/public-benchmark-results/c3pt29jt7c-v1.json")
    review_results["mendeley-ztkc87d6sr-v1"] = load_json("data/public-benchmark-results/ztkc87d6sr-v1.json")
    review_results["strathclyde-rtim-tablets-v1"] = load_json("data/public-benchmark-results/strathclyde-rtim-tablets-v1.json")
    need(review_results["mendeley-597jrsm9zm-v1"]["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "597 process-documentation record must remain non-counting")
    need(review_results["mendeley-c3pt29jt7c-v1"]["status"] == "retrieved-profile-blocked-external-dic-workbook-not-delivered", "c3 DIC blocker drifted")
    need(review_results["mendeley-ztkc87d6sr-v1"]["status"] == "publisher-record-no-files-exposed", "ztkc payload blocker drifted")
    need(review_results["strathclyde-rtim-tablets-v1"]["status"] == "retrieval-blocked-http", "Strathclyde HTTP blocker drifted")

    measured["targetLedger"] = targets
    measured["datasetInventory"] = inventory
    measured["datasetExecutionLedger"] = execution
    measured["specializedMeasuredBenchmarkContracts"] = specialized_contracts
    measured["specializedMeasuredBenchmarkResults"] = specialized_results
    measured["publicBenchmarkReviewResults"] = review_results
    measured["wave2Extension"] = ext
    return measured


base.compile_measured = compile_measured_with_wave2_extension

if __name__ == "__main__":
    base.main()

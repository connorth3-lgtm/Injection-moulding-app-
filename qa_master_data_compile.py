from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
CURRENT = ROOT / "tools" / "compile_master_data.py"
PREVIOUS = ROOT / "tools" / "compile_master_data_wave2_batch4.py"
EXT = json.loads((ROOT / "data/measured-dataset-wave2-batch5-extension-v1.json").read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def run_compiler(path, expected):
    with tempfile.TemporaryDirectory() as td:
        p = subprocess.run([sys.executable, str(path), "--output-dir", td], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
        need(p.returncode == 0, f"compiler failed {path.name}:\n{p.stdout}\n{p.stderr}")
        out = Path(td)
        manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
        counts = manifest["counts"]
        for key, value in expected.items():
            need(counts.get(key) == value, f"{path.name} count drift for {key}: {counts.get(key)} != {value}")
        measured = json.loads((out / "measured-data.json").read_text(encoding="utf-8"))
        return manifest, measured


need(CURRENT.exists() and PREVIOUS.exists(), "batch-5 compiler layer chain missing")
need(EXT["baseEffective"] == {
    "inventoriedMeasuredSources": 32,
    "automatedIngestionAllowed": 19,
    "fullyProfiledMeasuredFamilies": 16,
    "acceptedInjectionProcessTimeSeriesValues": 66521519,
}, "batch-5 immutable base checkpoint drifted")
need(EXT["effective"]["inventoriedMeasuredSources"] == 34, "batch-5 effective inventory drifted")
need(EXT["effective"]["automatedIngestionAllowed"] == 21, "batch-5 effective executable count drifted")
need(EXT["effective"]["fullyProfiledMeasuredFamilies"] == 17, "batch-5 effective family count drifted")
need(EXT["effective"]["acceptedInjectionProcessTimeSeriesValues"] == 85_569_824, "batch-5 effective waveform total drifted")

common = {
    "publisherVerifiedPrimaryMeasuredStudies": 60,
    "verifiedPeerReviewedResearchRecords": 60,
    "measuredEvidencePasses": 50,
    "deepDiveEvidencePasses": 600,
    "researchCandidates": 0,
    "heuristicPrimaryMeasuredCandidates": 0,
    "syntheticProcessCases": 264,
    "syntheticGeneratedCycles": 19_008,
    "approvedAssessmentItems": 157,
    "coreLessons": 120,
    "specialistLessons": 20,
    "draftMaterialProfiles": 260,
    "draftDefectMechanisms": 320,
    "draftSensorMachineHealthConcepts": 220,
    "draftAssessmentItems": 1200,
}
prev_manifest, prev = run_compiler(PREVIOUS, {**common, "measuredDatasetInventory": 32, "automatedIngestionAllowedDatasets": 19, "fullyProfiledMeasuredDatasets": 16, "measuredTimeSeriesSamplesAccepted": 66_521_519})
need(prev_manifest.get("candidateRegistryEmbedded") is False, "previous checkpoint compiler must remain offline-core reproducible")
need(prev["datasetInventory"]["summary"]["datasets"] == 32 and prev["datasetExecutionLedger"]["summary"]["acceptedProfiled"] == 16, "previous batch-4 checkpoint no longer reconciles")

manifest, measured = run_compiler(CURRENT, {**common, "measuredDatasetInventory": 34, "automatedIngestionAllowedDatasets": 21, "fullyProfiledMeasuredDatasets": 17, "measuredTimeSeriesSamplesAccepted": 85_569_824})
need(manifest.get("candidateRegistryEmbedded") is False, "core compilation must not require network candidate registry")
inv = measured["datasetInventory"]
execution = measured["datasetExecutionLedger"]
need(inv["summary"]["datasets"] == len(inv["datasets"]) == 34, "compiled batch-5 inventory drifted")
need(sum(1 for x in inv["datasets"] if x.get("automatedIngestionAllowed") is True) == inv["summary"]["automatedIngestionAllowed"] == 21, "compiled batch-5 executable count drifted")
need(execution["summary"]["total"] == len(execution["sources"]) == 34, "compiled batch-5 execution total drifted")
need(execution["summary"]["acceptedProfiled"] == 17, "compiled batch-5 accepted-profiled count drifted")
need(execution["summary"]["retrievalBlockedExecutable"] == 3, "compiled licensed retrieval-blocked count drifted")

by_id = {x["datasetId"]: x for x in inv["datasets"]}
zen = by_id["zenodo-energy-20338544"]
need(zen["count"]["acceptedMeasuredTimeSeriesSamples"] == 19_048_305 and zen["automatedIngestionAllowed"] is True, "compiled Zenodo energy profile/rights drifted")
ad = by_id["ad-stgn-injection-moulding-v1"]
need(ad["count"]["acceptedMeasuredTimeSeriesSamples"] == 0 and ad["accessState"] == "retrieval-blocked-publisher-no-files", "compiled AD-STGN blocker drifted")
need(ad["automatedIngestionAllowed"] is True, "AD-STGN CC BY 4.0 rights must remain distinct from retrieval availability")

public = measured["publicBenchmarkResults"]
need(public["zenodo-energy-20338544"]["acceptedMeasuredTimeSeriesSamples"] == 19_048_305, "compiled Zenodo energy acceptance missing")
need(measured["publicBenchmarkReviewResults"]["ad-stgn-injection-moulding-v1"]["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "compiled AD-STGN review blocker missing")
need(measured["wave2Batch5Extension"]["effective"]["acceptedInjectionProcessTimeSeriesValues"] == 85_569_824, "compiled batch-5 extension missing")

print("MouldMaster master compilation QA passed: immutable 32/19/16/66,521,519 checkpoint plus effective 34 inventoried / 21 executable / 17 fully profiled / 85,569,824 process waveform values")

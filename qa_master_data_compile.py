from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
COMPILER = ROOT / "tools" / "compile_master_data.py"
PREVIOUS_COMPILER = ROOT / "tools" / "compile_master_data_wave2_xrd_xps.py"
BASE_COMPILER = ROOT / "tools" / "compile_master_data_base.py"
EXT2 = json.loads((ROOT / "data/measured-dataset-wave2-batch4-extension-v1.json").read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(COMPILER.exists() and PREVIOUS_COMPILER.exists() and BASE_COMPILER.exists(), "master compiler layer chain missing")
need(EXT2["effective"]["inventoriedMeasuredSources"] == 32, "batch-4 effective inventory drifted")
need(EXT2["effective"]["automatedIngestionAllowed"] == 19, "batch-4 effective executable count drifted")
need(EXT2["effective"]["fullyProfiledMeasuredFamilies"] == 16, "batch-4 effective family count drifted")
need(EXT2["effective"]["acceptedInjectionProcessTimeSeriesValues"] == 66_521_519, "batch-4 effective waveform total drifted")

with tempfile.TemporaryDirectory() as td:
    p = subprocess.run([sys.executable, str(COMPILER), "--output-dir", td], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    need(p.returncode == 0, f"master data compiler failed:\n{p.stdout}\n{p.stderr}")
    out = Path(td)
    manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
    counts = manifest["counts"]
    expected = {
        "measuredDatasetInventory": 32,
        "automatedIngestionAllowedDatasets": 19,
        "fullyProfiledMeasuredDatasets": 16,
        "measuredTimeSeriesSamplesAccepted": 66_521_519,
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
    for key, value in expected.items():
        need(counts.get(key) == value, f"compiled count drift for {key}: {counts.get(key)} != {value}")
    need(manifest.get("candidateRegistryEmbedded") is False, "core compilation must not require network candidate registry")

    measured = json.loads((out / "measured-data.json").read_text(encoding="utf-8"))
    inv = measured["datasetInventory"]
    execution = measured["datasetExecutionLedger"]
    need(inv["summary"]["datasets"] == len(inv["datasets"]) == 32, "compiled batch-4 inventory drifted")
    need(sum(1 for x in inv["datasets"] if x.get("automatedIngestionAllowed") is True) == inv["summary"]["automatedIngestionAllowed"] == 19, "compiled batch-4 executable count drifted")
    need(execution["summary"]["total"] == len(execution["sources"]) == 32, "compiled batch-4 execution total drifted")
    need(execution["summary"]["acceptedProfiled"] == 16, "compiled batch-4 accepted-profiled count drifted")
    need(execution["summary"]["acceptedRestrictedResearchEducation"] == 3, "compiled restricted accepted-profile count drifted")
    need(execution["summary"]["retrievalBlockedExecutable"] == 2, "compiled licensed retrieval-blocked count drifted")

    by_id = {x["datasetId"]: x for x in inv["datasets"]}
    need(by_id["mendeley-ypf95p4bs4-v1"]["count"]["acceptedRecordLevelMeasuredValues"] == 666, "compiled ypf value count drifted")
    ztkc = by_id["mendeley-ztkc87d6sr-v1"]
    need(ztkc["alternateSource"] == "https://doi.org/10.17632/47k6jswwg7.1", "compiled ztkc alternate source drifted")
    need(ztkc["count"]["acceptedRecordLevelMeasuredValues"] == 40 and ztkc["automatedIngestionAllowed"] is False, "compiled ztkc recovered-family profile/rights drifted")

    specialized = measured["specializedMeasuredBenchmarkResults"]
    need(len(specialized) == 8, "compiled specialized measured benchmark set must contain eight families")
    need(specialized["mendeley-ypf95p4bs4-v1"]["acceptance"]["acceptedRecordLevelMeasuredValues"] == 666, "compiled ypf acceptance drifted")
    need(specialized["mendeley-ztkc87d6sr-v1"]["acceptance"]["acceptedRecordLevelMeasuredValues"] == 40, "compiled SiC acceptance drifted")
    need(specialized["mendeley-ztkc87d6sr-v1"]["acceptance"]["createsNewSecondFamilyForAlternateDoi"] is False, "compiled alternate-release dedup boundary drifted")
    need(specialized["mendeley-ztkc87d6sr-v1"]["acceptance"]["commercialReuseAllowed"] is False, "compiled SiC noncommercial boundary drifted")
    need(all((v["acceptance"].get("acceptedMeasuredTimeSeriesSamples") or 0) == 0 for v in specialized.values()), "specialized non-waveform families must not add process waveform samples")
    need("mendeley-ztkc87d6sr-v1" not in measured["publicBenchmarkReviewResults"], "recovered ztkc family must leave blocked review set")
    need(measured["wave2Batch4Extension"]["effective"]["fullyProfiledMeasuredFamilies"] == 16, "compiled batch-4 extension missing")

print("MouldMaster master compilation QA passed: effective 32 inventoried / 19 executable / 16 fully profiled / 66,521,519 process waveform values after source-by-source batch-4 integration")

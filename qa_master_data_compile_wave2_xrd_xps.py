from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
COMPILER = ROOT / "tools" / "compile_master_data.py"
BASE_COMPILER = ROOT / "tools" / "compile_master_data_base.py"
EXT = json.loads((ROOT / "data/measured-dataset-wave2-extension-v1.json").read_text(encoding="utf-8"))
BASE_TARGETS = json.loads((ROOT / "data/content-scale-targets.json").read_text(encoding="utf-8"))["targets"]


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(COMPILER.exists() and BASE_COMPILER.exists(), "master compiler overlay/base pair missing")
need(BASE_TARGETS["fully_profiled_measured_datasets"]["currentAccepted"] == 12, "landed pre-extension family checkpoint drifted")
need(BASE_TARGETS["fully_profiled_measured_datasets"]["currentDiscovered"] == 25, "landed pre-extension inventory checkpoint drifted")
need(BASE_TARGETS["measured_time_series_samples"]["currentAccepted"] == 66_521_519, "landed pre-extension waveform checkpoint drifted")
need(EXT["effective"] == {
    "inventoriedMeasuredSources": 31,
    "automatedIngestionAllowed": 19,
    "fullyProfiledMeasuredFamilies": 14,
    "acceptedInjectionProcessTimeSeriesValues": 66_521_519,
    "wave2MaterialCharacterizationTraceValues": 84_482,
}, "Wave-2 effective reconciliation drifted")

with tempfile.TemporaryDirectory() as td:
    p = subprocess.run([sys.executable, str(COMPILER), "--output-dir", td], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    need(p.returncode == 0, f"master data compiler failed:\n{p.stdout}\n{p.stderr}")
    out = Path(td)
    expected_files = {"manifest.json", "measured-data.json", "research-evidence.json", "app-data-sources.json", "synthetic-process-data.json", "draft-banks.json", "mouldmaster-all-data.json"}
    need(expected_files.issubset({x.name for x in out.iterdir()}), "master data output set incomplete")

    manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
    counts = manifest["counts"]
    expected = {
        "measuredDatasetInventory": 31,
        "automatedIngestionAllowedDatasets": 19,
        "fullyProfiledMeasuredDatasets": 14,
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
    for key in ["syntheticIsNotMeasured", "candidateResearchIsNotVerified", "metadataOnlyDatasetIsNotProfiled", "thirdPartyRawRedistributionNotAssumed", "productionSetpointsNotDerived"]:
        need(manifest["boundaries"].get(key) is True, f"master compilation boundary missing: {key}")

    measured = json.loads((out / "measured-data.json").read_text(encoding="utf-8"))
    inv = measured["datasetInventory"]
    execution = measured["datasetExecutionLedger"]
    need(inv["summary"]["datasets"] == len(inv["datasets"]) == 31, "compiled effective inventory drifted")
    need(inv["summary"]["automatedIngestionAllowed"] == sum(1 for x in inv["datasets"] if x.get("automatedIngestionAllowed") is True) == 19, "compiled effective executable count drifted")
    need(execution["summary"]["total"] == len(execution["sources"]) == 31, "compiled execution total drifted")
    need(execution["summary"]["acceptedProfiled"] == 14, "compiled accepted-profiled count drifted")
    need(execution["summary"]["retrievalBlockedExecutable"] == 3, "compiled licensed retrieval-blocked count drifted")
    need(execution["summary"]["retrievedNotAccepted"] == 4, "compiled retrieved/non-counting count drifted")

    ids = [x["datasetId"] for x in inv["datasets"]]
    need(len(ids) == len(set(ids)) == 31, "compiled inventory IDs must be unique")
    for did in ["mendeley-8c8fjwcw86-v1", "mendeley-crmb7xjymg-v1", "mendeley-597jrsm9zm-v1", "mendeley-c3pt29jt7c-v1", "mendeley-ztkc87d6sr-v1", "strathclyde-rtim-tablets-v1"]:
        need(did in ids, f"missing Wave-2 extension inventory source: {did}")

    specialized = measured["specializedMeasuredBenchmarkResults"]
    need(set(specialized) == {"mendeley-6k8fpbrd9s-v1", "mendeley-4h98rz9f92-v3", "pmc4753395-hdpe-cenosphere-v1", "mendeley-yxz2w7ctnh-v1", "mendeley-8c8fjwcw86-v1", "mendeley-crmb7xjymg-v1"}, f"specialized measured benchmark set drifted: {set(specialized)}")
    need(specialized["mendeley-8c8fjwcw86-v1"]["profile"]["acceptedMeasuredXrdIntensityValues"] == 6_588, "compiled XRD count drifted")
    need(specialized["mendeley-crmb7xjymg-v1"]["profile"]["measuredDetectorCountsValues"] == 71_868, "compiled XPS count drifted")
    need(all((specialized[x]["acceptance"].get("acceptedMeasuredTimeSeriesSamples") or 0) == 0 for x in specialized), "specialized Wave-2 sources must add zero process waveform samples")

    reviews = measured["publicBenchmarkReviewResults"]
    need(reviews["mendeley-597jrsm9zm-v1"]["status"] == "profiled-process-documentation-only-noncounting", "compiled 597 state drifted")
    need(reviews["mendeley-c3pt29jt7c-v1"]["deliveredWorkbookProfile"]["externalWorkbookToken"] == "[1]PP6523_DIC!", "compiled c3 blocker drifted")
    need(reviews["mendeley-ztkc87d6sr-v1"]["status"] == "publisher-record-no-files-exposed", "compiled ztkc blocker drifted")
    need(reviews["strathclyde-rtim-tablets-v1"]["status"] == "retrieval-blocked-http", "compiled Strathclyde blocker drifted")

    base_results = measured["publicBenchmarkResults"]
    need(base_results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] == 13_631_488, "AVAPS sample count drifted")
    need(base_results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] == 298_080, "OpenMMS sample count drifted")
    need(len(measured["primaryMeasuredStudies"]) == 60, "verified primary measured study set drifted")

print("MouldMaster master compilation QA passed: effective 31 inventoried / 19 executable / 14 fully profiled / 66,521,519 process waveform values; XRD+XPS promotion and four carry-forward blockers compiled without weakening legacy boundaries")

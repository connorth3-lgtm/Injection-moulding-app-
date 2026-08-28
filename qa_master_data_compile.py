from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
COMPILER = ROOT / "tools" / "compile_master_data.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(COMPILER.exists(), "master data compiler missing")
with tempfile.TemporaryDirectory() as td:
    p = subprocess.run(
        [sys.executable, str(COMPILER), "--output-dir", td],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    need(p.returncode == 0, f"master data compiler failed:\n{p.stdout}\n{p.stderr}")
    out = Path(td)
    expected_files = {
        "manifest.json",
        "measured-data.json",
        "research-evidence.json",
        "app-data-sources.json",
        "synthetic-process-data.json",
        "draft-banks.json",
        "mouldmaster-all-data.json",
    }
    need(expected_files.issubset({x.name for x in out.iterdir()}), "master data output set incomplete")

    manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
    counts = manifest.get("counts") or {}
    expected = {
        "measuredDatasetInventory": 20,
        "automatedIngestionAllowedDatasets": 9,
        "fullyProfiledMeasuredDatasets": 8,
        "measuredTimeSeriesSamplesAccepted": 52_526_432,
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
    need(counts.get("structuredReferenceEntryMarkers", 0) >= 180, "compiled reference knowledge unexpectedly small")
    need(manifest.get("candidateRegistryEmbedded") is False, "core compilation must not require network candidate harvest")

    for key in [
        "syntheticIsNotMeasured",
        "candidateResearchIsNotVerified",
        "metadataOnlyDatasetIsNotProfiled",
        "thirdPartyRawRedistributionNotAssumed",
        "productionSetpointsNotDerived",
    ]:
        need((manifest.get("boundaries") or {}).get(key) is True, f"master compilation boundary missing: {key}")

    measured = json.loads((out / "measured-data.json").read_text(encoding="utf-8"))
    need(measured["datasetInventory"]["summary"]["datasets"] == 20, "compiled measured dataset inventory drifted")
    need(measured["profiledMeasuredDatasetRegistry"]["summary"]["fullyProfiledDatasetPackages"] == 8, "compiled profiled dataset count drifted")
    need(measured["profiledMeasuredDatasetRegistry"]["summary"]["acceptedMeasuredTimeSeriesSamples"] == 52_526_432, "compiled measured-sample total drifted")
    profiled_ids = {x["datasetId"] for x in measured["profiledMeasuredDatasetRegistry"]["datasets"]}
    need("iguzzini-road-lenses" in profiled_ids and "skz-loki-v1" in profiled_ids, "compiled accepted dataset registry missing recent promotions")
    need(len(measured["primaryMeasuredStudies"]) == 60, "compiled primary-measured study set incomplete")
    need(len({x["doi"].lower() for x in measured["primaryMeasuredStudies"]}) == 60, "compiled primary-measured DOI deduplication failed")
    need(measured["publicBenchmarkResult"]["status"] == "completed-public-measured-benchmark", "compiled first public benchmark result missing")

    research = json.loads((out / "research-evidence.json").read_text(encoding="utf-8"))
    need(research["cumulativePassCount"] == 600 and len(research["waves"]) == 6, "compiled Deep Dive v2 evidence coverage drifted")
    need(research["candidateRegistry"] is None, "core compilation must leave candidate registry optional")

    process = json.loads((out / "synthetic-process-data.json").read_text(encoding="utf-8"))
    need(process["totals"]["cases"] == 264 and process["totals"]["cycles"] == 19_008, "compiled synthetic corpus totals drifted")
    need(process["measuredDataBoundary"]["measuredRowsInSyntheticCorpus"] == 0, "synthetic corpus must contain zero measured rows")

    app = json.loads((out / "app-data-sources.json").read_text(encoding="utf-8"))
    need(len(app["canonicalRuntimeData"]["lessons"]) == 120, "compiled canonical curriculum drifted")
    need(len(app["specialistLessonIds"]) == 20, "compiled specialist curriculum drifted")
    need(len(app["sourceSnapshots"]) >= 30, "master source snapshot unexpectedly narrow")

    drafts = json.loads((out / "draft-banks.json").read_text(encoding="utf-8"))
    need(drafts["manifest"]["acceptedCountsChanged"] is False, "draft banks must not change accepted counts")

    combined = json.loads((out / "mouldmaster-all-data.json").read_text(encoding="utf-8"))
    for section in ["manifest", "measured", "research", "appData", "processData", "drafts"]:
        need(section in combined, f"combined master package missing section: {section}")

print("MouldMaster master data compilation QA passed (20 inventoried datasets; 8 fully profiled measured packages; 52,526,432 accepted real time-series samples; 60 verified primary measured studies; 600 evidence passes; 264/19,008 synthetic cases/cycles; 157 approved items; 120+20 lessons; full draft banks)")

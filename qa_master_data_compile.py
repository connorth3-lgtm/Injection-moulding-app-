from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
COMPILER = ROOT / "tools" / "compile_master_data.py"
TARGETS = ROOT / "data" / "content-scale-targets.json"
WORKFLOW = ROOT / ".github" / "workflows" / "master-data-compile.yml"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(COMPILER.exists(), "master data compiler missing")
target_obj = json.loads(TARGETS.read_text(encoding="utf-8"))
targets = target_obj["targets"]
expected_profiled = targets["fully_profiled_measured_datasets"]["currentAccepted"]
expected_samples = targets["measured_time_series_samples"]["currentAccepted"]
need(expected_profiled == 4, "audited profiled-dataset baseline drifted")
need(expected_samples == 13_929_568, "audited measured-sample baseline drifted")
workflow_text = WORKFLOW.read_text(encoding="utf-8")
need(
    f"assert c['fullyProfiledMeasuredDatasets']=={expected_profiled}" in workflow_text,
    "master-data workflow profiled-dataset assertion is stale",
)
need(
    f"assert c['measuredTimeSeriesSamplesAccepted']=={expected_samples}" in workflow_text,
    "master-data workflow measured-sample assertion is stale",
)

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
        "automatedIngestionAllowedDatasets": 6,
        "fullyProfiledMeasuredDatasets": expected_profiled,
        "measuredTimeSeriesSamplesAccepted": expected_samples,
        "publisherVerifiedPrimaryMeasuredStudies": 60,
        "verifiedPeerReviewedResearchRecords": 60,
        "measuredEvidencePasses": 50,
        "deepDiveEvidencePasses": 600,
        "researchCandidates": 0,
        "heuristicPrimaryMeasuredCandidates": 0,
        "syntheticProcessCases": 264,
        "syntheticGeneratedCycles": 19008,
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
    need(manifest.get("candidateRegistryEmbedded") is False, "core compilation must not require a network-harvested candidate registry")
    need(manifest.get("compiledOn") == target_obj.get("reviewed"), "master compilation date must follow audited target ledger")

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
    need(measured["datasetExecutionLedger"]["summary"]["acceptedProfiled"] == expected_profiled, "compiled execution ledger accepted-profiled count drifted")
    need(len(measured["primaryMeasuredStudies"]) == 60, "compiled primary-measured study set incomplete")
    need(len({x["doi"].lower() for x in measured["primaryMeasuredStudies"]}) == 60, "compiled primary-measured study DOI deduplication failed")
    need(measured["publicBenchmarkResult"]["status"] == "completed-public-measured-benchmark", "legacy public benchmark alias missing")
    results = measured.get("publicBenchmarkResults") or {}
    need(set(results) == {"gtnb4j7bfx-v1", "scatimdata-avaps", "openmms-t4g", "su13148102-supplement"}, f"completed public benchmark set drifted: {set(results)}")
    need(all(x.get("status") == "completed-public-measured-benchmark" for x in results.values()), "compiled public benchmark completion state drifted")
    need(results["su13148102-supplement"]["profile"]["rows"] == 955, "compiled Sustainability supplement row count drifted")
    review_results = measured.get("publicBenchmarkReviewResults") or {}
    need(set(review_results) == {"pet-preform-v2", "warwick-demoulding"}, "retrieved non-accepted result set drifted")
    need(all(x.get("status") != "completed-public-measured-benchmark" for x in review_results.values()), "review-only datasets must not enter accepted benchmark counts")
    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] == 13_631_488, "compiled AVAPS sample count drifted")
    need(results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] == 298_080, "compiled OpenMMS sample count drifted")
    need(
        results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"]
        + results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"]
        == expected_samples,
        "compiled measured benchmark sample totals do not reconcile",
    )

    research = json.loads((out / "research-evidence.json").read_text(encoding="utf-8"))
    need(research["cumulativePassCount"] == 600 and len(research["waves"]) == 6, "compiled Deep Dive v2 evidence coverage drifted")
    need(research["candidateRegistry"] is None, "core compilation must leave candidate registry optional")

    process = json.loads((out / "synthetic-process-data.json").read_text(encoding="utf-8"))
    need(process["totals"]["cases"] == 264 and process["totals"]["cycles"] == 19008, "compiled synthetic corpus totals drifted")
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

print(f"MouldMaster master data compilation QA passed (20 measured datasets; {expected_profiled} profiled benchmarks; {expected_samples:,} accepted measured time-series values; 60 verified primary measured studies; 600 evidence passes; 264/19,008 synthetic cases/cycles; 157 approved items; 120+20 lessons; full draft banks)")

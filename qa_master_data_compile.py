from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
COMPILER = ROOT / "tools" / "compile_master_data.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


need(COMPILER.exists(), "master data compiler missing")
source_inventory = load(DATA / "measured-dataset-inventory-v1.json")
source_profiled = load(DATA / "profiled-measured-dataset-registry-v1.json")
source_primary = load(DATA / "primary-measured-evidence-registry-v1.json")
source_targets = load(DATA / "content-scale-targets.json")

inventory_rows = source_inventory.get("datasets") or []
inventory_summary = source_inventory.get("summary") or {}
profiled_rows = source_profiled.get("datasets") or []
profiled_summary = source_profiled.get("summary") or {}
primary_summary = source_primary.get("summary") or {}

expected_inventory = len(inventory_rows)
expected_automated = sum(1 for row in inventory_rows if row.get("automatedIngestionAllowed") is True)
expected_profiled = len(profiled_rows)
expected_samples = profiled_summary.get("acceptedMeasuredTimeSeriesSamples")
expected_primary = primary_summary.get("publisherVerifiedPeerReviewedPrimaryMeasured")
expected_peer_reviewed = (source_targets.get("targets") or {}).get("peer_reviewed_research_records", {}).get("currentAccepted")

need(inventory_summary.get("datasets") == expected_inventory, "source inventory summary drifted before compilation")
need(inventory_summary.get("automatedIngestionAllowed") == expected_automated, "source automated-ingestion summary drifted before compilation")
need(profiled_summary.get("fullyProfiledDatasetPackages") == expected_profiled, "source profiled summary drifted before compilation")
need((source_targets.get("targets") or {}).get("fully_profiled_measured_datasets", {}).get("currentAccepted") == expected_profiled, "target/profiled package mismatch before compilation")
need((source_targets.get("targets") or {}).get("measured_time_series_samples", {}).get("currentAccepted") == expected_samples, "target/profiled sample mismatch before compilation")

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
        "manifest.json", "measured-data.json", "research-evidence.json",
        "app-data-sources.json", "synthetic-process-data.json", "draft-banks.json",
        "mouldmaster-all-data.json",
    }
    need(expected_files.issubset({x.name for x in out.iterdir()}), "master data output set incomplete")

    manifest = load(out / "manifest.json")
    counts = manifest.get("counts") or {}
    ledger_expected = {
        "measuredDatasetInventory": expected_inventory,
        "automatedIngestionAllowedDatasets": expected_automated,
        "fullyProfiledMeasuredDatasets": expected_profiled,
        "measuredTimeSeriesSamplesAccepted": expected_samples,
        "publisherVerifiedPrimaryMeasuredStudies": expected_primary,
        "verifiedPeerReviewedResearchRecords": expected_peer_reviewed,
    }
    for key, value in ledger_expected.items():
        need(counts.get(key) == value, f"compiled ledger count drift for {key}: {counts.get(key)} != {value}")

    stable_expected = {
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
    for key, value in stable_expected.items():
        need(counts.get(key) == value, f"compiled stable count drift for {key}: {counts.get(key)} != {value}")
    need(counts.get("structuredReferenceEntryMarkers", 0) >= 180, "compiled reference knowledge unexpectedly small")
    need(manifest.get("candidateRegistryEmbedded") is False, "core compilation must not require network candidate harvest")

    for key in [
        "syntheticIsNotMeasured", "candidateResearchIsNotVerified",
        "metadataOnlyDatasetIsNotProfiled", "thirdPartyRawRedistributionNotAssumed",
        "productionSetpointsNotDerived",
    ]:
        need((manifest.get("boundaries") or {}).get(key) is True, f"master compilation boundary missing: {key}")

    measured = load(out / "measured-data.json")
    compiled_inventory = measured["datasetInventory"]
    compiled_profiled = measured["profiledMeasuredDatasetRegistry"]
    need(compiled_inventory["summary"]["datasets"] == expected_inventory, "compiled measured inventory count drifted")
    need(len(compiled_inventory["datasets"]) == expected_inventory, "compiled measured inventory rows incomplete")
    need(compiled_profiled["summary"]["fullyProfiledDatasetPackages"] == expected_profiled, "compiled profiled package count drifted")
    need(compiled_profiled["summary"]["acceptedMeasuredTimeSeriesSamples"] == expected_samples, "compiled measured-sample total drifted")

    source_profiled_ids = {x["datasetId"] for x in profiled_rows}
    compiled_profiled_ids = {x["datasetId"] for x in compiled_profiled["datasets"]}
    need(compiled_profiled_ids == source_profiled_ids, "compiled accepted dataset registry differs from canonical source registry")
    need({
        "iguzzini-road-lenses", "skz-loki-v1", "impure-pascoe-2022", "forinfpro-himd-v1",
        "cross-process-chain-17240390", "hdpe-gnp-v3",
    }.issubset(compiled_profiled_ids), "compiled accepted registry missing recent promotions")

    benchmark_profiles = measured.get("publicBenchmarkResults") or {}
    need({
        "impure-pascoe-2022-v1.json", "forinfpro-himd-v1.json", "skz-loki-v1.json",
        "cross-process-chain-v1.json", "hdpe-gnp-v3.json",
    }.issubset(benchmark_profiles), "compiled benchmark profile set missing recent measured profiles")
    need(len(measured["primaryMeasuredStudies"]) == expected_primary, "compiled primary-measured study set incomplete")
    need(len({x["doi"].lower() for x in measured["primaryMeasuredStudies"]}) == expected_primary, "compiled primary-measured DOI deduplication failed")
    need(measured["publicBenchmarkResult"]["status"] == "completed-public-measured-benchmark", "compiled first public benchmark result missing")

    research = load(out / "research-evidence.json")
    need(research["cumulativePassCount"] == 600 and len(research["waves"]) == 6, "compiled Deep Dive v2 evidence coverage drifted")
    need(research["candidateRegistry"] is None, "core compilation must leave candidate registry optional")

    process = load(out / "synthetic-process-data.json")
    need(process["totals"]["cases"] == 264 and process["totals"]["cycles"] == 19_008, "compiled synthetic corpus totals drifted")
    need(process["measuredDataBoundary"]["measuredRowsInSyntheticCorpus"] == 0, "synthetic corpus must contain zero measured rows")

    app = load(out / "app-data-sources.json")
    need(len(app["canonicalRuntimeData"]["lessons"]) == 120, "compiled canonical curriculum drifted")
    need(len(app["specialistLessonIds"]) == 20, "compiled specialist curriculum drifted")
    need(len(app["sourceSnapshots"]) >= 30, "master source snapshot unexpectedly narrow")

    drafts = load(out / "draft-banks.json")
    need(drafts["manifest"]["acceptedCountsChanged"] is False, "draft banks must not change accepted counts")

    combined = load(out / "mouldmaster-all-data.json")
    for section in ["manifest", "measured", "research", "appData", "processData", "drafts"]:
        need(section in combined, f"combined master package missing section: {section}")

print(
    "MouldMaster master data compilation QA passed "
    f"({expected_inventory} inventoried sources; {expected_automated} automated-ingestion; "
    f"{expected_profiled} accepted measured packages; {expected_samples:,} accepted scalar samples; "
    f"{expected_primary} verified primary measured studies)"
)

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
TARGETS = ROOT / "data" / "content-scale-targets.json"
LEGACY_CATALOG = ROOT / "data" / "measured-dataset-catalog.json"
INVENTORY = ROOT / "data" / "measured-dataset-inventory-v1.json"
PROFILED = ROOT / "data" / "profiled-measured-dataset-registry-v1.json"
PRIMARY = ROOT / "data" / "primary-measured-evidence-registry-v1.json"
BENCHMARK = ROOT / "data" / "public-benchmark-results" / "gtnb4j7bfx-v1.json"
SCATIM = ROOT / "data" / "public-benchmark-results" / "scatimdata-v1.json"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


obj = json.loads(TARGETS.read_text(encoding="utf-8"))
need(obj.get("schema") == 1, "content-scale target schema drifted")
need("synthetic" in obj.get("scope", "").lower(), "scope must explicitly exclude synthetic evidence from measured counts")

targets = obj.get("targets", {})
expected = {
    "fully_profiled_measured_datasets": (30, 50),
    "measured_time_series_samples": (1_000_000, 5_000_000),
    "material_profiles": (250, 300),
    "defect_mechanisms": (300, 400),
    "sensor_machine_health_concepts": (200, 250),
    "assessment_education_items": (1000, 1500),
    "peer_reviewed_research_records": (1500, 2000),
    "primary_measured_studies": (800, 1000),
}
need(set(targets) == set(expected), f"content-scale target areas drifted: {set(targets)}")
for key, (minimum, preferred) in expected.items():
    rec = targets[key]
    need(rec.get("minimum") == minimum, f"{key} minimum target drifted")
    need(rec.get("preferred") == preferred, f"{key} preferred target drifted")
    need(isinstance(rec.get("acceptance"), str) and len(rec["acceptance"]) >= 120, f"{key} needs a substantive acceptance definition")
    need(isinstance(rec.get("currentAccepted"), int) and rec["currentAccepted"] >= 0, f"{key} currentAccepted must be a non-negative integer")
    # Some scale measures can legitimately exceed the preferred target while
    # other programme areas remain incomplete. Do not cap real measured samples.
    if key != "measured_time_series_samples":
        need(rec["currentAccepted"] <= preferred, f"{key} accepted count cannot exceed preferred target without revising the programme")

legacy = json.loads(LEGACY_CATALOG.read_text(encoding="utf-8"))
need(len(legacy.get("datasets") or []) >= 14, "legacy measured-dataset discovery seed unexpectedly small")
inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
datasets = inventory.get("datasets") or []
summary = inventory.get("summary") or {}
need(summary.get("datasets") == len(datasets) == 20, f"measured dataset inventory count drifted: {summary.get('datasets')} / {len(datasets)}")
ids = [x.get("datasetId") for x in datasets]
need(len(ids) == len(set(ids)) and all(ids), "measured dataset inventory IDs must be unique and non-empty")
need(summary.get("automatedIngestionAllowed") == sum(1 for x in datasets if x.get("automatedIngestionAllowed") is True), "automated-ingestion dataset count drifted")
need(targets["fully_profiled_measured_datasets"].get("currentDiscovered") == len(datasets), "target ledger discovery count must equal the measured-dataset inventory")

# Record-level Mendeley benchmark remains accepted.
benchmark = json.loads(BENCHMARK.read_text(encoding="utf-8"))
need(benchmark.get("status") == "completed-public-measured-benchmark", "completed public benchmark status missing")
source = benchmark.get("source") or {}
separation = benchmark.get("process_separation") or {}
need(source.get("doi") == "10.17632/gtnb4j7bfx.1", "profiled benchmark DOI drifted")
need(source.get("sha256") == "b231af5d49c0a258b5625d6e2ab2c324c233017c5c010e326a3ca485387ecc9f", "profiled benchmark fingerprint drifted")
need(separation.get("injection_rows_profiled") == 4502 and separation.get("blow_rows_excluded") == 1855, "profiled benchmark process separation drifted")

# High-resolution scatimdata benchmark must remain tied to exact downloaded
# archive fingerprints and only count physical numeric signal matrices.
scatim = json.loads(SCATIM.read_text(encoding="utf-8"))
need(scatim.get("status") == "completed-public-measured-timeseries-benchmark", "scatimdata benchmark status missing")
need((scatim.get("source") or {}).get("license") == "CC BY 4.0", "scatimdata licence drifted")
need((scatim.get("source") or {}).get("peerReviewedCompanion") == "10.3390/polym15040978", "scatimdata companion DOI drifted")
need((scatim.get("observedSourceStructure") or {}).get("pointsPerCurveInDownloadedMatrices") == 2048, "scatimdata observed numeric time rows drifted")
need(scatim.get("acceptedMeasuredTimeSeriesSamples") == 16_228_352, "scatimdata accepted sample count drifted")
need(scatim.get("sampleCountBySignal") == {
    "cavity-pressure": 1_888_256,
    "injection-flow": 7_170_048,
    "injection-pressure": 7_170_048,
}, "scatimdata physical-signal split drifted")
need(scatim.get("rawSourceRowsCommitted") is False, "scatimdata profile must not commit third-party raw rows")
expected_archive_hashes = {
    "dataset1.zip": "f8c7f6363ecbd541735b374746ce8549aaa50dae754aaaa2efa980c227b19c09",
    "dataset2.zip": "69294087889a52791c296734051d6b21b30847c2859613e4178074182150c491",
    "dataset3.zip": "b6baa4f5f5dbdf0c1bbe23a7b854358967d9004b75de4a16502730a77aed316e",
}
need({a.get("name"): a.get("sha256") for a in scatim.get("archives") or []} == expected_archive_hashes, "scatimdata archive fingerprints drifted")

# Dedicated accepted registry is the source of truth for fully profiled dataset
# packages. scatimdata's three constituent datasets count as one source family.
profiled = json.loads(PROFILED.read_text(encoding="utf-8"))
profiled_rows = profiled.get("datasets") or []
profiled_summary = profiled.get("summary") or {}
need(len(profiled_rows) == 2, "expected exactly two accepted profiled dataset packages")
need({x.get("datasetId") for x in profiled_rows} == {"mendeley-gtnb4j7bfx-v1", "scatimdata-avaps"}, "profiled dataset registry IDs drifted")
need(profiled_summary.get("fullyProfiledDatasetPackages") == 2, "profiled registry dataset count drifted")
need(profiled_summary.get("acceptedMeasuredTimeSeriesSamples") == 16_228_352, "profiled registry measured-sample total drifted")
need(sum(int(x.get("acceptedMeasuredTimeSeriesSamples", 0)) for x in profiled_rows) == 16_228_352, "profiled registry sample totals do not reconcile")
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == profiled_summary["fullyProfiledDatasetPackages"], "target ledger profiled-dataset count must match accepted registry")
need(targets["measured_time_series_samples"]["currentAccepted"] == profiled_summary["acceptedMeasuredTimeSeriesSamples"], "target ledger measured-sample count must match accepted registry")

# The publisher-verified registry supersedes the older 40-study lower bound.
primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
ps = primary.get("summary") or {}
verified = ps.get("publisherVerifiedPeerReviewedPrimaryMeasured")
need(verified == 60 and ps.get("uniqueDois") == 60, f"verified primary-measured registry drifted: {ps}")
need(sum(int(p.get("entries", 0)) for p in primary.get("packs") or []) == verified, "primary-measured pack totals do not reconcile")
need(targets["primary_measured_studies"]["currentAccepted"] == verified, "target ledger primary-measured count must match dedicated registry")
need(targets["peer_reviewed_research_records"]["currentAccepted"] == verified, "current audited peer-reviewed master subset must match the 60 verified DOI records")

# Remaining categories stay conservative until dedicated accepted registries exist.
need(targets["material_profiles"]["currentAccepted"] == 20, "base material count must remain conservative until a dedicated accepted registry supersedes it")
need(targets["defect_mechanisms"]["currentAccepted"] == 20, "base defect count must remain conservative until mechanism records are normalized")
need(targets["sensor_machine_health_concepts"]["currentAccepted"] == 0, "do not infer an accepted sensor/health count from mixed reference cards or drafts")
need(targets["assessment_education_items"]["currentAccepted"] == 157, "accepted learner-item count must match the evidence-gated keyed-question baseline")

rules = " ".join(obj.get("nonCountingRules", [])).lower()
for marker in ["synthetic process-data cases never count", "actual source files", "openalex candidate is not", "generated assessment drafts"]:
    need(marker in rules, f"content-scale non-counting rule missing: {marker}")

report = {
    "schema": 3,
    "version": obj.get("version"),
    "reviewed": obj.get("reviewed"),
    "measuredDatasetDiscovery": {
        "inventoryCount": len(datasets),
        "legacyCatalogSeedCount": len(legacy.get("datasets") or []),
        "fullyProfiledAccepted": profiled_summary.get("fullyProfiledDatasetPackages"),
        "acceptedMeasuredTimeSeriesSamples": profiled_summary.get("acceptedMeasuredTimeSeriesSamples"),
        "automatedIngestionAllowed": summary.get("automatedIngestionAllowed"),
        "embargoedRecords": summary.get("embargoed"),
    },
    "verifiedResearch": {
        "publisherVerifiedPeerReviewedPrimaryMeasured": verified,
        "uniqueDois": ps.get("uniqueDois"),
        "tierA": ps.get("tierA"),
        "tierB": ps.get("tierB"),
    },
    "areas": {
        key: {
            "accepted": targets[key]["currentAccepted"],
            "minimum": targets[key]["minimum"],
            "preferred": targets[key]["preferred"],
            "remainingToMinimum": max(0, targets[key]["minimum"] - targets[key]["currentAccepted"]),
            "remainingToPreferred": max(0, targets[key]["preferred"] - targets[key]["currentAccepted"]),
        }
        for key in expected
    },
    "boundary": "No synthetic, metadata-only, generated-draft or heuristic-candidate evidence is counted as completed measured/reviewed content unless its area-specific acceptance definition is satisfied."
}
(ROOT / "content-scale-targets-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"MouldMaster content-scale target integrity QA passed ({len(datasets)} measured datasets inventoried; {profiled_summary.get('fullyProfiledDatasetPackages')} fully profiled dataset packages; {profiled_summary.get('acceptedMeasuredTimeSeriesSamples'):,} accepted real measured time-series samples; {verified} publisher-verified primary measured studies)")

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
TARGETS = ROOT / "data" / "content-scale-targets.json"
LEGACY_CATALOG = ROOT / "data" / "measured-dataset-catalog.json"
INVENTORY = ROOT / "data" / "measured-dataset-inventory-v1.json"
PRIMARY = ROOT / "data" / "primary-measured-evidence-registry-v1.json"
BENCHMARK_RECORD = ROOT / "data" / "public-benchmark-results" / "gtnb4j7bfx-v1.json"
BENCHMARK_AVAPS = ROOT / "data" / "public-benchmark-results" / "scatimdata-avaps-v1.json"
BENCHMARK_OPENMMS = ROOT / "data" / "public-benchmark-results" / "openmms-t4g-v1.json"


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
    # Targets are thresholds, not caps. Valid measured evidence may exceed preferred scale.

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
by_id = {x.get("datasetId"): x for x in datasets}

record = json.loads(BENCHMARK_RECORD.read_text(encoding="utf-8"))
need(record.get("status") == "completed-public-measured-benchmark", "record-level public benchmark status missing")
record_source = record.get("source") or {}
record_sep = record.get("process_separation") or {}
need(record_source.get("doi") == "10.17632/gtnb4j7bfx.1", "record benchmark DOI drifted")
need(record_source.get("sha256") == "b231af5d49c0a258b5625d6e2ab2c324c233017c5c010e326a3ca485387ecc9f", "record benchmark fingerprint drifted")
need(record_sep.get("injection_rows_profiled") == 4502 and record_sep.get("blow_rows_excluded") == 1855, "record benchmark process separation drifted")
need(by_id["mendeley-gtnb4j7bfx-v1"].get("accessState") == "executed-open", "completed Mendeley benchmark inventory state drifted")

avaps = json.loads(BENCHMARK_AVAPS.read_text(encoding="utf-8"))
need(avaps.get("status") == "completed-public-measured-benchmark", "AVAPS public benchmark status missing")
av_source = avaps.get("source") or {}
av_profile = avaps.get("measurement_profile") or {}
need(av_source.get("datasetId") == "scatimdata-avaps", "AVAPS dataset identity drifted")
need(av_source.get("repositoryCommit") == "7bd35941d75c97a3f276439377dc430ab47402be", "AVAPS pinned commit drifted")
need(av_source.get("license") == "CC BY 4.0", "AVAPS licence drifted")
need(av_profile.get("linkedCycles") == 3328, "AVAPS linked cycle count drifted")
need(av_profile.get("deliveredPointsPerSignalPerLinkedCycle") == 2048, "AVAPS delivered point count drifted")
need(av_profile.get("paperReportedPointsPerSignalPerCycle") == 2049, "AVAPS paper-reported point count drifted")
need(av_profile.get("acceptedMeasuredTimeSeriesSamples") == 13_631_488, "AVAPS accepted measured-sample count drifted")
need(sum(int(x.get("acceptedMeasuredTimeSeriesSamples", 0)) for x in avaps.get("archives") or []) == 13_631_488, "AVAPS archive sample totals do not reconcile")
need(by_id["scatimdata-avaps"].get("automatedIngestionAllowed") is True and by_id["scatimdata-avaps"].get("license") == "CC BY 4.0", "AVAPS inventory execution rights drifted")

openmms = json.loads(BENCHMARK_OPENMMS.read_text(encoding="utf-8"))
need(openmms.get("status") == "completed-public-measured-benchmark", "OpenMMS public benchmark status missing")
om_source = openmms.get("source") or {}
om_profile = openmms.get("measurement_profile") or {}
need(om_source.get("datasetId") == "openmms-t4g", "OpenMMS dataset identity drifted")
need(om_source.get("repositoryCommit") == "cfa6e23c7fc02a645e31e06d299021cb0a3ce3e7", "OpenMMS pinned commit drifted")
need(om_source.get("license") == "BSD-3-Clause", "OpenMMS licence drifted")
need(om_source.get("peerReviewedCompanion") == "10.3390/s23073569", "OpenMMS companion DOI drifted")
need(om_source.get("sha256") == "aa78e659bc4b7a0361882d2eaa516a0010bfb573d413a3600baad98aae397bf6", "OpenMMS source fingerprint drifted")
need(om_profile.get("rows") == 29_808 and om_profile.get("columns") == 12, "OpenMMS file dimensions drifted")
need(om_profile.get("measuredSignalColumns") == 10, "OpenMMS measured signal count drifted")
need(om_profile.get("acceptedMeasuredTimeSeriesSamples") == 298_080, "OpenMMS accepted measured-sample count drifted")
need(len(om_profile.get("signals") or []) == 10, "OpenMMS signal registry must contain ten source-defined measured channels")
need(set((om_profile.get("time_bases") or {}).keys()) == {"t", "t2"}, "OpenMMS two time bases drifted")
need(all(v.get("monotonicNonDecreasing") is True and v.get("strictlyIncreasingFraction") == 1.0 for v in (om_profile.get("time_bases") or {}).values()), "OpenMMS time bases must remain ordered")
need(by_id["openmms-t4g"].get("automatedIngestionAllowed") is True, "OpenMMS inventory execution right drifted")

accepted_measured_total = av_profile["acceptedMeasuredTimeSeriesSamples"] + om_profile["acceptedMeasuredTimeSeriesSamples"]
need(accepted_measured_total == 13_929_568, "combined real measured-sample arithmetic drifted")
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == 3, "fully profiled measured dataset count must equal the three completed benchmark families")
need(targets["measured_time_series_samples"]["currentAccepted"] == accepted_measured_total, "measured sample count must equal AVAPS plus OpenMMS delivered-file evidence")

primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
ps = primary.get("summary") or {}
verified = ps.get("publisherVerifiedPeerReviewedPrimaryMeasured")
need(verified == 60 and ps.get("uniqueDois") == 60, f"verified primary-measured registry drifted: {ps}")
need(sum(int(p.get("entries", 0)) for p in primary.get("packs") or []) == verified, "primary-measured pack totals do not reconcile")
need(targets["primary_measured_studies"]["currentAccepted"] == verified, "target ledger primary-measured count must match dedicated registry")
need(targets["peer_reviewed_research_records"]["currentAccepted"] == verified, "current audited peer-reviewed master subset must match the 60 verified DOI records")

need(targets["material_profiles"]["currentAccepted"] == 20, "base material count must remain conservative until a dedicated accepted registry supersedes it")
need(targets["defect_mechanisms"]["currentAccepted"] == 20, "base defect count must remain conservative until mechanism records are normalized")
need(targets["sensor_machine_health_concepts"]["currentAccepted"] == 0, "do not infer an accepted sensor/health count from mixed reference cards, measured datasets or drafts")
need(targets["assessment_education_items"]["currentAccepted"] == 157, "accepted learner-item count must match the evidence-gated keyed-question baseline")

rules = " ".join(obj.get("nonCountingRules", [])).lower()
for marker in ["synthetic process-data cases never count", "actual source files", "openalex candidate is not", "generated assessment drafts"]:
    need(marker in rules, f"content-scale non-counting rule missing: {marker}")

report = {
    "schema": 4,
    "version": obj.get("version"),
    "reviewed": obj.get("reviewed"),
    "measuredDatasetDiscovery": {
        "inventoryCount": len(datasets),
        "legacyCatalogSeedCount": len(legacy.get("datasets") or []),
        "fullyProfiledAccepted": 3,
        "automatedIngestionAllowed": summary.get("automatedIngestionAllowed"),
        "embargoedRecords": summary.get("embargoed"),
    },
    "realMeasuredSamples": {
        "accepted": accepted_measured_total,
        "sources": [
            {"path": "data/public-benchmark-results/scatimdata-avaps-v1.json", "accepted": av_profile["acceptedMeasuredTimeSeriesSamples"]},
            {"path": "data/public-benchmark-results/openmms-t4g-v1.json", "accepted": om_profile["acceptedMeasuredTimeSeriesSamples"]},
        ],
        "avaps": {
            "linkedCycles": av_profile["linkedCycles"],
            "signalsPerCycle": 2,
            "deliveredValuesPerSignal": av_profile["deliveredPointsPerSignalPerLinkedCycle"],
            "paperReportedValuesPerSignal": av_profile["paperReportedPointsPerSignalPerCycle"],
        },
        "openmms": {
            "rows": om_profile["rows"],
            "measuredSignalColumns": om_profile["measuredSignalColumns"],
            "timeBases": list(om_profile["time_bases"]),
        },
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
print(f"MouldMaster content-scale target integrity QA passed ({len(datasets)} measured datasets inventoried; 3 fully profiled benchmark families; {accepted_measured_total:,} real measured time-series values; {verified} publisher-verified primary measured studies)")

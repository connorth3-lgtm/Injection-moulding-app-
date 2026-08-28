from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
RESULTS = DATA / "public-benchmark-results"

TARGETS = DATA / "content-scale-targets.json"
LEGACY_CATALOG = DATA / "measured-dataset-catalog.json"
INVENTORY = DATA / "measured-dataset-inventory-v1.json"
PROFILED = DATA / "profiled-measured-dataset-registry-v1.json"
PRIMARY = DATA / "primary-measured-evidence-registry-v1.json"

BENCHMARK = RESULTS / "gtnb4j7bfx-v1.json"
SCATIM = RESULTS / "scatimdata-v1.json"
SUSTAINABLE = RESULTS / "su13148102-v1.json"
OPENMMS = RESULTS / "openmms-t4g-v1.json"
PROBAYES_MAIN = RESULTS / "probayes-main-v2.json"
PROBAYES_DOPT = RESULTS / "probayes-doptimal-v1.json"
PET_PREFORM = RESULTS / "vc3k9tt5zj-v2.json"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


obj = load(TARGETS)
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
    if key != "measured_time_series_samples":
        need(rec["currentAccepted"] <= preferred, f"{key} accepted count cannot exceed preferred target without revising the programme")

legacy = load(LEGACY_CATALOG)
need(len(legacy.get("datasets") or []) >= 14, "legacy measured-dataset discovery seed unexpectedly small")

inventory = load(INVENTORY)
datasets = inventory.get("datasets") or []
summary = inventory.get("summary") or {}
need(summary.get("datasets") == len(datasets) == 20, f"measured dataset inventory count drifted: {summary.get('datasets')} / {len(datasets)}")
ids = [x.get("datasetId") for x in datasets]
need(len(ids) == len(set(ids)) and all(ids), "measured dataset inventory IDs must be unique and non-empty")
need(summary.get("automatedIngestionAllowed") == sum(1 for x in datasets if x.get("automatedIngestionAllowed") is True), "automated-ingestion dataset count drifted")
need(targets["fully_profiled_measured_datasets"].get("currentDiscovered") == len(datasets), "target ledger discovery count must equal measured-dataset inventory")
for required in ["mendeley-gtnb4j7bfx-v1", "scatimdata-avaps", "su13148102-supplement", "openmms-t4g", "probayes-main-v2", "probayes-doptimal-v1"]:
    need(required in ids, f"accepted measured dataset missing from inventory: {required}")
inv_by_id = {x["datasetId"]: x for x in datasets}
need(inv_by_id["openmms-t4g"].get("peerReviewedCompanion") == "10.3390/s23073569", "OpenMMS corrected companion DOI drifted")
need((inv_by_id["openmms-t4g"].get("count") or {}).get("cycles") == 110, "OpenMMS cycle inventory drifted")
need(inv_by_id["probayes-main-v2"].get("accessState") == "executed-open-profiled", "ProBayes main must remain executed/profiled")
need(inv_by_id["probayes-main-v2"].get("rawRedistributionAllowedWithAttribution") is False, "ProBayes main v2 must not gain an inferred redistribution licence")
need(inv_by_id["probayes-doptimal-v1"].get("accessState") == "executed-open-ccby", "ProBayes d-optimal must remain executed/open")
need("CC-BY" in (inv_by_id["probayes-doptimal-v1"].get("license") or ""), "ProBayes d-optimal EUDAT CC-BY rights statement missing")
need(inv_by_id["pet-preform-v2"].get("accessState") == "profiled-rejected-measured", "PET preform measured-evidence rejection must remain explicit")

# Record-level Mendeley benchmark.
benchmark = load(BENCHMARK)
need(benchmark.get("status") == "completed-public-measured-benchmark", "completed Mendeley public benchmark status missing")
source = benchmark.get("source") or {}
separation = benchmark.get("process_separation") or {}
need(source.get("doi") == "10.17632/gtnb4j7bfx.1", "profiled benchmark DOI drifted")
need(source.get("sha256") == "b231af5d49c0a258b5625d6e2ab2c324c233017c5c010e326a3ca485387ecc9f", "profiled benchmark fingerprint drifted")
need(separation.get("injection_rows_profiled") == 4502 and separation.get("blow_rows_excluded") == 1855, "Mendeley process separation drifted")

# High-resolution scatimdata benchmark.
scatim = load(SCATIM)
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
expected_archive_hashes = {
    "dataset1.zip": "f8c7f6363ecbd541735b374746ce8549aaa50dae754aaaa2efa980c227b19c09",
    "dataset2.zip": "69294087889a52791c296734051d6b21b30847c2859613e4178074182150c491",
    "dataset3.zip": "b6baa4f5f5dbdf0c1bbe23a7b854358967d9004b75de4a16502730a77aed316e",
}
need({a.get("name"): a.get("sha256") for a in scatim.get("archives") or []} == expected_archive_hashes, "scatimdata archive fingerprints drifted")

# Sustainable-material record-level benchmark.
sustainable = load(SUSTAINABLE)
need(sustainable.get("status") == "completed-public-measured-benchmark", "sustainable-material benchmark status missing")
sus_source = sustainable.get("source") or {}
need(sus_source.get("doi") == "10.3390/su13148102", "sustainable-material DOI drifted")
need(sus_source.get("articleLicense") == "CC BY 4.0", "sustainable-material licence drifted")
need((sustainable.get("archive") or {}).get("sha256") == "b546abea4eb9f14b6736dec415dc43c00240965b91de4c7ca92b2494321c6ace", "sustainable-material archive fingerprint drifted")
member = (sustainable.get("archive") or {}).get("member") or {}
need(member.get("sha256") == "8c46e9697d5b2d849d041bc47f60ab629f57538dcaedc13b9e1b80eeeeabd01d", "sustainable-material CSV fingerprint drifted")
need(member.get("dataRows") == 955 and member.get("physicalColumns") == 45 and member.get("missingCells") == 0, "sustainable-material file structure drifted")
recon = sustainable.get("publishedVsObservedStructure") or {}
need(recon.get("publishedAnalyticalColumns") == 42 and recon.get("observedAnalyticalColumnsAfterIndexExclusion") == 42, "sustainable-material 42-column reconciliation drifted")
need(len(sustainable.get("materials") or []) == 5, "sustainable-material grade count drifted")

# OpenMMS measured-health benchmark.
openmms = load(OPENMMS)
need(openmms.get("status") == "completed-public-measured-timeseries-benchmark", "OpenMMS benchmark status missing")
oms = openmms.get("source") or {}
need(oms.get("commit") == "cfa6e23c7fc02a645e31e06d299021cb0a3ce3e7", "OpenMMS pinned source commit drifted")
need(oms.get("peerReviewedCompanion") == "10.3390/s23073569", "OpenMMS companion DOI drifted")
omfile = openmms.get("file") or {}
need(omfile.get("sha256") == "aa78e659bc4b7a0361882d2eaa516a0010bfb573d413a3600baad98aae397bf6", "OpenMMS file fingerprint drifted")
need(omfile.get("dataRows") == 29_808 and omfile.get("columns") == 12 and omfile.get("missingCells") == 0, "OpenMMS source structure drifted")
need((openmms.get("experimentalContext") or {}).get("cycles", {}).get("totalContinuouslyRecorded") == 110, "OpenMMS study cycle count drifted")
need(openmms.get("acceptedMeasuredTimeSeriesSamples") == 298_080, "OpenMMS accepted sample count drifted")
need(len((openmms.get("channelSemantics") or {}).get("measuredChannels") or []) == 10, "OpenMMS physical channel count drifted")

# ProBayes main v2: exact public source, real cycle rows, mixed physical/derived schema.
pro_main = load(PROBAYES_MAIN)
need(pro_main.get("status") == "completed-public-measured-benchmark", "ProBayes main benchmark status missing")
pm_source = pro_main.get("source") or {}
pm_file = pro_main.get("file") or {}
pm_struct = pro_main.get("publishedVsObservedStructure") or {}
pm_schema = pro_main.get("schemaInspection") or {}
pm_measure = pro_main.get("measurementBoundary") or {}
need(pm_source.get("doi") == "10.23728/b2share.4c5692b886db419180f716acf895bf06", "ProBayes main DOI drifted")
need(pm_source.get("version") == "v2" and pm_source.get("recordAccess") == "Dataset Open", "ProBayes main access/version drifted")
need(pm_source.get("licenseOnCurrentB2shareRecordPage") is None, "Do not invent a current-v2 ProBayes main licence value")
need(pm_file.get("md5") == "f04efe419e63db5fb4a392e1569ea417", "ProBayes main published MD5 drifted")
need(pm_file.get("sha256") == "009d64ae4d77d2ed2de817c7d921d2c5ca58065f62b2680ededdf6b5576468bd", "ProBayes main SHA-256 drifted")
need(pm_file.get("sizeBytes") == 89_409_728 and pm_file.get("parquetRows") == 564, "ProBayes main file size/row count drifted")
need(pm_struct.get("publishedFeatures") == 334 and pm_struct.get("observedArrowTopLevelFields") == 364 and pm_struct.get("featureCountDiscrepancy") == 30, "ProBayes main 334-vs-364 reconciliation drifted")
need(pm_schema.get("listTimeSeriesFields") == 143 and pm_schema.get("scalarFields") == 221, "ProBayes main list/scalar schema drifted")
need((pro_main.get("experimentalContext") or {}).get("experimentalPoints") == 47, "ProBayes main DoE count drifted")
need(pm_measure.get("acceptedMeasuredCycles") == 564 and pm_measure.get("acceptedMeasuredTimeSeriesSamples") == 0, "ProBayes main conservative measurement boundary drifted")
need(pm_measure.get("rawSourceRowsCommitted") is False and pm_measure.get("rawSourceRedistributed") is False, "ProBayes main raw-data boundary drifted")
need("SIM_*" in pm_schema.get("derivedAndNonMeasured", "") and "CALC_*" in pm_schema.get("derivedAndNonMeasured", ""), "ProBayes main simulation/calculated separation missing")

# ProBayes d-optimal v1: exact source, exact 396-field reconciliation, CC-BY/openAccess metadata.
pro_dopt = load(PROBAYES_DOPT)
pd_source = pro_dopt.get("source") or {}
pd_file = pro_dopt.get("file") or {}
pd_struct = pro_dopt.get("publishedVsObservedStructure") or {}
pd_schema = pro_dopt.get("schemaInspection") or {}
pd_measure = pro_dopt.get("measurementBoundary") or {}
need(pro_dopt.get("status") == "completed-public-measured-benchmark", "ProBayes d-optimal benchmark status missing")
need(pd_source.get("doi") == "10.23728/b2share.3f80952ce5ff4be88ae4cf6a3bdfe732", "ProBayes d-optimal DOI drifted")
need(pd_source.get("version") == "v1" and pd_source.get("recordAccess") == "Dataset Open" and pd_source.get("openAccess") is True, "ProBayes d-optimal access/version drifted")
need("CC-BY" in pd_source.get("license", ""), "ProBayes d-optimal EUDAT rights statement missing")
need(pd_file.get("md5") == "913cb30061ba35b78cc7715799674783", "ProBayes d-optimal published MD5 drifted")
need(pd_file.get("sha256") == "f2bcef655df1dc1d283a752bbf7f55d5877bb9638b4901f9569df567a68b40b9", "ProBayes d-optimal SHA-256 drifted")
need(pd_file.get("sizeBytes") == 62_365_198 and pd_file.get("parquetRows") == 303, "ProBayes d-optimal file size/row count drifted")
need(pd_struct.get("publishedFeatures") == 396 and pd_struct.get("observedArrowTopLevelFields") == 396 and pd_struct.get("featuresReconcile") is True, "ProBayes d-optimal 396-field reconciliation drifted")
need(pd_schema.get("listTimeSeriesFields") == 212 and pd_schema.get("scalarFields") == 184, "ProBayes d-optimal list/scalar schema drifted")
need((pro_dopt.get("experimentalContext") or {}).get("experimentalPoints") == 28, "ProBayes d-optimal DoE count drifted")
need(pd_measure.get("acceptedMeasuredCycles") == 303 and pd_measure.get("acceptedMeasuredTimeSeriesSamples") == 0, "ProBayes d-optimal conservative measurement boundary drifted")
need(pd_measure.get("rawSourceRowsCommitted") is False and pd_measure.get("rawSourceRedistributed") is False, "ProBayes d-optimal raw-data boundary drifted")

# Dedicated accepted measured-dataset registry is the hard-count source of truth.
profiled = load(PROFILED)
profiled_rows = profiled.get("datasets") or []
profiled_summary = profiled.get("summary") or {}
expected_profiled_ids = {
    "mendeley-gtnb4j7bfx-v1",
    "scatimdata-avaps",
    "su13148102-supplement",
    "openmms-t4g",
    "probayes-main-v2",
    "probayes-doptimal-v1",
}
need(len(profiled_rows) == 6, "expected exactly six accepted profiled dataset packages")
need({x.get("datasetId") for x in profiled_rows} == expected_profiled_ids, "profiled dataset registry IDs drifted")
need(profiled_summary.get("fullyProfiledDatasetPackages") == 6, "profiled registry dataset count drifted")
need(profiled_summary.get("recordLevelDatasetPackages") == 2 and profiled_summary.get("timeSeriesDatasetPackages") == 4, "profiled registry type counts drifted")
need(profiled_summary.get("acceptedMeasuredTimeSeriesSamples") == 16_526_432, "profiled registry measured-sample total drifted")
need(sum(int(x.get("acceptedMeasuredTimeSeriesSamples", 0)) for x in profiled_rows) == 16_526_432, "profiled registry sample totals do not reconcile")
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == profiled_summary["fullyProfiledDatasetPackages"], "target ledger profiled-dataset count must match accepted registry")
need(targets["measured_time_series_samples"]["currentAccepted"] == profiled_summary["acceptedMeasuredTimeSeriesSamples"], "target ledger measured-sample count must match accepted registry")

# ProBayes adds real cycle-linked data but intentionally does not inflate the
# scalar-sample ledger until channel-level time bases/units are normalized.
pro_rows = [x for x in profiled_rows if x.get("datasetId", "").startswith("probayes-")]
need(sum(int(x.get("cyclesProfiled", 0)) for x in pro_rows) == 867, "ProBayes accepted real-cycle total drifted")
need(sum(int(x.get("acceptedMeasuredTimeSeriesSamples", 0)) for x in pro_rows) == 0, "ProBayes waveform scalar values must remain uncounted until normalized")

# PET preform stays excluded from measured evidence.
pet = load(PET_PREFORM)
need("reject" in json.dumps(pet).lower() or "simulation" in json.dumps(pet).lower() or "prediction" in json.dumps(pet).lower(), "PET preform rejection/simulation boundary disappeared")

# Publisher-verified literature registry remains separate from dataset profiling.
primary = load(PRIMARY)
ps = primary.get("summary") or {}
verified = ps.get("publisherVerifiedPeerReviewedPrimaryMeasured")
need(verified == 60 and ps.get("uniqueDois") == 60, f"verified primary-measured registry drifted: {ps}")
need(sum(int(p.get("entries", 0)) for p in primary.get("packs") or []) == verified, "primary-measured pack totals do not reconcile")
need(targets["primary_measured_studies"]["currentAccepted"] == verified, "target ledger primary-measured count must match dedicated registry")
need(targets["peer_reviewed_research_records"]["currentAccepted"] == verified, "current audited peer-reviewed master subset must match the 60 verified DOI records")

# Remaining content categories stay conservative until dedicated accepted registries exist.
need(targets["material_profiles"]["currentAccepted"] == 20, "base material count must remain conservative until a dedicated accepted registry supersedes it")
need(targets["defect_mechanisms"]["currentAccepted"] == 20, "base defect count must remain conservative until mechanism records are normalized")
need(targets["sensor_machine_health_concepts"]["currentAccepted"] == 0, "do not infer an accepted sensor/health count from mixed reference cards or drafts")
need(targets["assessment_education_items"]["currentAccepted"] == 157, "accepted learner-item count must match the evidence-gated keyed-question baseline")

rules = " ".join(obj.get("nonCountingRules", [])).lower()
for marker in ["synthetic process-data cases never count", "actual source files", "openalex candidate is not", "generated assessment drafts"]:
    need(marker in rules, f"content-scale non-counting rule missing: {marker}")

report = {
    "schema": 5,
    "version": obj.get("version"),
    "reviewed": obj.get("reviewed"),
    "measuredDatasetDiscovery": {
        "inventoryCount": len(datasets),
        "legacyCatalogSeedCount": len(legacy.get("datasets") or []),
        "fullyProfiledAccepted": profiled_summary.get("fullyProfiledDatasetPackages"),
        "acceptedMeasuredTimeSeriesSamples": profiled_summary.get("acceptedMeasuredTimeSeriesSamples"),
        "automatedIngestionAllowed": summary.get("automatedIngestionAllowed"),
        "embargoedRecords": summary.get("embargoed"),
        "proBayesAcceptedCycles": 867,
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
    "boundary": "No synthetic, metadata-only, generated-draft, simulation/prediction-only or heuristic-candidate evidence is counted as completed measured/reviewed content unless its area-specific acceptance definition is satisfied. ProBayes packages count as fully profiled real measured datasets while their nested waveform scalar values stay outside the measured-sample ledger pending per-channel normalization."
}
(ROOT / "content-scale-targets-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(
    "MouldMaster content-scale target integrity QA passed "
    f"({len(datasets)} measured datasets inventoried; "
    f"{profiled_summary.get('fullyProfiledDatasetPackages')} fully profiled dataset packages; "
    f"{profiled_summary.get('acceptedMeasuredTimeSeriesSamples'):,} accepted real measured time-series samples; "
    "867 accepted ProBayes real cycles; "
    f"{verified} publisher-verified primary measured studies)"
)

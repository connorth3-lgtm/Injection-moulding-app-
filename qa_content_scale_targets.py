from pathlib import Path
import json
import math

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
SKZ_LOKI = RESULTS / "skz-loki-v1.json"
IGUZZINI = RESULTS / "iguzzini-road-lenses-v1.json"
PASCOE = RESULTS / "impure-pascoe-2022-v1.json"
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
expected_targets = {
    "fully_profiled_measured_datasets": (30, 50),
    "measured_time_series_samples": (1_000_000, 5_000_000),
    "material_profiles": (250, 300),
    "defect_mechanisms": (300, 400),
    "sensor_machine_health_concepts": (200, 250),
    "assessment_education_items": (1000, 1500),
    "peer_reviewed_research_records": (1500, 2000),
    "primary_measured_studies": (800, 1000),
}
need(set(targets) == set(expected_targets), "content-scale target areas drifted")
for key, (minimum, preferred) in expected_targets.items():
    rec = targets[key]
    need(rec.get("minimum") == minimum and rec.get("preferred") == preferred, f"{key} target drifted")
    need(isinstance(rec.get("acceptance"), str) and len(rec["acceptance"]) >= 120, f"{key} acceptance definition too weak")
    need(isinstance(rec.get("currentAccepted"), int) and rec["currentAccepted"] >= 0, f"{key} currentAccepted invalid")

legacy = load(LEGACY_CATALOG)
need(len(legacy.get("datasets") or []) >= 14, "legacy dataset seed unexpectedly small")

inventory = load(INVENTORY)
datasets = inventory.get("datasets") or []
summary = inventory.get("summary") or {}
need(summary.get("datasets") == len(datasets) == 20, "measured dataset inventory count drifted")
need(summary.get("automatedIngestionAllowed") == 9, "automated profiling inventory count drifted")
ids = [x.get("datasetId") for x in datasets]
need(all(ids) and len(ids) == len(set(ids)), "measured dataset IDs must be unique")
need(targets["fully_profiled_measured_datasets"].get("currentDiscovered") == 20, "discovered dataset target must match inventory")
inv = {x["datasetId"]: x for x in datasets}
for required in [
    "mendeley-gtnb4j7bfx-v1", "scatimdata-avaps", "su13148102-supplement",
    "openmms-t4g", "probayes-main-v2", "probayes-doptimal-v1",
    "skz-loki-v1", "iguzzini-road-lenses", "impure-pascoe-2022"
]:
    need(required in inv, f"required measured source missing from inventory: {required}")
need(inv["probayes-main-v2"].get("accessState") == "executed-open-profiled", "ProBayes main access state drifted")
need(inv["probayes-main-v2"].get("rawRedistributionAllowedWithAttribution") is False, "ProBayes main raw-rights boundary drifted")
need(inv["probayes-doptimal-v1"].get("accessState") == "executed-open-ccby", "ProBayes d-optimal access state drifted")
need("CC-BY" in (inv["probayes-doptimal-v1"].get("license") or ""), "ProBayes d-optimal CC-BY metadata missing")
need(inv["skz-loki-v1"].get("accessState") == "executed-open-profiled", "SKZ access state drifted")
need(inv["skz-loki-v1"].get("license") is None and inv["skz-loki-v1"].get("rawRedistributionAllowedWithAttribution") is False, "SKZ blank-licence boundary drifted")
need((inv["skz-loki-v1"].get("count") or {}).get("acceptedPhysicalScalarSamples") == 36_000_000, "SKZ inventory sample total drifted")
need(inv["iguzzini-road-lenses"].get("accessState") == "public-research-education-release", "iGuzzini source terms state drifted")
need(inv["iguzzini-road-lenses"].get("rawRedistributionAllowedWithAttribution") is False, "iGuzzini research/education terms must not be widened")
need((inv["iguzzini-road-lenses"].get("count") or {}).get("samples") == 1451, "iGuzzini inventory record count drifted")
need(inv["pet-preform-v2"].get("accessState") == "profiled-rejected-measured", "PET preform rejection must remain explicit")
need(inv["leon-process-20309380"].get("accessState") == "embargoed", "León process embargo drifted")
need(inv["leon-defects-20322729"].get("accessState") == "embargoed", "León defect embargo drifted")

# First public record-level benchmark.
bench = load(BENCHMARK)
need(bench.get("status") == "completed-public-measured-benchmark", "Mendeley benchmark status missing")
need((bench.get("source") or {}).get("doi") == "10.17632/gtnb4j7bfx.1", "Mendeley DOI drifted")
need((bench.get("source") or {}).get("sha256") == "b231af5d49c0a258b5625d6e2ab2c324c233017c5c010e326a3ca485387ecc9f", "Mendeley fingerprint drifted")
need((bench.get("process_separation") or {}).get("injection_rows_profiled") == 4502, "Mendeley injection row count drifted")
need((bench.get("process_separation") or {}).get("blow_rows_excluded") == 1855, "Mendeley process separation drifted")

# scatimdata high-resolution source.
scatim = load(SCATIM)
need(scatim.get("status") == "completed-public-measured-timeseries-benchmark", "scatimdata status missing")
need(scatim.get("acceptedMeasuredTimeSeriesSamples") == 16_228_352, "scatimdata sample count drifted")
need(scatim.get("sampleCountBySignal") == {
    "cavity-pressure": 1_888_256,
    "injection-flow": 7_170_048,
    "injection-pressure": 7_170_048,
}, "scatimdata physical-signal split drifted")
need((scatim.get("observedSourceStructure") or {}).get("pointsPerCurveInDownloadedMatrices") == 2048, "scatimdata curve length drifted")
need({a.get("name"): a.get("sha256") for a in scatim.get("archives") or []} == {
    "dataset1.zip": "f8c7f6363ecbd541735b374746ce8549aaa50dae754aaaa2efa980c227b19c09",
    "dataset2.zip": "69294087889a52791c296734051d6b21b30847c2859613e4178074182150c491",
    "dataset3.zip": "b6baa4f5f5dbdf0c1bbe23a7b854358967d9004b75de4a16502730a77aed316e",
}, "scatimdata archive fingerprints drifted")

# Sustainable-material measured DOE.
sus = load(SUSTAINABLE)
need(sus.get("status") == "completed-public-measured-benchmark", "sustainable-material status missing")
need((sus.get("source") or {}).get("doi") == "10.3390/su13148102", "sustainable-material DOI drifted")
need((sus.get("archive") or {}).get("sha256") == "b546abea4eb9f14b6736dec415dc43c00240965b91de4c7ca92b2494321c6ace", "sustainable archive fingerprint drifted")
sus_member = (sus.get("archive") or {}).get("member") or {}
need(sus_member.get("sha256") == "8c46e9697d5b2d849d041bc47f60ab629f57538dcaedc13b9e1b80eeeeabd01d", "sustainable CSV fingerprint drifted")
need(sus_member.get("dataRows") == 955 and sus_member.get("physicalColumns") == 45 and sus_member.get("missingCells") == 0, "sustainable CSV structure drifted")
need((sus.get("publishedVsObservedStructure") or {}).get("observedAnalyticalColumnsAfterIndexExclusion") == 42, "sustainable 42-vs-45 reconciliation drifted")
need(len(sus.get("materials") or []) == 5, "sustainable material count drifted")

# OpenMMS measured machine-health source.
openmms = load(OPENMMS)
need(openmms.get("status") == "completed-public-measured-timeseries-benchmark", "OpenMMS status missing")
need((openmms.get("source") or {}).get("commit") == "cfa6e23c7fc02a645e31e06d299021cb0a3ce3e7", "OpenMMS pinned commit drifted")
need((openmms.get("source") or {}).get("peerReviewedCompanion") == "10.3390/s23073569", "OpenMMS companion DOI drifted")
need((openmms.get("file") or {}).get("sha256") == "aa78e659bc4b7a0361882d2eaa516a0010bfb573d413a3600baad98aae397bf6", "OpenMMS fingerprint drifted")
need((openmms.get("file") or {}).get("dataRows") == 29_808 and (openmms.get("file") or {}).get("columns") == 12, "OpenMMS structure drifted")
need(openmms.get("acceptedMeasuredTimeSeriesSamples") == 298_080, "OpenMMS sample count drifted")
need(len((openmms.get("channelSemantics") or {}).get("measuredChannels") or []) == 10, "OpenMMS physical channel count drifted")

# ProBayes sources: real cycles accepted, nested waveform values deliberately not counted yet.
pro_main = load(PROBAYES_MAIN)
pm_file = pro_main.get("file") or {}
pm_struct = pro_main.get("publishedVsObservedStructure") or {}
pm_schema = pro_main.get("schemaInspection") or {}
pm_measure = pro_main.get("measurementBoundary") or {}
need(pro_main.get("status") == "completed-public-measured-benchmark", "ProBayes main status missing")
need(pm_file.get("md5") == "f04efe419e63db5fb4a392e1569ea417", "ProBayes main MD5 drifted")
need(pm_file.get("sha256") == "009d64ae4d77d2ed2de817c7d921d2c5ca58065f62b2680ededdf6b5576468bd", "ProBayes main SHA-256 drifted")
need(pm_file.get("parquetRows") == 564 and pm_struct.get("publishedFeatures") == 334 and pm_struct.get("observedArrowTopLevelFields") == 364, "ProBayes main 334-vs-364 reconciliation drifted")
need(pm_schema.get("listTimeSeriesFields") == 143 and pm_measure.get("acceptedMeasuredCycles") == 564 and pm_measure.get("acceptedMeasuredTimeSeriesSamples") == 0, "ProBayes main measurement boundary drifted")

pro_d = load(PROBAYES_DOPT)
pd_file = pro_d.get("file") or {}
pd_struct = pro_d.get("publishedVsObservedStructure") or {}
pd_schema = pro_d.get("schemaInspection") or {}
pd_measure = pro_d.get("measurementBoundary") or {}
need(pro_d.get("status") == "completed-public-measured-benchmark", "ProBayes d-optimal status missing")
need(pd_file.get("md5") == "913cb30061ba35b78cc7715799674783", "ProBayes d-optimal MD5 drifted")
need(pd_file.get("sha256") == "f2bcef655df1dc1d283a752bbf7f55d5877bb9638b4901f9569df567a68b40b9", "ProBayes d-optimal SHA-256 drifted")
need(pd_file.get("parquetRows") == 303 and pd_struct.get("publishedFeatures") == 396 and pd_struct.get("observedArrowTopLevelFields") == 396, "ProBayes d-optimal schema reconciliation drifted")
need(pd_schema.get("listTimeSeriesFields") == 212 and pd_measure.get("acceptedMeasuredCycles") == 303 and pd_measure.get("acceptedMeasuredTimeSeriesSamples") == 0, "ProBayes d-optimal measurement boundary drifted")

# SKZ LoKI: direct pressure only; time and calculated pressure difference excluded.
skz = load(SKZ_LOKI)
need(skz.get("status") == "completed-public-measured-timeseries-benchmark", "SKZ benchmark status missing")
need((skz.get("source") or {}).get("license") is None, "SKZ current blank licence must remain explicit")
files = skz.get("files") or {}
need((files.get("quality") or {}).get("md5") == "4078fb85d2586bc3dd03d4a0825ff74d", "SKZ quality MD5 drifted")
need((files.get("machine") or {}).get("md5") == "384b1ee87679fa4b52b78e842a83cd99", "SKZ machine MD5 drifted")
need((files.get("viscometer") or {}).get("md5") == "d37a69bacfbdbe5d7bac9339dfdd94be", "SKZ pressure MD5 drifted")
obs = (skz.get("observedStructure") or {}).get("viscometerPressure") or {}
need(obs.get("rows") == 18_000_000 and obs.get("columns") == 6, "SKZ pressure structure drifted")
need(obs.get("cyclesWithPressure") == 60 and obs.get("rowsPerPressureCycle") == 300_000, "SKZ pressure cycle coverage drifted")
need(math.isclose(float(obs.get("observedApproxRateHz")), 10_000, rel_tol=1e-6), "SKZ observed pressure rate drifted")
direct = obs.get("directPhysicalChannels") or []
need(len(direct) == 2 and sum(int(x.get("samples", 0)) for x in direct) == 36_000_000, "SKZ direct pressure sample count drifted")
need(skz.get("acceptedMeasuredTimeSeriesSamples") == 36_000_000, "SKZ accepted sample total drifted")
need(skz.get("rawSourceRowsCommitted") is False and skz.get("rawSourceRedistributed") is False, "SKZ raw-data boundary drifted")

# iGuzzini real-production record-level dataset.
ig = load(IGUZZINI)
ig_source = ig.get("source") or {}
ig_file = ig.get("file") or {}
ig_schema = ig.get("schemaInspection") or {}
ig_quality = ig.get("quality") or {}
need(ig.get("status") == "completed-public-measured-benchmark", "iGuzzini benchmark status missing")
need(ig_source.get("commit") == "41b8f392923d37b50b5098ed918dd2f0de1bc328", "iGuzzini pinned commit drifted")
need(ig_source.get("peerReviewedCompanion") == "10.3390/info13060272", "iGuzzini companion DOI drifted")
need("research and educational" in ig_source.get("releaseTerms", "").lower(), "iGuzzini research/education source terms missing")
need(ig_file.get("gitBlobShaFromPublisherMetadata") == "1ca731e1e80451f6ebf857f3db69bc9f4566d073", "iGuzzini Git blob identity drifted")
need(ig_file.get("sizeBytes") == 127_056 and ig_file.get("sha256") == "c8424a6a47cb793383e19e646212b09f5b63b66147a9397f26fdd8760b6889e0", "iGuzzini file fingerprint drifted")
need(ig_file.get("rows") == 1451 and ig_file.get("columns") == 14 and ig_file.get("missingCells") == 0, "iGuzzini file structure drifted")
need(len(ig_schema.get("processParameterFields") or []) == 13 and ig_schema.get("qualityField") == "quality", "iGuzzini process/quality schema drifted")
need(ig_quality.get("observedLabelCounts") == {"1.0": 370, "2.0": 406, "3.0": 310, "4.0": 365}, "iGuzzini observed quality class counts drifted")
need(ig_quality.get("readmePublishedCountSum") == 1446 and ig_quality.get("observedRows") == 1451, "iGuzzini README-vs-file reconciliation drifted")
need(ig.get("acceptedMeasuredRecords") == 1451 and ig.get("acceptedMeasuredTimeSeriesSamples") == 0, "iGuzzini accepted record/sample boundary drifted")
need(ig.get("rawSourceRowsCommitted") is False and ig.get("rawSourceRedistributed") is False, "iGuzzini raw-data boundary drifted")
need("not specified" in ((ig.get("experimentalContext") or {}).get("material") or "").lower(), "iGuzzini missing-material limitation must remain explicit")

# ImPure/PASCOE 17 May: exact 307-cycle source and quality files, scalar ledger kept conservative.
pascoe = load(PASCOE)
psource = pascoe.get("source") or {}
pverify = pascoe.get("sourceVerification") or {}
pcycle = pascoe.get("cycleCoverage") or {}
pstruct = pascoe.get("observedCycleStructure") or {}
psem = pascoe.get("measurementSemantics") or {}
pquality = pascoe.get("qualityEvidence") or {}
need(pascoe.get("status") == "completed-public-measured-benchmark", "PASCOE benchmark status missing")
need(psource.get("doi") == "10.5281/zenodo.6913660" and psource.get("license") == "CC BY 4.0", "PASCOE source/licence drifted")
need(pverify.get("publisherFiles") == 309 and pverify.get("verifiedFileCount") == 309 and pverify.get("allDownloadedFilesMatchedPublisherMd5") is True, "PASCOE exact-file verification drifted")
need(pverify.get("fingerprintManifestSha256") == "7ccf2279e0906269adce34d2ba6167d6daa86b40ed0ed2f1e811e9d99f1e6655", "PASCOE fingerprint manifest drifted")
need(pcycle.get("acceptedMeasuredCycles") == 307 and pascoe.get("acceptedMeasuredCycles") == 307, "PASCOE accepted cycle count drifted")
need(pstruct.get("all307CycleFilesUseSameHeader") is True and pstruct.get("totalRowsAcrossCycleFiles") == 297_087, "PASCOE cycle structure drifted")
need(pstruct.get("numericSensorChannelsPerRow") == 8 and pstruct.get("totalNumericSensorCellsAcrossCycleFiles") == 2_376_696 and pstruct.get("totalMissingSensorCellsAcrossCycleFiles") == 0, "PASCOE sensor-cell structure drifted")
need(len(psem.get("directNamedChannels") or []) == 6 and psem.get("candidateDirectNamedValuesNotAcceptedAsSamples") == 1_782_522, "PASCOE direct-channel candidate count drifted")
need(psem.get("sourceUnitsExplicitInCycleHeaders") is False and psem.get("sourceTimeBasisNormalized") is False, "PASCOE unit/time non-counting boundary drifted")
need(pascoe.get("acceptedMeasuredTimeSeriesSamples") == 0, "PASCOE must not inflate measured scalar samples before unit/time verification")
need(pquality.get("twoCavityLabelRows") == 386 and pquality.get("dimensionalAndWeightRows") == 772, "PASCOE measured quality-file structure drifted")
need(pascoe.get("rawSourceRowsCommitted") is False and pascoe.get("rawSourceFilesCommitted") is False, "PASCOE raw-data boundary drifted")

# Dedicated accepted dataset registry is the hard count source of truth.
profiled = load(PROFILED)
profiled_rows = profiled.get("datasets") or []
profiled_summary = profiled.get("summary") or {}
expected_profiled_ids = {
    "mendeley-gtnb4j7bfx-v1", "scatimdata-avaps", "su13148102-supplement",
    "openmms-t4g", "probayes-main-v2", "probayes-doptimal-v1",
    "skz-loki-v1", "iguzzini-road-lenses", "impure-pascoe-2022",
}
need(len(profiled_rows) == 9 and {x.get("datasetId") for x in profiled_rows} == expected_profiled_ids, "accepted profiled dataset set drifted")
need(profiled_summary.get("fullyProfiledDatasetPackages") == 9, "profiled dataset count drifted")
need(profiled_summary.get("recordLevelDatasetPackages") == 3 and profiled_summary.get("timeSeriesDatasetPackages") == 6, "profiled dataset type counts drifted")
need(profiled_summary.get("acceptedMeasuredTimeSeriesSamples") == 52_526_432, "profiled registry sample total drifted")
need(sum(int(x.get("acceptedMeasuredTimeSeriesSamples", 0)) for x in profiled_rows) == 52_526_432, "profiled sample totals do not reconcile")
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == 9, "target ledger accepted dataset count drifted")
need(targets["measured_time_series_samples"]["currentAccepted"] == 52_526_432, "target ledger measured-sample total drifted")

# PET remains simulation/prediction-oriented and excluded.
pet_text = json.dumps(load(PET_PREFORM)).lower()
need(any(x in pet_text for x in ["reject", "simulation", "prediction"]), "PET measured-evidence rejection boundary disappeared")

# Literature registry remains independent from dataset profiling.
primary = load(PRIMARY)
ps = primary.get("summary") or {}
verified = ps.get("publisherVerifiedPeerReviewedPrimaryMeasured")
need(verified == 60 and ps.get("uniqueDois") == 60, "verified primary-measured literature count drifted")
need(sum(int(p.get("entries", 0)) for p in primary.get("packs") or []) == 60, "primary-measured evidence pack totals drifted")
need(targets["primary_measured_studies"]["currentAccepted"] == 60, "primary measured target ledger drifted")
need(targets["peer_reviewed_research_records"]["currentAccepted"] == 60, "audited peer-reviewed target ledger drifted")

# Other content areas stay conservative until dedicated accepted registries exist.
need(targets["material_profiles"]["currentAccepted"] == 20, "material accepted count must remain conservative")
need(targets["defect_mechanisms"]["currentAccepted"] == 20, "defect accepted count must remain conservative")
need(targets["sensor_machine_health_concepts"]["currentAccepted"] == 0, "sensor/health accepted count must not be inferred from mixed sources")
need(targets["assessment_education_items"]["currentAccepted"] == 157, "accepted learner-item count drifted")

rules = " ".join(obj.get("nonCountingRules", [])).lower()
for marker in ["synthetic process-data cases never count", "actual source files", "openalex candidate is not", "generated assessment drafts"]:
    need(marker in rules, f"content-scale non-counting rule missing: {marker}")

report = {
    "schema": 7,
    "version": obj.get("version"),
    "reviewed": obj.get("reviewed"),
    "measuredDatasetDiscovery": {
        "inventoryCount": len(datasets),
        "legacyCatalogSeedCount": len(legacy.get("datasets") or []),
        "fullyProfiledAccepted": 9,
        "acceptedMeasuredTimeSeriesSamples": 52_526_432,
        "automatedIngestionAllowed": summary.get("automatedIngestionAllowed"),
        "embargoedRecords": summary.get("embargoed"),
        "proBayesAcceptedCycles": 867,
        "iGuzziniAcceptedRecords": 1451,
        "pascoeAcceptedCycles": 307,
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
        for key in expected_targets
    },
    "boundary": "No synthetic, metadata-only, generated-draft, simulation/prediction-only or heuristic-candidate evidence is counted as completed measured/reviewed content unless its area-specific acceptance definition is satisfied. PASCOE is accepted as 307 real cycle records under CC BY 4.0 but contributes zero accepted waveform scalars until source units/time semantics are verified; RWTH remains uncounted until exact source bytes are obtainable and profiled."
}
(ROOT / "content-scale-targets-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(
    "MouldMaster content-scale target integrity QA passed "
    f"({len(datasets)} measured datasets inventoried; 9 fully profiled dataset packages; "
    "52,526,432 accepted real measured time-series samples; 867 accepted ProBayes cycles; "
    "1,451 accepted iGuzzini real-production records; 307 accepted PASCOE cycles; "
    "60 publisher-verified primary measured studies)"
)

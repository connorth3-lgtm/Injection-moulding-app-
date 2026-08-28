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
SUSTAINABLE = ROOT / "data" / "public-benchmark-results" / "su13148102-v1.json"
OPENMMS = ROOT / "data" / "public-benchmark-results" / "openmms-t4g-v1.json"
PET_PREFORM = ROOT / "data" / "public-benchmark-results" / "vc3k9tt5zj-v2.json"


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
for required_id in ["su13148102-supplement", "openmms-t4g", "pet-preform-v2"]:
    need(required_id in ids, f"measured dataset inventory missing {required_id}")

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

# Sustainable-material hot-runner supplement is accepted at record level.
sustainable = json.loads(SUSTAINABLE.read_text(encoding="utf-8"))
need(sustainable.get("status") == "completed-public-measured-benchmark", "sustainable-material benchmark status missing")
sus_source = sustainable.get("source") or {}
need(sus_source.get("doi") == "10.3390/su13148102", "sustainable-material DOI drifted")
need(sus_source.get("articleLicense") == "CC BY 4.0", "sustainable-material article licence drifted")
need((sustainable.get("archive") or {}).get("sha256") == "b546abea4eb9f14b6736dec415dc43c00240965b91de4c7ca92b2494321c6ace", "sustainable-material archive fingerprint drifted")
member = (sustainable.get("archive") or {}).get("member") or {}
need(member.get("sha256") == "8c46e9697d5b2d849d041bc47f60ab629f57538dcaedc13b9e1b80eeeeabd01d", "sustainable-material CSV fingerprint drifted")
need(member.get("dataRows") == 955 and member.get("physicalColumns") == 45, "sustainable-material observed file dimensions drifted")
need(member.get("missingCells") == 0, "sustainable-material accepted source unexpectedly gained missing cells")
recon = sustainable.get("publishedVsObservedStructure") or {}
need(recon.get("publishedAnalyticalColumns") == 42 and recon.get("observedAnalyticalColumnsAfterIndexExclusion") == 42, "sustainable-material 42-column publication reconciliation drifted")
need(recon.get("extraIndexColumns") == ["Part #", "Material #", "DOE Run #"], "sustainable-material index fields drifted")
need(len(sustainable.get("materials") or []) == 5, "sustainable-material grade count drifted")
need({m.get("grade") for m in sustainable.get("materials") or []} == {"Pro-fax 702", "KWR621-20", "M-Vera GP1025", "W3052D", "Flex-AN 29"}, "sustainable-material grades drifted")
need(sustainable.get("acceptedMeasuredTimeSeriesSamples") == 0, "record-level sustainable-material data must not inflate waveform sample count")
need(sustainable.get("rawSourceRowsCommitted") is False, "sustainable-material profile must not commit third-party raw rows")
acceptance = sustainable.get("acceptance") or {}
need(all(acceptance.get(k) is True for k in [
    "sourceFilesLawfullyObtained", "fingerprinted", "schemaInspected", "unitsReviewed",
    "groupingReviewed", "commandsMeasurementsDerivedAndOutcomesSeparated", "materialContextReviewed",
    "processContextReviewed", "mouldContextReviewed", "machineContextLimitationRecorded",
    "qualityContextReviewed", "limitationsRecorded"
]), "sustainable-material acceptance checklist incomplete")

# OpenMMS is a paper-linked real-world mould-health time series. The accepted
# profile supersedes the legacy inventory's incorrect companion DOI. We require
# the paper-linked commit, exact raw-file fingerprint and ten physical channels.
openmms = json.loads(OPENMMS.read_text(encoding="utf-8"))
need(openmms.get("status") == "completed-public-measured-timeseries-benchmark", "OpenMMS accepted status missing")
om_source = openmms.get("source") or {}
need(om_source.get("commit") == "cfa6e23c7fc02a645e31e06d299021cb0a3ce3e7", "OpenMMS paper-linked source commit drifted")
need(om_source.get("peerReviewedCompanion") == "10.3390/s23073569", "OpenMMS companion DOI must be the injection-mould monitoring paper")
need(om_source.get("repositoryLicense") == "BSD-3-Clause" and om_source.get("articleLicense") == "CC BY 4.0", "OpenMMS licence provenance drifted")
om_file = openmms.get("file") or {}
need(om_file.get("sha256") == "aa78e659bc4b7a0361882d2eaa516a0010bfb573d413a3600baad98aae397bf6", "OpenMMS raw CSV fingerprint drifted")
need(om_file.get("dataRows") == 29_808 and om_file.get("columns") == 12, "OpenMMS raw-file dimensions drifted")
need(om_file.get("headers") == ["t","T1","T2","P","F","Ax","Ay","Az","Gx","Gy","Gz","t2"], "OpenMMS source schema drifted")
need(om_file.get("missingCells") == 0 and om_file.get("allColumnsNumeric") is True, "OpenMMS completeness drifted")
om_context = openmms.get("experimentalContext") or {}
need((om_context.get("cycles") or {}).get("totalContinuouslyRecorded") == 110, "OpenMMS documented cycle count drifted")
need((om_context.get("cycles") or {}).get("normalOperationFirstCycles") == 54, "OpenMMS normal-cycle boundary drifted")
need(om_context.get("publishedAcquisitionRateHz") == 10, "OpenMMS published acquisition-rate context drifted")
channels = ((openmms.get("channelSemantics") or {}).get("measuredChannels") or [])
need(len(channels) == 10 and {c.get("field") for c in channels} == {"T1","T2","P","F","Ax","Ay","Az","Gx","Gy","Gz"}, "OpenMMS physical-channel mapping drifted")
need(sum(int(c.get("scalarSamples", 0)) for c in channels) == 298_080, "OpenMMS channel sample totals do not reconcile")
need(openmms.get("acceptedMeasuredTimeSeriesSamples") == 298_080, "OpenMMS accepted measured-sample count drifted")
need(openmms.get("rawSourceRowsCommitted") is False, "OpenMMS raw rows must not be copied into the app repository")
om_acceptance = openmms.get("acceptance") or {}
need(all(v is True for v in om_acceptance.values()), "OpenMMS acceptance checklist incomplete")

# PET preform Mendeley v2 was lawfully profiled but must remain rejected from
# measured acceptance because the file is a compact CAE/ANN table containing
# simulation/model outputs and predictions rather than a clear raw measured set.
pet = json.loads(PET_PREFORM.read_text(encoding="utf-8"))
need(pet.get("status") == "profiled-not-accepted-as-measured-dataset", "PET preform rejection status drifted")
pet_source = pet.get("source") or {}
need(pet_source.get("doi") == "10.17632/vc3k9tt5zj.2" and pet_source.get("license") == "CC BY 4.0", "PET preform source identity drifted")
pet_file = pet.get("file") or {}
need(pet_file.get("sha256") == "20f6704a93df7638d682b692ae4cb7432ca7d94bbc950ef2bdd0cfc17db124dc", "PET preform file fingerprint drifted")
need(pet_file.get("dataRows") == 27 and pet_file.get("columns") == 26, "PET preform profiled dimensions drifted")
pet_decision = pet.get("acceptanceDecision") or {}
need(pet_decision.get("fullyProfiledForClassification") is True, "PET preform classification profile must remain complete")
need(pet_decision.get("acceptedAsRealMeasuredDataset") is False and pet_decision.get("acceptedMeasuredTimeSeriesSamples") == 0, "PET preform must not enter measured counts")
need(pet.get("rawSourceRowsCommitted") is False, "PET preform raw rows must not be copied into the app repository")

# Dedicated accepted registry is the source of truth for fully profiled dataset
# packages. scatimdata's three constituent datasets count as one source family.
profiled = json.loads(PROFILED.read_text(encoding="utf-8"))
profiled_rows = profiled.get("datasets") or []
profiled_summary = profiled.get("summary") or {}
need(len(profiled_rows) == 4, "expected exactly four accepted profiled dataset packages")
need({x.get("datasetId") for x in profiled_rows} == {"mendeley-gtnb4j7bfx-v1", "scatimdata-avaps", "su13148102-supplement", "openmms-t4g"}, "profiled dataset registry IDs drifted")
need("pet-preform-v2" not in {x.get("datasetId") for x in profiled_rows}, "rejected PET preform candidate must not enter accepted registry")
need(profiled_summary.get("fullyProfiledDatasetPackages") == 4, "profiled registry dataset count drifted")
need(profiled_summary.get("recordLevelDatasetPackages") == 2 and profiled_summary.get("timeSeriesDatasetPackages") == 2, "profiled registry type counts drifted")
need(profiled_summary.get("acceptedMeasuredTimeSeriesSamples") == 16_526_432, "profiled registry measured-sample total drifted")
need(sum(int(x.get("acceptedMeasuredTimeSeriesSamples", 0)) for x in profiled_rows) == 16_526_432, "profiled registry sample totals do not reconcile")
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
    "schema": 5,
    "version": obj.get("version"),
    "reviewed": obj.get("reviewed"),
    "measuredDatasetDiscovery": {
        "inventoryCount": len(datasets),
        "legacyCatalogSeedCount": len(legacy.get("datasets") or []),
        "fullyProfiledAccepted": profiled_summary.get("fullyProfiledDatasetPackages"),
        "acceptedMeasuredTimeSeriesSamples": profiled_summary.get("acceptedMeasuredTimeSeriesSamples"),
        "profiledRejectedCandidates": 1,
        "automatedIngestionAllowed": summary.get("automatedIngestionAllowed"),
        "embargoedRecords": summary.get("embargoed"),
        "provenanceCorrection": "The accepted OpenMMS profile uses DOI 10.3390/s23073569. The older inventory entry's s23031198 association is superseded and must not be used for evidence promotion."
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
    "boundary": "No synthetic, metadata-only, generated-draft or heuristic-candidate evidence is counted as completed measured/reviewed content unless its area-specific acceptance definition is satisfied. Profiling a candidate may result in explicit rejection rather than promotion."
}
(ROOT / "content-scale-targets-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"MouldMaster content-scale target integrity QA passed ({len(datasets)} measured datasets inventoried; {profiled_summary.get('fullyProfiledDatasetPackages')} fully profiled dataset packages; {profiled_summary.get('acceptedMeasuredTimeSeriesSamples'):,} accepted real measured time-series samples; {verified} publisher-verified primary measured studies; PET simulation/ANN candidate remains rejected)")

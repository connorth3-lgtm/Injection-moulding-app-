from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
TARGETS = ROOT / "data" / "content-scale-targets.json"
LEGACY_CATALOG = ROOT / "data" / "measured-dataset-catalog.json"
INVENTORY = ROOT / "data" / "measured-dataset-inventory-v1.json"
RIGHTS_REVIEW = ROOT / "data" / "measured-dataset-rights-review-2026-08-29.json"
PRIMARY = ROOT / "data" / "primary-measured-evidence-registry-v1.json"
BENCHMARK_RECORD = ROOT / "data" / "public-benchmark-results" / "gtnb4j7bfx-v1.json"
BENCHMARK_AVAPS = ROOT / "data" / "public-benchmark-results" / "scatimdata-avaps-v1.json"
BENCHMARK_OPENMMS = ROOT / "data" / "public-benchmark-results" / "openmms-t4g-v1.json"
BENCHMARK_SU = ROOT / "data" / "public-benchmark-results" / "su13148102-supplement-v1.json"
BENCHMARK_IGUZZINI = ROOT / "data" / "public-benchmark-results" / "iguzzini-road-lenses-v1.json"
BENCHMARK_FORINFPRO = ROOT / "data" / "public-benchmark-results" / "forinfpro-himd-v1.json"
REVIEW_PET = ROOT / "data" / "public-benchmark-results" / "pet-preform-v2.json"
REVIEW_WARWICK = ROOT / "data" / "public-benchmark-results" / "warwick-demoulding-v2.json"
REVIEW_RWTH = ROOT / "data" / "public-benchmark-results" / "rwth-pcr-2025-v1.json"


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

legacy = json.loads(LEGACY_CATALOG.read_text(encoding="utf-8"))
need(len(legacy.get("datasets") or []) >= 14, "legacy measured-dataset discovery seed unexpectedly small")
inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
datasets = inventory.get("datasets") or []
summary = inventory.get("summary") or {}
need(summary.get("datasets") == len(datasets) == 20, f"measured dataset inventory count drifted: {summary.get('datasets')} / {len(datasets)}")
ids = [x.get("datasetId") for x in datasets]
need(len(ids) == len(set(ids)) and all(ids), "measured dataset inventory IDs must be unique and non-empty")
need(summary.get("automatedIngestionAllowed") == sum(1 for x in datasets if x.get("automatedIngestionAllowed") is True), "automated-ingestion dataset count drifted")
need(summary.get("automatedIngestionAllowed") == 10, "audited automated-ingestion source count must include four confirmed waveform-source promotions")
need(summary.get("rightsOrAccessReviewRequired") == 3, "rights-review source count must reflect Zenodo API licence confirmations")
need(targets["fully_profiled_measured_datasets"].get("currentDiscovered") == len(datasets), "target ledger discovery count must equal the measured-dataset inventory")
by_id = {x.get("datasetId"): x for x in datasets}

rights = json.loads(RIGHTS_REVIEW.read_text(encoding="utf-8"))
need((rights.get("summary") or {}).get("sourcesReviewed") == 5, "waveform rights-review source count drifted")
need((rights.get("summary") or {}).get("unblockedForAutomatedIngestion") == 4, "waveform rights-review unblocked count drifted")
rights_by_id = {x.get("datasetId"): x for x in rights.get("sources") or []}
need(rights_by_id["rwth-pcr-2025"].get("decision") == "executable-license-confirmed" and rights_by_id["rwth-pcr-2025"].get("license") == "CC BY 4.0", "RWTH rights decision drifted")
need(by_id["rwth-pcr-2025"].get("license") == "CC BY 4.0" and by_id["rwth-pcr-2025"].get("automatedIngestionAllowed") is True, "RWTH inventory execution rights drifted")
for blocked_id in ["skz-loki-v1"]:
    need(rights_by_id[blocked_id].get("decision") == "blocked-no-explicit-license", f"{blocked_id} rights decision drifted")
    need(by_id[blocked_id].get("license") is None and by_id[blocked_id].get("automatedIngestionAllowed") is False, f"{blocked_id} must remain non-executable without explicit data licence")

impure_count = by_id["impure-pascoe-2022"].get("count") or {}
need(impure_count.get("publisherFilesTotalMB") == 18.7, "ImPure publisher file-set size correction drifted")
need(impure_count.get("zenodoCumulativeDownloadTrafficMB") == 605.2, "ImPure Zenodo traffic metric drifted")
need("dataVolumeMB" not in impure_count, "ImPure must not mislabel cumulative download traffic as source-data size")
need(by_id["inqcim-2500-request"].get("source") == "https://doi.org/10.3390/polym14173551", "INQCIM corrected DOI drifted")
need(by_id["inqcim-2500-request"].get("peerReviewedCompanion") == "10.3390/polym14173551", "INQCIM companion DOI drifted")
need(by_id["leon-defects-20322729"].get("overlapGroup") == by_id["leon-process-20309380"].get("overlapGroup"), "León defect/process campaign must remain one overlap group")
need(rights_by_id["forinfpro-himd-v1"].get("decision") == "executable-license-confirmed", "FORinFPRO rights promotion drifted")
need(by_id["forinfpro-himd-v1"].get("license") == "CC BY 4.0" and by_id["forinfpro-himd-v1"].get("automatedIngestionAllowed") is True, "FORinFPRO inventory execution rights drifted")
for promoted_id in ["impure-pascoe-2022", "cross-process-chain-17240390"]:
    need(rights_by_id[promoted_id].get("decision") == "executable-license-confirmed", f"{promoted_id} rights promotion drifted")
    need(by_id[promoted_id].get("license") == "CC BY 4.0" and by_id[promoted_id].get("automatedIngestionAllowed") is True, f"{promoted_id} inventory execution rights drifted")

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

su = json.loads(BENCHMARK_SU.read_text(encoding="utf-8"))
need(su.get("status") == "completed-public-measured-benchmark", "Sustainability supplement benchmark status missing")
need((su.get("source") or {}).get("sha256") == "b546abea4eb9f14b6736dec415dc43c00240965b91de4c7ca92b2494321c6ace", "Sustainability supplement fingerprint drifted")
need((su.get("profile") or {}).get("rows") == 955 and (su.get("profile") or {}).get("columns") == 45, "Sustainability supplement delivered schema drifted")
need((su.get("profile") or {}).get("paperReleaseColumnDelta") == 3, "Sustainability supplement paper/release discrepancy missing")
need((su.get("profile") or {}).get("countsAsTimeSeriesSamples") is False, "record-level supplement must not inflate time-series values")

iguzzini = json.loads(BENCHMARK_IGUZZINI.read_text(encoding="utf-8"))
ig_source = iguzzini.get("source") or {}
ig_profile = iguzzini.get("profile") or {}
ig_acceptance = iguzzini.get("acceptance") or {}
need(iguzzini.get("status") == "accepted-restricted-profile", "iGuzzini restricted accepted state drifted")
need(ig_source.get("pinnedCommit") == "41b8f392923d37b50b5098ed918dd2f0de1bc328", "iGuzzini pinned source drifted")
need(ig_source.get("gitBlobSha") == "1ca731e1e80451f6ebf857f3db69bc9f4566d073", "iGuzzini source blob drifted")
need(ig_source.get("sha256") == "c8424a6a47cb793383e19e646212b09f5b63b66147a9397f26fdd8760b6889e0", "iGuzzini source fingerprint drifted")
need(ig_source.get("useScope") == "research-and-education-only" and ig_source.get("rawRedistributionAllowed") is False, "iGuzzini restricted-use boundary drifted")
need(ig_profile.get("rows") == 1451 and ig_profile.get("columns") == 14 and ig_profile.get("processFeatureCount") == 13, "iGuzzini delivered dimensions drifted")
need(ig_profile.get("recordLevelMeasuredProcessValues") == 18_863, "iGuzzini record-level measured value count drifted")
need(ig_profile.get("deliveredQualityCounts") == {"1": 370, "2": 406, "3": 310, "4": 365}, "iGuzzini delivered quality counts drifted")
need(ig_profile.get("publisherReportedQualityCountSum") == 1446 and ig_profile.get("deliveredQualityCountSum") == 1451, "iGuzzini README/release reconciliation drifted")
need(ig_profile.get("deliveredMinusReportedByClass") == {"1": 0, "2": 0, "3": 0, "4": 5}, "iGuzzini five-row discrepancy must remain localized to class 4")
need(ig_acceptance.get("countsAsFullyProfiledMeasuredDataset") is True and ig_acceptance.get("acceptedMeasuredTimeSeriesSamples") == 0, "iGuzzini acceptance boundary drifted")
need(by_id["iguzzini-road-lenses"].get("restrictedAggregateProfilingAllowed") is True and by_id["iguzzini-road-lenses"].get("automatedIngestionAllowed") is False, "iGuzzini inventory restricted-use gate drifted")

pet = json.loads(REVIEW_PET.read_text(encoding="utf-8"))
warwick = json.loads(REVIEW_WARWICK.read_text(encoding="utf-8"))
rwth = json.loads(REVIEW_RWTH.read_text(encoding="utf-8"))
need(pet.get("status") == "retrieved-profile-needs-semantic-review", "PET review-only state drifted")
need(warwick.get("status") == "retrieved-profile-needs-special-format-export", "Warwick special-format state drifted")
need(all(x.get("publisherHashMatched") is True for x in warwick.get("files") or []) and len(warwick.get("files") or []) == 5, "Warwick file verification drifted")
forinfpro = json.loads(BENCHMARK_FORINFPRO.read_text(encoding="utf-8"))
need(forinfpro.get("status") == "completed-public-measured-benchmark", "FORinFPRO benchmark status missing")
need((forinfpro.get("profile") or {}).get("deliveredCycles") == 1 and (forinfpro.get("profile") or {}).get("namedMachineChannels") == 60, "FORinFPRO delivered profile drifted")
need((forinfpro.get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 0, "unit-limited FORinFPRO values must not inflate measured samples")
need(rwth.get("status") == "retrieval-blocked-non-archive-response", "RWTH retrieval-blocked state drifted")
need((rwth.get("acceptance") or {}).get("countsAsFullyProfiledMeasuredDataset") is False, "RWTH must remain non-counting until real archive profiling passes")
need((rwth.get("acceptance") or {}).get("acceptedMeasuredTimeSeriesSamples") == 0, "RWTH blocked retrieval cannot contribute measured samples")
need(len((rwth.get("source") or {}).get("retrievalAttempts") or []) == 3, "RWTH retrieval attempt audit drifted")
need(all(a.get("sizeBytes") == 248 and a.get("contentType") == "text/html; charset=UTF-8" and a.get("zipStructureValid") is False for a in rwth["source"]["retrievalAttempts"]), "RWTH non-archive response evidence drifted")

accepted_measured_total = av_profile["acceptedMeasuredTimeSeriesSamples"] + om_profile["acceptedMeasuredTimeSeriesSamples"]
need(accepted_measured_total == 13_929_568, "combined real measured-sample arithmetic drifted")
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == 6, "fully profiled measured dataset count must equal five open benchmark families plus one restricted educational profile")
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
    "schema": 5,
    "version": obj.get("version"),
    "reviewed": obj.get("reviewed"),
    "measuredDatasetDiscovery": {
        "inventoryCount": len(datasets),
        "legacyCatalogSeedCount": len(legacy.get("datasets") or []),
        "fullyProfiledAccepted": 6,
        "openOrStandardRepoAccepted": 4,
        "restrictedResearchEducationAccepted": 1,
        "automatedIngestionAllowed": summary.get("automatedIngestionAllowed"),
        "embargoedRecords": summary.get("embargoed"),
    },
    "recordLevelMeasured": {
        "iguzziniRoadLensProcessValues": ig_profile["recordLevelMeasuredProcessValues"],
        "iguzziniRows": ig_profile["rows"],
        "iguzziniProcessFeatures": ig_profile["processFeatureCount"],
        "timeSeriesSamplesContributed": 0,
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
    "boundary": "No synthetic, metadata-only, generated-draft or heuristic-candidate evidence is counted as completed measured/reviewed content unless its area-specific acceptance definition is satisfied. Restricted research/education source terms are preserved rather than widened."
}
(ROOT / "content-scale-targets-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"MouldMaster content-scale target integrity QA passed ({len(datasets)} measured datasets inventoried; 6 fully profiled families including 1 restricted research/education profile; {accepted_measured_total:,} real measured time-series values; {verified} publisher-verified primary measured studies; {summary.get('automatedIngestionAllowed')} sources legally executable)")

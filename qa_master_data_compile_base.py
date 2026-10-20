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
need(expected_profiled == 12, "audited profiled-dataset baseline drifted")
need(expected_samples == 66_521_519, "audited measured-sample baseline drifted")
workflow_text = WORKFLOW.read_text(encoding="utf-8")
need(f"assert c['fullyProfiledMeasuredDatasets']=={expected_profiled}" in workflow_text, "master-data workflow profiled-dataset assertion is stale")
need(f"assert c['measuredTimeSeriesSamplesAccepted']=={expected_samples}" in workflow_text, "master-data workflow measured-sample assertion is stale")
need("assert c['automatedIngestionAllowedDatasets']==14" in workflow_text, "master-data workflow executable-source assertion is stale")

with tempfile.TemporaryDirectory() as td:
    p = subprocess.run([sys.executable, str(COMPILER), "--output-dir", td], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    need(p.returncode == 0, f"master data compiler failed:\n{p.stdout}\n{p.stderr}")
    out = Path(td)
    expected_files = {"manifest.json", "measured-data.json", "research-evidence.json", "app-data-sources.json", "synthetic-process-data.json", "draft-banks.json", "mouldmaster-all-data.json"}
    need(expected_files.issubset({x.name for x in out.iterdir()}), "master data output set incomplete")

    manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
    counts = manifest.get("counts") or {}
    expected = {
        "measuredDatasetInventory": 25,
        "automatedIngestionAllowedDatasets": 14,
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

    for key in ["syntheticIsNotMeasured", "candidateResearchIsNotVerified", "metadataOnlyDatasetIsNotProfiled", "thirdPartyRawRedistributionNotAssumed", "productionSetpointsNotDerived"]:
        need((manifest.get("boundaries") or {}).get(key) is True, f"master compilation boundary missing: {key}")

    measured = json.loads((out / "measured-data.json").read_text(encoding="utf-8"))
    inv = measured["datasetInventory"]
    ledger = measured["datasetExecutionLedger"]
    need(inv["summary"]["datasets"] == 25, "compiled measured dataset inventory drifted")
    need(inv["summary"]["automatedIngestionAllowed"] == 14, "compiled executable measured-source count drifted")
    need(ledger["summary"]["acceptedProfiled"] == expected_profiled, "compiled execution ledger accepted-profiled count drifted")
    need(ledger["summary"]["acceptedRestrictedResearchEducation"] == 2, "compiled restricted accepted profile count drifted")
    need(ledger["summary"]["queuedExecutable"] == 0, "completed licensed profiling sources must not remain queued")
    need(ledger["summary"]["retrievalBlockedExecutable"] == 1, "RWTH retrieval blocker count drifted")
    need((measured.get("datasetRightsReview") or {}).get("summary", {}).get("unblockedForAutomatedIngestion") == 4, "compiled rights-review promotion count drifted")
    need(len(measured["primaryMeasuredStudies"]) == 60, "compiled primary-measured study set incomplete")
    need(len({x["doi"].lower() for x in measured["primaryMeasuredStudies"]}) == 60, "compiled primary-measured study DOI deduplication failed")

    results = measured.get("publicBenchmarkResults") or {}
    need(set(results) == {"gtnb4j7bfx-v1", "scatimdata-avaps", "openmms-t4g", "su13148102-supplement", "forinfpro-himd-v1", "impure-pascoe-2022"}, f"completed public benchmark set drifted: {set(results)}")
    need(all(x.get("status") == "completed-public-measured-benchmark" for x in results.values()), "compiled public benchmark completion state drifted")
    need(results["su13148102-supplement"]["profile"]["rows"] == 955, "compiled Sustainability supplement row count drifted")
    need(results["forinfpro-himd-v1"]["profile"]["deliveredCycles"] == 1, "compiled FORinFPRO release boundary drifted")
    need(results["forinfpro-himd-v1"]["profile"]["acceptedMeasuredTimeSeriesSamples"] == 0, "unit-limited FORinFPRO values must not inflate measured samples")
    need(results["impure-pascoe-2022"]["profile"]["cycleFiles"] == 307, "compiled ImPure profile drifted")

    specialized = measured.get("specializedMeasuredBenchmarkResults") or {}
    need(set(specialized) == {"mendeley-6k8fpbrd9s-v1", "mendeley-4h98rz9f92-v3", "pmc4753395-hdpe-cenosphere-v1", "mendeley-yxz2w7ctnh-v1"}, f"specialized measured benchmark set drifted: {set(specialized)}")
    need((specialized["mendeley-6k8fpbrd9s-v1"].get("profile") or {}).get("deliveredDirectPhysicalValueCells") == 28590, "compiled Wave-2 pvT count drifted")
    need((specialized["mendeley-4h98rz9f92-v3"].get("profile") or {}).get("directMeasuredPropertyValues") == 525, "compiled Wave-2 HDPE/GNP count drifted")
    need((specialized["pmc4753395-hdpe-cenosphere-v1"].get("profile") or {}).get("materialTestTraceValues") == 142884, "compiled Wave-2 material-test count drifted")
    need((specialized["mendeley-yxz2w7ctnh-v1"].get("profile") or {}).get("directRecordLevelInjectionMeasuredValues") == 489, "compiled Wave-2 yxz2 injection mechanical-test count drifted")

    restricted_nc = measured.get("restrictedNoncommercialBenchmarkResults") or {}
    need(set(restricted_nc) == {"mendeley-fhj5p7ww9v-v1"}, f"restricted noncommercial benchmark set drifted: {set(restricted_nc)}")
    need((restricted_nc["mendeley-fhj5p7ww9v-v1"].get("profile") or {}).get("recordLevelMeasuredOutcomeValues") == 96, "compiled Wave-2 restricted outcome count drifted")
    need((restricted_nc["mendeley-fhj5p7ww9v-v1"].get("acceptance") or {}).get("commercialReuseAllowed") is False, "compiled Wave-2 noncommercial boundary drifted")

    restricted = measured.get("restrictedBenchmarkResults") or {}
    need(set(restricted) == {"iguzzini-road-lenses"}, f"restricted accepted benchmark set drifted: {set(restricted)}")
    ig = restricted["iguzzini-road-lenses"]
    need(ig.get("status") == "accepted-restricted-profile", "compiled iGuzzini acceptance state drifted")
    need((ig.get("acceptance") or {}).get("countsAsFullyProfiledMeasuredDataset") is True, "compiled iGuzzini profile must count as fully profiled")
    need((ig.get("acceptance") or {}).get("acceptedMeasuredTimeSeriesSamples") == 0, "iGuzzini record-level evidence cannot inflate waveform samples")
    need((ig.get("source") or {}).get("useScope") == "research-and-education-only", "compiled iGuzzini restricted scope drifted")
    need((ig.get("source") or {}).get("rawRedistributionAllowed") is False, "compiled iGuzzini terms must not be widened")
    need((ig.get("profile") or {}).get("recordLevelMeasuredProcessValues") == 18_863, "compiled iGuzzini record-level value count drifted")
    need((ig.get("profile") or {}).get("deliveredQualityCounts") == {"1": 370, "2": 406, "3": 310, "4": 365}, "compiled iGuzzini class reconciliation drifted")

    review_results = measured.get("publicBenchmarkReviewResults") or {}
    need(set(review_results) == {"pet-preform-v2", "warwick-demoulding", "rwth-pcr-2025", "cross-process-chain-17240390", "cross-process-lower-workpiece-source-contract", "cross-process-upper-workpiece-source-contract"}, "retrieved/review/partial-acceptance result set drifted")
    pet = review_results["pet-preform-v2"]
    need(pet.get("status") == "completed-profiled-zero-measured-simulation-optimization-model-workbook", "PET zero-measured terminal state drifted")
    pet_profile = pet.get("profile") or {}
    need(pet_profile.get("sourceDefinedMeasuredOutcomeColumns") == 0, "compiled PET result must not invent measured outcomes")
    need(pet_profile.get("acceptedMeasuredProcessValues") == 0 and pet_profile.get("acceptedMeasuredQualityValues") == 0 and pet_profile.get("acceptedMeasuredTimeSeriesSamples") == 0, "compiled PET zero-measured boundary drifted")
    need(sum(pet_profile.get(k, -100) for k in ["controlledProcessSettingColumns", "simulationResultColumns", "modelValidationColumns", "annHiddenLayerIntermediateColumns", "annPredictionColumns"]) == 26, "compiled PET semantic groups must account for all 26 columns")
    need(review_results["warwick-demoulding"].get("status") == "retrieved-profile-needs-special-format-export", "Warwick technical export state drifted")
    need(review_results["rwth-pcr-2025"].get("status") == "retrieval-blocked-non-archive-response", "RWTH retrieval blocker state drifted")
    need(review_results["cross-process-chain-17240390"].get("status") == "completed-public-measured-benchmark-scope-limited", "cross-process review state drifted")
    need(review_results["cross-process-lower-workpiece-source-contract"].get("status") == "completed-source-defined-lower-workpiece-profile", "cross-process lower accepted source-contract state drifted")
    need((review_results["cross-process-lower-workpiece-source-contract"].get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 7_426_743, "cross-process lower accepted sample count drifted")
    need(review_results["cross-process-upper-workpiece-source-contract"].get("status") == "completed-source-defined-upper-workpiece-partial-acceptance", "cross-process upper accepted source-contract state drifted")
    need((review_results["cross-process-upper-workpiece-source-contract"].get("profile") or {}).get("upperWorkpieceSerialCsvFilesAccepted") == 10_697, "cross-process upper accepted file count drifted")
    need((review_results["cross-process-upper-workpiece-source-contract"].get("profile") or {}).get("upperWorkpieceRowsAccepted") == 21_907_374, "cross-process upper accepted row count drifted")
    need((review_results["cross-process-upper-workpiece-source-contract"].get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 43_814_748, "cross-process upper accepted sample count drifted")
    need((review_results["rwth-pcr-2025"].get("acceptance") or {}).get("countsAsFullyProfiledMeasuredDataset") is False, "RWTH must remain non-counting")

    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] == 13_631_488, "compiled AVAPS sample count drifted")
    need(results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] == 298_080, "compiled OpenMMS sample count drifted")
    by_id = {x["datasetId"]: x for x in inv["datasets"]}
    impure = by_id["impure-pascoe-2022"]["count"]
    forinfpro_inv = by_id["forinfpro-himd-v1"]["count"]
    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-lower-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-upper-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] + impure.get("acceptedMeasuredTimeSeriesSamples", 0) + forinfpro_inv.get("acceptedMeasuredTimeSeriesSamples", 0) == expected_samples, "compiled measured benchmark sample totals do not reconcile")
    need(impure.get("publisherBytes") == 18_708_850 and impure.get("publisherFiles") == 309 and impure.get("cycleFiles") == 307 and impure.get("zenodoCumulativeDownloadTrafficMB") == 605.2 and "dataVolumeMB" not in impure, "compiled ImPure source dimensions drifted")
    need(impure.get("acceptedMeasuredChannels") == 4 and impure.get("acceptedMeasuredTimeSeriesSamples") == 1_188_348, "compiled ImPure accepted partial-semantic count drifted")
    need(forinfpro_inv.get("acceptedMachineRows") == 10_132 and forinfpro_inv.get("acceptedMeasuredChannels") == 16 and forinfpro_inv.get("acceptedMeasuredTimeSeriesSamples") == 162_112, "compiled FORinFPRO accepted partial-semantic count drifted")
    need(by_id["inqcim-2500-request"]["source"] == "https://doi.org/10.3390/polym14173551", "compiled INQCIM DOI correction drifted")

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

print(f"MouldMaster master data compilation QA passed (25 measured datasets; 14 legally executable sources; {expected_profiled} fully profiled families including 1 restricted educational profile; {expected_samples:,} accepted measured time-series values; 60 verified primary measured studies; 600 evidence passes; 264/19,008 synthetic cases/cycles; 157 approved items; 120+20 lessons; full draft banks)")


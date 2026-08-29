from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "data/public-benchmark-contracts"
RESULTS = ROOT / "data/public-benchmark-results"

def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

def load(path):
    need(path.exists(), f"missing terminal-state dependency: {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))

expected = {
    "probayes-main-v2": ("probayes-main-v2.json", "blocked-rights-review"),
    "probayes-doptimal-v1": ("probayes-doptimal-v1.json", "blocked-rights-review"),
    "skz-loki-v1": ("skz-loki-v1.json", "blocked-rights-review"),
    "impure-pascoe-2022": ("impure-pascoe-2022-v1.json", "accepted-profiled-unit-limited"),
    "iguzzini-road-lenses": ("iguzzini-road-lenses-v1.json", "accepted-restricted-profile"),
    "forinfpro-himd-v1": ("forinfpro-himd-v1.json", "accepted-profiled-unit-limited"),
    "cross-process-chain-17240390": ("cross-process-chain-17240390-v1.json", "profiled-scope-limited-semantic-review"),
    "kamp-injection-7996": ("kamp-injection-7996-v1.json", "blocked-mirror-rights"),
    "foxconn-competition-16600": ("foxconn-competition-16600-v1.json", "blocked-mirror-rights"),
    "warwick-demoulding": ("warwick-demoulding-v2.json", "retrieved-special-format-needs-origin-export"),
    "leon-process-20309380": ("leon-process-20309380-v1.json", "blocked-embargo"),
    "leon-defects-20322729": ("leon-defects-20322729-v1.json", "blocked-embargo"),
    "inqcim-2500-request": ("inqcim-2500-request-v1.json", "blocked-request-only"),
    "bottle-cap-7162-confidential": ("bottle-cap-7162-confidential-v1.json", "blocked-confidential")
}
loaded = {}
for dataset_id, (name, status) in expected.items():
    x = load(CONTRACTS / name)
    need(x.get("datasetId") == dataset_id, f"{dataset_id}: contract id drifted")
    need(x.get("status") == status, f"{dataset_id}: terminal state drifted")
    loaded[dataset_id] = x

for did in ["probayes-main-v2", "probayes-doptimal-v1", "skz-loki-v1"]:
    gate = loaded[did].get("rightsGate") or {}
    need(gate.get("rawFilesMustNotBeDownloadedByAutomationUntilLicenceIsExplicit") is True, f"{did}: raw retrieval fail-closed gate missing")

for did in ["impure-pascoe-2022", "forinfpro-himd-v1", "cross-process-chain-17240390"]:
    source = loaded[did].get("source") or {}
    need(source.get("license") == "CC BY 4.0", f"{did}: confirmed Zenodo licence drifted")
    need(source.get("automatedRetrievalAllowed") is True, f"{did}: licensed source must remain executable")
    need("Zenodo records API" in str(source.get("licenseEvidenceStatus", "")), f"{did}: authoritative licence evidence missing")

cross = loaded["cross-process-chain-17240390"]
need((cross.get("scopeBoundary") or {}).get("screwDrivingStreamsExcludedFromInjectionMeasuredSampleCounts") is True,
     "cross-process downstream screw-driving exclusion missing")

forinfpro_result = load(RESULTS / "forinfpro-himd-v1.json")
need(forinfpro_result.get("status") == "completed-public-measured-benchmark", "FORinFPRO accepted result missing")
need((forinfpro_result.get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 0,
     "FORinFPRO unit-limited profile must not inflate accepted time-series values")

impure_result = load(RESULTS / "impure-pascoe-2022-v1.json")
need(impure_result.get("status") == "completed-public-measured-benchmark", "ImPure completed result missing")
need((impure_result.get("profile") or {}).get("cycleFiles") == 307, "ImPure cycle-file count drifted")
need((impure_result.get("profile") or {}).get("cycleSchemaFamilies") == 1, "ImPure cycle schema drifted")
need((impure_result.get("profile") or {}).get("widthMismatchRows") == 0, "ImPure row-width integrity drifted")

cross_result = load(RESULTS / "cross-process-chain-17240390-v1.json")
need(cross_result.get("status") == "completed-public-measured-benchmark-scope-limited", "cross-process structural profile missing")
need((cross_result.get("source") or {}).get("publisherChecksum") == "md5:069e190338b2ca29f736b21fabf407ba", "cross-process publisher checksum drifted")
need((cross_result.get("profile") or {}).get("injectionScopeMembers") == 15688, "cross-process injection-scope member count drifted")
need((cross_result.get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 0, "cross-process semantic-review profile cannot inflate accepted samples")

for did in ["kamp-injection-7996", "foxconn-competition-16600"]:
    gate = loaded[did]["rightsGate"]
    need(gate.get("rawFilesMustNotBeDownloadedByAutomationUntilOriginalTermsAreCaptured") is True, f"{did}: mirror rights gate missing")
    need(loaded[did]["source"]["automatedRetrievalAllowed"] is False, f"{did}: mirror cannot be executable")

for did in ["leon-process-20309380", "leon-defects-20322729"]:
    x = loaded[did]
    need(x["source"]["license"] == "CC BY 4.0", f"{did}: licence drifted")
    need(x["embargoGate"]["notBefore"] == "2027-12-31", f"{did}: embargo date drifted")
    need(x["embargoGate"]["rawRetrievalBeforeEmbargoEnds"] is False, f"{did}: embargo fail-closed gate missing")

inq = loaded["inqcim-2500-request"]
need(inq["source"]["correctedPeerReviewedDoi"] == "10.3390/polym14173551", "INQCIM DOI correction missing")
need("upon request" in inq["source"]["dataAvailability"], "INQCIM request-only evidence missing")
need(inq["experimentContext"]["doeExperiments"] == 56, "INQCIM DOE count drifted")
need(inq["experimentContext"]["samplesApprox"] == 2500, "INQCIM approximate sample count drifted")

bottle = loaded["bottle-cap-7162-confidential"]
need(bottle["experimentContext"]["productionCycles"] == 7162, "bottle-cap cycle evidence drifted")
need("confidential" in bottle["source"]["dataAvailability"].lower(), "bottle-cap confidentiality statement missing")
need(bottle["confidentialityGate"]["paperReportedCountsMustNotBePresentedAsPossessedData"] is True, "bottle-cap possession boundary missing")

warwick = loaded["warwick-demoulding"]
need(len(warwick["retrievedFiles"]) == 5, "Warwick source-file set drifted")
need(all(len(x["sha256"]) == 64 for x in warwick["retrievedFiles"]), "Warwick source hashes incomplete")
need(warwick["technicalGate"]["acceptedTrialChannelSampleCountsRemainNullUntilExport"] is True, "Warwick cannot accept counts before validated Origin export")

ig = loaded["iguzzini-road-lenses"]
need(ig["source"]["automatedAggregateProfilingAllowedForResearchEducation"] is True, "iGuzzini educational profiling permission missing")
need(ig["source"]["rawRedistributionAllowed"] is False, "iGuzzini terms cannot be widened")
need(ig["experimentContext"]["reportedClassCountDiscrepancy"] == 5, "iGuzzini 1451 vs 1446 reported-count discrepancy must stay explicit")
need(ig["experimentContext"]["deliveredQualityClasses"] == {"1": 370, "2": 406, "3": 310, "4": 365}, "iGuzzini delivered class reconciliation drifted")
ig_result = load(RESULTS / "iguzzini-road-lenses-v1.json")
need(ig_result.get("status") == "accepted-restricted-profile", "iGuzzini committed accepted result missing")
need((ig_result.get("acceptance") or {}).get("countsAsFullyProfiledMeasuredDataset") is True, "iGuzzini must count as fully profiled under restricted educational terms")
need((ig_result.get("acceptance") or {}).get("acceptedMeasuredTimeSeriesSamples") == 0, "iGuzzini cannot inflate high-frequency sample count")

pet = load(RESULTS / "pet-preform-v2.json")
need(pet.get("status") == "retrieved-profile-needs-semantic-review", "PET review-only state drifted")
pet_acceptance = pet.get("acceptance") or {}
need(pet_acceptance.get("countsAsFullyProfiledMeasuredDataset") in {None, False}, "PET must remain non-counting")
need(pet_acceptance.get("acceptedMeasuredTimeSeriesSamples") in {None, 0}, "PET cannot contribute measured time-series samples")
need((pet.get("profile") or {}).get("rawRowsOrCellValuesEmitted") is False, "PET raw-value boundary drifted")

rwth = load(RESULTS / "rwth-pcr-2025-v1.json")
need(rwth.get("status") == "retrieval-blocked-non-archive-response", "RWTH source retrieval terminal state drifted")
need((rwth.get("acceptance") or {}).get("countsAsFullyProfiledMeasuredDataset") is False, "RWTH cannot be accepted without delivered archive")
need(len((rwth.get("source") or {}).get("retrievalAttempts") or []) == 3, "RWTH retrieval audit must retain all three publisher URL attempts")

report = {"schema": 4, "terminalContractsChecked": len(expected), "rightsBlocked": 3, "licensedQueued": 0, "licensedProfiledUnitLimited": 2, "licensedProfiledSemanticReview": 1, "mirrorRightsBlocked": 2, "embargoed": 2, "requestOnly": 1, "confidential": 1, "specialFormatExport": 1, "restrictedEducationAccepted": 1, "rwthRetrievalBlocked": 1, "petReviewOnly": 1, "result": "pass"}
(ROOT / "remaining-dataset-terminal-states-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster remaining dataset terminal-state QA passed (all sources are accepted or have an explicit rights/access/embargo/confidentiality/technical blocker)")


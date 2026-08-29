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
    "impure-pascoe-2022": ("impure-pascoe-2022-v1.json", "blocked-rights-review"),
    "iguzzini-road-lenses": ("iguzzini-road-lenses-v1.json", "restricted-research-education-profile-candidate"),
    "forinfpro-himd-v1": ("forinfpro-himd-v1.json", "blocked-rights-review"),
    "cross-process-chain-17240390": ("cross-process-chain-17240390-v1.json", "blocked-rights-review"),
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

for did in ["probayes-main-v2", "probayes-doptimal-v1", "skz-loki-v1", "impure-pascoe-2022", "forinfpro-himd-v1", "cross-process-chain-17240390"]:
    gate = loaded[did].get("rightsGate") or {}
    need(gate.get("rawFilesMustNotBeDownloadedByAutomationUntilLicenceIsExplicit") is True, f"{did}: raw retrieval fail-closed gate missing")

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

pet = load(RESULTS / "pet-preform-v2.json")
need(pet.get("status") == "retrieved-profile-needs-semantic-review", "PET review-only state drifted")
# PET's v2 result predates the common acceptance object. Treat absence as non-counting,
# and fail if a future record explicitly promotes it or assigns measured time-series samples.
pet_acceptance = pet.get("acceptance") or {}
need(pet_acceptance.get("countsAsFullyProfiledMeasuredDataset") in {None, False}, "PET must remain non-counting")
need(pet_acceptance.get("acceptedMeasuredTimeSeriesSamples") in {None, 0}, "PET cannot contribute measured time-series samples")
need((pet.get("profile") or {}).get("rawRowsOrCellValuesEmitted") is False, "PET raw-value boundary drifted")

report = {"schema": 1, "terminalContractsChecked": len(expected), "rightsBlocked": 6, "mirrorRightsBlocked": 2, "embargoed": 2, "requestOnly": 1, "confidential": 1, "specialFormatExport": 1, "restrictedEducationProfileCandidate": 1, "petReviewOnly": 1, "result": "pass"}
(ROOT / "remaining-dataset-terminal-states-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster remaining dataset terminal-state QA passed (all non-accepted sources explicitly governed)")

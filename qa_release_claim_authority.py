from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data" / "release-claim-authority-v1.json"
VERSION = ROOT / "version.json"

EXPECTED = {
    "realAssistiveTechnologyValidated": "human-assistive-technology-validation",
    "physicalPwaProductionValidated": "physical-device-validation",
    "signedWindowsDistributionValidated": "physical-signed-windows-validation",
    "curriculumSmeReviewed": "human-sme-review",
    "learnerEfficacyObserved": "observed-real-learner-outcomes",
    "siteProductionAccepted": "site-production-acceptance",
    "automaticMachineControlAuthorized": "formal-machine-control-safety-validation",
    "externalAccreditationAwarded": "external-accreditor-award",
}
FORBIDDEN_EVIDENCE_WORDS = {"automated", "synthetic", "modelled", "modeled", "ci-only", "contract-only"}


def need(ok, msg):
    if not ok:
        raise AssertionError(f"release claim authority QA failed: {msg}")


def load(path):
    need(path.is_file(), f"missing {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


manifest = load(MANIFEST)
version = load(VERSION)
need(manifest.get("schemaVersion") == 1, "schemaVersion must be 1")
need(manifest.get("webRelease") == version.get("web_release"), "claim authority must target exact current web release")
need(manifest.get("status") == "release-claims-restricted", "claims must remain restricted unless individually authorized")
boundary = str(manifest.get("boundary") or "").lower()
for marker in ("automated", "synthetic", "physical-device", "sme", "learner-efficacy", "machine-control", "external-accreditation"):
    need(marker in boundary, f"boundary missing {marker}")

claims = manifest.get("claims")
need(isinstance(claims, dict) and set(claims) == set(EXPECTED), "governed claim set drifted")
for claim_name, evidence_type in EXPECTED.items():
    row = claims[claim_name]
    need(isinstance(row, dict), f"{claim_name} must be an object")
    need(row.get("requiredEvidenceType") == evidence_type, f"{claim_name} evidence type drifted")
    need(isinstance(row.get("authorized"), bool), f"{claim_name}.authorized must be boolean")
    status = str(row.get("status") or "")
    need(status, f"{claim_name}.status is required")
    evidence_ref = row.get("evidenceRef")
    if evidence_ref is not None:
        need(isinstance(evidence_ref, str) and evidence_ref.strip(), f"{claim_name}.evidenceRef must be null or non-empty string")
        need((ROOT / evidence_ref).is_file(), f"{claim_name} references missing evidence file {evidence_ref}")
    if row["authorized"]:
        need(status == "validated", f"authorized {claim_name} must have status=validated")
        need(evidence_ref, f"authorized {claim_name} requires a repository evidence reference")
        lowered = evidence_type.lower()
        need(not any(word in lowered for word in FORBIDDEN_EVIDENCE_WORDS), f"{claim_name} uses non-human/non-physical evidence type")
    else:
        need(status != "validated", f"unauthorized {claim_name} must not say validated")

# Machine-control authority is a deliberately stronger invariant than the other claims.
# Enabling it requires a separately reviewed safety architecture, not a manifest edit.
machine = claims["automaticMachineControlAuthorized"]
need(machine.get("authorized") is False and machine.get("status") == "prohibited",
     "automatic machine control must remain prohibited in this advisory application")

psych = manifest.get("syntheticPsychometrics") or {}
need(psych.get("classification") == "qa-only", "synthetic psychometrics must be classified QA-only")
need(psych.get("maySatisfyLearnerEfficacyClaim") is False,
     "synthetic/modelled psychometrics must never satisfy observed learner efficacy")
need("cannot establish observed learner efficacy" in str(psych.get("boundary") or ""),
     "synthetic psychometric boundary is not explicit")

production = manifest.get("productionAuthority") or {}
need(production.get("processDataRole") == "advisory-decision-support-only",
     "process data role must remain advisory decision support")
need(production.get("validatedRecipeAuthority") is False, "validated production recipe authority must remain false")
need(production.get("automaticMachineControl") is False, "automatic machine control authority must remain false")

# Cross-check existing fail-closed evidence contracts so the authority manifest cannot
# declare a stronger state than the underlying governed evidence.
at = load(ROOT / "data" / "accessibility-real-at-validation-v1.json")
if claims["realAssistiveTechnologyValidated"]["authorized"]:
    need(at.get("status") == "validated", "real AT claim requires validated real-AT contract")
else:
    need(at.get("status") != "validated" or claims["realAssistiveTechnologyValidated"]["status"] != "validated",
         "real AT authorization must be explicit even when evidence later validates")

pwa = load(ROOT / "data" / "pwa-physical-device-validation-v1.json")
if claims["physicalPwaProductionValidated"]["authorized"]:
    need(pwa.get("status") in {"validated", "released-with-accepted-ios-risk"},
         "physical PWA production claim requires governed physical-device evidence")

print(
    "MouldMaster release claim authority QA passed "
    "(human/physical/SME/efficacy/site/accreditation claims fail closed; synthetic psychometrics remain QA-only; "
    "process data remains advisory and automatic machine control is prohibited)"
)

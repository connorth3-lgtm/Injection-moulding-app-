from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data" / "release-claim-authority-v1.json"
EXTERNAL = ROOT / "data" / "external-validation-contracts-v1.json"
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
EXTERNAL_CONTRACT_CLAIMS = {
    "signedWindowsDistributionValidated",
    "curriculumSmeReviewed",
    "learnerEfficacyObserved",
    "siteProductionAccepted",
    "externalAccreditationAwarded",
}
FORBIDDEN_EVIDENCE_WORDS = {"automated", "synthetic", "modelled", "modeled", "ci-only", "contract-only"}


def need(ok, msg):
    if not ok:
        raise AssertionError(f"release claim authority QA failed: {msg}")


def load(path):
    need(path.is_file(), f"missing {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


manifest = load(MANIFEST)
external = load(EXTERNAL)
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

# Every outstanding human/operational claim other than the already-specialised AT/PWA
# contracts has a canonical repository record. Pending contracts cannot contain
# pseudo-validation metadata, and any future authorization must be backed by a
# validated row of the same evidence type and exact target version.
need(external.get("schemaVersion") == 1, "external validation contract schema drifted")
need(external.get("webRelease") == version.get("web_release"), "external contracts must target current web release")
need(external.get("desktopRelease") == version.get("desktop_release"), "Windows contract must target current desktop release")
need(external.get("contentVersion") == version.get("content_version"), "SME/accreditation contracts must target current content version")
need(external.get("status") in {"pending-external-validation", "partially-validated", "validated"}, "invalid external contract top-level status")
external_boundary = str(external.get("boundary") or "").lower()
for marker in ("real people", "real devices", "authorised production site", "external accreditor", "synthetic data"):
    need(marker in external_boundary, f"external validation boundary missing {marker}")
contracts = external.get("contracts")
need(isinstance(contracts, dict) and set(contracts) == EXTERNAL_CONTRACT_CLAIMS,
     "external validation contract set drifted")

expected_targets = {
    "signedWindowsDistributionValidated": version.get("desktop_release"),
    "curriculumSmeReviewed": version.get("content_version"),
    "learnerEfficacyObserved": version.get("web_release"),
    "siteProductionAccepted": version.get("web_release"),
    "externalAccreditationAwarded": version.get("content_version"),
}
for claim_name in sorted(EXTERNAL_CONTRACT_CLAIMS):
    authority = claims[claim_name]
    contract = contracts[claim_name]
    need(authority.get("evidenceRef") == "data/external-validation-contracts-v1.json",
         f"{claim_name} must reference canonical external validation contracts")
    need(authority.get("evidenceContractKey") == claim_name,
         f"{claim_name} evidenceContractKey must match claim name")
    need(contract.get("evidenceType") == authority.get("requiredEvidenceType"),
         f"{claim_name} contract evidence type does not match authority manifest")
    need(contract.get("targetVersion") == expected_targets[claim_name],
         f"{claim_name} contract targets the wrong release/content version")
    need(isinstance(contract.get("requiredChecks"), list) and len(contract["requiredChecks"]) >= 5,
         f"{claim_name} must define at least five external validation checks")
    contract_status = contract.get("status")
    need(contract_status in {"pending", "validated"}, f"{claim_name} contract status must be pending or validated")
    metadata = tuple(contract.get(k) for k in ("validatedAt", "validator", "evidenceRef"))
    if contract_status == "pending":
        need(not any(metadata), f"pending {claim_name} contract must not carry pseudo-validation metadata")
        need(authority.get("authorized") is False, f"pending {claim_name} contract cannot authorize the release claim")
    else:
        need(all(metadata), f"validated {claim_name} contract requires dated validator evidence")
        if authority.get("authorized"):
            need(authority.get("status") == "validated", f"authorized {claim_name} must be marked validated")

# Machine-control authority is a deliberately stronger invariant than the other claims.
# Enabling it requires a separately reviewed safety architecture, not a manifest edit.
machine = claims["automaticMachineControlAuthorized"]
need(machine.get("authorized") is False and machine.get("status") == "prohibited",
     "automatic machine control must remain prohibited in this advisory application")
need(machine.get("evidenceRef") is None, "prohibited machine-control authority must not imply an executable validation path")

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

# Cross-check existing specialised fail-closed evidence contracts so the authority
# manifest cannot declare a stronger state than the underlying governed evidence.
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
    "(every external claim has a governed evidence contract; human/physical/SME/efficacy/site/accreditation claims fail closed; "
    "synthetic psychometrics remain QA-only; process data remains advisory and automatic machine control is prohibited)"
)

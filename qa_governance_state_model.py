from __future__ import annotations

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent


def load(path: str) -> dict:
    value = json.loads((ROOT / path).read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise AssertionError(f"{path} must contain a JSON object")
    return value


def state_allowed(model: dict, namespace: str, state: str) -> None:
    allowed = model["namespaces"][namespace]["states"]
    if state not in allowed:
        raise AssertionError(f"{namespace} state {state!r} is outside canonical states {allowed}")


def main() -> None:
    model = load("data/governance-state-model-v1.json")
    version = load("version.json")
    external = load("data/release-external-validation-v1.json")
    book_auth = load("data/book-publication-authorization-v1.json")
    book_sme = load("data/book-sme-review-v1.json")
    curriculum_sme = load("qa/curriculum-semantic-review.json")

    assert model.get("schemaVersion") == 1
    assert external.get("release") == version.get("web_release"), "external-validation contract must bind to current web release"
    assert book_sme.get("release") == version.get("web_release"), "Book SME contract must bind to current web release"
    assert curriculum_sme.get("release") == version.get("web_release"), "curriculum SME contract must bind to current web release"

    state_allowed(model, "technicalAutomation", external["technicalAutomation"]["status"])
    state_allowed(model, "publicationAuthorization", book_auth["status"])
    state_allowed(model, "externalValidation", book_sme["status"])
    state_allowed(model, "externalValidation", external["bookSme"]["status"])
    state_allowed(model, "externalValidation", external["curriculumSme"]["status"])
    state_allowed(model, "externalValidation", external["pwaPhysicalDevices"]["status"])
    state_allowed(model, "externalValidation", external["accessibility"]["status"])
    state_allowed(model, "externalValidation", external["learnerOutcomes"]["status"])
    state_allowed(model, "distributionValidation", external["windowsDistribution"]["status"])
    state_allowed(model, "productionAuthority", external["productionUse"]["status"])

    assert book_auth["status"] == "authorized", "current Book publication authorization changed unexpectedly"
    assert book_sme["status"] == "hold", "independent Book SME status must remain HOLD until real 46/46 human review exists"
    assert book_sme.get("reviews") == [], "current independent Book SME ledger must not contain manufactured approvals"
    assert external["bookSme"]["status"] == book_sme["status"]
    assert external["curriculumSme"]["status"] == "hold", "curriculum SME must remain HOLD until all 120 human reviews exist"
    assert curriculum_sme.get("reviews") == [], "current curriculum SME ledger must not contain manufactured approvals"

    for key in ("pwaPhysicalDevices", "accessibility", "windowsDistribution", "learnerOutcomes"):
        assert external[key]["status"] == "hold", f"{key} must remain HOLD until genuine release-bound evidence exists"

    assert external["productionUse"]["status"] == "advisory-only"
    assert external["productionUse"]["authority"] == "no-automatic-machine-control"

    claims = external.get("claims", {})
    for key in (
        "fullyExternallyValidated",
        "accreditationAuthorized",
        "learnerEfficacyEstablished",
        "productionRecipeValidated",
        "automaticMachineControlAuthorized",
    ):
        assert claims.get(key) is False, f"premature governed claim became true: {key}"

    current = model["currentPublicBoundary"]
    expected = {
        "technicalAutomation": external["technicalAutomation"]["status"],
        "bookPublicationAuthorization": book_auth["status"],
        "bookIndependentSme": book_sme["status"],
        "curriculumIndependentSme": external["curriculumSme"]["status"],
        "physicalPwa": external["pwaPhysicalDevices"]["status"],
        "assistiveTechnology": external["accessibility"]["status"],
        "windowsDistribution": external["windowsDistribution"]["status"],
        "learnerOutcomes": external["learnerOutcomes"]["status"],
        "productionAuthority": external["productionUse"]["status"],
    }
    assert current == expected, f"canonical state snapshot drifted from governed contracts: {current!r} != {expected!r}"

    invariant_ids = {row.get("id") for row in model.get("invariants", []) if isinstance(row, dict)}
    required = {
        "automation-does-not-create-external-evidence",
        "publication-is-not-independent-validation",
        "holds-are-not-test-failures",
        "external-evidence-is-release-bound",
        "production-authority-fails-closed",
        "claims-derive-from-evidence",
        "human-review-cannot-be-synthetic",
    }
    assert invariant_ids == required, "canonical governance invariants changed without an explicit model revision"

    print("MouldMaster canonical governance state-model QA passed")


if __name__ == "__main__":
    main()

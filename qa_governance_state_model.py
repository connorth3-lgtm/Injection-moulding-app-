from __future__ import annotations

from copy import deepcopy
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


def validate_model_shape(model: dict) -> None:
    assert model.get("schemaVersion") == 1
    namespaces = model.get("namespaces")
    transitions = model.get("transitions")
    assert isinstance(namespaces, dict) and namespaces
    assert isinstance(transitions, dict)
    assert set(transitions) == set(namespaces), "every canonical namespace must define transitions"

    for namespace, definition in namespaces.items():
        states = definition.get("states")
        assert isinstance(states, list) and states and len(states) == len(set(states)), f"{namespace}: invalid/duplicate states"
        rows = transitions[namespace]
        assert isinstance(rows, list) and rows, f"{namespace}: transition list must be non-empty"
        seen = set()
        for row in rows:
            assert isinstance(row, dict)
            source = row.get("from")
            target = row.get("to")
            requires = str(row.get("requires") or "").strip()
            assert source == "*" or source in states, f"{namespace}: transition source {source!r} is not a canonical state"
            assert target in states, f"{namespace}: transition target {target!r} is not a canonical state"
            assert source != target, f"{namespace}: self-transitions are not canonical lifecycle changes"
            assert requires, f"{namespace}: transition {source}->{target} must state its evidence/condition"
            key = (source, target)
            assert key not in seen, f"{namespace}: duplicate transition {key}"
            seen.add(key)

    forbidden = model.get("forbiddenCombinations")
    assert isinstance(forbidden, list) and forbidden
    ids = [row.get("id") for row in forbidden if isinstance(row, dict)]
    assert len(ids) == len(forbidden) == len(set(ids)), "forbidden-combination IDs must be unique"
    for row in forbidden:
        assert isinstance(row.get("when"), dict) and row["when"], f"{row.get('id')}: missing when condition"
        assert str(row.get("forbiddenUnless") or "").strip(), f"{row.get('id')}: missing fail-closed exception condition"


def validate_public_snapshot(snapshot: dict, *, book_sme: dict, curriculum_sme: dict, external: dict) -> None:
    if snapshot.get("bookIndependentSme") == "validated" and len(book_sme.get("reviews") or []) < 46:
        raise AssertionError("Book SME cannot be validated without genuine accepted human reviews for all 46 chapters")
    if snapshot.get("curriculumIndependentSme") == "validated" and len(curriculum_sme.get("reviews") or []) < 120:
        raise AssertionError("curriculum SME cannot be validated without genuine accepted human reviews for all 120 lessons")
    if snapshot.get("physicalPwa") == "validated" and external.get("pwaPhysicalDevices", {}).get("status") != "validated":
        raise AssertionError("physical PWA status cannot outrun the release-bound evidence contract")
    if snapshot.get("assistiveTechnology") == "validated" and external.get("accessibility", {}).get("status") != "validated":
        raise AssertionError("assistive-technology status cannot outrun the release-bound evidence contract")
    if snapshot.get("windowsDistribution") == "validated" and external.get("windowsDistribution", {}).get("status") != "validated":
        raise AssertionError("Windows distribution status cannot outrun signed/platform/physical evidence")
    if snapshot.get("learnerOutcomes") == "validated" and external.get("learnerOutcomes", {}).get("status") != "validated":
        raise AssertionError("learner-outcome status cannot outrun genuine learner evidence")
    if snapshot.get("nzqaProviderValidation") == "validated" and external.get("nzqaProvider", {}).get("status") != "validated":
        raise AssertionError("NZQA/provider validation cannot outrun genuine provider/consent/moderation evidence")
    if snapshot.get("productionAuthority") != "advisory-only":
        raise AssertionError("public MouldMaster production authority must remain advisory-only without separate controlled-site authorization")


def expect_failure(label: str, fn) -> None:
    try:
        fn()
    except AssertionError:
        return
    raise AssertionError(f"negative lifecycle regression did not fail closed: {label}")


def main() -> None:
    model = load("data/governance-state-model-v1.json")
    version = load("version.json")
    external = load("data/release-external-validation-v1.json")
    book_auth = load("data/book-publication-authorization-v1.json")
    book_sme = load("data/book-sme-review-v1.json")
    curriculum_sme = load("qa/curriculum-semantic-review.json")
    nzqa_external = load("data/nzqa-external-validation-v1.json")

    validate_model_shape(model)

    assert external.get("release") == version.get("web_release"), "external-validation contract must bind to current web release"
    assert book_sme.get("release") == version.get("web_release"), "Book SME contract must bind to current web release"
    assert curriculum_sme.get("release") == version.get("web_release"), "curriculum SME contract must bind to current web release"
    assert nzqa_external.get("release") == version.get("web_release"), "NZQA external-validation contract must bind to current web release"

    state_allowed(model, "technicalAutomation", external["technicalAutomation"]["status"])
    state_allowed(model, "publicationAuthorization", book_auth["status"])
    state_allowed(model, "externalValidation", book_sme["status"])
    state_allowed(model, "externalValidation", external["bookSme"]["status"])
    state_allowed(model, "externalValidation", external["curriculumSme"]["status"])
    state_allowed(model, "externalValidation", external["pwaPhysicalDevices"]["status"])
    state_allowed(model, "externalValidation", external["accessibility"]["status"])
    state_allowed(model, "externalValidation", external["learnerOutcomes"]["status"])
    state_allowed(model, "externalValidation", external["nzqaProvider"]["status"])
    state_allowed(model, "distributionValidation", external["windowsDistribution"]["status"])
    state_allowed(model, "productionAuthority", external["productionUse"]["status"])

    assert book_auth["status"] == "authorized", "current Book publication authorization changed unexpectedly"
    assert book_sme["status"] == "hold", "independent Book SME status must remain HOLD until real 46/46 human review exists"
    assert book_sme.get("reviews") == [], "current independent Book SME ledger must not contain manufactured approvals"
    assert external["bookSme"]["status"] == book_sme["status"]
    assert external["curriculumSme"]["status"] == "hold", "curriculum SME must remain HOLD until all 120 human reviews exist"
    assert curriculum_sme.get("reviews") == [], "current curriculum SME ledger must not contain manufactured approvals"
    assert nzqa_external.get("status") == "pending-provider-validation", "NZQA external evidence contract must remain pending until genuine provider evidence exists"
    assert nzqa_external.get("evidence") is None, "NZQA external HOLD must not contain manufactured completion evidence"

    for key in ("pwaPhysicalDevices", "accessibility", "windowsDistribution", "learnerOutcomes", "nzqaProvider"):
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
        "nzqaProviderValidation": external["nzqaProvider"]["status"],
        "productionAuthority": external["productionUse"]["status"],
    }
    assert current == expected, f"canonical state snapshot drifted from governed contracts: {current!r} != {expected!r}"
    validate_public_snapshot(current, book_sme=book_sme, curriculum_sme=curriculum_sme, external=external)

    invalid = deepcopy(current)
    invalid["bookIndependentSme"] = "validated"
    expect_failure(
        "automation/publication status cannot manufacture independent Book SME validation",
        lambda: validate_public_snapshot(invalid, book_sme=book_sme, curriculum_sme=curriculum_sme, external=external),
    )

    invalid = deepcopy(current)
    invalid["nzqaProviderValidation"] = "validated"
    expect_failure(
        "automation/readiness status cannot manufacture NZQA/provider validation",
        lambda: validate_public_snapshot(invalid, book_sme=book_sme, curriculum_sme=curriculum_sme, external=external),
    )

    invalid = deepcopy(current)
    invalid["productionAuthority"] = "automatic-machine-control"
    expect_failure(
        "public machine-control authority without controlled-site authorization",
        lambda: validate_public_snapshot(invalid, book_sme=book_sme, curriculum_sme=curriculum_sme, external=external),
    )

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

    print("MouldMaster canonical governance state-model QA passed (including fail-closed negative lifecycle regressions)")


if __name__ == "__main__":
    main()

from __future__ import annotations

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent


def load(path: str) -> dict:
    target = ROOT / path
    if not target.is_file():
        raise AssertionError(f"governance binding is orphaned: missing {path}")
    value = json.loads(target.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise AssertionError(f"governance binding must be a JSON object: {path}")
    return value


def referenced_file(owner: str, value: object) -> None:
    path = str(value or "").strip()
    if not path:
        raise AssertionError(f"{owner} has an empty governed file binding")
    if not (ROOT / path).is_file():
        raise AssertionError(f"{owner} points to missing governed file {path}")


def main() -> None:
    model = load("data/governance-state-model-v1.json")
    version = load("version.json")
    release = str(version.get("web_release") or "").strip()
    if not release:
        raise AssertionError("current web release is missing")

    bindings = model.get("currentReleaseBindings")
    if not isinstance(bindings, dict):
        raise AssertionError("canonical model has no currentReleaseBindings")
    for key in ("externalValidation", "bookPublication", "bookIndependentSme", "curriculumIndependentSme"):
        referenced_file(f"currentReleaseBindings.{key}", bindings.get(key))

    external = load(str(bindings["externalValidation"]))
    book_publication = load(str(bindings["bookPublication"]))
    book_sme = load(str(bindings["bookIndependentSme"]))
    curriculum_sme = load(str(bindings["curriculumIndependentSme"]))

    if external.get("release") != release:
        raise AssertionError("external-validation binding is stuck on a different release")
    if book_sme.get("release") != release:
        raise AssertionError("Book SME binding is stuck on a different release")
    if curriculum_sme.get("release") != release:
        raise AssertionError("curriculum SME binding is stuck on a different release")

    referenced_file("external validation index", external.get("validationIndex"))
    packet_fields = {
        "accessibility": "reviewPacket",
        "pwaPhysicalDevices": "reviewPacket",
        "windowsDistribution": "readinessPacket",
        "bookSme": "reviewPacket",
        "curriculumSme": "reviewPacket",
        "learnerOutcomes": "pilotPacket",
    }
    contract_fields = {
        "accessibility": "evidenceContract",
        "pwaPhysicalDevices": "evidenceContract",
        "bookSme": "evidenceContract",
        "curriculumSme": "evidenceContract",
        "learnerOutcomes": "pilotContract",
    }
    for section_name, packet_key in packet_fields.items():
        section = external.get(section_name)
        if not isinstance(section, dict):
            raise AssertionError(f"external-validation section is orphaned: {section_name}")
        referenced_file(f"{section_name}.{packet_key}", section.get(packet_key))
        contract_key = contract_fields.get(section_name)
        if contract_key:
            referenced_file(f"{section_name}.{contract_key}", section.get(contract_key))
        status = section.get("status")
        if status not in {"hold", "validated"}:
            raise AssertionError(f"{section_name} has an ambiguous/transient public status: {status!r}")
        required = section.get("required")
        if not required:
            raise AssertionError(f"{section_name} has no explicit exit condition; HOLD could become an unowned stuck state")

    current = model.get("currentPublicBoundary")
    if not isinstance(current, dict):
        raise AssertionError("canonical model has no currentPublicBoundary")
    expected_keys = {
        "technicalAutomation",
        "bookPublicationAuthorization",
        "bookIndependentSme",
        "curriculumIndependentSme",
        "physicalPwa",
        "assistiveTechnology",
        "windowsDistribution",
        "learnerOutcomes",
        "productionAuthority",
    }
    if set(current) != expected_keys:
        missing = sorted(expected_keys - set(current))
        unknown = sorted(set(current) - expected_keys)
        raise AssertionError(f"human-facing lifecycle surface has orphaned/missing states: missing={missing} unknown={unknown}")

    derived = {
        "technicalAutomation": external["technicalAutomation"]["status"],
        "bookPublicationAuthorization": book_publication["status"],
        "bookIndependentSme": book_sme["status"],
        "curriculumIndependentSme": external["curriculumSme"]["status"],
        "physicalPwa": external["pwaPhysicalDevices"]["status"],
        "assistiveTechnology": external["accessibility"]["status"],
        "windowsDistribution": external["windowsDistribution"]["status"],
        "learnerOutcomes": external["learnerOutcomes"]["status"],
        "productionAuthority": external["productionUse"]["status"],
    }
    if current != derived:
        raise AssertionError(f"human-facing lifecycle state is stuck/orphaned from authoritative contracts: {current!r} != {derived!r}")

    # HOLD is deliberately a stable blocked state. The public model must not expose
    # transition placeholders such as pending/in-progress that can become silently stuck.
    forbidden_public = {"pending", "in-progress", "processing", "unknown", "unresolved"}
    for key, state in current.items():
        if str(state).lower() in forbidden_public:
            raise AssertionError(f"{key} exposes a transient/orphan-prone public state: {state}")

    print("MouldMaster lifecycle orphan/stuck-state QA passed; all public states have live authoritative bindings and explicit exits")


if __name__ == "__main__":
    main()

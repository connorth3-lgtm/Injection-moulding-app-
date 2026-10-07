from __future__ import annotations

from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data" / "governance-state-model-v1.json"
VERSION = ROOT / "version.json"
OUTPUT = ROOT / "GOVERNANCE_STATUS.md"
BOOK_MANIFEST = ROOT / "data" / "book-manifest-v1.json"
BOOK_AUTH = ROOT / "data" / "book-publication-authorization-v1.json"
BOOK_ACCURACY = ROOT / "data" / "book-accuracy-gate-v1.json"
BOOK_AUDIT = ROOT / "data" / "book-verification-audit-all-v1.json"
BOOK_SME = ROOT / "data" / "book-sme-review-v1.json"
BOOK_READER = ROOT / "data" / "book-reader-architecture-v2.json"

LABELS = {
    "technicalAutomation": "Technical automation",
    "repositoryGovernance": "Native main governance",
    "bookPublicationAuthorization": "Book publication authorization",
    "bookIndependentSme": "Independent Book SME review",
    "curriculumIndependentSme": "Independent Academy SME review",
    "physicalPwa": "Physical iOS/iPadOS + Android validation",
    "assistiveTechnology": "Real NVDA + VoiceOver validation",
    "windowsDistribution": "Signed/Store Windows distribution validation",
    "learnerOutcomes": "Real learner outcome evidence",
    "nzqaProviderValidation": "NZQA/provider/accreditation validation",
    "desktopReleaseImmutability": "GitHub desktop-release immutability",
    "productionAuthority": "Production authority",
}


def load(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise AssertionError(f"{path.relative_to(ROOT)} must contain a JSON object")
    return value


def render() -> str:
    model = load(MODEL)
    version = load(VERSION)
    book_manifest = load(BOOK_MANIFEST)
    book_auth = load(BOOK_AUTH)
    book_accuracy = load(BOOK_ACCURACY)
    book_audit = load(BOOK_AUDIT)
    book_sme = load(BOOK_SME)
    book_reader = load(BOOK_READER)
    boundary = model.get("currentPublicBoundary")
    assurance = model.get("currentAssuranceEvidence")
    if not isinstance(boundary, dict) or set(boundary) != set(LABELS):
        raise AssertionError("canonical public boundary does not match the governed human-facing status fields")
    if not isinstance(assurance, dict) or set(assurance) != {"staticContract", "behavioralBrowser", "externalHumanDevice"}:
        raise AssertionError("canonical assurance layers are incomplete")
    release = str(version.get("web_release") or "").strip()
    if not release:
        raise AssertionError("version.json web_release is missing")

    modules = [chapter for part in book_manifest.get("parts", []) for chapter in part.get("chapters", [])]
    module_ids = [str(chapter.get("id") or "") for chapter in modules]
    if len(module_ids) != 46 or len(set(module_ids)) != 46 or any(not item for item in module_ids):
        raise AssertionError("Book manifest must contain exactly 46 unique governed module IDs")
    authorized_ids = [str(item) for item in book_auth.get("authorizedChapterIds", [])]
    if len(authorized_ids) != 46 or set(authorized_ids) != set(module_ids):
        raise AssertionError("Book publication authorization must cover all 46 governed modules exactly")
    reader_rows = book_reader.get("readerChapters") or []
    reader_module_ids = [str(item) for row in reader_rows for item in row.get("moduleIds", [])]
    if len(reader_rows) != 20 or len(reader_module_ids) != 46 or len(set(reader_module_ids)) != 46 or set(reader_module_ids) != set(module_ids):
        raise AssertionError("Book reader architecture must map all 46 modules exactly once into 20 reader chapters")
    lifecycle = book_accuracy.get("recordLifecycle") or {}
    if lifecycle.get("status") != "historical-prepublication-gate" or lifecycle.get("supersededForCurrentPublicationStatusBy") != "data/book-publication-authorization-v1.json":
        raise AssertionError("historical Book accuracy gate is not explicitly superseded by current publication authorization")
    claim_disposition = book_audit.get("effectiveClaimDisposition") or {}
    for key in ("supported", "qualified", "hold", "conflicting"):
        if not isinstance(claim_disposition.get(key), int):
            raise AssertionError(f"Book claim disposition is missing integer {key}")
    manifest_states = {}
    for chapter in modules:
        state = str(chapter.get("state") or "missing")
        manifest_states[state] = manifest_states.get(state, 0) + 1
    if book_auth.get("status") != boundary.get("bookPublicationAuthorization"):
        raise AssertionError("Book authorization status drifted from canonical public boundary")
    if book_sme.get("status") != boundary.get("bookIndependentSme"):
        raise AssertionError("Book SME status drifted from canonical public boundary")
    if book_sme.get("reviews") not in ([], None):
        raise AssertionError("current Book SME HOLD must not contain manufactured accepted reviews")
    lines = [
        "# MouldMaster governance status",
        "",
        f"Current governed web candidate: **`{release}`**.",
        "",
        "This page is generated from `data/governance-state-model-v1.json`. Do not hand-edit status words here; update the governed evidence/state contract and regenerate this file.",
        "",
        "| Boundary | Current state |",
        "| --- | --- |",
    ]
    for key, label in LABELS.items():
        lines.append(f"| {label} | **{boundary[key]}** |")
    lines.extend([
        "",
        "## Interpretation",
        "",
        "`pass` describes software-controlled automation only. `pending-native-ruleset-apply` means repository policy is ready but the live GitHub main ruleset has not yet been verified against it, so release promotion remains blocked. `authorized` describes internal publication authorization only. `hold` on an external-validation row is a truthful blocked state awaiting genuine release-bound human/device/platform evidence; it is not a software-test failure. `advisory-only` means MouldMaster does not provide validated production-recipe or automatic machine-control authority.",
        "",
        "The Book may therefore be publication-authorized while independent Book SME review remains on HOLD. Those states are intentionally different and must not be collapsed into a single 'validated' label.",
        "",
        "## Book publication detail",
        "",
        f"- **Current learner-facing publication:** {book_auth.get('learnerFacingPublicationLabel', 'unknown')} — internal governed publication status **{book_auth.get('status', 'unknown')}** for **{len(authorized_ids)}/46** governed modules.",
        f"- **Reader architecture:** **{len(reader_rows)}** reader chapters map all **{len(reader_module_ids)}** governed modules exactly once.",
        f"- **Claim evidence disposition:** **{claim_disposition['supported']} supported**, **{claim_disposition['qualified']} qualified scope boundaries**, **{claim_disposition['hold']} HOLD**, **{claim_disposition['conflicting']} conflicting**.",
        f"- **Independent human Book SME:** **{book_sme.get('status', 'unknown')}**; current accepted review records: **{len(book_sme.get('reviews') or [])}/46**.",
        f"- **Manifest workflow states:** {', '.join(f'{count} {state}' for state, count in sorted(manifest_states.items()))}. These fields are not the current publication authority; current publication status is derived from `data/book-publication-authorization-v1.json`.",
        f"- **Historical accuracy gate:** **{book_accuracy.get('currentBookDisposition', 'unknown')}**, **{book_accuracy.get('verifiedChapterCountAuthorizedByThisGate', 0)}** chapters automatically verified. Its lifecycle is explicitly `{lifecycle.get('status')}` and superseded for current publication status by `{lifecycle.get('supersededForCurrentPublicationStatusBy')}`.",
        "",
        "This distinction is fail-closed: publication authorization does not create independent SME approval, accreditation, learner outcome evidence, physical-device evidence or production authority.",
        "",
        "## Assurance evidence layers",
        "",
        "These layers are reported separately. Passing static/contract or automated browser QA does not convert the external human/device layer into a pass.",
        "",
        "| Layer | State | Meaning |",
        "| --- | --- | --- |",
        f"| Static / contract | **{assurance['staticContract']['status']}** | {assurance['staticContract']['meaning']} |",
        f"| Behavioral / browser | **{assurance['behavioralBrowser']['status']}** | {assurance['behavioralBrowser']['meaning']} |",
        f"| External human / device | **{assurance['externalHumanDevice']['status']}** | {assurance['externalHumanDevice']['meaning']} |",
        "",
    ])
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--write", action="store_true")
    group.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = render()
    if args.write:
        OUTPUT.write_text(expected, encoding="utf-8")
        print("Generated GOVERNANCE_STATUS.md from canonical state model")
        return
    actual = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
    if actual != expected:
        raise AssertionError("GOVERNANCE_STATUS.md drifted from canonical state model; run `python tools/render_governance_status.py --write`")
    print("MouldMaster human governance status matches canonical state model")


if __name__ == "__main__":
    main()
from __future__ import annotations

from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data" / "governance-state-model-v1.json"
VERSION = ROOT / "version.json"
OUTPUT = ROOT / "GOVERNANCE_STATUS.md"
BOOK_MANIFEST = ROOT / "data" / "book-manifest-v1.json"
BOOK_AUTHORIZATION = ROOT / "data" / "book-publication-authorization-v1.json"
BOOK_ACCURACY = ROOT / "data" / "book-accuracy-gate-v1.json"
BOOK_AUDIT = ROOT / "data" / "book-verification-audit-all-v1.json"
BOOK_READER = ROOT / "data" / "book-reader-architecture-v2.json"
BOOK_SME = ROOT / "data" / "book-sme-review-v1.json"

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
    boundary = model.get("currentPublicBoundary")
    assurance = model.get("currentAssuranceEvidence")
    if not isinstance(boundary, dict) or set(boundary) != set(LABELS):
        raise AssertionError("canonical public boundary does not match the governed human-facing status fields")
    if not isinstance(assurance, dict) or set(assurance) != {"staticContract", "behavioralBrowser", "externalHumanDevice"}:
        raise AssertionError("canonical assurance layers are incomplete")
    release = str(version.get("web_release") or "").strip()
    if not release:
        raise AssertionError("version.json web_release is missing")

    manifest = load(BOOK_MANIFEST)
    book_auth = load(BOOK_AUTHORIZATION)
    accuracy = load(BOOK_ACCURACY)
    audit = load(BOOK_AUDIT)
    reader = load(BOOK_READER)
    book_sme = load(BOOK_SME)

    module_ids = [
        str(chapter.get("id") or "")
        for part in manifest.get("parts", [])
        for chapter in part.get("chapters", [])
        if isinstance(chapter, dict)
    ]
    if not module_ids or len(module_ids) != len(set(module_ids)):
        raise AssertionError("Book manifest module IDs must be non-empty and unique")
    authorized_ids = [str(value) for value in book_auth.get("authorizedChapterIds", [])]
    if set(authorized_ids) != set(module_ids) or len(authorized_ids) != len(module_ids):
        raise AssertionError("Book publication authorization must cover every governed manifest module exactly once")
    reader_chapters = reader.get("readerChapters") or []
    reader_module_ids = [
        str(value)
        for row in reader_chapters
        if isinstance(row, dict)
        for value in row.get("moduleIds", [])
    ]
    if len(reader_module_ids) != len(module_ids) or len(set(reader_module_ids)) != len(module_ids) or set(reader_module_ids) != set(module_ids):
        raise AssertionError("Book reader architecture must cover every governed module exactly once")

    state_counts: dict[str, int] = {}
    for part in manifest.get("parts", []):
        for chapter in part.get("chapters", []):
            if isinstance(chapter, dict):
                state = str(chapter.get("state") or "missing")
                state_counts[state] = state_counts.get(state, 0) + 1
    manifest_state_summary = " · ".join(f"{count} {state}" for state, count in sorted(state_counts.items()))

    disposition = audit.get("effectiveClaimDisposition") or {}
    supported = int(disposition.get("supported") or 0)
    qualified = int(disposition.get("qualified") or 0)
    held = int(disposition.get("hold") or 0)
    conflicting = int(disposition.get("conflicting") or 0)
    if supported + qualified + held + conflicting <= 0:
        raise AssertionError("Book claim-disposition audit is missing")

    lifecycle = accuracy.get("recordLifecycle") or {}
    if lifecycle.get("status") != "historical-prepublication-gate" or lifecycle.get("supersededForCurrentPublicationStatusBy") != "data/book-publication-authorization-v1.json":
        raise AssertionError("historical Book accuracy gate must declare its current publication-status supersession")
    approved = {
        str(row.get("chapterId"))
        for row in book_sme.get("reviews", [])
        if isinstance(row, dict) and row.get("conclusion") == "approved"
    }
    if not approved <= set(module_ids):
        raise AssertionError("Book SME approvals reference unknown governed modules")

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
        "## Book current publication state",
        "",
        "This section resolves the Book current learner-facing publication state from the governed authorization/evidence overlays. Historical manifest workflow fields and the pre-publication accuracy gate remain audit inputs; they do not override the current publication authorization.",
        "",
        "| Signal | Current meaning |",
        "| --- | --- |",
        f"| Governed modules | **{len(authorized_ids)}/{len(module_ids)} publication-authorized** as **{book_auth.get('learnerFacingPublicationLabel', 'Source evidence reviewed')}** |",
        f"| Reader structure | **{len(reader_chapters)} reader chapters** derived from **{len(module_ids)} governed modules**; reader grouping adds no technical claim or SME approval. |",
        f"| Claim evidence | **{supported} supported · {qualified} qualified · {held} hold · {conflicting} conflicting** |",
        f"| Manifest workflow metadata | **{manifest_state_summary}**; this is evidence/workflow metadata, not the learner-facing publication status. |",
        f"| Historical accuracy gate | **{accuracy.get('currentBookDisposition', 'unknown')}** · lifecycle **{lifecycle.get('status', 'unknown')}** · superseded for current publication status by `data/book-publication-authorization-v1.json`. |",
        f"| Independent human SME review | **{book_sme.get('status')}** · **{len(approved)}/{len(module_ids)} governed modules approved** |",
        "",
        "Publication authorization and independent validation are separate namespaces. The Book can be authorized as a source-evidence-reviewed reference while independent human SME, device, learner-outcome and provider/accreditation evidence remains on HOLD.",
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
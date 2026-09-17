from __future__ import annotations

from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data" / "governance-state-model-v1.json"
VERSION = ROOT / "version.json"
OUTPUT = ROOT / "GOVERNANCE_STATUS.md"

LABELS = {
    "technicalAutomation": "Technical automation",
    "bookPublicationAuthorization": "Book publication authorization",
    "bookIndependentSme": "Independent Book SME review",
    "curriculumIndependentSme": "Independent Academy SME review",
    "physicalPwa": "Physical iOS/iPadOS + Android validation",
    "assistiveTechnology": "Real NVDA + VoiceOver validation",
    "windowsDistribution": "Signed/Store Windows distribution validation",
    "learnerOutcomes": "Real learner outcome evidence",
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
    if not isinstance(boundary, dict) or set(boundary) != set(LABELS):
        raise AssertionError("canonical public boundary does not match the governed human-facing status fields")
    release = str(version.get("web_release") or "").strip()
    if not release:
        raise AssertionError("version.json web_release is missing")

    lines = [
        "# MouldMaster governance status",
        "",
        f"Current learner-facing web release: **`{release}`**.",
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
        "`pass` describes software-controlled automation only. `authorized` describes internal publication authorization only. `hold` on an external-validation row is a truthful blocked state awaiting genuine release-bound human/device/platform evidence; it is not a software-test failure. `advisory-only` means MouldMaster does not provide validated production-recipe or automatic machine-control authority.",
        "",
        "The Book may therefore be publication-authorized while independent Book SME review remains on HOLD. Those states are intentionally different and must not be collapsed into a single 'validated' label.",
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

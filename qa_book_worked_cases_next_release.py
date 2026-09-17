from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "sources" / "BOOK_WORKED_ENGINEERING_CASES_NEXT_RELEASE.md"
VERSION = ROOT / "version.json"


def main() -> None:
    text = SOURCE.read_text(encoding="utf-8")
    lower = text.lower()
    version = json.loads(VERSION.read_text(encoding="utf-8"))
    release = str(version.get("web_release") or "").strip()
    assert release, "current web release identity is missing"
    assert "post-`2026.09.16.2` authoring source" in text
    assert "not independently SME-approved" in text

    # This file is an authoring/evidence-review source, not learner-runtime content.
    # The original .16.2 freeze is a historical boundary, not a permanent assertion
    # that the whole repository must remain on that release forever.
    source_name = SOURCE.name
    for runtime_surface in [
        ROOT / "index.html",
        ROOT / "service-worker.js",
        ROOT / "runtime-domain-manifest.json",
    ]:
        assert source_name not in runtime_surface.read_text(encoding="utf-8"), (
            f"worked-case authoring source leaked into learner runtime surface: {runtime_surface.name}"
        )

    headings = re.findall(r"^## (\d+)\. ", text, flags=re.M)
    assert headings == [str(i) for i in range(1, 11)], f"expected ten ordered worked cases, found {headings}"
    assert text.count("SYNTHETIC") >= 10, "worked numerical cases must remain visibly synthetic until replaced by governed measured evidence"
    for marker in [
        "Clamp-force estimate",
        "Staged pressure-loss study",
        "Gate-seal study",
        "Pressure-trace interpretation",
        "Two-factor DOE",
        "Multi-cavity variation",
        "Capability example",
        "Conditioning and dimensional state",
        "Cooling/heat-load estimate",
        "End-to-end diagnosis",
        "## Integration gate for issue #368",
        "No `.16.2` evidence may be relabelled for the changed bytes.",
    ]:
        assert marker in text, f"worked-case governance/content marker missing: {marker}"

    # Fail on affirmative unsafe claims, while allowing the source to explicitly
    # deny those claims (for example, "not universal production settings").
    unsafe_patterns = [
        r"(?<!not )universal production setting(?:s)?(?:\s+(?:is|are|applies?|for))",
        r"guaranteed root cause(?:\s+(?:is|has|was|identified|confirmed))",
        r"automatic machine-control authority is granted",
    ]
    for pattern in unsafe_patterns:
        assert not re.search(pattern, lower), f"unsafe worked-case claim detected: {pattern}"

    for required_boundary in [
        "not universal production settings",
        "does not establish a generic hold time",
        "does not by itself prove",
        "not a cooling-time formula",
        "not automatically the required machine clamp rating",
    ]:
        assert required_boundary in lower, f"worked-case fail-closed boundary missing: {required_boundary}"

    print(
        f"MouldMaster worked engineering case authoring-source QA passed for current release {release}; "
        "the pack remains outside learner runtime pending deliberate issue #368 integration and SME scope."
    )


if __name__ == "__main__":
    main()

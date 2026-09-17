from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "sources" / "BOOK_WORKED_ENGINEERING_CASES_NEXT_RELEASE.md"
VERSION = ROOT / "version.json"


def main() -> None:
    text = SOURCE.read_text(encoding="utf-8")
    version = json.loads(VERSION.read_text(encoding="utf-8"))
    assert version.get("web_release") == "2026.09.16.2", "worked-case source pack is explicitly staged behind the frozen .16.2 runtime"
    assert "post-`2026.09.16.2` authoring source" in text
    assert "not independently SME-approved" in text
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
    for unsafe in [
        "universal production setting",
        "guaranteed root cause",
        "automatic machine-control authority is granted",
    ]:
        assert unsafe not in text.lower(), f"unsafe worked-case claim detected: {unsafe}"
    print("MouldMaster next-release worked engineering case source QA passed")


if __name__ == "__main__":
    main()

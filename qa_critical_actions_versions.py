from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
WORKFLOWS = [
    ".github/workflows/qa.yml",
    ".github/workflows/mobile-browser-qa.yml",
    ".github/workflows/open-desktop-build.yml",
    ".github/workflows/publish-open-desktop.yml",
    ".github/workflows/microsoft-store-msix.yml",
    ".github/workflows/maturity-hardening-v2.yml",
    ".github/workflows/primary-measured-evidence.yml",
    ".github/workflows/real-site-pilot-preflight.yml",
    ".github/workflows/specialist-evidence-gaps.yml",
    ".github/workflows/deep-dive-v2.yml",
]
CORE = {"checkout", "setup-python", "setup-node", "upload-artifact", "download-artifact"}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

report = []
for rel in WORKFLOWS:
    path = ROOT / rel
    need(path.exists(), f"critical workflow missing: {rel}")
    text = path.read_text(encoding="utf-8")
    refs = re.findall(r"actions/(checkout|setup-python|setup-node|upload-artifact|download-artifact)@v(\d+)", text)
    need(refs, f"critical workflow has no governed core Action references: {rel}")
    bad = [(name, major) for name, major in refs if name in CORE and major != "7"]
    need(not bad, f"critical workflow uses stale core Action major(s) {bad}: {rel}")
    report.append({"workflow": rel, "coreActionRefs": len(refs), "majors": sorted({int(v) for _, v in refs})})

publish = (ROOT / ".github/workflows/publish-open-desktop.yml").read_text(encoding="utf-8")
need("actions/download-artifact@v7" in publish, "signed desktop release trust-boundary transfer must use governed download-artifact v7")

(ROOT / "critical-actions-versions-report.json").write_text(json.dumps({
    "schema": 1,
    "result": "pass",
    "criticalWorkflowCount": len(WORKFLOWS),
    "requiredCoreActionMajor": 7,
    "governedCoreActions": sorted(CORE),
    "workflows": report,
}, indent=2) + "\n", encoding="utf-8")
print(f"MouldMaster critical GitHub Actions QA passed ({len(WORKFLOWS)} active workflows pinned to core Action major v7, including artifact download transfer)")

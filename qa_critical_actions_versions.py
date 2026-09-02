from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
WORKFLOW_DIR = ROOT / ".github" / "workflows"
CORE = {"checkout", "setup-python", "setup-node", "upload-artifact", "download-artifact"}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


workflows = sorted(WORKFLOW_DIR.glob("*.yml"))
need(len(workflows) >= 20, f"workflow inventory unexpectedly small: {len(workflows)}")
report = []
stale = []
for path in workflows:
    rel = str(path.relative_to(ROOT))
    text = path.read_text(encoding="utf-8")
    refs = re.findall(r"actions/(checkout|setup-python|setup-node|upload-artifact|download-artifact)@v(\d+)", text)
    for name, major in refs:
        if name in CORE and major != "7":
            stale.append({"workflow": rel, "action": name, "major": int(major)})
    report.append({
        "workflow": rel,
        "coreActionRefs": len(refs),
        "majors": sorted({int(v) for _, v in refs}),
    })

need(not stale, "repository workflows use stale governed Action majors: " + "; ".join(
    f"{x['workflow']} actions/{x['action']}@v{x['major']}" for x in stale
))

publish = (WORKFLOW_DIR / "publish-open-desktop.yml").read_text(encoding="utf-8")
need("actions/download-artifact@v7" in publish, "signed desktop release trust-boundary transfer must use governed download-artifact v7")

(ROOT / "critical-actions-versions-report.json").write_text(json.dumps({
    "schema": 2,
    "result": "pass",
    "workflowCount": len(workflows),
    "requiredCoreActionMajor": 7,
    "governedCoreActions": sorted(CORE),
    "workflows": report,
}, indent=2) + "\n", encoding="utf-8")
print(f"MouldMaster GitHub Actions QA passed ({len(workflows)} workflows audited; every checkout/setup/upload/download core Action reference is v7)")

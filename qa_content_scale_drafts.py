from pathlib import Path
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
GEN = ROOT / "tools" / "generate_content_scale_drafts.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(GEN.exists(), "content-scale draft generator missing")
with tempfile.TemporaryDirectory() as td:
    p = subprocess.run(["python", str(GEN), "--output-dir", td], capture_output=True, text=True)
    need(p.returncode == 0, p.stderr or "draft generator failed")
    root = Path(td)
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    need(manifest.get("acceptedCountsChanged") is False, "draft generation must never change accepted counts")
    expected = {
        "materialProfiles": 260,
        "defectMechanisms": 320,
        "sensorMachineHealthConcepts": 220,
        "assessmentEducationItems": 1200,
    }
    need(manifest.get("counts") == expected, f"draft coverage counts drifted: {manifest.get('counts')}")

    files = {
        "materialProfiles": "material-profile-drafts.json",
        "defectMechanisms": "defect-mechanism-drafts.json",
        "sensorMachineHealthConcepts": "sensor-machine-health-drafts.json",
        "assessmentEducationItems": "assessment-item-drafts.json",
    }
    for key, name in files.items():
        obj = json.loads((root / name).read_text(encoding="utf-8"))
        need(obj.get("status") == "draft-bank-not-counted-as-accepted", f"{name} must remain draft-only")
        need(obj.get("count") == expected[key], f"{name} count mismatch")
        records = obj.get("records") or []
        need(len(records) == expected[key], f"{name} record length mismatch")
        ids = [r.get("id") for r in records]
        need(len(ids) == len(set(ids)) and all(ids), f"{name} requires unique non-empty IDs")
        need(all("draft" in (r.get("status") or "") for r in records), f"{name} contains a non-draft record")

print("MouldMaster content-scale draft QA passed (260 material, 320 defect, 220 sensor/health, 1200 assessment drafts; 0 accepted counts changed)")

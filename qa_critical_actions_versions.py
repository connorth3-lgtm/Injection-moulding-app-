from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
WORKFLOW_DIR = ROOT / ".github" / "workflows"
WORKFLOWS = sorted(
    path.relative_to(ROOT).as_posix()
    for path in WORKFLOW_DIR.iterdir()
    if path.is_file() and path.suffix in {".yml", ".yaml"}
)

PINNED = {
    "checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
    "setup-node": "820762786026740c76f36085b0efc47a31fe5020",
    "setup-python": "5fda3b95a4ea91299a34e894583c3862153e4b97",
    "upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
}
ANNOTATED_MAJOR = {"checkout": 7, "setup-node": 7, "setup-python": 7, "upload-artifact": 7}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def governed_refs(text, rel):
    refs = []
    pattern = re.compile(r"actions/(checkout|setup-python|setup-node|upload-artifact)@([^\s#]+)(?:\s+#\s*v(\d+)(?:\.\d+(?:\.\d+)?)?)?")
    for name, ref, annotated_major in pattern.findall(text):
        need(re.fullmatch(r"[0-9a-f]{40}", ref) is not None, f"mutable core Action reference is forbidden: actions/{name}@{ref} in {rel}")
        need(ref == PINNED[name], f"unreviewed core Action SHA for actions/{name} in {rel}: {ref}")
        need(bool(annotated_major), f"SHA-pinned core Action needs a reviewed major annotation: actions/{name}@{ref} in {rel}")
        need(int(annotated_major) == ANNOTATED_MAJOR[name], f"core Action major annotation drifted for actions/{name} in {rel}")
        refs.append((name, ref))
    return refs


report = []
for rel in WORKFLOWS:
    path = ROOT / rel
    need(path.exists(), f"critical workflow missing: {rel}")
    text = path.read_text(encoding="utf-8")
    refs = governed_refs(text, rel)
    # A workflow may legitimately use no governed core Action. Any core Action
    # reference that is present must still be exact-SHA pinned.
    report.append({
        "workflow": rel,
        "coreActionRefs": len(refs),
        "shaPinnedRefs": len(refs),
        "pins": sorted({f"{name}@{sha}" for name, sha in refs}),
    })

(ROOT / "critical-actions-versions-report.json").write_text(json.dumps({
    "schema": 2,
    "result": "pass",
    "workflowCount": len(WORKFLOWS),
    "policy": "exact-reviewed-sha",
    "approvedPins": PINNED,
    "workflows": report,
}, indent=2) + "\n", encoding="utf-8")

need(len(WORKFLOWS) >= 70, "workflow inventory unexpectedly shrank; repository-wide pin coverage may be incomplete")
print(f"MouldMaster GitHub Actions QA passed ({len(WORKFLOWS)} workflows scanned; every governed core Action reference uses an exact reviewed SHA pin).")
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
WORKFLOWS = [
    ".github/workflows/qa.yml",
    ".github/workflows/mobile-browser-qa.yml",
    ".github/workflows/question-quality-50-pass.yml",
    ".github/workflows/open-desktop-build.yml",
    ".github/workflows/publish-open-desktop.yml",
    ".github/workflows/microsoft-store-msix.yml",
    ".github/workflows/maturity-hardening-v2.yml",
    ".github/workflows/primary-measured-evidence.yml",
    ".github/workflows/real-site-pilot-preflight.yml",
    ".github/workflows/specialist-evidence-gaps.yml",
    ".github/workflows/deep-dive-v2.yml",
]
CORE = {"checkout", "setup-python", "setup-node", "upload-artifact"}
REQUIRED_MAJOR = 7
REQUIRED_SHA_WORKFLOWS = {
    ".github/workflows/qa.yml",
    ".github/workflows/mobile-browser-qa.yml",
    ".github/workflows/question-quality-50-pass.yml",
    ".github/workflows/open-desktop-build.yml",
}
REVIEWED_SHA = {
    "checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
    "setup-node": "820762786026740c76f36085b0efc47a31fe5020",
    "setup-python": "5fda3b95a4ea91299a34e894583c3862153e4b97",
    "upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def governed_refs(text, rel):
    refs = []
    pattern = re.compile(r"actions/(checkout|setup-python|setup-node|upload-artifact)@([^\s#]+)(?:\s+#\s*v(\d+)(?:\.\d+(?:\.\d+)?)?)?")
    for name, ref, annotated_major in pattern.findall(text):
        if ref.startswith("v") and ref[1:].isdigit():
            major = int(ref[1:])
            kind = "major-tag"
        elif re.fullmatch(r"[0-9a-f]{40}", ref):
            need(annotated_major, f"SHA-pinned core Action needs reviewed major annotation '# v{REQUIRED_MAJOR}': actions/{name}@{ref} in {rel}")
            major = int(annotated_major)
            kind = "commit-sha"
        else:
            raise AssertionError(f"unsupported core Action reference form: actions/{name}@{ref} in {rel}")
        refs.append((name, ref, major, kind))
    return refs


report = []
for rel in WORKFLOWS:
    path = ROOT / rel
    need(path.exists(), f"critical workflow missing: {rel}")
    text = path.read_text(encoding="utf-8")
    refs = governed_refs(text, rel)
    need(refs, f"critical workflow has no governed core Action references: {rel}")
    bad = [(name, major) for name, _, major, _ in refs if name in CORE and major != REQUIRED_MAJOR]
    need(not bad, f"critical workflow uses stale core Action major(s) {bad}: {rel}")
    if rel in REQUIRED_SHA_WORKFLOWS:
        for name, ref, major, kind in refs:
            if name not in CORE:
                continue
            need(kind == "commit-sha", f"required status-check workflow must SHA-pin actions/{name}: {rel}")
            need(ref == REVIEWED_SHA[name], f"required status-check workflow uses unreviewed SHA for actions/{name}: {rel}")
    report.append({
        "workflow": rel,
        "coreActionRefs": len(refs),
        "majors": sorted({major for _, _, major, _ in refs}),
        "shaPinnedRefs": sum(1 for _, _, _, kind in refs if kind == "commit-sha"),
    })

(ROOT / "critical-actions-versions-report.json").write_text(json.dumps({
    "schema": 1,
    "result": "pass",
    "criticalWorkflowCount": len(WORKFLOWS),
    "requiredCoreActionMajor": REQUIRED_MAJOR,
    "workflows": report,
}, indent=2) + "\n", encoding="utf-8")
print(
    f"MouldMaster critical GitHub Actions QA passed "
    f"({len(WORKFLOWS)} active workflows use core Action major v{REQUIRED_MAJOR}; required status checks use exact reviewed SHA pins)"
)

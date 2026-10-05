from pathlib import Path
import json
import re
import shlex

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
    "download-artifact": "3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
}
ANNOTATED_MAJOR = {
    "checkout": 7,
    "setup-node": 7,
    "setup-python": 7,
    "upload-artifact": 7,
    "download-artifact": 8,
}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def all_external_refs(text, rel):
    refs = []
    pattern = re.compile(r"(?m)^\s*(?:-\s*)?uses:\s+([^\s#]+)")
    for ref in pattern.findall(text):
        if ref.startswith("./"):
            continue
        if ref.startswith("docker://"):
            need(
                re.search(r"@sha256:[0-9a-f]{64}$", ref) is not None,
                f"mutable Docker action/image reference is forbidden in {rel}: {ref}",
            )
            refs.append(ref)
            continue
        need("@" in ref, f"external Action reference is missing an immutable ref in {rel}: {ref}")
        version = ref.rsplit("@", 1)[1]
        need(
            re.fullmatch(r"[0-9a-f]{40}", version) is not None,
            f"mutable external Action reference is forbidden in {rel}: {ref}",
        )
        refs.append(ref)
    return refs



def pinned_pip_specs(text, rel):
    specs = []
    value_options = {"-r", "--requirement", "-c", "--constraint", "--index-url", "--extra-index-url", "--find-links"}
    for line_no, line in enumerate(text.splitlines(), 1):
        if "pip install" not in line:
            continue
        tail = line.split("pip install", 1)[1].strip()
        if not tail:
            continue
        tokens = shlex.split(tail)
        skip_next = False
        for token in tokens:
            if skip_next:
                skip_next = False
                continue
            if token in value_options:
                skip_next = True
                continue
            if token.startswith("-") or token == "\\":
                continue
            need(
                "==" in token,
                f"unpinned workflow-time pip dependency is forbidden in {rel}:{line_no}: {token}",
            )
            name, version = token.split("==", 1)
            need(name.strip() and version.strip(), f"malformed pinned pip dependency in {rel}:{line_no}: {token}")
            specs.append(token)
    return specs


def governed_refs(text, rel):
    refs = []
    pattern = re.compile(r"actions/(checkout|setup-python|setup-node|upload-artifact|download-artifact)@([^\s#]+)(?:\s+#\s*v(\d+)(?:\.\d+(?:\.\d+)?)?)?")
    for name, ref, annotated_major in pattern.findall(text):
        need(re.fullmatch(r"[0-9a-f]{40}", ref) is not None, f"mutable core Action reference is forbidden: actions/{name}@{ref} in {rel}")
        need(ref == PINNED[name], f"unreviewed core Action SHA for actions/{name} in {rel}: {ref}")
        if annotated_major:
            need(int(annotated_major) == ANNOTATED_MAJOR[name], f"core Action major annotation drifted for actions/{name} in {rel}")
        refs.append((name, ref))
    return refs


report = []
for rel in WORKFLOWS:
    path = ROOT / rel
    need(path.exists(), f"critical workflow missing: {rel}")
    text = path.read_text(encoding="utf-8")
    refs = governed_refs(text, rel)
    external_refs = all_external_refs(text, rel)
    pip_specs = pinned_pip_specs(text, rel)
    # A workflow may legitimately use no governed core Action. Every external
    # Action reference must be immutable, and workflow-time Python packages must
    # use exact versions rather than mutable latest-resolution installs.
    report.append({
        "workflow": rel,
        "coreActionRefs": len(refs),
        "externalActionRefs": len(external_refs),
        "shaPinnedRefs": len(external_refs),
        "pinnedPipSpecs": len(pip_specs),
        "pins": sorted(set(external_refs)),
        "pipPins": sorted(set(pip_specs)),
    })

(ROOT / "critical-actions-versions-report.json").write_text(json.dumps({
    "schema": 2,
    "result": "pass",
    "workflowCount": len(WORKFLOWS),
    "policy": "all-external-actions-immutable; governed-core-actions-exact-reviewed-sha; workflow-pip-dependencies-exact-version; human-readable major annotations optional",
    "approvedPins": PINNED,
    "workflows": report,
}, indent=2) + "\n", encoding="utf-8")

need(len(WORKFLOWS) >= 70, "workflow inventory unexpectedly shrank; repository-wide pin coverage may be incomplete")
print(f"MouldMaster GitHub Actions QA passed ({len(WORKFLOWS)} workflows scanned; every external Action reference is immutable, every governed core Action uses the exact reviewed SHA pin, and workflow-time pip dependencies are exact-version pinned).")
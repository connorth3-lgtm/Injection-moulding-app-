from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


def global_document_calls(body, method):
    # Match application-global document.method(...), but not scoped popup/frame
    # calls such as w.document.write(...) used to print a certificate.
    return len(re.findall(rf"(?<![\w.])document\.{re.escape(method)}\s*\(", body))


ignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
for marker in (
    "desktop/electron/dist/",
    "desktop/electron/release-assets/",
    ".pages-dist/",
    "qa-artifacts/",
    "*.exe",
    "*.msi",
    "*.msix",
    "*.msixupload",
):
    need(marker in ignore, f"generated artifact ignore rule missing: {marker}")

tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).split(b"\0")
paths = [p.decode("utf-8") for p in tracked if p]
forbidden_suffixes = (
    ".exe",
    ".msi",
    ".msix",
    ".msixupload",
    ".dmg",
    ".appimage",
    ".deb",
    ".rpm",
)
forbidden = sorted(p for p in paths if p.lower().endswith(forbidden_suffixes))
need(not forbidden, "generated executable/installer artifacts are tracked in source: " + ", ".join(forbidden))

for forbidden_path in (
    "MouldMasterAcademy.exe",
    "desktop/electron/dist",
    "desktop/electron/release-assets",
    ".pages-dist",
    "qa-artifacts",
    "playwright-report",
    "test-results",
):
    need(not any(p == forbidden_path or p.startswith(forbidden_path + "/") for p in paths),
         f"generated output path is tracked in source: {forbidden_path}")

need((ROOT / ".gitattributes").is_file(), ".gitattributes missing")
attrs = (ROOT / ".gitattributes").read_text(encoding="utf-8")
need("MouldMaster_Core_App.html -text" in attrs, "audited core byte-preservation attribute missing")

# Architecture budget. Two historical compatibility bootstraps use parser-level
# replacement of the application document: index.html (current shell assembly)
# and the frozen MouldMaster_Academy_App.html recovery loader. Both are capped
# exactly and may only shrink in a separately validated migration. Scoped popup
# documents (for example w.document.write in certificate printing) are not app
# replacement and are deliberately distinguished here.
legacy_document_replacement = {
    "index.html": {"write": 1, "open": 1, "close": 1},
    "MouldMaster_Academy_App.html": {"write": 1, "open": 1, "close": 1},
}
for rel, expected in legacy_document_replacement.items():
    body = (ROOT / rel).read_text(encoding="utf-8")
    for method in ("write", "open", "close"):
        need(global_document_calls(body, method) == expected[method],
             f"{rel} global document.{method} budget drifted")
for rel in paths:
    if rel in legacy_document_replacement or not rel.lower().endswith((".js", ".html")):
        continue
    try:
        body = (ROOT / rel).read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    counts = {method: global_document_calls(body, method) for method in ("write", "open", "close")}
    need(not any(counts.values()),
         f"application document replacement technique spread outside audited bootstraps: {rel} {counts}")

finalizer = (ROOT / "app-shell-finalize.js").read_text(encoding="utf-8")
late_assets = re.findall(r"loadAsset\('([^']+\.js)'", finalizer)
need(late_assets == ["assessment-bank-expansion.js", "app-integration-v3.js"],
     f"late integration asset budget drifted: {late_assets}")
need("window.MM_APP_INTEGRATION_READY=p" in finalizer,
     "late integration readiness must remain explicit and observable")

# Local-first privacy boundary. Static same-origin reads are permitted where the
# process runtime loads its registry/manifest, but learner/process/diagnostic
# modules may not introduce upload/socket primitives or POST-style transports.
local_only_modules = (
    "data-integration-runtime.js",
    "process-data-intelligence-ui.js",
    "app-integration-v3.js",
    "learning-analytics.js",
    "learning-effectiveness.js",
    "research-utilisation-analytics.js",
    "production-health.js",
)
network_write_markers = (
    "XMLHttpRequest(",
    "new XMLHttpRequest",
    "new WebSocket",
    "WebSocket(",
    "new EventSource",
    "EventSource(",
    "sendBeacon(",
    "FormData(",
    "method:'POST'",
    'method:"POST"',
    "method: 'POST'",
    'method: "POST"',
    "method:'PUT'",
    'method:"PUT"',
    "method:'PATCH'",
    'method:"PATCH"',
)
for rel in local_only_modules:
    body = (ROOT / rel).read_text(encoding="utf-8")
    for marker in network_write_markers:
        need(marker not in body, f"local-first module gained a network-write primitive ({marker}): {rel}")

# Workflow privilege budget. The three release/governance writers are reviewed
# individually. Any other contents writer must be a tightly bounded aggregate
# data profiler: no PR trigger, no secrets, fixed data/* checkout and pushes only
# to that same fixed data/* branch. This prevents profiling tokens from ever
# becoming a path to main while retaining deterministic aggregate-generation jobs.
workflow_dir = ROOT / ".github" / "workflows"
workflows = sorted(workflow_dir.glob("*.yml"))
need(len(workflows) >= 20, f"workflow audit unexpectedly small: {len(workflows)}")
reviewed_privileged_writers = {
    "main-pr-provenance-guard.yml",
    "prune-merged-branches.yml",
    "publish-open-desktop.yml",
}
writers = []
data_writers = []
for path in workflows:
    body = path.read_text(encoding="utf-8")
    need("write-all" not in body, f"workflow may not request write-all permission: {path.name}")
    need("pull_request_target:" not in body, f"pull_request_target is forbidden because repository code and privileged context must stay separated: {path.name}")
    if "contents: write" not in body:
        continue
    writers.append(path.name)
    if path.name in reviewed_privileged_writers:
        continue
    need("pull_request:" not in body,
         f"data-branch contents writer must never execute with pull-request code: {path.name}")
    need("${{ secrets." not in body,
         f"data-branch contents writer may not combine repository secrets with write authority: {path.name}")
    checkout_refs = re.findall(r"^\s+ref:\s*(data/[A-Za-z0-9._/-]+)\s*$", body, flags=re.M)
    push_targets = re.findall(r"git push origin HEAD:(data/[A-Za-z0-9._/-]+)", body)
    need(len(set(checkout_refs)) == 1 and len(set(push_targets)) == 1,
         f"data-branch writer must have one fixed data/* checkout and one fixed data/* push target: {path.name}")
    checkout_ref = checkout_refs[0]
    push_target = push_targets[0]
    need(checkout_ref == push_target,
         f"data-branch writer checkout/push target mismatch: {path.name}: {checkout_ref} != {push_target}")
    need("HEAD:main" not in body and "refs/heads/main" not in body and "branches: [main]" not in body,
         f"data-branch writer contains a main-branch write/trigger path: {path.name}")
    need("gh release" not in body and "git push --force" not in body and "-f sha=" not in body,
         f"data-branch writer contains release/force-update primitives: {path.name}")
    data_writers.append(path.name)

need(reviewed_privileged_writers <= set(writers),
     f"reviewed privileged writer set is incomplete: expected {sorted(reviewed_privileged_writers)}, got {sorted(writers)}")

main_guard = (workflow_dir / "main-pr-provenance-guard.yml").read_text(encoding="utf-8")
need("branches: [main]" in main_guard and "rollback_main" in main_guard,
     "main write authority must remain limited to provenance enforcement/rollback on main")
pruner = (workflow_dir / "prune-merged-branches.yml").read_text(encoding="utf-8")
need('workflows: ["Main PR Provenance Guard"]' in pruner and "compare/main...$sha" in pruner,
     "branch-pruning write authority must remain guard-gated and prove branch safety")
publisher = (workflow_dir / "publish-open-desktop.yml").read_text(encoding="utf-8")
need(publisher.count("contents: write") == 1 and "publish-release:" in publisher and "tools/verify_production_source.py" in publisher,
     "desktop publisher write authority must remain isolated to the verified publication job")

print(
    f"MouldMaster repository hygiene QA passed ({len(paths)} tracked paths; {len(workflows)} workflows; "
    f"no generated installers/build outputs; two capped app-document bootstraps; local-only data transports; "
    f"{len(reviewed_privileged_writers)} reviewed privileged writers and {len(data_writers)} structurally bounded data-branch writer(s))."
)

from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


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

# Workflow privilege budget: destructive/publishing write authority is limited to
# three explicitly reviewed workflows. Fork-context execution and write-all are
# forbidden repository-wide. This turns least privilege into a regression gate
# instead of a convention reviewers have to remember.
workflow_dir = ROOT / ".github" / "workflows"
workflows = sorted(workflow_dir.glob("*.yml"))
need(len(workflows) >= 20, f"workflow audit unexpectedly small: {len(workflows)}")
allowed_contents_write = {
    "main-pr-provenance-guard.yml",
    "prune-merged-branches.yml",
    "publish-open-desktop.yml",
}
writers = []
for path in workflows:
    body = path.read_text(encoding="utf-8")
    need("write-all" not in body, f"workflow may not request write-all permission: {path.name}")
    need("pull_request_target:" not in body, f"pull_request_target is forbidden because repository code and privileged context must stay separated: {path.name}")
    if "contents: write" in body:
        writers.append(path.name)
        need(path.name in allowed_contents_write, f"unexpected repository contents write authority: {path.name}")

need(set(writers) == allowed_contents_write,
     f"reviewed contents-write workflow set drifted: expected {sorted(allowed_contents_write)}, got {sorted(writers)}")

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
    "no generated installers/build outputs and only three reviewed contents-write workflows)."
)

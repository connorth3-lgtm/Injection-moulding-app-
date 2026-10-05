from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent


def need(condition, message):
    if not condition:
        raise SystemExit(f"Branch assurance QA failed: {message}")


def text(path):
    p = ROOT / path
    need(p.exists(), f"missing {path}")
    return p.read_text(encoding="utf-8")


workflow = text(".github/workflows/branch-release-assurance.yml")
verifier = text("tools/verify_branch_assurance.py")

for marker in (
    "name: Branch Release Assurance",
    "branches: [main, preview]",
    "actions: read",
    "exact-push-assurance:",
    "BRANCH_ASSURANCE_BRANCH",
    "BRANCH_ASSURANCE_SHA",
    "tools/verify_branch_assurance.py",
    "github.ref_name",
    "github.sha",
):
    need(marker in workflow, f"workflow missing marker: {marker}")

for marker in (
    '"main": (',
    '"preview": (',
    '"MouldMaster Release QA"',
    '"Mobile Browser QA"',
    '"Question Quality 50-Pass"',
    '"Deep Audit Governance"',
    '"Release External Validation Boundary"',
    '"MouldMaster Pages Release Readiness"',
    '"Main PR Provenance Guard"',
    '"MouldMaster Preview Pages"',
    '"event": "push"',
    "head_sha",
    "completed",
    "success",
    "Exact-push branch assurance failed",
    "Exact-push branch assurance incomplete",
    "branch-assurance-report.json",
    "branch-assurance-report.md",
    "first failing dependency",
    "first unresolved dependency",
    "GITHUB_STEP_SUMMARY",
    "run_url",
    "workflow-state API unavailable",
    "GitHub workflow-state query failed after 4 attempts",
    "full lowercase 40-character commit SHA",
):
    need(marker in verifier, f"verifier missing marker: {marker}")

need("contents: write" not in workflow, "assurance workflow must remain read-only")
need("pages: write" not in workflow, "assurance workflow must not publish")
need("pull-requests: write" not in workflow, "assurance workflow must not mutate pull requests")
need("Upload branch assurance diagnostics" in workflow, "assurance diagnostics are not retained")
need("actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a" in workflow, "assurance artifact uploader is not pinned")
need("branch-assurance-report.md" in workflow and "branch-assurance-report.json" in workflow, "assurance report artifact paths are incomplete")

run = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_branch_assurance.py"), "--self-test"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
need(run.returncode == 0, f"verifier self-test failed: {(run.stderr or run.stdout).strip()}")

print("MouldMaster branch assurance QA passed (preview/main exact-push convergence is fail-closed and read-only)")

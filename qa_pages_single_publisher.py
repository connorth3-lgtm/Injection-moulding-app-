import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text(encoding="utf-8")
guard_path = ROOT / "tools" / "quarantine_legacy_pages.py"
guard = guard_path.read_text(encoding="utf-8")
verifier = (ROOT / "tools" / "verify_pages_deployment.py").read_text(encoding="utf-8")

publisher_block = workflow.split("  publisher-guard:", 1)[1].split("\n  build:", 1)[0]
need("needs:" not in publisher_block, "publisher guard must start independently so legacy cancellation is not delayed")

for marker in (
    "actions: write",
    "publisher-guard:",
    "Block competing legacy branch Pages publisher",
    "python3 tools/quarantine_legacy_pages.py",
    "needs: [production-source, publisher-guard]",
    "path: .pages-dist",
    "Verify deployment remains stable after race window",
    "--convergence-attempts 6",
):
    need(marker in workflow, f"Pages single-publisher workflow safeguard missing: {marker}")

need("path: .\n" not in workflow, "hardened Pages workflow must never upload the repository root")

for marker in (
    '"build_type": "workflow"',
    "dynamic/pages/pages-build-deployment",
    "/actions/runs/{run_id}/cancel",
    "/actions/runs/{run_id}/jobs",
    "jobs_report_successful_deploy",
    "already completed {DEPLOY_STEP_NAME}",
    "GitHub Pages remains configured for legacy branch publishing",
    "Production publication remains blocked",
    "workflow mode confirmed/selected and no successful legacy deploy detected",
    'shutil.which("gh")',
    'env["GH_TOKEN"] = token',
    '"gh",',
    '"api",',
    '"Accept: application/vnd.github+json"',
    "api_endpoint",
):
    need(marker in guard, f"legacy Pages fail-closed safeguard missing: {marker}")

for forbidden in (
    "legacy race contained for this SHA",
    "hardened deploy may proceed",
    "X-GitHub-Api-Version",
    "API_VERSION =",
    "urllib.request",
    "urlopen(",
    "Request(",
    'Authorization": f"Bearer',
):
    need(forbidden not in guard, f"legacy Pages guard unsafe/stale behavior returned: {forbidden}")

# Regression for the #195 incident: an overall workflow may later be labelled
# cancelled even though actions/deploy-pages already reported success. The guard must
# classify the successful deploy step as publication and fail closed.
spec = importlib.util.spec_from_file_location("quarantine_legacy_pages", guard_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
need(
    module.jobs_report_successful_deploy(
        {
            "jobs": [
                {
                    "name": "deploy",
                    "conclusion": "cancelled",
                    "steps": [
                        {"name": "Set up job", "conclusion": "success"},
                        {"name": "Deploy to GitHub Pages", "conclusion": "success"},
                    ],
                }
            ]
        }
    ),
    "cancelled legacy workflow with a successful Pages deploy step was misclassified as contained",
)
need(
    not module.jobs_report_successful_deploy(
        {
            "jobs": [
                {
                    "name": "deploy",
                    "conclusion": "cancelled",
                    "steps": [{"name": "Deploy to GitHub Pages", "conclusion": "cancelled"}],
                }
            ]
        }
    ),
    "cancelled-before-deploy fixture was falsely classified as a completed publication",
)

for marker in ("--convergence-attempts", "--convergence-delay", "FORBIDDEN_PROBES"):
    need(marker in verifier, f"live deployment verifier safeguard missing: {marker}")

print(
    "MouldMaster Pages single-publisher QA passed (workflow-mode release gate, "
    "successful legacy-deploy detection, earliest-start cancellation, production-only "
    "artifact, stable live verification)"
)

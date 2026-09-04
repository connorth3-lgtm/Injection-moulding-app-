import importlib.util
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text(encoding="utf-8")
guard_path = ROOT / "tools" / "quarantine_legacy_pages.py"
guard = guard_path.read_text(encoding="utf-8")
verifier = (ROOT / "tools" / "verify_pages_deployment.py").read_text(encoding="utf-8")
hold_builder_path = ROOT / "tools" / "build_pages_hold.py"
hold_builder = hold_builder_path.read_text(encoding="utf-8")
hold_verifier = (ROOT / "tools" / "verify_pages_hold.py").read_text(encoding="utf-8")

publisher_block = workflow.split("  publisher-guard:", 1)[1].split("\n  build:", 1)[0]
need("needs:" not in publisher_block, "publisher guard must start independently so legacy cancellation is not delayed")

for marker in (
    "actions: write",
    "publisher-guard:",
    "Block competing legacy branch Pages publisher",
    "python3 tools/quarantine_legacy_pages.py",
    "needs: [production-source, publisher-guard]",
    "Build release-hold Pages artifact",
    "python3 tools/build_pages_hold.py",
    "Upload production Pages artifact",
    "path: .pages-dist",
    "Upload release-hold Pages artifact",
    "path: .pages-hold",
    "Deploy selected Pages artifact",
    "Verify production deployment remains stable after race window",
    "Verify release-hold deployment removed legacy publication",
    "python3 tools/verify_pages_hold.py",
    "Verify release-hold remains stable after race window",
    "--convergence-attempts 6",
):
    need(marker in workflow, f"Pages single-publisher workflow safeguard missing: {marker}")

need("path: .\n" not in workflow, "hardened Pages workflow must never upload the repository root")
need(
    "if: github.event_name != 'pull_request' && steps.physical-readiness.outputs.production_ready != 'true'" in workflow,
    "pending main releases must select only the release-hold artifact",
)
need(
    "if: github.event_name == 'pull_request' || steps.physical-readiness.outputs.production_ready == 'true'" in workflow,
    "production app artifact must remain gated by PR validation or validated production readiness",
)
need(
    "if: github.event_name != 'pull_request'\n    needs: build" in workflow,
    "main Pages deploy must publish the already-selected production or release-hold artifact",
)

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

# The pending-release artifact is a deterministic, three-file quarantine site with no
# script/runtime references. It is allowed to overwrite stale Pages content, but it is
# never equivalent to production readiness.
hold_spec = importlib.util.spec_from_file_location("build_pages_hold", hold_builder_path)
hold_module = importlib.util.module_from_spec(hold_spec)
hold_spec.loader.exec_module(hold_module)
with tempfile.TemporaryDirectory() as tmp:
    target = Path(tmp) / "hold"
    files = hold_module.build(target)
    need(files == {"index.html", "404.html", ".nojekyll"}, "release-hold artifact must contain exactly three safe files")
    index = (target / "index.html").read_text(encoding="utf-8")
    need('data-mm-release-hold="true"' in index, "release-hold marker missing")
    need("No learner application runtime" in index, "release-hold boundary is not explicit")
    need("<script" not in index.lower() and "<link" not in index.lower(), "release-hold page must not load active assets")

for marker in (
    "ALLOWED_FILES",
    'data-mm-release-hold="true"',
    "No learner application runtime",
    "release-hold artifact boundary mismatch",
):
    need(marker in hold_builder, f"release-hold builder safeguard missing: {marker}")
for marker in (
    "FORBIDDEN_PATHS",
    "MouldMasterAcademy.exe",
    "MouldMaster_Academy_App.html",
    "tools/quarantine_legacy_pages.py",
    "qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md",
    "data/pwa-physical-device-validation-v1.json",
    "probe_status != 404",
    "release-hold root mismatch",
):
    need(marker in hold_verifier, f"release-hold live verifier safeguard missing: {marker}")

for marker in ("--convergence-attempts", "--convergence-delay", "FORBIDDEN_PROBES"):
    need(marker in verifier, f"live production deployment verifier safeguard missing: {marker}")

print(
    "MouldMaster Pages single-publisher QA passed (workflow-only source, successful legacy-deploy detection, "
    "earliest-start guard, production-runtime gate, deterministic release-hold quarantine and live 404 verification)"
)

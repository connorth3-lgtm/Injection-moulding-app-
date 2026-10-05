import importlib.util
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text(encoding="utf-8")
preview_workflow = (ROOT / ".github" / "workflows" / "preview-pages.yml").read_text(encoding="utf-8")
guard_path = ROOT / "tools" / "quarantine_legacy_pages.py"
guard = guard_path.read_text(encoding="utf-8")
verifier = (ROOT / "tools" / "verify_pages_deployment.py").read_text(encoding="utf-8")
hold_builder_path = ROOT / "tools" / "build_pages_hold.py"
hold_builder = hold_builder_path.read_text(encoding="utf-8")
hold_verifier = (ROOT / "tools" / "verify_pages_hold.py").read_text(encoding="utf-8")

publisher_block = workflow.split("  publisher-guard:", 1)[1].split("\n  build:", 1)[0]
need("needs:" not in publisher_block, "publisher guard must start independently so legacy cancellation is not delayed")

shared_publish_concurrency = "group: mouldmaster-pages-site-publish"
need(shared_publish_concurrency in workflow, "main Pages deploy must use the shared site-wide publication concurrency group")
need(shared_publish_concurrency in preview_workflow, "preview Pages deploy must use the shared site-wide publication concurrency group")
need("cancel-in-progress: false" in workflow, "main Pages publication must not be cancelled mid-deploy by a later run")
need("cancel-in-progress: false" in preview_workflow, "preview Pages publication must not be cancelled mid-deploy by a later run")
need(preview_workflow.count("pull-requests: read") >= 2, "preview build and deploy provenance checks require pull-request read permission")
for required in (
    "Require merged-PR preview provenance",
    "tools/verify_preview_source.py --self-test",
    '--source-sha "${{ github.sha }}"',
    "Recheck current merged preview provenance",
    "xs.sort(key=lambda x:",
    "retain-exact-candidate",
    '--expected-source-sha "${{ github.sha }}"',
):
    need(required in preview_workflow, f"preview Pages provenance/serialization safeguard missing: {required}")
need('--expected-source-sha "${{ github.sha }}"' in workflow, "main Pages live verification must bind to the exact deployed source SHA")

for marker in (
    "actions: write",
    "publisher-guard:",
    "Block competing legacy branch Pages publisher",
    "python3 tools/quarantine_legacy_pages.py",
    "needs: [production-source, publisher-guard]",
    "Build release-hold Pages artifact",
    "python3 tools/build_pages_hold.py",
    "Upload PR validation Pages artifact",
    "path: .pages-dist",
    "Upload preview-only release-hold Pages artifact",
    "path: .pages-hold",
    "Deploy selected Pages artifact",
    "Verify preview-only release-hold deployment",
    "Verify preview-only release-hold deployment",
    "python3 tools/verify_pages_hold.py",
    "Verify preview-only release-hold remains stable after race window",
    "--convergence-attempts 6",
):
    need(marker in workflow, f"Pages single-publisher workflow safeguard missing: {marker}")

need("path: .\n" not in workflow, "hardened Pages workflow must never upload the repository root")
need(
    "Upload preview-only release-hold Pages artifact" in workflow,
    "main Pages publication must select the preview-only release-hold artifact",
)
need(
    "if: github.event_name == 'pull_request'" in workflow,
    "direct learner artifact upload must be limited to PR validation and never selected for main publication",
)
need(
    "if: github.event_name != 'pull_request'\n    needs: build" in workflow,
    "main Pages deploy must publish the preview-only release-hold artifact",
)
need("production_ready == 'true'" not in workflow.split("      - name: Build release-hold Pages artifact",1)[1], "production readiness must not switch main publication away from preview-only mode")

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

# A hold without a staged preview remains the minimal three-file quarantine.
hold_spec = importlib.util.spec_from_file_location("build_pages_hold", hold_builder_path)
hold_module = importlib.util.module_from_spec(hold_spec)
hold_spec.loader.exec_module(hold_module)
with tempfile.TemporaryDirectory() as tmp:
    target = Path(tmp) / "hold"
    files = hold_module.build(target)
    expected = {"index.html", "404.html", "device-validation.html"}
    need(files == expected, "base release-hold artifact must contain exactly the two safe hold HTML files plus the local metadata helper")
    index = (target / "index.html").read_text(encoding="utf-8")
    helper = (target / "device-validation.html").read_text(encoding="utf-8")
    need('data-mm-release-hold="true"' in index, "release-hold marker missing")
    need("No learner application runtime" in index, "release-hold boundary is not explicit")
    need('href="device-validation.html"' in index, "release-hold page must link the device metadata helper")
    need("<script" not in index.lower() and "<link" not in index.lower(), "base release-hold page must not load active assets")
    need('data-mm-device-metadata-helper="true"' in helper, "device metadata helper marker missing")
    need("mouldmaster-on-device-metadata-helper" in helper, "device metadata helper output identity missing")
    need(not any(path.name.startswith(".") for path in target.iterdir()), "release-hold artifact must not rely on dotfiles excluded by the Pages upload action")

# When /preview/ is staged, the root may add exactly one migration-only service worker.
# This replaces older installed root workers, moves stale clients to /preview/, and never
# caches or serves learner assets itself.
with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    preview = root / "preview-source"
    preview.mkdir()
    (preview / "index.html").write_text("<!doctype html><html><head></head><body>preview</body></html>", encoding="utf-8")
    (preview / "manifest.webmanifest").write_text("{}", encoding="utf-8")
    (preview / "service-worker.js").write_text("self.addEventListener('fetch',()=>{});", encoding="utf-8")
    (preview / "version.json").write_text('{"web_release":"2026.10.05.1"}', encoding="utf-8")
    source_sha = "0123456789abcdef0123456789abcdef01234567"
    (preview / "deployment.json").write_text(
        '{"schema":3,"web_release":"2026.10.05.1","source_sha":"'+source_sha+'"}',
        encoding="utf-8",
    )
    (preview / "pages-manifest.json").write_text(
        '{"schema":3,"web_release":"2026.10.05.1","source_sha":"'+source_sha+'","assets":{"index.html":{},"version.json":{},"service-worker.js":{},"deployment.json":{}}}',
        encoding="utf-8",
    )
    target = root / "hold"
    files = hold_module.build(target, preview_source=preview)
    root_files = {path.name for path in target.iterdir() if path.is_file()}
    need(
        root_files == {"index.html", "404.html", "device-validation.html", "service-worker.js"},
        "preview release-hold root must add only the migration worker to the three safe hold files",
    )
    need("preview/index.html" in files and "preview/service-worker.js" in files, "preview runtime was not staged under /preview/")
    preview_index_path = target / "preview" / "index.html"
    preview_index = preview_index_path.read_text(encoding="utf-8")
    staged_manifest = __import__("json").loads((target / "preview" / "pages-manifest.json").read_text(encoding="utf-8"))
    staged_index_record = staged_manifest["assets"]["index.html"]
    staged_index_bytes = preview_index_path.read_bytes()
    need(staged_index_record["bytes"] == len(staged_index_bytes), "staged preview manifest index byte count was not rebound")
    need(staged_index_record["sha256"] == __import__("hashlib").sha256(staged_index_bytes).hexdigest(), "staged preview manifest index SHA-256 was not rebound")
    need(f'<meta name="mm-preview-source-sha" content="{source_sha}">' in preview_index, "staged preview HTML missing exact source SHA provenance")
    need('<meta name="mm-preview-web-release" content="2026.10.05.1">' in preview_index, "staged preview HTML missing release provenance")
    index = (target / "index.html").read_text(encoding="utf-8")
    worker = (target / "service-worker.js").read_text(encoding="utf-8")
    need('data-mm-release-hold-migration="true"' in index, "release-hold root must register the migration worker")
    need('data-mm-preview-autoforward="true"' in index, "release-hold root must auto-forward normal browser visits to /preview/")
    need("location.replace(preview.href)" in index, "release-hold root preview forwarding must use location.replace")
    need(index.count("<script") == 1 and "<script src=" not in index.lower(), "release-hold root may contain only one inline migration/preview-forward bootstrap")
    for marker in (
        "MouldMaster release-hold migration worker",
        "./preview/",
        "self.skipWaiting()",
        "self.clients.claim()",
        "client.navigate(preview.href)",
        "Response.redirect(previewUrl().href,302)",
    ):
        need(marker in worker, f"stale-PWA migration worker missing: {marker}")
    need("caches.open" not in worker.lower() and ".put(" not in worker.lower(), "migration worker must not own learner caches")
    need("MouldMaster_Core_App" not in worker, "migration worker must not serve learner runtime")

for marker in (
    'ALLOWED_FILES = {"index.html", "404.html", "device-validation.html"}',
    'MIGRATION_FILE = "service-worker.js"',
    'MIGRATION_REGISTER_MARKER = \'data-mm-release-hold-migration="true"\'',
    'PREVIEW_FORWARD_MARKER = \'data-mm-preview-autoforward="true"\'',
    'MIGRATION_WORKER_MARKER = "MouldMaster release-hold migration worker"',
    "validate_migration_worker(worker_payload)",
    'HELPER_MARKER = \'data-mm-device-metadata-helper="true"\'',
    "validate_helper(helper_payload)",
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
    'fetch(urljoin(root, "service-worker.js"))',
    "release-hold migration worker mismatch",
    'fetch(urljoin(root, "device-validation.html"))',
    "device metadata helper violates local-only boundary",
    "critical_assets",
    "preview pages-manifest has no hash record for critical asset",
    "Rebind the copied manifest's index.html integrity record",
    'assets["index.html"] = {',
    "critical preview asset byte-size mismatch",
    "critical preview asset SHA-256 mismatch",
):
    need(marker in hold_verifier, f"release-hold live verifier safeguard missing: {marker}")

for marker in ("--convergence-attempts", "--convergence-delay", "FORBIDDEN_PROBES"):
    need(marker in verifier, f"live production deployment verifier safeguard missing: {marker}")

print(
    "MouldMaster Pages publisher-governance QA passed (serialized main/preview deployers, merged-PR preview provenance, exact deployed-source verification, workflow-only source, successful legacy-deploy detection, "
    "earliest-start guard, preview-only main publication, minimal base hold plus stale-root-PWA migration with /preview/ staged, "
    "root-to-preview Home forwarding, local-only metadata helper, live critical-byte SHA-256 verification, and live 404 verification)"
)

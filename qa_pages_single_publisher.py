from pathlib import Path

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text(encoding="utf-8")
guard = (ROOT / "tools" / "quarantine_legacy_pages.py").read_text(encoding="utf-8")
verifier = (ROOT / "tools" / "verify_pages_deployment.py").read_text(encoding="utf-8")
source_gate = (ROOT / "tools" / "verify_production_source.py").read_text(encoding="utf-8")
physical_gate = (ROOT / "tools" / "verify_pwa_physical_evidence.py").read_text(encoding="utf-8")
physical_template = ROOT / "qa" / "pwa-physical-validation.example.json"
physical_checklist = ROOT / "qa" / "PWA_PHYSICAL_DEVICE_CHECKLIST.md"

for marker in (
    "actions: write",
    "pull-requests: read",
    "publisher-guard:",
    "Require protected fully validated production source",
    "python3 tools/verify_production_source.py --evidence-out production-source-evidence.json",
    "Contain competing legacy branch Pages publisher",
    "python3 tools/quarantine_legacy_pages.py",
    "needs: publisher-guard",
    "Validate physical PWA evidence template",
    "Require current physical iOS and Android PWA evidence",
    "python3 tools/verify_pwa_physical_evidence.py",
    "Verify physical evidence still matches rebuilt runtime",
    "path: .pages-dist",
    "Verify deployment remains stable after race window",
    "--convergence-attempts 6",
):
    need(marker in workflow, f"Pages single-publisher workflow safeguard missing: {marker}")

need("path: .\n" not in workflow, "hardened Pages workflow must never upload the repository root")
need("if: github.event_name != 'pull_request'" in workflow, "production-only gates must not turn PR artifact validation into a deployment")

for marker in (
    '"build_type": "workflow"',
    "dynamic/pages/pages-build-deployment",
    "/actions/runs/{run_id}/cancel",
    "legacy race contained for this SHA",
):
    need(marker in guard, f"legacy Pages containment safeguard missing: {marker}")

for marker in ("--convergence-attempts", "--convergence-delay", "FORBIDDEN_PROBES"):
    need(marker in verifier, f"live deployment verifier safeguard missing: {marker}")

for marker in (
    "Protect main — MouldMaster required gates",
    "required_review_thread_resolution",
    "REQUIRED_WORKFLOWS",
    "current main SHA is not uniquely attributable",
    "exact merged PR head is not fully green",
):
    need(marker in source_gate, f"production-source governance gate missing: {marker}")

for marker in (
    "runtime_fingerprint",
    "deployment.json",
    "pages-manifest.json",
    "MAX_AGE_DAYS = 30",
    "IOS_CHECKS",
    "ANDROID_CHECKS",
    "evidence status must be pass",
):
    need(marker in physical_gate, f"physical PWA release-evidence gate missing: {marker}")
need(physical_template.is_file(), "physical PWA evidence template missing")
need(physical_checklist.is_file(), "physical PWA validation checklist missing")

print(
    "MouldMaster Pages single-publisher QA passed "
    "(protected merged-PR source, physical iOS/Android evidence, legacy race containment, production-only artifact, stable live verification)"
)

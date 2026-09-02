from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


def text(path):
    return (ROOT / path).read_text(encoding="utf-8")


# One governance source of truth only. The reviewed helper lives under .github
# and production publishers must consume the same verifier rather than cloning
# weaker rules in separate workflows.
need(not (ROOT / "BRANCH_PROTECTION.md").exists(), "duplicate root branch-protection policy must not return")
for path in (
    ".github/MAIN_PROTECTION.md",
    ".github/scripts/apply-main-ruleset.sh",
    ".github/workflows/branch-protection-audit.yml",
    ".github/workflows/main-pr-provenance-guard.yml",
    "tools/verify_production_source.py",
):
    need((ROOT / path).is_file(), f"production governance file missing: {path}")

source_gate = text("tools/verify_production_source.py")
for marker in (
    'RULESET_NAME = "Protect main — MouldMaster required gates"',
    '"integrity"',
    '"mobile-browser"',
    '"build-windows"',
    '"question-quality-50-pass"',
    '"required_review_thread_resolution"',
    '"bypass_actors"',
    '"required_linear_history"',
    '"strict_required_status_checks_policy"',
    '"MouldMaster Release QA"',
    '"Question Quality 50-Pass"',
    '"Mobile Browser QA"',
    '"Open Desktop Build"',
    '"Desktop Dependency Lock"',
    '"Research Utilisation QA"',
    '"Connected Process Data QA"',
    '"MouldMaster Maturity Hardening v2"',
    '"MouldMaster Deep Dive v2 QA"',
    '"MouldMaster Real Site Pilot Preflight"',
    '"Production Observability QA"',
    '"Read Aloud QA"',
    '"MouldMaster Specialist Evidence Gaps"',
    '"MouldMaster Evidence Scale Overlay QA"',
    '"Deploy MouldMaster to GitHub Pages"',
    "current main SHA is not uniquely attributable to one merged pull request",
    "exact merged PR head is not fully green",
):
    need(marker in source_gate, f"production source gate missing invariant: {marker}")

helper = text(".github/scripts/apply-main-ruleset.sh")
for marker in (
    '"required_review_thread_resolution": true',
    '"bypass_actors": []',
    '"strict_required_status_checks_policy": true',
    "tools/verify_production_source.py --protection-only",
):
    need(marker in helper, f"main ruleset helper missing reviewed invariant: {marker}")

protection_audit = text(".github/workflows/branch-protection-audit.yml")
need("python3 tools/verify_production_source.py --protection-only" in protection_audit,
     "scheduled branch-protection audit must use the canonical live verifier")

# Production Pages is allowed to build in PRs, but it may not publish from an
# unprotected/unvalidated main or without fresh physical iOS + Android evidence
# tied to the actual public runtime bytes.
pages = text(".github/workflows/pages.yml")
for marker in (
    "pull-requests: read",
    "Require protected fully validated production source",
    "python3 tools/verify_production_source.py --evidence-out production-source-evidence.json",
    "Require current physical iOS and Android PWA evidence",
    "qa/pwa-physical-validation.json",
    "Verify physical evidence still matches rebuilt runtime",
    "github.event_name != 'pull_request'",
):
    need(marker in pages, f"production Pages gate missing: {marker}")

physical_gate = text("tools/verify_pwa_physical_evidence.py")
for marker in (
    'EXCLUDED = {"deployment.json", "pages-manifest.json"}',
    "MAX_AGE_DAYS = 30",
    "IOS_CHECKS",
    "ANDROID_CHECKS",
    "runtime_fingerprint",
    "evidence status must be pass",
    "physical evidence contains unresolved failures",
    "physical evidence is stale",
):
    need(marker in physical_gate, f"physical PWA evidence verifier missing invariant: {marker}")

template_path = ROOT / "qa" / "pwa-physical-validation.example.json"
need(template_path.is_file(), "physical PWA evidence template missing")
template = json.loads(template_path.read_text(encoding="utf-8"))
need(template.get("schema") == 1 and template.get("status") == "pending", "physical evidence template must remain explicitly pending")
need(all(v == "pending" for v in template["ios"]["checks"].values()), "iOS example checks must not fabricate passes")
need(all(v == "pending" for v in template["android"]["checks"].values()), "Android example checks must not fabricate passes")
need(not (ROOT / "qa" / "pwa-physical-validation.json").exists(),
     "do not commit fabricated physical-device pass evidence; add the real file only after both devices were tested")

# PR/test Windows builds remain usable without production secrets. Public
# production publication must use two trust domains: a read-only signed-build
# job and a tiny write-capable publish job. Signing secrets are scoped only to
# the readiness/signing invocation and electron-builder itself; they must not be
# job-global, QA-global or available to the release publication step.
publish = text(".github/workflows/publish-open-desktop.yml")
for marker in (
    "permissions:\n  contents: read",
    "build-signed-windows:",
    "publish-release:",
    "needs: build-signed-windows",
    "persist-credentials: false",
    "contents: read\n      pull-requests: read\n      actions: read",
    "contents: write\n      actions: read",
    "actions/upload-artifact@v7",
    "actions/download-artifact@v7",
    "Require protected fully validated production source",
    "tools/verify_production_source.py --evidence-out desktop/electron/generated/production-source-evidence.json",
    "Generate integrity, licence and SBOM evidence",
    "Require production signing credentials",
    "Desktop package QA without signing secrets",
    "Build signed portable Windows package",
    "npx electron-builder --win portable",
    "Re-verify transferred signed release evidence",
    "Get-AuthenticodeSignature",
    "$signature.Status -ne 'Valid'",
    "TimeStamperCertificate",
    "Transferred executable hash does not match Authenticode evidence",
    "Transferred executable failed independent Authenticode verification",
    "authenticode-status.json",
    "production-source-evidence.json",
    "signing-status.json",
    "Publish one-shot release without asset replacement",
):
    need(marker in publish, f"production Windows release gate missing: {marker}")

need(publish.count("contents: write") == 1,
     "production desktop workflow must grant contents:write only to the publish job")
need(publish.count("secrets.WINDOWS_CSC_LINK") == 2,
     "Windows signing certificate secret must be scoped only to readiness and electron-builder steps")
need(publish.count("secrets.WINDOWS_CSC_KEY_PASSWORD") == 2,
     "Windows signing password secret must be scoped only to readiness and electron-builder steps")
need(publish.count("GH_TOKEN: ${{ github.token }}") == 1,
     "release write token must be exposed only to the one-shot publication step")
need("env:\n      MM_REQUIRE_WINDOWS_SIGNING" not in publish,
     "production signing secrets/requirement must not return as job-global environment")
for forbidden in (
    "Build unsigned portable Windows package",
    "This unsigned GitHub release is intended",
    "npm run dist:portable",
):
    need(forbidden not in publish, f"unsafe or over-broad production desktop build path returned: {forbidden}")

signing = text("desktop/electron/scripts/signing-status.cjs")
need("required&&!configured" in signing, "desktop signing readiness must fail closed when production signing is required")
need("PR/development build may be unsigned" in signing, "test/PR unsigned boundary must remain explicit")

print(
    "MouldMaster production release gates QA passed: native main governance, exact merged-PR validation, "
    "physical iOS/Android PWA evidence and least-privilege timestamped Windows Authenticode publication are fail-closed production requirements."
)

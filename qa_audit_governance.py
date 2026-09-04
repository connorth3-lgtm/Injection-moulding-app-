from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parent


def text(path):
    return (ROOT / path).read_text(encoding="utf-8")


def need(ok, message):
    if not ok:
        raise AssertionError(message)


pages = text(".github/workflows/pages.yml")
physical = text("tools/verify_pwa_physical_evidence.py")
hold_builder = text("tools/build_pages_hold.py")
hold_verifier = text("tools/verify_pages_hold.py")
pruner = text(".github/workflows/prune-merged-branches.yml")
ruleset = text("tools/verify_main_ruleset.py")
attestation = json.loads(text(".github/main-ruleset-attestation.json"))

# Pages permissions are deny-by-default and granted only per job.
need("name: MouldMaster Pages Release Readiness" in pages, "Pages workflow name does not describe release-readiness policy")
need("permissions: {}" in pages, "Pages workflow must deny token permissions by default")
for marker in (
    "production-source:\n    permissions:\n      contents: read\n      pull-requests: read\n      actions: read",
    "publisher-guard:\n    permissions:\n      contents: read\n      actions: write\n      pages: write",
    "build:\n    permissions:\n      contents: read",
    "deploy:\n    permissions:\n      pages: write\n      id-token: write",
    "verify:\n    permissions:\n      contents: read",
):
    need(marker in pages, f"Pages job-scoped permission contract missing: {marker}")
need(pages.count("actions: write") == 1, "actions:write must be limited to the publisher guard")
need(pages.count("pages: write") == 2, "pages:write must be limited to publisher containment and deploy")
need(pages.count("id-token: write") == 1, "OIDC write permission must be limited to deploy")

# PRs may validate a pending evidence contract. On main, pending valid evidence never
# publishes the learner application. Instead a deterministic two-file release-hold
# artifact (index.html + 404.html) quarantines the Pages origin and removes stale
# legacy/non-public content. Invalid, stale or mismatched validated evidence must
# still fail the build.
for marker in (
    "Validate physical PWA evidence contract on PRs",
    "--contract-only",
    "Report exact public-runtime fingerprint for physical-device validation",
    "--artifact .pages-dist --print-fingerprint",
    "Evaluate physical-device production readiness",
    'production_ready: ${{ steps.physical-readiness.outputs.production_ready }}',
    'id: physical-readiness',
    'if [[ "$status" == "validated" ]]; then',
    "--artifact .pages-dist --require-validated",
    'echo "production_ready=true" >> "$GITHUB_OUTPUT"',
    'echo "production_ready=false" >> "$GITHUB_OUTPUT"',
    "Pages application release not ready",
    "The learner application will not be published. A minimal release-hold site is used only to quarantine the Pages origin",
    "needs: [production-source, publisher-guard]",
    "Build release-hold Pages artifact",
    "python3 tools/build_pages_hold.py",
    "Upload production Pages artifact",
    "github.event_name == 'pull_request' || steps.physical-readiness.outputs.production_ready == 'true'",
    "Upload release-hold Pages artifact",
    "github.event_name != 'pull_request' && steps.physical-readiness.outputs.production_ready != 'true'",
    "path: .pages-hold",
    "if: github.event_name != 'pull_request'\n    needs: build",
    "Reconfirm validated physical PWA evidence against rebuilt runtime",
    "Verify release-hold deployment removed legacy publication",
    "python3 tools/verify_pages_hold.py",
):
    need(marker in pages, f"physical-device release policy missing from Pages workflow: {marker}")
for marker in (
    'parser.add_argument("--require-validated", action="store_true")',
    'if args.require_validated and data["status"] != "validated":',
    "validated physical iOS/iPadOS and Android evidence is required for production publication",
):
    need(marker in physical, f"physical-device verifier does not fail closed for production app publication: {marker}")

# Pending evidence must never select the learner application artifact for a main deploy.
false_index = pages.index('echo "production_ready=false" >> "$GITHUB_OUTPUT"')
hold_index = pages.index("- name: Build release-hold Pages artifact")
need(false_index < hold_index, "pending readiness decision must occur before release-hold construction")
need(
    "if: github.event_name == 'pull_request' || steps.physical-readiness.outputs.production_ready == 'true'" in pages,
    "production app artifact must require PR validation or validated production readiness",
)
need(
    "if: github.event_name != 'pull_request' && steps.physical-readiness.outputs.production_ready != 'true'" in pages,
    "pending main release must select the quarantine artifact",
)
for marker in (
    'ALLOWED_FILES = {"index.html", "404.html"}',
    "Pages upload action excludes dotfiles",
    "No learner application runtime",
    "release-hold artifact boundary mismatch",
):
    need(marker in hold_builder, f"release-hold builder does not enforce the exact deployed public boundary: {marker}")
for marker in (
    "FORBIDDEN_PATHS",
    "MouldMasterAcademy.exe",
    "tools/quarantine_legacy_pages.py",
    "probe_status != 404",
):
    need(marker in hold_verifier, f"release-hold live verifier does not prove stale content removal: {marker}")

# Branch deletion must reconfirm the ref has not moved after safety evaluation.
for marker in (
    "live_sha=$(gh api \"repos/$GH_REPO/git/ref/heads/$branch\" --jq '.object.sha' 2>/dev/null || true)",
    '[[ -z "$live_sha" || "$live_sha" != "$sha" ]]',
    "Keeping branch whose head moved during prune evaluation",
    "live SHA rechecked",
):
    need(marker in pruner, f"branch-prune live-SHA recheck missing: {marker}")

# Ruleset bypass verification must fail closed. If GitHub Actions redacts the
# bypass_actors field, only an administrator-verified attestation tied to the
# exact live ruleset id + updated_at instant may cover that API limitation.
for marker in (
    'bypass = detail.get("bypass_actors", "__missing__")',
    'if bypass != []:',
    "bypass_actors must be present and empty",
    "ATTESTATION_PATH",
    'attestation.get("ruleset_id") != detail.get("id")',
    "normalized_timestamp",
    'normalized_timestamp(attestation.get("ruleset_updated_at"))',
    'missing_bypass.pop("bypass_actors")',
    'null_bypass["bypass_actors"] = None',
    "equivalent timestamp offsets must match the same ruleset update instant",
    "stale bypass attestation must fail closed",
    "malformed bypass attestation timestamp must fail closed",
):
    need(marker in ruleset, f"ruleset bypass fail-closed contract missing: {marker}")
need(attestation.get("schema") == 1, "ruleset attestation schema must be 1")
need(attestation.get("source") == "admin-verified-ruleset-detail", "ruleset attestation must identify administrator-readable source")
need(attestation.get("repository") == "connorth3-lgtm/Injection-moulding-app-", "ruleset attestation repository mismatch")
need(attestation.get("ruleset_id") == 22155472, "ruleset attestation must identify the verified live ruleset")
need(attestation.get("ruleset_updated_at") == "2026-09-04T14:28:19.562+12:00", "ruleset attestation must be bound to the verified live ruleset version")
need(attestation.get("bypass_actors") == [], "ruleset attestation must explicitly record no bypass actors")
need(attestation.get("current_user_can_bypass") == "never", "ruleset attestation must record no current-user bypass")

self_test = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_main_ruleset.py"), "--self-test"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
need(self_test.returncode == 0, f"ruleset verifier self-test failed: {self_test.stderr or self_test.stdout}")

print("Audit governance QA passed: least-privilege Pages permissions, physical-test runtime fingerprint reporting, production-app fail-closed gating with exact two-file release-hold quarantine, live branch-prune SHA recheck and fail-closed ruleset bypass verification are enforced.")

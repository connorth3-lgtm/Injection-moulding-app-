from pathlib import Path
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
pruner = text(".github/workflows/prune-merged-branches.yml")
ruleset = text("tools/verify_main_ruleset.py")

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

# PRs may validate a pending evidence contract, but production publication must
# fail closed until exact-runtime physical iOS/iPadOS and Android evidence is validated.
for marker in (
    "Validate physical PWA evidence contract on PRs",
    "--contract-only",
    "Require validated physical iOS and Android evidence for production publication",
    "--artifact .pages-dist --require-validated",
    "Reconfirm validated physical PWA evidence against rebuilt runtime",
):
    need(marker in pages, f"physical-device release policy missing from Pages workflow: {marker}")
for marker in (
    'parser.add_argument("--require-validated", action="store_true")',
    'if args.require_validated and data["status"] != "validated":',
    "validated physical iOS/iPadOS and Android evidence is required for production publication",
):
    need(marker in physical, f"physical-device verifier does not fail closed for publication: {marker}")

# Branch deletion must reconfirm the ref has not moved after safety evaluation.
for marker in (
    'live_sha=$(gh api "repos/$GH_REPO/git/ref/heads/$branch" --jq ".object.sha" 2>/dev/null || true)',
    '[[ -z "$live_sha" || "$live_sha" != "$sha" ]]',
    "Keeping branch whose head moved during prune evaluation",
    "live SHA rechecked",
):
    need(marker in pruner, f"branch-prune live-SHA recheck missing: {marker}")

# Ruleset bypass verification must require an explicit empty list; missing/null
# API data is not equivalent to verified absence of bypass actors.
for marker in (
    'bypass = detail.get("bypass_actors", "__missing__")',
    'if bypass != []:',
    "bypass_actors must be present and empty",
    'missing_bypass.pop("bypass_actors")',
    'null_bypass["bypass_actors"] = None',
):
    need(marker in ruleset, f"ruleset bypass fail-closed contract missing: {marker}")

self_test = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_main_ruleset.py"), "--self-test"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
need(self_test.returncode == 0, f"ruleset verifier self-test failed: {self_test.stderr or self_test.stdout}")

print("Audit governance QA passed: least-privilege Pages permissions, validated physical-device publication gate, live branch-prune SHA recheck and fail-closed bypass verification are enforced.")

from pathlib import Path

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text(encoding="utf-8")
guard = (ROOT / "tools" / "quarantine_legacy_pages.py").read_text(encoding="utf-8")
verifier = (ROOT / "tools" / "verify_pages_deployment.py").read_text(encoding="utf-8")

for marker in (
    "actions: write",
    "publisher-guard:",
    "Contain competing legacy branch Pages publisher",
    "python3 tools/quarantine_legacy_pages.py",
    "needs: publisher-guard",
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
    "legacy race contained for this SHA",
    'shutil.which("gh")',
    'env["GH_TOKEN"] = token',
    '"gh",',
    '"api",',
    '"Accept: application/vnd.github+json"',
    "api_endpoint",
):
    need(marker in guard, f"legacy Pages containment safeguard missing: {marker}")

for forbidden in (
    "X-GitHub-Api-Version",
    "API_VERSION =",
    "urllib.request",
    "urlopen(",
    "Request(",
    'Authorization": f"Bearer',
):
    need(forbidden not in guard, f"legacy Pages guard transport divergence returned: {forbidden}")

for marker in ("--convergence-attempts", "--convergence-delay", "FORBIDDEN_PROBES"):
    need(marker in verifier, f"live deployment verifier safeguard missing: {marker}")

print("MouldMaster Pages single-publisher QA passed (unified gh api transport, legacy race containment, production-only artifact, stable live verification)")

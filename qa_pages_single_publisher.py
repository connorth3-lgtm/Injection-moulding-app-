from pathlib import Path

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text(encoding="utf-8")
guard = (ROOT / "tools" / "quarantine_legacy_pages.py").read_text(encoding="utf-8")
verifier = (ROOT / "tools" / "verify_pages_deployment.py").read_text(encoding="utf-8")

for marker in (
    "publisher-guard:",
    "pr-publisher-boundary:",
    "Contain competing legacy branch Pages publisher",
    "python3 tools/quarantine_legacy_pages.py",
    "needs: [production-source, publisher-guard, pr-publisher-boundary]",
    "path: .pages-dist",
    "Verify deployment remains stable after race window",
    "--convergence-attempts 6",
):
    need(marker in workflow, f"Pages single-publisher workflow safeguard missing: {marker}")

need("permissions:\n  contents: read\n\nconcurrency:" in workflow,
     "Pages workflow must default to read-only repository permissions")
need("publisher-guard:\n    if: github.event_name != 'pull_request'" in workflow,
     "privileged Pages publisher guard must never run on pull_request")
need("publisher-guard:\n    if: github.event_name != 'pull_request'\n    needs: production-source\n    permissions:\n      contents: read\n      actions: write\n      pages: write" in workflow,
     "publisher guard must hold only the write capabilities needed for legacy containment")
need("pr-publisher-boundary:\n    if: github.event_name == 'pull_request'\n    needs: production-source\n    permissions:\n      contents: read" in workflow,
     "PR Pages boundary job must remain read-only")
need("build:\n    if: >-" in workflow and "permissions:\n      contents: read\n    runs-on: ubuntu-latest" in workflow,
     "PR-controlled Pages build must have read-only repository permissions")
need("deploy:\n    if: github.event_name != 'pull_request'" in workflow,
     "Pages deployment must remain push/manual only")
need("pages: write\n      id-token: write" in workflow,
     "deployment job must scope Pages/OIDC write permission explicitly")
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

print("MouldMaster Pages single-publisher QA passed (least-privilege PR build, isolated publisher writes, unified gh api transport, legacy race containment, production-only artifact, stable live verification)")

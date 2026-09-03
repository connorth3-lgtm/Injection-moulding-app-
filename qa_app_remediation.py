from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


def text(path):
    return (ROOT / path).read_text(encoding="utf-8")


def worker_assets(source, name):
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*\[(.*?)\]\s*;", source, re.S)
    need(match is not None, f"service-worker asset array missing: {name}")
    return set(re.findall(r"['\"](\./[^'\"]+)['\"]", match.group(1)))


index = text("index.html")
pwa = text("pwa-shell.js")
worker = text("service-worker.js")
materials = text("src/domains/materials/material-registry.js")
engineering = text("src/domains/engineering/engineering-store.js")
workspace = text("mould-master-workspace.js")
a11y = text("accessibility-hardening.js")
pages = text(".github/workflows/pages.yml")
main_guard = text(".github/workflows/main-pr-provenance-guard.yml")
production_source = text("tools/verify_production_source.py")
mobile = text(".github/workflows/mobile-browser-qa.yml")
desktop_pkg = json.loads(text("desktop/electron/package.json"))
integrity_script = text("desktop/electron/scripts/generate-integrity.cjs")
manifest = json.loads(text("runtime-domain-manifest.json"))

# PWA/browser lifecycle: browser use must never remove the installed app's shared origin state.
for forbidden in ("retireBrowserOfflineRuntime", ".unregister()", "mmFresh"):
    need(forbidden not in pwa, f"PWA shell still contains destructive browser cache lifecycle marker: {forbidden}")
for forbidden in ("ensureCoherentRuntime", ".unregister()", "mmBundle"):
    need(forbidden not in index, f"index bootstrap still contains destructive service-worker reset marker: {forbidden}")
need("MM_BROWSER_UPDATE_MODE='shared-origin-service-worker'" in pwa, "browser/PWA shared service-worker mode is not explicit")
need("serviceWorker.register('./service-worker.js'" in pwa, "same-origin service worker is no longer registered by the shell")

# Legacy recovery files may remain documented/source-only, but current web/desktop products cannot ship them.
public_worker_assets = worker_assets(worker, "CORE") | worker_assets(worker, "OPTIONAL")
need("./MouldMaster_Academy_App.html" not in public_worker_assets, "frozen legacy Academy app remains in current PWA cache")
need("./MouldMasterAcademy.exe" not in public_worker_assets, "legacy recovery executable must never be a PWA asset")
need("MouldMaster_Academy_App.html" not in integrity_script, "frozen legacy Academy app remains in desktop integrity set")
extra = desktop_pkg["build"]["extraResources"]
need("../../MouldMaster_Academy_App.html" not in {x.get("from") for x in extra if isinstance(x, dict)}, "frozen legacy Academy app remains in desktop package")

# Engineering cases have one live authority: owner-scoped IndexedDB. Legacy localStorage is import-only.
for marker in (
    "Engineering case belongs to a different learner profile",
    "String(record.learnerToken)===tokenValue(token)",
    "learnerToken:owner",
    "importLegacyCases",
    "if(prior?.complete)return",
    "preservedExisting",
    "destructive:false",
    "repairLegacyLinkOwnership",
):
    need(marker in engineering, f"engineering learner/case invariant missing: {marker}")
need("syncLegacySnapshot" not in engineering, "engineering store still exposes live legacy snapshot parity")
need(not (ROOT / "src/domains/engineering/store-bridge.js").exists(), "retired engineering store bridge still exists")
for marker in (
    "MM_ENGINEERING_STORE",
    "await store.saveCase(c,{token:owner})",
    "await store.deleteCase(id,owner)",
    "canonicalStore:'indexeddb-v2'",
    "legacy localStorage is migration input only",
    "hydratedLearnerToken",
    "store.learnerToken()",
):
    need(marker in workspace, f"Mould Master canonical IndexedDB contract missing: {marker}")
for forbidden in (
    "localStorage.getItem(",
    "localStorage.setItem(",
    "localStorage.removeItem(",
    "localStorage.clear(",
    "mm:mould-master-cases-changed",
    "publishCasesChanged",
    "STORAGE_BASE",
):
    need(forbidden not in workspace, f"Mould Master workspace still writes/coordinates a second live store: {forbidden}")
need("await workspace.newCase" in materials and "materialGradeId" in materials and "linkCaseMaterial" in materials, "exact material case creation is not durably linked through the canonical case store")
assets = manifest.get("assets", [])
need("./src/domains/engineering/engineering-store.js" in assets, "engineering store missing from domain manifest")
need("./src/domains/engineering/store-bridge.js" not in assets, "retired engineering bridge remains in domain manifest")
need("./src/domains/engineering/store-bridge.js" not in public_worker_assets, "retired engineering bridge remains in PWA runtime")
need("src/domains/engineering/store-bridge.js" not in integrity_script, "retired engineering bridge remains in Desktop integrity runtime")

# Material variants/revisions must not collapse on display grade name alone.
compiler = text("tools/material_catalog.py")
for marker in ("identity_payload", "material_identity_key", "regionalVariant", "formulationRevision", "productionPlant", "sourceRevisions"):
    need(marker in compiler, f"variant-safe material identity marker missing: {marker}")
schema = json.loads(text("data/materials/material-grade.schema.json"))
need("identity" in schema["properties"], "material schema missing identity variant object")
need("production" in schema["properties"], "material schema missing production provenance object")

# Production publication must be gated before Pages publisher/deploy work begins.
for marker in (
    "production-source:",
    "tools/verify_production_source.py",
    "Require merged-PR provenance before publication",
    "needs: production-source",
):
    need(marker in pages, f"Pages pre-deploy provenance gate missing: {marker}")
run = subprocess.run(["python", "tools/verify_production_source.py", "--self-test"], cwd=ROOT, capture_output=True, text=True)
need(run.returncode == 0, f"production-source verifier self-test failed: {run.stdout}\n{run.stderr}")

# The exact Pages Actions token/request contract must be exercised before merge against
# the current main base commit, not discovered for the first time after a squash merge.
for marker in (
    "Validate production-source guard and live API contract on PRs",
    'GITHUB_TOKEN: ${{ github.token }}',
    '--source-sha "${{ github.event.pull_request.base.sha }}"',
    "contents: read",
    "pull-requests: read",
    "actions: read",
):
    need(marker in pages, f"Pages live provenance preflight missing: {marker}")

# Pages and the post-merge guard must use the same GitHub CLI API negotiation contract.
# The verifier may not add a separate REST-version header or raw HTTP transport.
for marker in (
    'shutil.which("gh")',
    'env["GH_TOKEN"] = token',
    '"gh",',
    '"api",',
    '"Accept: application/vnd.github+json"',
    "api_endpoint",
    'parsed.netloc != "api.github.com"',
):
    need(marker in production_source, f"production-source canonical GitHub CLI transport missing: {marker}")
for forbidden in (
    "X-GitHub-Api-Version",
    "API_VERSION =",
    "urllib.request",
    "urlopen(",
    "Request(",
    'Authorization": f"Bearer',
):
    need(forbidden not in production_source, f"production-source transport divergence returned: {forbidden}")
need("gh api" in main_guard, "post-merge provenance guard must retain GitHub CLI API transport")

# Production provenance cannot rely on the eventually-consistent commit->PR index alone.
# Both publication and the post-merge guard independently inspect recently closed main PRs,
# accept one exact merged candidate, and deduplicate the same PR observed through both endpoints.
for marker in (
    "PROVENANCE_ATTEMPTS = 20",
    "RECENT_MAIN_PULL_LIMIT = 100",
    "matching_merged_prs",
    "unique_matching_merged_prs",
    "resolve_merged_pr",
    '"state": "closed"',
    '"base": "main"',
    '"sort": "updated"',
    '"direction": "desc"',
    "commits/{source_sha}/pulls",
    "pulls?{recent_query}",
    "len(matches) > 1",
    "merge_commit_sha",
    "time.sleep(3)",
):
    need(marker in production_source, f"production-source cross-index provenance guard missing: {marker}")

for marker in (
    "for attempt in {1..20}",
    "associated_json",
    "recent_main_json",
    "state=closed&base=main&sort=updated&direction=desc&per_page=100",
    "unique_by(.number)",
    "match_count",
    "ambiguously attributable",
    "Exact merged-PR provenance is not visible through either GitHub index yet",
    "merge_commit_sha == $sha",
):
    need(marker in main_guard, f"post-merge cross-index provenance guard missing: {marker}")

# Browser matrix and lifecycle regression coverage.
for marker in ("chromium firefox webkit", "playwright.cross-browser.config.cjs", "qa/pwa-lifecycle.spec.js", "qa/cross-browser-smoke.spec.js"):
    need(marker in mobile, f"browser-matrix QA coverage missing: {marker}")
cross = text("playwright.cross-browser.config.cjs")
need("firefox-desktop" in cross and "webkit-tablet" in cross and "chromium-desktop" in cross, "cross-browser project matrix incomplete")
smoke = text("qa/cross-browser-smoke.spec.js")
need("onboardingDone:true" in smoke and "mouldmasterProDB" in smoke, "cross-browser matrix does not establish deterministic learner/onboarding state")

# Broad document polling should be retired where canonical lifecycle hooks exist.
need("new MutationObserver" not in pwa, "PWA shell still uses document-wide mutation polling")
need("new MutationObserver" not in materials, "Materials domain still uses document-wide mutation polling")
need("mutationScope:'changed-subtrees'" in a11y, "accessibility safety net is not constrained to changed subtrees")

print("MouldMaster app-wide remediation QA passed: pre-merge live Pages provenance, aligned gh api negotiation, cross-index fail-closed provenance, single authoritative owner-scoped engineering case store, variant-safe materials, PWA lifecycle, legacy distribution separation, deterministic browser matrix and targeted observers")

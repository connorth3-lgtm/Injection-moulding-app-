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
release_graph = json.loads(text("release-asset-graph.json"))
need(release_graph.get("schemaVersion") == 1, "release asset graph schema drift")
need(release_graph.get("domainManifest") == "runtime-domain-manifest.json", "release asset graph lost canonical domain manifest")
need(release_graph.get("serviceWorker") == "service-worker.js", "release asset graph lost canonical service worker")
graph_check = subprocess.run(["python", "tools/generate_release_asset_graph.py"], cwd=ROOT, capture_output=True, text=True)
need(graph_check.returncode == 0, f"release asset graph validation failed: {graph_check.stdout} / {graph_check.stderr}")

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

# Production artifact/build work must wait for both provenance verification and the
# independently-started legacy Pages publisher guard. The guard itself must not wait
# behind provenance because cancellation latency is release-safety critical.
for marker in (
    "production-source:",
    "publisher-guard:",
    "tools/verify_production_source.py",
    "Require merged-PR provenance before publication",
    "needs: [production-source, publisher-guard]",
):
    need(marker in pages, f"Pages pre-deploy provenance/publisher gate missing: {marker}")
publisher_block = pages.split("  publisher-guard:", 1)[1].split("\n  build:", 1)[0]
need("needs:" not in publisher_block, "legacy Pages publisher guard must start independently of production-source")
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
need("&&!!window.MM_CASE_STORE_BRIDGE" not in smoke, "cross-browser smoke still waits for the retired engineering compatibility bridge")
for marker in ("without a compatibility bridge", "canonicalStore:'indexeddb-v2'", "bridgePresent:false"):
    need(marker in smoke, f"cross-browser canonical engineering-store smoke invariant missing: {marker}")

# Broad document polling should be retired where canonical lifecycle hooks exist.
need("new MutationObserver" not in pwa, "PWA shell still uses document-wide mutation polling")
need("new MutationObserver" not in materials, "Materials domain still uses document-wide mutation polling")
need("mutationScope:'changed-subtrees'" in a11y, "accessibility safety net is not constrained to changed subtrees")

ci_contract = text("docs/CI_RISK_COVERAGE.md")
for marker in ("MouldMaster Release QA", "MouldMaster Domain Foundation QA", "Deep Audit Governance", "Mobile Browser QA", "Premium UI QA", "MouldMaster Physical PWA Contract QA", "Open Desktop Build", "MouldMaster Pages Release Readiness", "Release External Validation Boundary", "Question Quality 50-Pass"):
    need(marker in ci_contract, f"CI risk coverage contract missing workflow: {marker}")
release_workflow = text(".github/workflows/qa.yml")
need("python qa_app_remediation.py" in release_workflow, "release QA must execute the full-app remediation contract")

process_data_runtime = text("data-integration-runtime.js")
need("function esc(v)" in process_data_runtime, "connected process-data runtime lost its explicit HTML escaping boundary")
for marker in (
    "esc(d.datasetMeta?.source_label||d.id)",
    "esc(d.entities?.machine||'machine not linked')",
    "esc(d.entities?.mould||'mould not linked')",
    "esc(link?.materialGrade||'')",
    "esc(link?.intervention||'')",
    "esc(x.title)",
):
    need(marker in process_data_runtime, f"connected process-data HTML sink lost escaping: {marker}")

book_runtime = text("src/domains/learning/book-runtime.js")
activity_events = text("src/domains/learning/activity-events-v2.js")
learner_model = text("src/domains/learning/learner-model.js")
need("emitBookRender('chapter',id)" in book_runtime, "Book runtime must emit chapter engagement events")
for marker in ("mm:book-render", "book_chapter_open", "activityType:'book'", "book_listening_start"):
    need(marker in activity_events, f"Book-to-app learner activity bridge missing: {marker}")
need("if(e.type==='book_chapter_open')" in learner_model and "engagement.get(id)" in learner_model, "learner model lost separate Book engagement reporting")
need("bookEngagement:" in learner_model, "learner model must expose Book engagement separately from mastery topics")
need("e.activityType==='book'?" not in learner_model, "Book engagement must not carry a mastery evidence weight")
need("Book reading/listening engagement is reported separately and never contributes to mastery" in learner_model, "Book engagement/mastery authority boundary missing")

sink_register = text("docs/DYNAMIC_HTML_SINK_REGISTER.md")
for marker in ("learner strings", "imported/device/site data", "Frozen/generated core runtime", "eval", "new Function", "textContent"):
    need(marker in sink_register, f"dynamic HTML sink register missing security boundary: {marker}")

storage_matrix = text("docs/STORAGE_OWNERSHIP_MATRIX.md")
for marker in ("Learner assessment/progress state", "Engineering cases", "Process/connected machine observations", "PWA runtime cache", "Desktop application bytes", "owner scope", "migration"):
    need(marker in storage_matrix, f"storage ownership matrix missing contract: {marker}")
compatibility_matrix = text("docs/CLIENT_COMPATIBILITY_MATRIX.md")
version_meta = json.loads(text("version.json"))
for key in ("web_release", "desktop_release", "android_release", "windows_recovery_release", "content_version", "question_bank_version"):
    need(str(version_meta[key]) in compatibility_matrix, f"client compatibility matrix stale for {key}")
need("external HOLD" in compatibility_matrix, "client compatibility matrix must preserve external validation boundary")

print("MouldMaster app-wide remediation QA passed: pre-merge live Pages provenance plus earliest-start legacy publisher guard, aligned gh api negotiation, cross-index fail-closed provenance, single authoritative owner-scoped engineering case store, variant-safe materials, PWA lifecycle, legacy distribution separation, deterministic browser matrix and targeted observers")

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
bridge = text("src/domains/engineering/store-bridge.js")
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

# Engineering case ownership and explicit legacy parity without browser-global Storage monkey-patching.
for marker in (
    "Engineering case belongs to a different learner profile",
    "String(record.learnerToken)===tokenValue(token)",
    "learnerToken:owner",
    "syncLegacySnapshot",
    "repairLegacyLinkOwnership",
):
    need(marker in engineering, f"engineering learner/case invariant missing: {marker}")
for marker in ("mm_mould_master_cases_v1::", "store.syncLegacySnapshot", "MM_CASE_STORE_BRIDGE", "mm:mould-master-cases-changed"):
    need(marker in bridge, f"legacy workspace parity bridge missing marker: {marker}")
need("mm:mould-master-cases-changed" in workspace and "publishCasesChanged" in workspace, "Mould Master workspace does not publish explicit persistence-change events")
need("Storage?.prototype" not in bridge and "Object.defineProperty" not in bridge, "engineering bridge must not monkey-patch browser Storage.prototype")
assets = manifest.get("assets", [])
need("./src/domains/engineering/engineering-store.js" in assets, "engineering store missing from domain manifest")
need("./src/domains/engineering/store-bridge.js" in assets, "engineering store bridge missing from domain manifest")
need(assets.index("./src/domains/engineering/engineering-store.js") < assets.index("./src/domains/engineering/store-bridge.js"), "engineering bridge must load after canonical store")

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

# GitHub's commit->PR association is eventually consistent immediately after squash merge.
# Both production publication and the post-merge guard must retry temporary invisibility,
# but exact merge SHA/base matching and ambiguity remain fail-closed.
for marker in (
    "PROVENANCE_ATTEMPTS = 20",
    "matching_merged_prs",
    "resolve_merged_pr",
    "len(matches) > 1",
    "merge_commit_sha",
    "time.sleep(3)",
):
    need(marker in production_source, f"production-source eventual-consistency guard missing: {marker}")
for marker in (
    "for attempt in {1..20}",
    "match_count",
    "ambiguously attributable",
    "Merged-PR association is not visible yet",
    "merge_commit_sha == $sha",
):
    need(marker in main_guard, f"post-merge provenance visibility guard missing: {marker}")

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

print("MouldMaster app-wide remediation QA passed: production gate + post-merge visibility retry, storage ownership/explicit parity, variant-safe materials, PWA lifecycle, legacy distribution separation, deterministic browser matrix and targeted observers")

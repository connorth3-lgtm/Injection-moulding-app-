from pathlib import Path
import re


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def read(path):
    return Path(path).read_text(encoding="utf-8")


def js_const(source, name):
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*['\"]([^'\"]+)['\"]", source)
    require(match is not None, f"missing JavaScript constant: {name}")
    return match.group(1)


def must(source, needles, context):
    for needle in needles:
        require(needle in source, f"{context}: missing {needle}")


index = read("index.html")
shell = read("pwa-shell.js")
repair = read("repair.html")
reference_page = read("reference-data.html")
service_worker = read("service-worker.js")
approval = read("assessment-evidence-approval.js")
psychometric_approval = read("assessment-psychometric-approval.js")
training = read("training-upgrade.js")
sbom = read("desktop/electron/scripts/generate-sbom.cjs")
assessment_qa = read("qa_assessment_quality.py")

# The bootstrap and service worker must describe one coherent bundle, but the
# QA must not hard-code a specific feature release token. Data/curriculum
# additions are allowed to advance the bundle while preserving coherence.
shell_release = js_const(index, "SHELL_RELEASE")
runtime_asset_version = js_const(index, "RUNTIME_ASSET_VERSION")
expected_static_cache = js_const(index, "EXPECTED_STATIC_CACHE")
cache_version = js_const(service_worker, "CACHE_VERSION")
cache_revision = js_const(service_worker, "CACHE_REVISION")
require(shell_release == cache_version, "browser shell release and PWA cache version must match")
require(expected_static_cache == f"mouldmaster-static-{cache_version}-{cache_revision}", "bootstrap expected cache must exactly match the service-worker cache identity")
require(re.fullmatch(r"\d{8}\.\d+-[a-z0-9-]+", runtime_asset_version) is not None, "runtime bundle token must retain dated revision + family format")
require(runtime_asset_version[:8] == ''.join(cache_version.split('.')[:3]), "runtime bundle date must align with the PWA release date")
runtime_family = runtime_asset_version.split('-', 1)[1]
cache_family = re.sub(r"-\d{8}$", "", cache_revision)
require(runtime_family == cache_family, "runtime asset family and PWA cache revision family must match")

must(index, [
    "viewport-fit=cover", "HEAD_ASSETS", "BODY_SCRIPTS",
    "for(const [needle,markup] of HEAD_ASSETS)", "for(const [src,tag] of BODY_SCRIPTS)",
    'throw new Error("Core training content is incomplete")', "versionMarkup", "?v=${RUNTIME_ASSET_VERSION}",
    "fetch(`${CORE_URL}?v=${RUNTIME_ASSET_VERSION}`", "window.MM_RUNTIME_ASSET_VERSION=RUNTIME_ASSET_VERSION",
    "ensureCoherentRuntime", "navigator.serviceWorker.getRegistrations()", "owned.map(r=>r.unregister())",
    "const standalone=!!window.matchMedia?.('(display-mode: standalone)').matches", "||standalone)return false",
    "owned.map(k=>caches.delete(k))", "fresh.searchParams.set('mmBundle',RUNTIME_ASSET_VERSION)",
    "if(await ensureCoherentRuntime())return;", "clearStaleRuntimeCaches",
    "k.startsWith('mouldmaster-static-')&&k!==EXPECTED_STATIC_CACHE", "await clearStaleRuntimeCaches();",
    "'./assessment-psychometric-hardening.js'", "'./assessment-psychometric-approval.js'"
], "bootstrap hardening")
require(index.index("'./evidence-maturity-formal-bridge.js'") < index.index("'./assessment-psychometric-hardening.js'") < index.index("'./assessment-evidence-approval.js'") < index.index("'./assessment-psychometric-approval.js'") < index.index("'./app-shell-registry.js'"), "psychometric/evidence assets must load in deterministic approval order")

must(shell, [
    "new MutationObserver(scheduleSync)", "el.textContent!==value", "syncUpdateCard", "[data-mm-update-card]",
    "data-mm-repair-link", "Repair app files", "location.assign('./repair.html')", "hideInternalQaProvenance", "Plugin-assisted QA provenance",
    "dockReferenceLauncher", "getElementById('mm-src-open')", "document.querySelector('.sidebar-foot')",
    "sourceReviewDisplayDate", "qualitySuite?.sourceFreshnessReviewed", "syncStandardsReviewDate", "window.MM_DATA?.standards", "References reviewed\\s+\\d{1,2}",
    "open.style.position='static'", "open.style.zIndex='auto'", "configureReferenceDrawer",
    "modal.setAttribute('aria-modal','false')", "pointer-events:none!important",
    ".mmsrc.mm-reference-drawer .mmsrc-panel{width:min(430px", "pointer-events:auto!important",
    "calc(82px + env(safe-area-inset-bottom))", "max-height:48dvh",
    "REFERENCE_DATA_URL='./reference-data.html'", "openStandaloneReferenceData", "location.assign(REFERENCE_DATA_URL)",
    "patchMobileMoreForReferenceData", "window.openMobileMenu=function()", "data-mm-reference-data-menu", "Reference data",
    "dockReferenceDataLauncher", "getElementById('mmrd-open')", "open.dataset.mmDocked='mobile-more-standalone-page'",
    "open.style.display='none'", ".mmrd.mm-reference-data-drawer,.mmrd.mm-reference-data-drawer[data-open=\"1\"]{display:none!important",
    "MM_REFERENCE_DATA_LAUNCHER_DOCK='mobile-more-standalone-page'",
    "MM_REFERENCE_DATA_DRAWER_MODE='standalone-mobile-page-desktop-drawer'",
    "dockReferenceLauncher();configureReferenceDrawer();dockReferenceDataLauncher();configureReferenceDataDrawer();addNZLegacyNote()",
    "runSync();\nwindow.addEventListener('resize',scheduleSync",
    "mode:standalone?'Installed PWA':'Browser'", "retireBrowserOfflineRuntime",
    "displayContext().mode!=='Browser'||!navigator.onLine", "owned.map(r=>r.unregister())", "owned.map(k=>caches.delete(k))",
    "fresh.searchParams.set('mmFresh',BROWSER_FRESH_TOKEN)", "location.replace(fresh.href)",
    "displayContext().mode!=='Installed PWA'||!('serviceWorker' in navigator)",
    "MM_BROWSER_UPDATE_MODE='network-current-no-service-worker'", "MM_REFERENCE_DRAWER_MODE='non-blocking'",
    "desktopRelease", "location.hostname==='127.0.0.1'", "Electron"
], "shell hardening")
require("26 August 2026" not in shell, "shell source-review date must derive from validated metadata rather than a hard-coded calendar date")
require("ensureReferenceDataPage" not in shell and "openReferenceDataPage" not in shell, "legacy in-app Reference Data modal reparenting must be removed")

must(repair, [
    "MouldMaster browser repair", "navigator.serviceWorker.getRegistrations()", "r=>r.unregister()",
    "k=>k.startsWith('mouldmaster-static-')", "caches.delete(k)", "mmFresh", "location.replace(target.href)"
], "repair route")
require("localStorage.clear" not in repair and "sessionStorage.clear" not in repair, "repair page must not delete learner storage")

must(reference_page, [
    '<script src="./reference-data.js"></script>', '<script src="./reference-2026-expansion.js"></script>',
    'id="mm-reference-back"', "history.back()", "position:static!important", ".mmrd-close{display:none!important}",
    "modal.setAttribute('role','main')", "MM_REFERENCE_DATA_PAGE_MODE='standalone-document-full-library'"
], "standalone Reference Data")

must(service_worker, [
    "${CACHE_VERSION}-${CACHE_REVISION}", "'./repair.html'",
    "runtimeCritical=url.pathname.endsWith('.js')||url.pathname.endsWith('.json')",
    "const network=await fetchAndCache(event,url)", "if(network&&network.ok)return network",
    "'./reference-data.html'", "'./reference-2026-expansion.js'", "'./diagnostic-learning-labs.js'",
    "'./material-behaviour-labs.js'", "'./assessment-evidence-sources.js'", "'./evidence-maturity-deep-dive.js'",
    "'./evidence-maturity-formal-bridge.js'", "'./assessment-psychometric-hardening.js'", "'./lesson-evidence-depth.js'",
    "'./assessment-evidence-approval.js'", "'./assessment-psychometric-approval.js'",
    "'./curriculum-integration.js'", "'./specialist-curriculum.js'", "'./learning-analytics.js'"
], "PWA hardening")

must(approval, [
    "const coverageOk=!(summary.total!==157", "status:coverageOk?'approved':'update-required'",
    "function scheduleApproval()", "DOMContentLoaded',()=>setTimeout(buildApproval,0)",
    "Evidence metadata could not finish loading.", "showUpdateWarning"
], "evidence approval hardening")
must(psychometric_approval, [
    "const REQUIRED_VERSION='2026.08.30.5'", "itemsHardened:197", "optionsParallelised:788",
    "verifiedSurfaceCueMean:0.269", "verifiedOptionPermutationEvaluations:9850", "psychometricCoverageOk"
], "psychometric approval hardening")
require("throw new Error('Evidence approval coverage failure" not in approval, "incomplete evidence coverage must not crash the learning app")
require("document.addEventListener('DOMContentLoaded',init)" in training, "training scenario upgrade remains DOMContentLoaded-driven")
require("npm_execpath" in sbom and "result.error" in sbom, "desktop SBOM generation must use the npm CLI entry point and report spawn failures")
require("NamedTemporaryFile" in assessment_qa and "['node','-e',node]" not in assessment_qa, "assessment runtime QA must not exceed OS command-line limits")

print(f"MouldMaster runtime hardening QA passed ({runtime_asset_version}; {expected_static_cache})")

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


def worker_assets(source, name):
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*\[(.*?)\]\s*;", source, re.S)
    require(match is not None, f"PWA hardening: missing {name} asset array")
    return set(re.findall(r"['\"](\./[^'\"]+)['\"]", match.group(1)))


index = read("index.html")
shell = read("pwa-shell.js")
repair = read("repair.html")
reference_page = read("reference-data.html")
service_worker = read("service-worker.js")
approval = read("assessment-evidence-approval.js")
psychometric_hardening = read("assessment-psychometric-hardening.js")
proposition_integrity = read("assessment-evidence-integrity-upgrade.js")
psychometric_approval = read("assessment-psychometric-approval.js")
real_measured = read("real-measured-data-assessment.js")
training = read("training-upgrade.js")
sbom = read("desktop/electron/scripts/generate-sbom.cjs")
assessment_qa = read("qa_assessment_quality.py")
question_runtime = read("qa_question_quality_50_pass_runtime.py")
runtime_v2 = read("runtime-v2.js")
assessment_runtime_v2 = read("assessment-runtime-v2.js")
lesson_v2 = read("lesson-deep-authoring-v2.js")
multimodal = read("assessment-multimodal.js")
a11y = read("accessibility-hardening.js")

shell_release = js_const(index, "SHELL_RELEASE")
runtime_asset_version = shell_release
expected_static_cache = js_const(index, "EXPECTED_STATIC_CACHE")
cache_version = js_const(service_worker, "CACHE_VERSION")
cache_revision = js_const(service_worker, "CACHE_REVISION")
require(shell_release == cache_version, "browser shell release and PWA cache version must match")
require("const RUNTIME_ASSET_VERSION=SHELL_RELEASE;" in index, "runtime asset query identity must derive from the canonical shell/web release")
require(expected_static_cache == f"mouldmaster-static-{cache_version}-{cache_revision}", "bootstrap expected cache must exactly match the service-worker cache identity")
require(bool(cache_revision.strip()), "PWA cache revision must remain an explicit independent invalidation token")

# Bootstrap hardening: preserve fail-closed content assembly and CSP while no longer
# treating an ordinary browser visit as a reason to destroy the installed PWA state.
must(index, [
    "viewport-fit=cover", "HEAD_ASSETS", "BODY_SCRIPTS",
    "for(const [needle,markup] of HEAD_ASSETS)", "for(const [src,tag] of BODY_SCRIPTS)",
    'throw new Error("Core training content is incomplete")', "versionMarkup", "?v=${RUNTIME_ASSET_VERSION}",
    "fetch(`${CORE_URL}?v=${RUNTIME_ASSET_VERSION}`", "window.MM_RUNTIME_ASSET_VERSION=RUNTIME_ASSET_VERSION",
    "Content-Security-Policy", "default-src 'self'", "object-src 'none'", "frame-src 'none'", "connect-src 'self'", "worker-src 'self'",
    "'./runtime-v2.js'", "'./assessment-runtime-v2.js'", "'./lesson-deep-authoring-v2.js'", "'./assessment-multimodal.js'", "'./accessibility-hardening.js'",
    "'./assessment-psychometric-hardening.js'", "'./assessment-evidence-integrity-upgrade.js'", "'./assessment-psychometric-approval.js'",
    "'./real-measured-data-assessment.js'", "'./src/domains/domain-bootstrap.js'"
], "bootstrap hardening")
for forbidden in ("ensureCoherentRuntime", ".unregister()", "mmBundle"):
    require(forbidden not in index, f"bootstrap hardening: destructive browser/PWA reset marker remains: {forbidden}")
require(index.index("'./assessment-final-hardening.js'") < index.index("'./runtime-v2.js'") < index.index("'./assessment-runtime-v2.js'") < index.index("'./assessment-ux.js'"), "runtime v2 must capture the audited assessment functions before the new selector owns getExamQuestions and before assessment UX decorates it")
require(index.index("'./evidence-maturity-formal-bridge.js'") < index.index("'./assessment-psychometric-hardening.js'") < index.index("'./assessment-evidence-integrity-upgrade.js'") < index.index("'./lesson-evidence-depth.js'") < index.index("'./lesson-deep-authoring-v2.js'") < index.index("'./assessment-evidence-approval.js'") < index.index("'./assessment-psychometric-approval.js'") < index.index("'./app-shell-registry.js'") < index.index("'./assessment-multimodal.js'"), "psychometric/evidence/deep-authoring/multimodal assets must load in deterministic order")
require(index.index("'./process-data-diagnostics.js'") < index.index("'./real-measured-data-assessment.js'"), "real measured assessment must load after the process-data navigation surface")
require(index.rindex("'./accessibility-hardening.js'") > index.index("'./learning-analytics.js'"), "accessibility hardening must run after learner-facing runtime modules are installed")

must(runtime_v2, ["const CORE=['renderLesson','renderDashboard','switchView','startExam','gradeExam','getExamQuestions']", "setImplementation", "already owned by", "before:new Set(),after:new Set()", "scopedKey", "registerModule", "one owner at a time"], "runtime v2")
must(assessment_runtime_v2, ["technicalBankPerLevel:10", "technicalPerExam:7", "least-exposed blueprint-preserving stable IDs", "R.setImplementation('getExamQuestions',selector,'assessment-runtime-v2')", "BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting']", "coverageSimulation"], "assessment runtime v2")
must(lesson_v2, ["D.lessons.length!==120", "duplicate lesson records", "Mechanism → evidence → decision", "Teach-back", "R.after('renderLesson'", "R.registerModule('lesson-deep-authoring-v2'"], "lesson deep authoring v2")
require("window.renderLesson=function" not in lesson_v2, "new lesson depth must use runtime-v2 hooks rather than adding another renderLesson wrapper")
must(multimodal, ["Multimodal formative assessment", "type:'chart'", "type:'table'", "type:'calculation'", "type:'sequence'", "formal certificate answer keys", "production setpoint", "machinery authorisation"], "multimodal assessment")
must(a11y, ["aria-modal", "focusTrap:true", "focusRestore:true", "forced-colors:active", "prefers-contrast:more", "noopener", "noreferrer", "mutationScope:'changed-subtrees'", "formal WCAG conformance still requires manual"], "accessibility hardening")

# Shell hardening now uses canonical lifecycle hooks rather than document-wide polling,
# and browser + installed PWA share the same service-worker/cache origin state.
must(shell, [
    "el.textContent!==value", "syncUpdateCard", "[data-mm-update-card]",
    "data-mm-repair-link", "Repair app files", "location.assign('./repair.html')", "hideInternalQaProvenance", "Plugin-assisted QA provenance",
    "dockReferenceLauncher", "getElementById('mm-src-open')", "document.querySelector('.sidebar-foot')",
    "sourceReviewDisplayDate", "qualitySuite?.sourceFreshnessReviewed", "syncStandardsReviewDate", "window.MM_DATA?.standards", "References reviewed\\s+\\d{1,2}",
    "open.style.position='static'", "open.style.zIndex='auto'", "configureReferenceDrawer",
    "modal.setAttribute('aria-modal','false')", "pointer-events:none!important",
    ".mmsrc.mm-reference-drawer .mmsrc-panel{width:min(430px", "pointer-events:auto!important",
    "calc(82px + env(safe-area-inset-bottom))", "max-height:48dvh",
    "REFERENCE_DATA_URL='./reference-data.html'", "openStandaloneReferenceData", "location.assign(REFERENCE_DATA_URL)",
    "patchMobileMoreForReferenceData", "data-mm-reference-data-menu", "Reference data",
    "dockReferenceDataLauncher", "getElementById('mmrd-open')", "open.dataset.mmDocked='mobile-more-standalone-page'",
    "open.style.display='none'", ".mmrd.mm-reference-data-drawer,.mmrd.mm-reference-data-drawer[data-open=\"1\"]{display:none!important",
    "MM_REFERENCE_DATA_LAUNCHER_DOCK='mobile-more-standalone-page'",
    "MM_REFERENCE_DATA_DRAWER_MODE='standalone-mobile-page-desktop-drawer'",
    "shell?.events?.onViewChange?.(scheduleSync)", "shell?.events?.onRender?.(view,scheduleSync)",
    "navigator.serviceWorker.register('./service-worker.js'", "MM_BROWSER_UPDATE_MODE='shared-origin-service-worker'",
    "mode:standalone?'Installed PWA':'Browser'", "MM_REFERENCE_DRAWER_MODE='non-blocking'",
    "desktopRelease", "location.hostname==='127.0.0.1'", "Electron"
], "shell hardening")
require("new MutationObserver" not in shell, "shell hardening: document-wide mutation polling must remain retired")
for forbidden in ("retireBrowserOfflineRuntime", ".unregister()", "owned.map(k=>caches.delete(k))", "mmFresh"):
    require(forbidden not in shell, f"shell hardening: destructive browser/PWA lifecycle marker remains: {forbidden}")
require("26 August 2026" not in shell, "shell source-review date must derive from validated metadata rather than a hard-coded calendar date")
require("ensureReferenceDataPage" not in shell and "openReferenceDataPage" not in shell, "legacy in-app Reference Data modal reparenting must be removed")

# The explicit repair route is the one place where clearing the current worker/cache is intentional.
must(repair, ["MouldMaster browser repair", "navigator.serviceWorker.getRegistrations()", "r=>r.unregister()", "k=>k.startsWith('mouldmaster-static-')", "caches.delete(k)", "mmFresh", "location.replace(target.href)"], "repair route")
require("localStorage.clear" not in repair and "sessionStorage.clear" not in repair, "repair page must not delete learner storage")

must(reference_page, ['<script src="./reference-data.js"></script>', '<script src="./reference-2026-expansion.js"></script>', 'id="mm-reference-back"', "history.back()", "position:static!important", ".mmrd-close{display:none!important}", "modal.setAttribute('role','main')", "MM_REFERENCE_DATA_PAGE_MODE='standalone-document-full-library'"], "standalone Reference Data")

# Service-worker install remains atomic for CORE and best-effort for optional packs.
must(service_worker, [
    "${CACHE_VERSION}-${CACHE_REVISION}", "'./repair.html'", "runtimeCritical=url.pathname.endsWith('.js')||url.pathname.endsWith('.json')",
    "const network=await fetchAndCache(event,url)", "if(network&&network.ok)return network", "'./reference-data.html'", "'./reference-2026-expansion.js'", "'./diagnostic-learning-labs.js'",
    "'./material-behaviour-labs.js'", "'./assessment-evidence-sources.js'", "'./evidence-maturity-deep-dive.js'", "'./evidence-maturity-formal-bridge.js'",
    "'./assessment-psychometric-hardening.js'", "'./assessment-evidence-integrity-upgrade.js'", "'./lesson-evidence-depth.js'", "'./lesson-deep-authoring-v2.js'", "'./assessment-evidence-approval.js'", "'./assessment-psychometric-approval.js'",
    "'./runtime-v2.js'", "'./assessment-runtime-v2.js'", "'./assessment-multimodal.js'", "'./accessibility-hardening.js'",
    "'./process-data-diagnostics.js'", "'./real-measured-data-assessment.js'", "'./curriculum-integration.js'", "'./specialist-curriculum.js'", "'./learning-analytics.js'",
    "Promise.allSettled", "if(failed.length)", "await caches.delete(STATIC_CACHE)", "keeping the previous worker", "mouldmaster-offline-asset-unavailable"
], "PWA hardening")
core = worker_assets(service_worker, "CORE")
optional = worker_assets(service_worker, "OPTIONAL")
require("./MouldMaster_Academy_App.html" not in core | optional, "PWA hardening: frozen legacy Academy app must not be a current cached asset")
for required_asset in ("./index.html", "./MouldMaster_Core_App.html", "./pwa-shell.js", "./src/domains/domain-bootstrap.js", "./src/domains/engineering/engineering-store.js", "./material-catalog-v1.json"):
    require(required_asset in core, f"PWA hardening: required core asset missing: {required_asset}")
install = service_worker[service_worker.index("self.addEventListener('install'"):service_worker.index("self.addEventListener('activate'")]
require("cache.addAll" not in install, "service-worker install should identify the exact failed assets rather than use opaque addAll failure")
require("throw new Error" in install and "skipWaiting" in install, "service-worker install must fail closed before activation when any core asset is incomplete")

# Preserve the original assessment/evidence/security integrity assertions.
must(approval, ["const coverageOk=!(summary.total!==157", "status:coverageOk?'approved':'update-required'", "function scheduleApproval()", "DOMContentLoaded',()=>setTimeout(buildApproval,0)", "Evidence metadata could not finish loading.", "showUpdateWarning"], "evidence approval hardening")
must(psychometric_hardening, [
    "const VERSION='2026.09.01.6'", "scenarioCount!==40", "DOMContentLoaded", "initialization:'after-training-upgrade'", "itemsHardened,optionsParallelised", "technicalKeyPositions:technicalKeyPositions.slice()",
    "semanticAnswerChanges:0", "technicalTermSubstitutions:0", "paddingApplied:false", "keyedConciseEdits", "distractorCueEdits", "formClauseTrims",
    "technicalLengthRanks", "regionalLengthRanks", "scenarioLengthRanks", "diagnosticLengthRanks", "materialLengthRanks", "optionalLengthRanks", "keyFormPenalty",
    "technicalLengthRanks=[0,0,0,0]", "optionalLengthRanks=[0,0,0,0]", "kp.chars>median*1.40&&kp.chars-median>12"
], "psychometric initialization hardening")
require("Math.max(124" not in psychometric_hardening and "cueNeutral" not in psychometric_hardening, "psychometric layer must not use generic length padding or global engineering-term synonym rewriting")
require("kp.chars>=Math.max" not in psychometric_hardening, "psychometric layer must not create a longest-is-always-wrong inverse cue")
must(proposition_integrity, ["records.length===197", "supportLocator", "limitations", "relevanceStatus", "weakOptional.length===0", "context-only", "sourceUpgrades:Object.keys(SOURCE_UPGRADES)"], "proposition evidence integrity")
must(psychometric_approval, [
    "const REQUIRED_VERSION='2026.09.01.6'", "itemsHardened:197", "optionsParallelised:788", "technicalKeyPositions:[8,8,7,7]", "technicalTermSubstitutions:0", "paddingApplied:false", "keyedConciseEdits:3",
    "distractorCueEdits", "formClauseTrims", "technicalLengthRanks", "regionalLengthRanks", "scenarioLengthRanks", "diagnosticLengthRanks", "materialLengthRanks", "optionalLengthRanks", "verificationPolicy", "psychometricCoverageOk", "a.length===4"
], "psychometric approval hardening")
require("_evaluate_balanced_length" in question_runtime and "hard.remove('correct-longest-or-tied')" in question_runtime, "final standard audit must remove the absolute longest-key prohibition while retaining salience checks")
must(real_measured, ["evidenceType:'real-measured'", "decisionCount:CASES.reduce", "Pressure actual values excluded pending unit", "without assigning phase names until an authoritative mapping is found"], "real measured assessment")
require("throw new Error('Evidence approval coverage failure" not in approval, "incomplete evidence coverage must not crash the learning app")
require("document.addEventListener('DOMContentLoaded',init)" in training, "training scenario upgrade remains DOMContentLoaded-driven")
require("npm_execpath" in sbom and "result.error" in sbom, "desktop SBOM generation must use the npm CLI entry point and report spawn failures")
require("NamedTemporaryFile" in assessment_qa and "['node','-e',node]" not in assessment_qa, "assessment runtime QA must not exceed OS command-line limits")

print(f"MouldMaster runtime hardening QA passed ({runtime_asset_version}; {expected_static_cache}; shared-origin PWA + runtime v2 + bank rotation + lesson depth + multimodal + accessibility enabled)")

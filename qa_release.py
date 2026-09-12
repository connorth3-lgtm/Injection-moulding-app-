from pathlib import Path
import hashlib
import json
import os
import re
import struct
import subprocess
import tempfile

WEB_RELEASE = "2026.09.12.18"
ANDROID_RELEASE = "2026.08.26.2"
CONTENT_VERSION = "2026.08.26.1"
WINDOWS_RECOVERY_VERSION = "2026.08.21.1"
QUESTION_BANK_VERSION = "2026.08.30.1"
LEGACY_REVIEW_ID_VERSION = "2026.08.21.1"
WINDOWS_RECOVERY_SOURCE_COMMIT = "19ef75781e3a782b234db313a5265ff0f3518ee4"
WINDOWS_RECOVERY_CORE_SHA256 = "96ed07e1487633538359eb12073fe50bfe595d9d5aaa807173e0a764b9123754"
CURRENT_CORE_SHA256 = "961ea748b7355d4af2dfecdf644b6311051b3228a15c42f48b09bedb367fb394"
EXE_SHA256 = "db7abc4da613a6d1409fdb129cb788b8ac396e5ac2d161963521c844d0ee771c"
NODE = os.environ.get("MM_NODE", "node")


def text(name):
    return Path(name).read_text(encoding="utf-8")


def sha256(name):
    return hashlib.sha256(Path(name).read_bytes()).hexdigest()


def png_size(name):
    data = Path(name).read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", f"{name} is not a PNG"
    assert data[12:16] == b"IHDR", f"{name} has no IHDR"
    return struct.unpack(">II", data[16:24])


version = json.loads(text("version.json"))
latest = json.loads(text("latest.json"))
manifest = json.loads(text("manifest.webmanifest"))
assert version["web_release"] == WEB_RELEASE
assert version["android_release"] == ANDROID_RELEASE
subprocess.run(["python", "qa_web_release_identity.py"], check=True)
assert version["content_version"] == CONTENT_VERSION
assert version["question_bank_version"] == QUESTION_BANK_VERSION
assert version["legacy_review_id_version"] == LEGACY_REVIEW_ID_VERSION
assert latest["version"] == WINDOWS_RECOVERY_VERSION, "Windows recovery version changed unexpectedly"
assert latest["sha256"] == WINDOWS_RECOVERY_CORE_SHA256, "Windows recovery feed must use audited recovery SHA-256"
expected_recovery_url = f"https://raw.githubusercontent.com/connorth3-lgtm/Injection-moulding-app-/{WINDOWS_RECOVERY_SOURCE_COMMIT}/MouldMaster_Core_App.html"
assert latest["app_url"] == expected_recovery_url, "Windows recovery feed must pin the audited immutable source commit"
assert sha256("MouldMasterAcademy.exe") == latest["launcher_sha256"] == EXE_SHA256, "Windows recovery launcher hash mismatch"

icon_sizes = {icon["src"].removeprefix("./"): icon["sizes"] for icon in manifest["icons"]}
for name, size in [("mouldmaster-192.png", 192), ("mouldmaster-512.png", 512)]:
    assert png_size(name) == (size, size), f"{name} dimensions are wrong"
    assert icon_sizes.get(name) == f"{size}x{size}", f"manifest size for {name} is wrong"
assert manifest["start_url"] in ("./", "./index.html")
assert manifest["display"] == "standalone"

core = text("MouldMaster_Core_App.html")
attributes = text(".gitattributes")
assert re.search(r"^MouldMaster_Core_App\.html\s+-text\s*$", attributes, flags=re.M), "audited core must disable Git line-ending conversion"
assert sha256("MouldMaster_Core_App.html") == CURRENT_CORE_SHA256, "current standalone core bytes changed without updating its audited hash lock"
assert len(core) > 500000, "audited core unexpectedly small"
assert "clean.certificates=[];" in core and "clean.certificateMeta={};" in core and "clean.examPassStatus={};" in core, "standalone backup import must strip credential evidence"
assert "function pvCommitImportedUsers(proposed)" in core and "if(file.size>10*1024*1024)" in core, "standalone backup import must be storage-first and size-bounded"
assert "function pvCommitPristineReset()" in core and "Existing learner data was left unchanged" in core, "standalone destructive reset must fail closed when browser storage cannot persist the reset"
assert "function mmPersistCurrentState()" in core and "mmStorageDurabilityWarning" in core and "return durable;" in core, "ordinary learner persistence must report durability and expose a persistent session-only warning on storage failure"
assert "mm-session-only-result" in core and "This result and any certificate earned are available only for this session" in core, "non-durable assessment evidence must be disclosed in the result UI"
assert "function mmSelectStartupDb(candidate,pristine)" in core and "Object.prototype.hasOwnProperty.call(candidate.users,active)" in core, "persisted learner registry must fail closed on inherited/unsafe startup identities"
assert "function mmStartupUniqueLessonIdsAreSafe(values)" in core and "function mmStartupCertificatesAreSafe(values)" in core and "mmStartupCertificatesAreSafe(record.certificates)" in core, "persisted learner registry must validate unique in-range progress/bookmark IDs and recognized certificate keys before rendering"
assert "record.currentLesson!=null" in core and "record.region!=null" in core and "m.completed.length>36" in core and "new Set(m.completed).size!==m.completed.length" in core, "persisted learner registry must fail closed on unsafe lesson pointers, regions and duplicate material progress"
assert "Assessment selector rejected unknown level or region" in core and core.count("mmSetStorageDurability(true)") >= 2, "standalone assessment/storage recovery hardening missing"
assert "typeof value!==\"number\"||!Number.isFinite(value)||value<0||value>100" in core and "<span class=\"pill\">${esc(status)}</span>" in core, "persisted assessment values must be typed at startup and escaped at exam-status HTML sinks"
assert "${esc(f.xp)} XP" in core and "${esc(f.streak)}-day learning streak" in core and "m.bestQuiz==null?\"—\":esc(m.bestQuiz)+\"%\"" in core, "legacy gamification/material numeric state must be escaped at HTML sinks"
assert "criticalWrong===0" in core, "zero-wrong safety-critical gate missing"
assert "Compare All assesses ALL 9 regional items" in core, "Compare All regional rule missing"

index = text("index.html")
assert f'const SHELL_RELEASE="{WEB_RELEASE}"' in index
assert 'const RUNTIME_ASSET_VERSION=SHELL_RELEASE;' in index
assert 'const CORE_URL="./MouldMaster_Core_App.html"' in index
assert "BODY_SCRIPTS" in index and "'./source-library.js'" in index, "source library not loaded by shell"
for marker in ["Content-Security-Policy", "default-src 'self'", "object-src 'none'", "frame-src 'none'", "connect-src 'self'", "worker-src 'self'"]:
    assert marker in index, f"browser CSP boundary missing: {marker}"
for asset in [
    "learning-experience.js",
    "process-data-diagnostics.js",
    "curriculum-integration.js",
    "specialist-curriculum.js",
    "specialist-evidence-gap-extension.js",
    "mould-master-workspace.js",
    "app-shell-finalize.js",
    "learning-analytics.js",
    "runtime-v2.js",
    "assessment-runtime-v2.js",
    "lesson-deep-authoring-v2.js",
    "assessment-multimodal.js",
    "accessibility-hardening.js",
]:
    assert f"'./{asset}'" in index, f"current learner-facing runtime asset not loaded by shell: {asset}"
assert index.index("'./assessment-final-hardening.js'") < index.index("'./runtime-v2.js'") < index.index("'./assessment-runtime-v2.js'") < index.index("'./assessment-ux.js'"), "runtime-v2 assessment ownership load order is wrong"
assert index.index("'./specialist-curriculum.js'") < index.index("'./specialist-evidence-gap-extension.js'") < index.index("'./mould-master-workspace.js'") < index.index("'./app-shell-finalize.js'"), "specialist evidence/runtime finalizer load order is wrong"

sw = text("service-worker.js")
assert f"CACHE_VERSION='{WEB_RELEASE}'" in sw
for asset in [
    "index.html", "MouldMaster_Core_App.html", "manifest.webmanifest",
    "mouldmaster-192.png", "mouldmaster-512.png", "version.json", "reading-patch.css", "reading-patch.js",
    "training-upgrade.js", "training-qa-fix.js", "source-library.js", "pwa-shell.js", "learning-experience.js",
    "process-data-diagnostics.js", "curriculum-integration.js", "specialist-curriculum.js",
    "specialist-evidence-gap-extension.js", "mould-master-workspace.js", "app-shell-finalize.js", "learning-analytics.js",
    "runtime-v2.js", "assessment-runtime-v2.js", "lesson-deep-authoring-v2.js", "assessment-multimodal.js", "accessibility-hardening.js",
    "learner-ux-repair.css", "learner-ux-repair.js"
]:
    assert f"'./{asset}'" in sw, f"offline asset missing: {asset}"
assert "'./MouldMaster_Academy_App.html'" not in sw.split("const OPTIONAL=", 1)[0], "frozen legacy Academy app must not be a current core cache asset"
install = sw[sw.index("self.addEventListener('install'"):sw.index("self.addEventListener('activate'")]
assert "Promise.allSettled" in install, "install must inspect every required offline asset"
assert "if(failed.length)" in install and "await caches.delete(STATIC_CACHE)" in install, "incomplete new cache must be deleted"
assert "throw new Error" in install, "install must fail if any core asset cannot be cached"
assert "cache.addAll" not in install, "install must report exact missing assets rather than an opaque addAll failure"
assert ".skipWaiting(" not in install, "new worker must wait for existing controlled clients before activation"
activate = sw[sw.index("self.addEventListener('activate'"):sw.index("// Governed release bytes") ]
assert ".clients.claim(" not in activate, "new worker must not replace the controller of an already-open document"
runtime_fetch = sw[sw.index("self.addEventListener('fetch'"):]
assert "const RELEASE_PATHS=" in sw and "async function releaseCacheMatch(request)" in sw, "governed release assets must be pinned to the active worker cache"
assert "RELEASE_PATHS.has(url.pathname)" in runtime_fetch, "governed fetches must be identified by the release asset set"
assert "caches.match(" not in runtime_fetch, "runtime fetches must not search across multiple release caches"
assert "async function fetchNetwork(event)" in sw and "fetch(event.request,{cache:'no-store'})" in sw, "non-governed network fallback must bypass the HTTP cache"
assert ".put(" not in runtime_fetch, "runtime fetches must never mutate the validated release cache"
assert "cacheAsset(" not in runtime_fetch, "install-only cache writer must not be reachable from runtime fetches"
assert "mouldmaster-offline-asset-unavailable" in sw, "critical offline failure response must be explicit"

runtime_v2 = text("runtime-v2.js")
for marker in ["one owner at a time", "setImplementation", "before:new Set(),after:new Set()", "registerModule", "scopedKey"]:
    assert marker in runtime_v2, f"runtime v2 invariant missing: {marker}"
assessment_v2 = text("assessment-runtime-v2.js")
for marker in ["technicalPerExam:7", "technicalBankPerLevel:10", "least-exposed blueprint-preserving stable IDs", "R.setImplementation('getExamQuestions',selector,'assessment-runtime-v2')", "Assessment selector rejected unknown level or region"]:
    assert marker in assessment_v2, f"assessment membership rotation invariant missing: {marker}"
lesson_v2 = text("lesson-deep-authoring-v2.js")
assert "D.lessons.length!==120" in lesson_v2 and "duplicate lesson records" in lesson_v2, "lesson deep authoring must cover 120 unique records"
assert "R.after('renderLesson'" in lesson_v2 and "window.renderLesson=function" not in lesson_v2, "lesson deep authoring must use canonical runtime hook"
multimodal = text("assessment-multimodal.js")
for marker in ["type:'chart'", "type:'table'", "type:'calculation'", "type:'sequence'", "formal certificate answer keys"]:
    assert marker in multimodal, f"multimodal assessment invariant missing: {marker}"
a11y = text("accessibility-hardening.js")
for marker in ["aria-modal", "focusTrap:true", "focusRestore:true", "forced-colors:active", "prefers-contrast:more"]:
    assert marker in a11y, f"accessibility runtime invariant missing: {marker}"

training = text("training-upgrade.js")
assert f"const BANK_VERSION='{LEGACY_REVIEW_ID_VERSION}'" in training, "legacy spaced-review identifier changed without migration"
assert "reg:${BANK_VERSION}:${region}:${level}:${i}" in training
assert "tech:${BANK_VERSION}:${level}:${i}" in training
assert "COURSE_GUIDES" in training and "'Foundations'" in training
assert "l.intro=" not in training and "l.objectives=" not in training, "enhancement must preserve authored lesson content"
assert "/mould|mold|runner" not in training, "generic moulding titles must not be classified as tooling"
assert "exam.mmSubmitted=true" in training
assert "if(exam.mmSubmitted)" in training
assert "#examQuestions input" in training and "x.disabled=true" in training
assert "Attempt graded" in training
assert "return qu(q)?" in training, "question debrief references must be exact-only"

reading = text("reading-patch.js")
assert "questionBank" not in reading and "question-reference" not in reading, "pre-grade source injection must remain disabled"
assert "fallback" not in reading and "lessonSources" not in reading, "blanket or guessed sources must not return"
assert "enhanceLesson" in reading
for marker in ["mm-reading-guide", "READ THIS FIRST", "READ NEXT", "MAIN POINTS", "DO THIS AFTER READING"]:
    assert marker in reading, f"lesson reading-order cue missing: {marker}"
for marker in ["mm-extra-help", "Finished reading — next lesson", "lesson-actions-sticky"]:
    assert marker in reading or marker in text("reading-patch.css"), f"lesson mobile-clarity cue missing: {marker}"
assert "Open <b>Extra help</b> only if you want examples or a simpler explanation" in reading

reading_css = text("reading-patch.css")
for marker in [
    "Android profile/data layout clearance",
    'body[data-mm-view="profile"] .top-actions',
    "padding-bottom:calc(174px + env(safe-area-inset-bottom))",
]:
    assert marker in reading_css, f"Android profile mobile layout regression guard missing: {marker}"
for marker in [
    "iOS/iPadOS WebKit safe-area + profile viewport hardening",
    "html.mm-ios-webkit",
    "safe-area-inset-top",
    "html.mm-ios-standalone .mobile-nav",
]:
    assert marker in reading_css, f"iOS/iPadOS mobile layout regression guard missing: {marker}"

source_lib = text("source-library.js")
for marker in ["ISO 20430:2020", "HSE PPIS4(rev1)", "OSHA 1910.147", "WorkSafe NZ — Machine lockouts", "ISO 1133-1:2022", "ISO 22514-2:2026", "NIST — Experimental design", "More authoritative sources"]:
    assert marker in source_lib, f"authoritative source missing: {marker}"
assert "#examQuestions" not in source_lib and "activeExam" not in source_lib and "questionBank" not in source_lib, "source library must not inject sources into live assessments"
assert "lesson()" in source_lib and "standards()" in source_lib, "sources must be limited to lesson/standards presentation"
assert Path("sources/AUTHORITATIVE_SOURCE_REGISTER.md").exists(), "authoritative source register missing"

bridge = text("training-qa-fix.js")
assert bridge.count("mmSetStorageDurability?.(true)") == 2, "hosted import/reset must clear stale session-only storage warnings after successful writes"
for marker in ["file.size>10*1024*1024", "const sid=requireCoreLearnerId(id);", "if(hasOwnCoreLearner(users,sid))", "if(!clean||clean.id!==sid)", "const active=requireCoreLearnerId(x.activeUser);", "if(!hasOwnCoreLearner(users,active))", "clean.certificates=[]", "clean.certificateMeta={}", "clean.examPassStatus={}", "restoreSnapshot(before)", "Certificates must be re-earned", "db!==beforeDb", "LEARNING_ANALYTICS_PREFIX", "ANALYTICS_CLEANUP_CODE", "remaining key(s):", "clearAllAnalyticsStores();clearTrainingExtrasStores()", "analytics were cleared and verified"]:
    assert marker in bridge, f"import/reset hardening missing: {marker}"
assert "clean.id=sid" not in bridge, "import bridge must reject learner-ID mismatch instead of silently rewriting it"
assert "!x.users[x.activeUser]" not in bridge, "import bridge must not use inherited learner lookup for activeUser"
storage_commit = bridge.index("for(const [k,v] of Object.entries(writes))localStorage.setItem(k,v)")
cleanup_commit = bridge.index("clearAllAnalyticsStores();", storage_commit)
memory_commit = bridge.index("db=proposed;user=db.users[db.activeUser]")
assert storage_commit < cleanup_commit < memory_commit, "imported learner registry must activate only after staged writes and verified analytics cleanup"
shell = text("pwa-shell.js")
assert f"const RELEASE='{WEB_RELEASE}'" in shell
assert f"const CONTENT='{CONTENT_VERSION}'" in shell
assert "NZ source-status (?:note|clarification)" in shell, "duplicate NZ note prevention missing"
for marker in ["function isIOSFamily()", "syncPlatformClasses", "mm-ios-webkit", "MM_IOS_LAYOUT_PATCH='safe-area-viewport-profile-v1'"]:
    assert marker in shell, f"iOS/iPadOS shell regression guard missing: {marker}"
for marker in [".scenario-scoreboard .scorebox", "mm-question-collapsed", "data-mm-scenario-toggle", "data-mm-exam-question-toggle", "function patchQuestionListRenderers()"]:
    assert marker in shell, f"mobile troubleshooting/question disclosure guard missing: {marker}"

legacy_loader = text("MouldMaster_Academy_App.html")
assert 'crypto.subtle.digest("SHA-256",bytes)' in legacy_loader, "legacy loader SHA-256 verification removed"
assert "failed SHA-256 verification" in legacy_loader, "legacy loader must fail closed on altered assets"

assert Path("privacy.html").exists(), "public privacy page missing"
assert Path("support.html").exists(), "public support page missing"
assert Path("certification/README.md").exists(), "certification roadmap missing"
assert Path("credentials/README.md").exists(), "credential governance spec missing"
runtime = "\n".join(text(x) for x in ["MouldMaster_Core_App.html", "index.html", "training-upgrade.js", "source-library.js", "pwa-shell.js", "training-qa-fix.js", "assessment-quality-suite.js"])
for claim in [r"\bNZQA approved\b", r"\bIACET CEUs?\b", r"\bMicrosoft certified\b", r"\bNZQA accredited\b"]:
    assert not re.search(claim, runtime, flags=re.I), f"premature external certification claim detected: {claim}"
assert "not accredited" in core.lower() or "not third-party accredited" in core.lower(), "non-accredited certificate status must remain explicit"

assert Path("LICENSE").exists(), "Apache-2.0 licence missing"
licence = text("LICENSE")
assert "Apache License" in licence and "Version 2.0" in licence and "Grant of Patent License" in licence, "Apache-2.0/patent grant incomplete"
assert Path("OPEN_SOURCE_AND_PATENT_POLICY.md").exists(), "open-source/patent policy missing"
assert Path("THIRD_PARTY_NOTICES.md").exists(), "third-party notices missing"
policy = text("OPEN_SOURCE_AND_PATENT_POLICY.md")
assert "do not intend to seek patent protection" in policy, "project no-patenting commitment missing"
assert "not a warranty that no third-party patent exists" in policy, "third-party patent limitation must remain explicit"

desktop_root = Path("desktop/electron")
for req in ["package.json", "README.md", "src/main.cjs", "scripts/generate-integrity.cjs", "scripts/qa.cjs"]:
    assert (desktop_root / req).exists(), f"open desktop file missing: {req}"
dpkg = json.loads((desktop_root / "package.json").read_text(encoding="utf-8"))
assert dpkg["license"] == "Apache-2.0", "desktop package must use Apache-2.0"
for dep in ["electron", "electron-builder"]:
    assert re.fullmatch(r"\d+\.\d+\.\d+", dpkg["devDependencies"][dep]), f"{dep} must be exact-version pinned"
from_paths = {x.get("from") for x in dpkg["build"].get("extraResources", []) if isinstance(x, dict)}
for asset in ["runtime-v2.js", "assessment-runtime-v2.js", "lesson-deep-authoring-v2.js", "assessment-multimodal.js", "accessibility-hardening.js"]:
    assert f"../../{asset}" in from_paths, f"desktop bundle missing maturity-hardening asset: {asset}"
dmain = (desktop_root / "src" / "main.cjs").read_text(encoding="utf-8")
for marker in ["nodeIntegration: false", "contextIsolation: true", "sandbox: true", "webSecurity: true", "allowRunningInsecureContent: false", "setPermissionRequestHandler", "setPermissionCheckHandler", "will-attach-webview", "setWindowOpenHandler", "const DESKTOP_PORT = 43139", "server.listen(DESKTOP_PORT, '127.0.0.1'", "requestSingleInstanceLock()", "SHA-256 verification failed"]:
    assert marker in dmain, f"open desktop security control missing: {marker}"
assert "server.listen(0, '127.0.0.1'" not in dmain, "desktop must not use an ephemeral origin because browser storage is origin-scoped"
assert Path(".github/workflows/desktop-dependency-lock.yml").exists(), "desktop dependency lock workflow missing"
assert Path(".github/workflows/open-desktop-build.yml").exists(), "open desktop build workflow missing"
lock = desktop_root / "package-lock.json"
if lock.exists():
    lock_data = json.loads(lock.read_text(encoding="utf-8"))
    assert lock_data.get("lockfileVersion", 0) >= 2, "desktop npm lockfile is too old"

for js_name in [
    "service-worker.js", "reading-patch.js", "training-upgrade.js", "training-qa-fix.js",
    "assessment-quality-suite.js", "source-library.js", "pwa-shell.js", "specialist-curriculum.js",
    "specialist-evidence-gap-extension.js", "mould-master-workspace.js", "app-shell-finalize.js",
    "runtime-v2.js", "assessment-runtime-v2.js", "lesson-deep-authoring-v2.js", "assessment-multimodal.js", "accessibility-hardening.js",
    "desktop/electron/src/main.cjs", "desktop/electron/scripts/generate-integrity.cjs", "desktop/electron/scripts/qa.cjs"
]:
    p = subprocess.run([NODE, "--check", js_name], capture_output=True, text=True)
    assert p.returncode == 0, f"{js_name}: {p.stderr}"

for html_name in ["index.html", "MouldMaster_Academy_App.html"]:
    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", text(html_name), flags=re.S | re.I)
    for i, script in enumerate(scripts, 1):
        if not script.strip():
            continue
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as handle:
            handle.write(script)
            temp_name = handle.name
        p = subprocess.run([NODE, "--check", temp_name], capture_output=True, text=True)
        Path(temp_name).unlink(missing_ok=True)
        assert p.returncode == 0, f"{html_name} inline script {i}: {p.stderr}"

print("MouldMaster release QA passed")

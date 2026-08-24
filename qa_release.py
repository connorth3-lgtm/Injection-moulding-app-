from pathlib import Path
import hashlib
import json
import os
import re
import struct
import subprocess
import tempfile

ANDROID_RELEASE = "2026.08.24.1"
CONTENT_VERSION = "2026.08.24.2"
WINDOWS_RECOVERY_VERSION = "2026.08.21.1"
QUESTION_BANK_VERSION = "2026.08.24.2"
LEGACY_REVIEW_ID_VERSION = "2026.08.21.1"
CORE_SHA256 = "b30719d5d3ea946a01c72d0b8996b0375575ad910a5c8d9b22b4395d6b3c8098"
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
assert version["android_release"] == ANDROID_RELEASE
assert version["content_version"] == CONTENT_VERSION
assert version["question_bank_version"] == QUESTION_BANK_VERSION
assert version["legacy_review_id_version"] == LEGACY_REVIEW_ID_VERSION
assert latest["version"] == WINDOWS_RECOVERY_VERSION, "Windows recovery version changed unexpectedly"
assert latest["sha256"] == CORE_SHA256, "Windows recovery feed must use audited core SHA-256"
assert latest["app_url"].endswith("/MouldMaster_Core_App.html"), "Windows recovery feed must point to audited full core"
assert sha256("MouldMaster_Core_App.html") == latest["sha256"], "Windows recovery content hash mismatch"
assert sha256("MouldMasterAcademy.exe") == latest["launcher_sha256"] == EXE_SHA256, "Windows recovery launcher hash mismatch"

icon_sizes = {icon["src"].removeprefix("./"): icon["sizes"] for icon in manifest["icons"]}
for name, size in [("mouldmaster-192.png", 192), ("mouldmaster-512.png", 512)]:
    assert png_size(name) == (size, size), f"{name} dimensions are wrong"
    assert icon_sizes.get(name) == f"{size}x{size}", f"manifest size for {name} is wrong"
assert manifest["start_url"] in ("./", "./index.html")
assert manifest["display"] == "standalone"

core = text("MouldMaster_Core_App.html")
assert sha256("MouldMaster_Core_App.html") == CORE_SHA256, "audited core bytes changed"
assert len(core) > 500000, "audited core unexpectedly small"
assert "criticalWrong===0" in core, "zero-wrong safety-critical gate missing"
assert "Compare All assesses ALL 9 regional items" in core, "Compare All regional rule missing"

index = text("index.html")
assert f'const SHELL_RELEASE="{ANDROID_RELEASE}"' in index
assert 'const CORE_URL="./MouldMaster_Core_App.html"' in index
assert "BODY_SCRIPTS" in index and "'./source-library.js'" in index, "source library not loaded by shell"

sw = text("service-worker.js")
assert f"CACHE_VERSION='{ANDROID_RELEASE}'" in sw
for asset in ["index.html", "MouldMaster_Core_App.html", "MouldMaster_Academy_App.html", "manifest.webmanifest", "mouldmaster-192.png", "mouldmaster-512.png", "version.json", "reading-patch.css", "reading-patch.js", "training-upgrade.js", "training-qa-fix.js", "source-library.js", "pwa-shell.js"]:
    assert f"'./{asset}'" in sw, f"offline asset missing: {asset}"
install = sw[sw.index("self.addEventListener('install'"):sw.index("self.addEventListener('activate'")]
assert "cache.addAll" in install, "install must fail if any core asset cannot be cached"
assert "catch" not in install, "install must not swallow missing asset failures"
assert "if(isShell)" in sw and "c.put('./index.html'" in sw, "only shell navigation may refresh offline index"

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

source_lib = text("source-library.js")
for marker in ["ISO 20430:2020", "HSE PPIS4(rev1)", "OSHA 1910.147", "WorkSafe NZ — Machine lockouts", "ISO 1133-1:2022", "ISO 22514-2:2026", "NIST — Experimental design", "More authoritative sources"]:
    assert marker in source_lib, f"authoritative source missing: {marker}"
assert "#examQuestions" not in source_lib and "activeExam" not in source_lib and "questionBank" not in source_lib, "source library must not inject sources into live assessments"
assert "lesson()" in source_lib and "standards()" in source_lib, "sources must be limited to lesson/standards presentation"
assert Path("sources/AUTHORITATIVE_SOURCE_REGISTER.md").exists(), "authoritative source register missing"

bridge = text("training-qa-fix.js")
for marker in ["file.size>10*1024*1024", "clean.id=sid", "clean.certificates=[]", "clean.certificateMeta={}", "clean.examPassStatus={}", "before[k]===null?localStorage.removeItem(k):localStorage.setItem(k,before[k])", "Certificates must be re-earned", "db!==beforeDb"]:
    assert marker in bridge, f"import hardening missing: {marker}"
storage_commit = bridge.index("for(const [k,v] of Object.entries(writes))localStorage.setItem(k,v)")
memory_commit = bridge.index("db=proposed;user=db.users[db.activeUser]")
assert storage_commit < memory_commit, "memory must change only after all storage writes succeed"

shell = text("pwa-shell.js")
assert f"const RELEASE='{ANDROID_RELEASE}'" in shell
assert f"const CONTENT='{CONTENT_VERSION}'" in shell
assert "NZ source-status (?:note|clarification)" in shell, "duplicate NZ note prevention missing"

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
dmain = (desktop_root / "src" / "main.cjs").read_text(encoding="utf-8")
for marker in ["nodeIntegration: false", "contextIsolation: true", "sandbox: true", "webSecurity: true", "allowRunningInsecureContent: false", "setPermissionRequestHandler", "setPermissionCheckHandler", "will-attach-webview", "setWindowOpenHandler", "server.listen(0, '127.0.0.1'", "SHA-256 verification failed"]:
    assert marker in dmain, f"open desktop security control missing: {marker}"
assert Path(".github/workflows/desktop-dependency-lock.yml").exists(), "desktop dependency lock workflow missing"
assert Path(".github/workflows/open-desktop-build.yml").exists(), "open desktop build workflow missing"
lock = desktop_root / "package-lock.json"
if lock.exists():
    lock_data = json.loads(lock.read_text(encoding="utf-8"))
    assert lock_data.get("lockfileVersion", 0) >= 2, "desktop npm lockfile is too old"

for js_name in ["service-worker.js", "reading-patch.js", "training-upgrade.js", "training-qa-fix.js", "assessment-quality-suite.js", "source-library.js", "pwa-shell.js", "desktop/electron/src/main.cjs", "desktop/electron/scripts/generate-integrity.cjs", "desktop/electron/scripts/qa.cjs"]:
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

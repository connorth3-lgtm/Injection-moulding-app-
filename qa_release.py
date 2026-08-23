from pathlib import Path
import hashlib
import json
import os
import re
import struct
import subprocess
import tempfile

ANDROID_RELEASE = "2026.08.23.7"
CONTENT_VERSION = "2026.08.23.2"
QUESTION_BANK_VERSION = "2026.08.21.1"
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
assert latest["version"] == CONTENT_VERSION
assert sha256("MouldMaster_Academy_App.html") == latest["sha256"], "Windows loader hash mismatch"
assert sha256("MouldMasterAcademy.exe") == latest["launcher_sha256"] == EXE_SHA256, "Windows launcher hash mismatch"

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

sw = text("service-worker.js")
assert f"CACHE_VERSION='{ANDROID_RELEASE}'" in sw
for asset in ["index.html", "MouldMaster_Core_App.html", "MouldMaster_Academy_App.html", "manifest.webmanifest", "mouldmaster-192.png", "mouldmaster-512.png", "version.json", "reading-patch.css", "reading-patch.js", "training-upgrade.js", "training-qa-fix.js", "pwa-shell.js"]:
    assert f"'./{asset}'" in sw, f"offline asset missing: {asset}"
install = sw[sw.index("self.addEventListener('install'"):sw.index("self.addEventListener('activate'")]
assert "cache.addAll" in install, "install must fail if any core asset cannot be cached"
assert "catch" not in install, "install must not swallow missing asset failures"
assert "if(isShell)" in sw and "c.put('./index.html'" in sw, "only shell navigation may refresh offline index"

training = text("training-upgrade.js")
assert f"const BANK_VERSION='{QUESTION_BANK_VERSION}'" in training
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
assert "const fallback=fallbackFor(stem)" not in reading, "question references must not use topic guesses"
assert "function fallbackFor" not in reading and "const fallbacks" not in reading
assert "lessonSources.slice" not in reading, "blanket sources must not be appended to every lesson"
assert "const lessonSources" not in reading
assert "if(!usable.length)return;" in reading

bridge = text("training-qa-fix.js")
for marker in ["clean.certificates=[]", "clean.certificateMeta={}", "clean.examPassStatus={}", "before[k]===null?localStorage.removeItem(k):localStorage.setItem(k,before[k])", "Certificates must be re-earned"]:
    assert marker in bridge, f"import hardening missing: {marker}"
storage_commit = bridge.index("for(const [k,v] of Object.entries(writes))localStorage.setItem(k,v)")
memory_commit = bridge.index("db=proposed;user=db.users[db.activeUser]")
assert storage_commit < memory_commit, "memory must change only after all storage writes succeed"

shell = text("pwa-shell.js")
assert f"const RELEASE='{ANDROID_RELEASE}'" in shell
assert f"const CONTENT='{CONTENT_VERSION}'" in shell
assert "NZ source-status (?:note|clarification)" in shell, "duplicate NZ note prevention missing"

loader = text("MouldMaster_Academy_App.html")
assert f'const CONTENT="{CONTENT_VERSION}"' in loader
assert 'crypto.subtle.digest("SHA-256",bytes)' in loader
for key, name in {"core": "MouldMaster_Core_App.html", "css": "reading-patch.css", "reading": "reading-patch.js", "training": "training-upgrade.js", "qa": "training-qa-fix.js"}.items():
    expected = sha256(name)
    marker = f'{key}:{{path:"{name}",sha256:"{expected}"}}'
    assert marker in loader, f"Windows loader does not verify current {name} bytes"

for js_name in ["service-worker.js", "reading-patch.js", "training-upgrade.js", "training-qa-fix.js", "pwa-shell.js"]:
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

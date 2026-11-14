from pathlib import Path
import hashlib
import json
import os
import re
import struct
import subprocess
import tempfile

WEB_RELEASE = "2026.11.14.3"
ANDROID_RELEASE = "2026.11.08.1"
CONTENT_VERSION = "2026.08.26.1"
WINDOWS_RECOVERY_VERSION = "2026.08.21.1"
QUESTION_BANK_VERSION = "2026.08.30.1"
LEGACY_REVIEW_ID_VERSION = "2026.08.21.1"
WINDOWS_RECOVERY_SOURCE_COMMIT = "3e7144b68c5dfe79232cf2ba0180060f1395ffcc"
WINDOWS_RECOVERY_CORE_SHA256 = "96ed07e1487633538359eb12073fe50bfe595d9d5aaa807173e0a764b9123754"
CURRENT_CORE_SHA256 = "56b1b423fc62596b6a5d0762b6aa13f922125e6e697223c77919d18ece48cfeb"
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
subprocess.run(["python", "tools/build_runtime_packs.py", "--check"], check=True)
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
assert "function pvBuildImportedUsers(x)" in core and "if(entries.length>500)" in core, "standalone backup import must reject oversized learner registries instead of truncating"
assert "function pvCanonicalLearnerId(v)" in core and "Learner identifier mismatch" in core, "standalone learner identity validation is missing"
assert "data-mm-switch-user" in core and "function pvWireInstructorSwitches(users)" in core, "standalone instructor switching must not interpolate learner IDs into inline handlers"
assert "criticalWrong===0" in core, "zero-wrong safety-critical gate missing"
assert "Compare All assesses ALL 9 regional items" in core, "Compare All regional rule missing"

index = text("index.html")
assert f'const SHELL_RELEASE="{WEB_RELEASE}"' in index
assert 'const RUNTIME_ASSET_VERSION=SHELL_RELEASE;' in index
assert 'const CORE_
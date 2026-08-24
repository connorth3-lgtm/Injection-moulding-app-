from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
DESKTOP = ROOT / "desktop" / "electron"


def require(condition, message):
    if not condition:
        raise AssertionError(message)


for path in [
    ROOT / "README.md",
    ROOT / "SECURITY.md",
    ROOT / "LICENSE",
    ROOT / "OPEN_SOURCE_AND_PATENT_POLICY.md",
    ROOT / "THIRD_PARTY_NOTICES.md",
    DESKTOP / "README.md",
    DESKTOP / "THREAT_MODEL.md",
    DESKTOP / "package.json",
    DESKTOP / "package-lock.json",
    DESKTOP / "src" / "main.cjs",
    DESKTOP / "scripts" / "generate-integrity.cjs",
    DESKTOP / "scripts" / "generate-licenses.cjs",
    DESKTOP / "scripts" / "generate-sbom.cjs",
    DESKTOP / "scripts" / "generate-msix-assets.ps1",
    DESKTOP / "scripts" / "qa.cjs",
    ROOT / ".github" / "workflows" / "desktop-dependency-lock.yml",
    ROOT / ".github" / "workflows" / "open-desktop-build.yml",
    ROOT / ".github" / "workflows" / "microsoft-store-msix.yml",
]:
    require(path.exists(), f"open desktop/release file missing: {path.relative_to(ROOT)}")

pkg = json.loads((DESKTOP / "package.json").read_text(encoding="utf-8"))
lock = json.loads((DESKTOP / "package-lock.json").read_text(encoding="utf-8"))
require(pkg.get("license") == "Apache-2.0", "desktop package must remain Apache-2.0")
require(lock.get("lockfileVersion", 0) >= 3, "desktop npm lockfile must be v3+")
for dep in ("electron", "electron-builder"):
    require(lock["packages"][""]["devDependencies"][dep] == pkg["devDependencies"][dep], f"locked {dep} version mismatch")

main = (DESKTOP / "src" / "main.cjs").read_text(encoding="utf-8")
for marker in [
    "nodeIntegration: false",
    "contextIsolation: true",
    "sandbox: true",
    "webSecurity: true",
    "allowRunningInsecureContent: false",
    "setPermissionRequestHandler",
    "setPermissionCheckHandler",
    "will-attach-webview",
    "setWindowOpenHandler",
    "server.listen(0, '127.0.0.1'",
    "SHA-256 verification failed",
]:
    require(marker in main, f"desktop security invariant missing: {marker}")

integrity_script = (DESKTOP / "scripts" / "generate-integrity.cjs").read_text(encoding="utf-8")
require("MouldMaster_Academy_App.html" in integrity_script, "desktop integrity set must include the file expected by the existing service worker")

extra = pkg["build"]["extraResources"]
from_paths = {x.get("from") for x in extra if isinstance(x, dict)}
require("../../MouldMaster_Academy_App.html" in from_paths, "desktop bundle must include service-worker compatibility loader")
require("generated/integrity.json" in from_paths, "packaged integrity manifest missing")
require("generated/dependency-licenses.json" in from_paths, "dependency licence inventory missing")
require("generated/sbom.cdx.json" in from_paths, "SBOM missing from package")

msix_assets = (DESKTOP / "scripts" / "generate-msix-assets.ps1").read_text(encoding="utf-8")
require('"../../../mouldmaster-512.png"' in msix_assets, "MSIX artwork source path must resolve to repository root icon")

store = (ROOT / ".github" / "workflows" / "microsoft-store-msix.yml").read_text(encoding="utf-8")
for marker in ["MM_STORE_IDENTITY_NAME", "MM_STORE_PUBLISHER_DISPLAY_NAME", "createMsixupload=true", "enforcePackageIntegrity=true"]:
    require(marker in store, f"Store package gate missing: {marker}")

version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
require(version.get("desktop_release"), "desktop_release missing from version.json")
require(version.get("windows_recovery_release"), "windows_recovery_release missing from version.json")
require(version["desktop_release"] != version["windows_recovery_release"], "open desktop and legacy recovery lanes must be explicit and separate")

print("MouldMaster open desktop release QA passed")

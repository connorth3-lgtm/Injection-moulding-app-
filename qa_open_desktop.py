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
    DESKTOP / "LEGACY_MIGRATION.md",
    DESKTOP / "REAL_WINDOWS_VALIDATION.md",
    DESKTOP / "THREAT_MODEL.md",
    DESKTOP / "package.json",
    DESKTOP / "package-lock.json",
    DESKTOP / "src" / "main.cjs",
    DESKTOP / "scripts" / "generate-integrity.cjs",
    DESKTOP / "scripts" / "generate-licenses.cjs",
    DESKTOP / "scripts" / "generate-sbom.cjs",
    DESKTOP / "scripts" / "signing-status.cjs",
    DESKTOP / "scripts" / "generate-msix-assets.ps1",
    DESKTOP / "scripts" / "verify-real-windows-release.ps1",
    DESKTOP / "scripts" / "qa.cjs",
    ROOT / ".github" / "workflows" / "desktop-dependency-lock.yml",
    ROOT / ".github" / "workflows" / "open-desktop-build.yml",
    ROOT / ".github" / "workflows" / "publish-open-desktop.yml",
    ROOT / ".github" / "workflows" / "microsoft-store-msix.yml",
]:
    require(path.exists(), f"open desktop/release file missing: {path.relative_to(ROOT)}")

pkg = json.loads((DESKTOP / "package.json").read_text(encoding="utf-8"))
lock = json.loads((DESKTOP / "package-lock.json").read_text(encoding="utf-8"))
require(pkg.get("license") == "Apache-2.0", "desktop package must remain Apache-2.0")
require(lock.get("lockfileVersion", 0) >= 3, "desktop npm lockfile must be v3+")
for dep in ("electron", "electron-builder"):
    require(lock["packages"][""]["devDependencies"][dep] == pkg["devDependencies"][dep], f"locked {dep} version mismatch")
msix_cmd = pkg.get("scripts", {}).get("dist:msix", "")
require("electron-builder@27.0.0-alpha.7" in msix_cmd, "local MSIX command must pin the approved beta toolchain")
require("--config.msix.setBuildNumber=true" in msix_cmd, "local MSIX command must preserve the desktop release build number")
require(pkg.get("scripts", {}).get("signing") == "node scripts/signing-status.cjs", "desktop signing-readiness command must remain explicit")
for script_name in ("start", "dist:portable", "dist:nsis", "dist:msix"):
    require("npm run signing" in pkg.get("scripts", {}).get(script_name, ""), f"{script_name} must record Windows signing readiness before launch/package")
require("generated/signing-status.json" in pkg.get("build", {}).get("files", []), "packaged desktop build must retain its signing-readiness record")
signing = (DESKTOP / "scripts" / "signing-status.cjs").read_text(encoding="utf-8")
for marker in ["MM_REQUIRE_WINDOWS_SIGNING", "CSC_LINK", "CSC_KEY_PASSWORD", "signing-status.json", "required&&!configured", "PR/development build may be unsigned"]:
    require(marker in signing, f"Windows signing-readiness gate missing: {marker}")

version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
release = version.get("desktop_release", "")
parts = release.split(".")
require(len(parts) == 4 and all(x.isdigit() for x in parts), "desktop_release must be a four-part numeric version")
normalized = [str(int(x)) for x in parts]
expected_pkg_version = ".".join(normalized[:3])
expected_build_number = normalized[3]
expected_build_version = ".".join(normalized)
expected_tag = f"desktop-v{release}"
expected_url = f"https://github.com/{version.get('repository')}/releases/tag/{expected_tag}"
require(pkg.get("version") == expected_pkg_version, "desktop package version must match the first three desktop_release components")
require(str(pkg["build"].get("buildNumber")) == expected_build_number, "desktop buildNumber must match desktop_release fourth component")
require(pkg["build"].get("buildVersion") == expected_build_version, "desktop buildVersion must match desktop_release")
require("${buildVersion}" in pkg["build"]["win"].get("artifactName", ""), "Windows artifact name must include buildVersion")
require(version.get("desktop_release_tag") == expected_tag, "desktop_release_tag must match desktop_release")
require(version.get("desktop_release_url") == expected_url, "desktop_release_url must match the tagged GitHub release")
require(version.get("windows_recovery_release"), "windows_recovery_release missing from version.json")
require(version["desktop_release"] != version["windows_recovery_release"], "open desktop and legacy recovery lanes must be explicit and separate")

desktop_readme = (DESKTOP / "README.md").read_text(encoding="utf-8")
require(f"Current desktop release: `{release}`" in desktop_readme, "desktop README current release is stale")
for marker in ["REAL_WINDOWS_VALIDATION.md", "verify-real-windows-release.ps1", "normal Windows 10/11", "It is unsigned unless explicitly stated otherwise", "preferred signed public Windows distribution"]:
    require(marker in desktop_readme, f"desktop README real-Windows/signing marker missing: {marker}")

fuses = pkg["build"].get("electronFuses", {})
for name, expected in {
    "runAsNode": False,
    "enableNodeOptionsEnvironmentVariable": False,
    "enableNodeCliInspectArguments": False,
    "enableEmbeddedAsarIntegrityValidation": True,
    "onlyLoadAppFromAsar": True,
}.items():
    require(fuses.get(name) is expected, f"Electron fuse must remain {name}={str(expected).lower()}")

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
    "const INTEGRITY_PATH = path.join(__dirname, '..', 'generated', 'integrity.json')",
    "const allowed = new Set(Object.keys(integrity.files))",
    "method !== 'GET' && method !== 'HEAD'",
    "SHA-256 verification failed",
]:
    require(marker in main, f"desktop security invariant missing: {marker}")
require("process.resourcesPath, 'mouldmaster', 'integrity.json'" not in main, "packaged integrity manifest must not be read from the writable asset directory")

integrity_script = (DESKTOP / "scripts" / "generate-integrity.cjs").read_text(encoding="utf-8")
require("MouldMaster_Academy_App.html" in integrity_script, "desktop integrity set must include the file expected by the existing service worker")
require("process-statistics-v2.js" in integrity_script, "desktop integrity set must hash the advanced process-statistics runtime")

extra = pkg["build"]["extraResources"]
from_paths = {x.get("from") for x in extra if isinstance(x, dict)}
require("../../MouldMaster_Academy_App.html" in from_paths, "desktop bundle must include service-worker compatibility loader")
require("../../process-statistics-v2.js" in from_paths, "desktop bundle must include advanced process-statistics runtime")
require("generated/integrity.json" in from_paths, "packaged integrity manifest missing")
require("generated/dependency-licenses.json" in from_paths, "dependency licence inventory missing")
require("generated/sbom.cdx.json" in from_paths, "SBOM missing from package")

msix_assets = (DESKTOP / "scripts" / "generate-msix-assets.ps1").read_text(encoding="utf-8")
require('"../../../mouldmaster-512.png"' in msix_assets, "MSIX artwork source path must resolve to repository root icon")

real_windows = (DESKTOP / "REAL_WINDOWS_VALIDATION.md").read_text(encoding="utf-8")
for marker in [
    "manual evidence required",
    "normal Windows 10/11",
    "real legacy backup",
    "offline launch",
    "imported certificate/pass state is not trusted",
    "learner names, backup content, customer identifiers",
]:
    require(marker in real_windows, f"real-Windows retirement safeguard missing: {marker}")

verify_script = (DESKTOP / "scripts" / "verify-real-windows-release.ps1").read_text(encoding="utf-8")
for marker in [
    "$IsWindows",
    "Get-FileHash",
    "SHA-256 mismatch",
    "sha256_verified",
    "content_copied_to_evidence = $false",
    "manual_checks",
]:
    require(marker in verify_script, f"real-Windows evidence helper safeguard missing: {marker}")

store = (ROOT / ".github" / "workflows" / "microsoft-store-msix.yml").read_text(encoding="utf-8")
for marker in [
    "MM_STORE_IDENTITY_NAME",
    "MM_STORE_PUBLISHER",
    "MM_STORE_PUBLISHER_DISPLAY_NAME",
    "electron-builder@27.0.0-alpha.7",
    "--config.msix.publisher=",
    "--config.msix.setBuildNumber=true",
    "createMsixupload=true",
    "enforcePackageIntegrity=true",
    "${buildVersion}",
]:
    require(marker in store, f"Store package gate missing: {marker}")

publish = (ROOT / ".github" / "workflows" / "publish-open-desktop.yml").read_text(encoding="utf-8")
for marker in [
    "permissions:\n  contents: read",
    "build-signed-windows:",
    "publish-release:",
    "needs: build-signed-windows",
    "contents: write",
    "persist-credentials: false",
    "npx electron-builder --win portable",
    "Require protected fully validated production source",
    "python tools/verify_production_source.py --evidence-out desktop/electron/generated/production-source-evidence.json",
    "Require production signing credentials",
    "Desktop package QA without signing secrets",
    "Re-verify transferred signed release evidence",
    "Get-AuthenticodeSignature",
    "TimeStamperCertificate",
    "python qa_release.py",
    "python qa_open_desktop.py",
    "python qa_real_process_data_pilot.py",
    "SHA256SUMS.txt",
    "SOURCE_COMMIT.txt",
    "dependency-licenses.json",
    "sbom.cdx.json",
    "authenticode-status.json",
    "production-source-evidence.json",
    "gh api \"repos/$repo/git/ref/tags/$env:MM_RELEASE_TAG\"",
    "gh release create",
    "gh release upload",
    "--target $env:GITHUB_SHA",
]:
    require(marker in publish, f"open desktop publish gate missing: {marker}")
require(publish.count("contents: write") == 1, "desktop publication write authority must exist only in the publish job")
require(publish.count("secrets.WINDOWS_CSC_LINK") == 2, "signing certificate secret must be exposed only to readiness and signed-build steps")
require(publish.count("GH_TOKEN: ${{ github.token }}") == 1, "release token must be exposed only to the publication step")
require("npm run dist:portable" not in publish, "production publisher must not route signing secrets through the broad dist:portable QA wrapper")
require("paths:\n      - 'version.json'" in publish, "desktop publishing must be driven by an explicit release-version change")

migration = (DESKTOP / "LEGACY_MIGRATION.md").read_text(encoding="utf-8")
for marker in [
    "not assumed to migrate automatically",
    "progress-backup export",
    "certificates must be re-earned",
    "real Windows 10/11",
    "SHA256SUMS.txt",
]:
    require(marker in migration, f"legacy migration safeguard missing: {marker}")

print("MouldMaster open desktop release QA passed (least-privilege signed build/publish split; explicit Windows signing-readiness provenance; browser/offline/desktop process-statistics parity)")

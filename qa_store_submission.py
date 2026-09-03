from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
CERT = ROOT / "certification"


def text(path):
    return Path(path).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


version = json.loads(text(ROOT / "version.json"))
desktop_release = version["desktop_release"]

listing_path = CERT / "MICROSOFT_STORE_LISTING_COPY.md"
submission_path = CERT / "MICROSOFT_STORE_SUBMISSION.md"
assets_path = CERT / "MICROSOFT_STORE_ASSET_CHECKLIST.md"
roadmap_path = CERT / "README.md"
store_workflow_path = ROOT / ".github" / "workflows" / "microsoft-store-msix.yml"

for path in [listing_path, submission_path, assets_path, roadmap_path, store_workflow_path]:
    require(path.exists(), f"Store readiness file missing: {path.relative_to(ROOT)}")

listing = text(listing_path)
submission = text(submission_path)
assets = text(assets_path)
roadmap = text(roadmap_path)
workflow = text(store_workflow_path)
desktop_pkg = json.loads(text(ROOT / 'desktop/electron/package.json'))
desktop_lock = json.loads(text(ROOT / 'desktop/electron/package-lock.json'))
msix_pkg = json.loads(text(ROOT / 'desktop/electron/msix-toolchain/package.json'))
msix_lock = json.loads(text(ROOT / 'desktop/electron/msix-toolchain/package-lock.json'))
msix_runner = text(ROOT / 'desktop/electron/scripts/run-msix-builder.cjs')
dependency_lock_workflow = text(ROOT / '.github/workflows/desktop-dependency-lock.yml')

# The Store route must describe the source-backed desktop package, not stale PWA packaging.
require("open Windows desktop/MSIX" in listing, "Store listing must identify the desktop/MSIX lane")
require("open-source Electron desktop application" in listing, "Store reviewer notes must describe Electron desktop packaging")
require("Progressive Web App for injection moulding education" not in listing, "stale PWA Store certification notes returned")
require("active Store route is the **open Electron/MSIX desktop package**" in submission, "Store submission route must be explicit")
require("preferred Microsoft Store route is now the source-backed Electron desktop" in roadmap, "certification roadmap Store route is stale")

# Release metadata and public support/privacy endpoints must remain coherent.
for body, name in [(listing, "listing"), (submission, "submission"), (roadmap, "roadmap")]:
    require(desktop_release in body, f"{name} desktop release is stale")
require("https://connorth3-lgtm.github.io/Injection-moulding-app-/privacy.html" in listing, "Store privacy URL missing")
require("https://connorth3-lgtm.github.io/Injection-moulding-app-/support.html" in listing, "Store support URL missing")
for stale in ["2026.08.23.10", "2026.08.23.5"]:
    require(stale not in roadmap, f"stale certification roadmap release remains: {stale}")

# Screenshot rules reflect the current Microsoft desktop listing requirements used by the project.
for marker in ["PNG", "1366×768", "50 MB", "minimum count: 1", "recommended count: 4 or more", "maximum desktop count: 10"]:
    require(marker in assets, f"Store screenshot requirement missing: {marker}")
for marker in ["actual application build", "no real learner PII", "Do not use generated, composited or mock UI as certification evidence"]:
    require(marker in assets, f"Store screenshot evidence safeguard missing: {marker}")

# Store package identity/build mechanics must remain tied to real Partner Center values.
for marker in [
    "MM_STORE_IDENTITY_NAME",
    "MM_STORE_PUBLISHER",
    "MM_STORE_PUBLISHER_DISPLAY_NAME",
    "--x64 --arm64",
    "createMsixbundle=true",
    "createMsixupload=true",
    "setBuildNumber=true",
    "enforcePackageIntegrity=true",
    "10.0.19041.0",
    "SOURCE_COMMIT.txt",
    "SHA256SUMS-STORE.txt",
]:
    require(marker in workflow, f"Store package workflow safeguard missing: {marker}")

# MSIX packaging must be reproducible and isolated from the stable portable/NSIS builder.
require(desktop_pkg['devDependencies'].get('electron-builder') == '26.15.7', 'portable/NSIS electron-builder pin changed unexpectedly')
require('node scripts/run-msix-builder.cjs --win msix' in desktop_pkg['scripts'].get('dist:msix', ''), 'desktop MSIX script must use the locked local runner')
require('npx --yes electron-builder' not in desktop_pkg['scripts'].get('dist:msix', ''), 'desktop MSIX script must not resolve a builder from the network at execution time')
require(desktop_lock['packages']['']['devDependencies'].get('electron-builder') == '26.15.7', 'root desktop lock must preserve electron-builder 26.15.7')
require(msix_pkg.get('devDependencies', {}).get('electron-builder') == '27.0.0-alpha.7', 'MSIX toolchain must pin electron-builder 27.0.0-alpha.7 exactly')
locked_msix = msix_lock.get('packages', {}).get('node_modules/electron-builder')
require(locked_msix is not None and locked_msix.get('version') == '27.0.0-alpha.7', 'MSIX lockfile must resolve electron-builder 27.0.0-alpha.7 exactly')
require(bool(locked_msix.get('resolved')) and bool(locked_msix.get('integrity')), 'MSIX electron-builder lock entry must include resolved tarball and integrity')
require(re.fullmatch(r'sha512-[A-Za-z0-9+/=]+', locked_msix.get('integrity', '')) is not None, 'MSIX electron-builder lock integrity must be SHA-512')
require("EXPECTED_VERSION = '27.0.0-alpha.7'" in msix_runner, 'MSIX runner must fail closed on builder version drift')
require('msix-toolchain' in msix_runner and 'node_modules' in msix_runner and 'spawnSync' in msix_runner, 'MSIX runner must execute only the isolated installed toolchain')
require('npx --yes electron-builder' not in workflow, 'Store workflow must not download electron-builder at package time')
require('desktop/electron/msix-toolchain/package-lock.json' in workflow, 'Store workflow cache must include the MSIX lockfile')
require('working-directory: desktop/electron/msix-toolchain' in workflow and 'npm ci --no-audit --fund=false' in workflow, 'Store workflow must install the isolated MSIX toolchain with npm ci')
require('node scripts/run-msix-builder.cjs --version' in workflow and 'node scripts/run-msix-builder.cjs --win msix --x64 --arm64' in workflow, 'Store workflow must verify and use the locked local MSIX runner')
require('npm ci --prefix desktop/electron' in dependency_lock_workflow and 'npm ci --prefix desktop/electron/msix-toolchain' in dependency_lock_workflow, 'dependency-lock CI must prove both npm lockfiles with npm ci')
require('root electron-builder drift' in dependency_lock_workflow and 'run-msix-builder.cjs --version' in dependency_lock_workflow, 'dependency-lock CI must prove builder isolation')

# Current Microsoft Store trust boundary: Store MSIX gets Microsoft signing only after certification.
for marker in ["re-signs the package with a Microsoft certificate", "Windows App Certification Kit", "must never be guessed"]:
    require(marker in submission, f"Store submission trust/identity safeguard missing: {marker}")

# Avoid unsupported marketing counts and premature Store/NZQA approval claims.
# IACET claims are owned by qa_iacet_readiness.py so this checker does not use
# proximity heuristics that can misclassify legitimate IACET explanatory text.
require("120 structured injection moulding lessons" not in listing, "unverified exact lesson-count marketing claim returned")
for body, name in [(listing, "listing"), (submission, "submission"), (roadmap, "roadmap"), (assets, "assets")]:
    for claim in [r"\bMicrosoft certified\b", r"\bMicrosoft Store certified\b", r"\bNZQA approved\b"]:
        matches = list(re.finditer(claim, body, flags=re.I))
        for match in matches:
            context = body[max(0, match.start() - 400): min(len(body), match.end() + 400)].lower()
            require(
                any(gate in context for gate in ["not yet", "not ", "no ", "do not", "must not", "until", "only after", "without permission", "false", "premature"]),
                f"premature external approval claim in {name}: {match.group(0)}",
            )

print(f"MouldMaster Microsoft Store submission QA passed (desktop {desktop_release})")

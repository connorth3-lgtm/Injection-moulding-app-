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

# Current Microsoft Store trust boundary: Store MSIX gets Microsoft signing only after certification.
for marker in ["re-signs the package with a Microsoft certificate", "Windows App Certification Kit", "must never be guessed"]:
    require(marker in submission, f"Store submission trust/identity safeguard missing: {marker}")

# Avoid unsupported marketing counts and premature external approval claims.
require("120 structured injection moulding lessons" not in listing, "unverified exact lesson-count marketing claim returned")
for body, name in [(listing, "listing"), (submission, "submission"), (roadmap, "roadmap"), (assets, "assets")]:
    for claim in [r"\bMicrosoft certified\b", r"\bMicrosoft Store certified\b", r"\bNZQA approved\b", r"\bIACET CEUs?\b"]:
        matches = list(re.finditer(claim, body, flags=re.I))
        for match in matches:
            context = body[max(0, match.start() - 120): min(len(body), match.end() + 120)].lower()
            require(
                any(gate in context for gate in ["not yet", "not ", "do not", "must not", "until", "only after", "without permission", "false", "premature"]),
                f"premature external approval claim in {name}: {match.group(0)}",
            )

print(f"MouldMaster Microsoft Store submission QA passed (desktop {desktop_release})")

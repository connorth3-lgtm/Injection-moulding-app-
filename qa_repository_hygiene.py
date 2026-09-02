from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


ignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
for marker in (
    "desktop/electron/dist/",
    "desktop/electron/release-assets/",
    ".pages-dist/",
    "qa-artifacts/",
    "*.exe",
    "*.msi",
    "*.msix",
    "*.msixupload",
):
    need(marker in ignore, f"generated artifact ignore rule missing: {marker}")

tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).split(b"\0")
paths = [p.decode("utf-8") for p in tracked if p]
forbidden_suffixes = (
    ".exe",
    ".msi",
    ".msix",
    ".msixupload",
    ".dmg",
    ".appimage",
    ".deb",
    ".rpm",
)
forbidden = sorted(p for p in paths if p.lower().endswith(forbidden_suffixes))
need(not forbidden, "generated executable/installer artifacts are tracked in source: " + ", ".join(forbidden))

for forbidden_path in (
    "MouldMasterAcademy.exe",
    "desktop/electron/dist",
    "desktop/electron/release-assets",
    ".pages-dist",
    "qa-artifacts",
    "playwright-report",
    "test-results",
):
    need(not any(p == forbidden_path or p.startswith(forbidden_path + "/") for p in paths),
         f"generated output path is tracked in source: {forbidden_path}")

need((ROOT / ".gitattributes").is_file(), ".gitattributes missing")
attrs = (ROOT / ".gitattributes").read_text(encoding="utf-8")
need("MouldMaster_Core_App.html -text" in attrs, "audited core byte-preservation attribute missing")

print(f"MouldMaster repository hygiene QA passed ({len(paths)} tracked paths; no generated executables/installers or build-output directories committed).")

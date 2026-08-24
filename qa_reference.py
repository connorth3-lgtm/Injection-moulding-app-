from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent
NODE = "node"


def text(name):
    return (ROOT / name).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


REFERENCE_ASSETS = ["source-library.js", "reference-data.js", "reference-sources.js"]
SHIPPING_FILES = [
    *REFERENCE_ASSETS,
    "index.html",
    "service-worker.js",
    "sources/AUTHORITATIVE_SOURCE_REGISTER.md",
    "desktop/electron/package.json",
    "desktop/electron/src/main.cjs",
    "desktop/electron/scripts/generate-integrity.cjs",
    ".github/workflows/qa.yml",
    ".github/workflows/open-desktop-build.yml",
    ".github/workflows/microsoft-store-msix.yml",
]
for name in SHIPPING_FILES:
    require((ROOT / name).exists(), f"reference shipping file missing: {name}")

reference_data = text("reference-data.js")
for marker in [
    "materials:",
    "defects:",
    "signals:",
    "tooling:",
    "machine:",
    "quality:",
    "safety:",
    "troubleshooting:",
    "glossary:",
    "window.MM_REFERENCE_DATA=DATA",
    "not universal production setpoints",
]:
    require(marker in reference_data, f"reference data category/control missing: {marker}")
structured_entries = re.findall(r"\{\s*name\s*:\s*'", reference_data)
require(len(structured_entries) >= 100, "reference database unexpectedly small")

reference_sources = text("reference-sources.js")
for marker in [
    "Authoritative References",
    "window.MM_REFERENCE_SOURCES=SOURCES",
    "ISO 20430:2020",
    "HSE PPIS4(rev1)",
    "OSHA 1910.147",
    "WorkSafe NZ — Machine lockouts",
    "ISO 1133-1:2022",
    "ASTM D1238",
    "NIST Engineering Statistics Handbook",
    "ISO 22514-2:2026",
    "Autodesk Moldflow — Venting analysis",
    "Autodesk Moldflow — Weld and meld lines",
    "Kistler — Cavity pressure",
    "RJG — Injection molding resources",
    "References support mechanisms, terminology, test methods, safety duties and statistical principles",
]:
    require(marker in reference_sources, f"reference source/control missing: {marker}")
require("#examQuestions" not in reference_sources and "activeExam" not in reference_sources, "reference browser must not alter live assessments")
source_urls = set(re.findall(r"https://[^'\"\s<]+", reference_sources))
require(len(source_urls) >= 30, "authoritative reference library unexpectedly small")
require("http://" not in reference_sources, "reference browser must use HTTPS source links")

source_register = text("sources/AUTHORITATIVE_SOURCE_REGISTER.md")
for marker in [
    "Reference-database coverage",
    "Materials",
    "Defects",
    "Process signals",
    "Tooling",
    "Machine",
    "Quality",
    "Safety",
    "Troubleshooting",
    "Glossary",
    "Law/regulator pages control legal statements",
]:
    require(marker in source_register, f"authoritative source register coverage missing: {marker}")

index = text("index.html")
positions = []
for asset in REFERENCE_ASSETS:
    marker = f'<script src="./{asset}">'
    require(marker in index, f"reference shell asset missing: {asset}")
    positions.append(index.index(marker))
require(positions == sorted(positions), "reference scripts must load source library, data, then source browser")

sw = text("service-worker.js")
for asset in REFERENCE_ASSETS:
    require(f"'./{asset}'" in sw, f"reference offline asset missing: {asset}")

pkg = json.loads(text("desktop/electron/package.json"))
extra = pkg["build"]["extraResources"]
from_paths = {x.get("from") for x in extra if isinstance(x, dict)}
for asset in REFERENCE_ASSETS:
    require(f"../../{asset}" in from_paths, f"desktop reference asset missing: {asset}")

integrity_script = text("desktop/electron/scripts/generate-integrity.cjs")
for asset in REFERENCE_ASSETS:
    require(f"'{asset}'" in integrity_script, f"reference integrity asset missing: {asset}")
generated_integrity = ROOT / "desktop" / "electron" / "generated" / "integrity.json"
if generated_integrity.exists():
    integrity = json.loads(generated_integrity.read_text(encoding="utf-8"))
    for asset in REFERENCE_ASSETS:
        require(asset in integrity.get("files", {}), f"generated integrity manifest missing reference asset: {asset}")

main = text("desktop/electron/src/main.cjs")
require("setWindowOpenHandler" in main and "shell.openExternal(url)" in main, "desktop must route external reference links through the operating system")
require("/^https:\\/\\//i.test(url)" in main, "desktop external reference links must be HTTPS-only")

qa_workflow = text(".github/workflows/qa.yml")
require("node --check reference-data.js" in qa_workflow, "release QA must syntax-check reference data")
require("node --check reference-sources.js" in qa_workflow, "release QA must syntax-check reference sources")
require("python qa_reference.py" in qa_workflow, "release QA must run reference integrity QA")

open_desktop = text(".github/workflows/open-desktop-build.yml")
for asset in ["reference-data.js", "reference-sources.js", "qa_reference.py"]:
    require(f"- '{asset}'" in open_desktop, f"desktop build trigger missing reference asset: {asset}")
require("python qa_reference.py" in open_desktop, "desktop build must run reference integrity QA")

store = text(".github/workflows/microsoft-store-msix.yml")
require("python qa_reference.py" in store, "Microsoft Store build must run reference integrity QA")

for js_name in REFERENCE_ASSETS:
    p = subprocess.run([NODE, "--check", str(ROOT / js_name)], capture_output=True, text=True)
    require(p.returncode == 0, f"{js_name}: {p.stderr}")

print(f"MouldMaster reference data and source QA passed ({len(structured_entries)} structured entries, {len(source_urls)} source URLs)")

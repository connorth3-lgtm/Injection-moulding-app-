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


REFERENCE_ASSETS = ["source-library.js", "reference-data.js", "reference-deep-dive.js", "reference-sources.js", "reference-browser-ui.js"]
SHIPPING_FILES = [
    *REFERENCE_ASSETS,
    "index.html",
    "service-worker.js",
    "sources/AUTHORITATIVE_SOURCE_REGISTER.md",
    "sources/DEEP_DIVE_SOURCE_REGISTER.md",
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

deep = text("reference-deep-dive.js")
for marker in [
    "window.MM_REFERENCE_DATA",
    "ISO 294-4:2018",
    "ISO 15512:2019",
    "ISO 12100:2010",
    "ISO 13849-1:2023",
    "ISO 10218-1:2025",
    "EUROMAP 77",
    "ISO 14021:2026",
    "ISO 14040:2006",
    "FDA — Process Validation: General Principles and Practices",
    "window.MM_DEEP_DIVE_REFERENCE",
]:
    require(marker in deep, f"deep-dive reference marker missing: {marker}")
require("http://" not in deep, "deep-dive sources must use HTTPS")

structured_entries = re.findall(r"\{\s*name\s*:\s*'", reference_data + "\n" + deep)
require(len(structured_entries) >= 180, "reference database unexpectedly small after deep-dive expansion")

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
source_urls = set(re.findall(r"https://[^'\"\s<]+", reference_sources + "\n" + deep))
require(len(source_urls) >= 55, "authoritative reference library unexpectedly small after deep-dive expansion")
require("http://" not in reference_sources, "reference browser must use HTTPS source links")

reference_ui = text("reference-browser-ui.js")
for marker in [
    "['all','All']",
    "['safety','Safety']",
    "['materials','Materials']",
    "['testing','Testing']",
    "['automation','Automation']",
    "['research','Research']",
    "['sustainability','Sustainability']",
    "mmsrc-search::placeholder",
    "mmsrc-cardtop",
    "mmsrc-badge",
    "Under review",
    "Status: ",
    "Back to top of references",
    "mmsrc-topbtn",
    "prefers-reduced-motion",
    "window.MM_REFERENCE_BROWSER_UI",
]:
    require(marker in reference_ui, f"reference UI feature missing: {marker}")
require("#examQuestions" not in reference_ui and "activeExam" not in reference_ui, "reference UI must not alter live assessments")
require("http://" not in reference_ui, "reference UI must not introduce HTTP links")

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

deep_register = text("sources/DEEP_DIVE_SOURCE_REGISTER.md")
for marker in [
    "ISO 294-4:2018",
    "ISO 527-2:2025",
    "ISO 179-1:2026",
    "ISO 12100:2010",
    "ISO 13849-1:2023",
    "ISO 10218-2:2025",
    "EUROMAP 77",
    "ISO 14021:2026",
    "ISO 14044:2006",
    "Process Validation: General Principles and Practices",
    "Water-content testing and water-absorption testing answer different questions",
]:
    require(marker in deep_register, f"deep-dive source register coverage missing: {marker}")

index = text("index.html")
positions = []
for asset in REFERENCE_ASSETS:
    marker = f'<script src="./{asset}">'
    require(marker in index, f"reference shell asset missing: {asset}")
    positions.append(index.index(marker))
require(positions == sorted(positions), "reference scripts must load source library, base data, deep-dive data, source browser, then reference UI")

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
require("find . -maxdepth 1 -type f -name '*.js' -print0 | sort -z | xargs -0 -n1 node --check" in qa_workflow, "release QA must retain the filesystem JavaScript syntax gate")
require("python qa_reference.py" in qa_workflow, "release QA must run reference integrity QA")

open_desktop = text(".github/workflows/open-desktop-build.yml")
for asset in ["reference-data.js", "reference-deep-dive.js", "reference-sources.js", "reference-browser-ui.js", "qa_reference.py"]:
    require(f"- '{asset}'" in open_desktop, f"desktop build trigger missing reference asset: {asset}")
require("python qa_reference.py" in open_desktop, "desktop build must run reference integrity QA")

store = text(".github/workflows/microsoft-store-msix.yml")
require("python qa_reference.py" in store, "Microsoft Store build must run reference integrity QA")

for js_name in REFERENCE_ASSETS:
    p = subprocess.run([NODE, "--check", str(ROOT / js_name)], capture_output=True, text=True)
    require(p.returncode == 0, f"{js_name}: {p.stderr}")

print(f"MouldMaster reference data, source and mobile browser UI QA passed ({len(structured_entries)} structured entries, {len(source_urls)} source URLs)")
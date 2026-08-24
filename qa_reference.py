from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parent
NODE = "node"


def text(name):
    return (ROOT / name).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


for name in [
    "reference-data.js",
    "reference-sources.js",
    "source-library.js",
    "index.html",
    "service-worker.js",
    "desktop/electron/package.json",
    "desktop/electron/scripts/generate-integrity.cjs",
]:
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

index = text("index.html")
for asset in ["source-library.js", "reference-data.js", "reference-sources.js"]:
    require(f'<script src="./{asset}">' in index, f"reference shell asset missing: {asset}")

sw = text("service-worker.js")
for asset in ["source-library.js", "reference-data.js", "reference-sources.js"]:
    require(f"'./{asset}'" in sw, f"reference offline asset missing: {asset}")

pkg = json.loads(text("desktop/electron/package.json"))
extra = pkg["build"]["extraResources"]
from_paths = {x.get("from") for x in extra if isinstance(x, dict)}
for asset in ["source-library.js", "reference-data.js", "reference-sources.js"]:
    require(f"../../{asset}" in from_paths, f"desktop reference asset missing: {asset}")

integrity = text("desktop/electron/scripts/generate-integrity.cjs")
for asset in ["source-library.js", "reference-data.js", "reference-sources.js"]:
    require(f"'{asset}'" in integrity, f"reference integrity asset missing: {asset}")

for js_name in ["reference-data.js", "reference-sources.js", "source-library.js"]:
    p = subprocess.run([NODE, "--check", str(ROOT / js_name)], capture_output=True, text=True)
    require(p.returncode == 0, f"{js_name}: {p.stderr}")

print("MouldMaster reference data and source QA passed")

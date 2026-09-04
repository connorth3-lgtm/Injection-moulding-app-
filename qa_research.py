from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
ASSETS = ["reference-research-extension.js", "reference-20x-extension.js"]
REGISTER = "sources/RESEARCH_20X_SOURCE_REGISTER.md"


def text(name):
    return (ROOT / name).read_text(encoding="utf-8")


def need(cond, msg):
    if not cond:
        raise AssertionError(msg)


for asset in ASSETS:
    need((ROOT / asset).exists(), f"research extension missing: {asset}")
need((ROOT / REGISTER).exists(), "20-pass research source register missing")

research = text("reference-research-extension.js")
for marker in [
    "window.MM_REFERENCE_DATA",
    "PCR-PP",
    "Pressure-curve feature validation",
    "Conformal-cooling design validation",
    "Model drift monitoring",
    "Data leakage",
    "Krantz et al. (2024)",
    "Ke, Wang & Nian (2024)",
    "Zheng et al. (2025)",
    "Kanbur, Suping & Duan (2020)",
    "window.MM_RESEARCH_REFERENCE",
]:
    need(marker in research, f"research marker missing: {marker}")
need("http://" not in research, "research sources must use HTTPS")
need(len(re.findall(r"\{\s*name\s*:\s*'", research)) >= 70, "research extension unexpectedly small")
need(len(set(re.findall(r"https://[^'\"\s<]+", research))) >= 9, "research source set unexpectedly small")

x20 = text("reference-20x-extension.js")
passes = [
    "rheology and shear response",
    "drying moisture and hydrolysis",
    "hot runners and valve gates",
    "tool wear and maintenance",
    "defect mechanisms",
    "fibre orientation and composites",
    "velocity pressure and machine control",
    "in-mould sensing",
    "machine vision and ML inspection",
    "robot and automation integration",
    "process validation and SPC",
    "DOE and multi-objective optimisation",
    "recyclates and reprocessing",
    "LCA and sustainability",
    "predictive maintenance",
    "design for injection moulding",
    "micro injection moulding",
    "assisted and microcellular moulding",
    "energy efficiency",
    "overmoulding and insert moulding",
]
for marker in passes:
    need(marker in x20, f"20-pass research area missing: {marker}")
for marker in [
    "window.MM_RESEARCH_20X",
    "passCount:PASSES.length",
    "Hydrolysis-related embrittlement",
    "Hot-runner thermal imbalance",
    "Fibre-orientation warpage",
    "Microfeature replication ratio",
    "Bayesian adaptive DOE",
    "Predictive maintenance is not isolation",
    "Specific energy per part",
    "Overmould interface qualification",
    "Inline pvT / compressibility estimate",
    "Vision false accept on novel defect",
]:
    need(marker in x20, f"20-pass research marker missing: {marker}")
need("http://" not in x20, "20-pass research sources must use HTTPS")
need(len(re.findall(r"\{\s*name\s*:\s*[\"']", x20)) >= 90, "20-pass structured research set unexpectedly small")
need(len(set(re.findall(r"https://[^'\"\s<]+", x20))) >= 30, "20-pass research source set unexpectedly small")

register = text(REGISTER)
for marker in [
    "Twenty research passes",
    "Rheology and shear response",
    "Drying, moisture and hydrolysis",
    "Hot runners and valve gates",
    "Machine vision and ML inspection",
    "Process validation and SPC",
    "Predictive maintenance",
    "Micro injection moulding",
    "Energy efficiency",
    "Overmoulding and insert moulding",
    "A published experiment demonstrates behaviour under its own material, mould, machine and test conditions",
]:
    need(marker in register, f"20-pass source register marker missing: {marker}")

index = text("index.html")
evidence_pack = text("src/domains/runtime-packs/evidence-runtime-pack.js")
pack_marker = '<script src="./src/domains/runtime-packs/evidence-runtime-pack.js">'
need(pack_marker in index, "research evidence runtime pack not loaded by shell")
positions = []
for asset in ["reference-deep-dive.js", *ASSETS, "reference-sources.js"]:
    marker = f"/* >>> {asset} */"
    need(marker in evidence_pack, f"research runtime-pack member missing: {asset}")
    positions.append(evidence_pack.index(marker))
need(positions == sorted(positions), "research extension order is wrong inside evidence runtime pack")

sw = text("service-worker.js")
for asset in ASSETS:
    need(f"'./{asset}'" in sw, f"research extension not cached offline: {asset}")

pkg = json.loads(text("desktop/electron/package.json"))
from_paths = {x.get("from") for x in pkg["build"]["extraResources"] if isinstance(x, dict)}
for asset in ASSETS:
    need(f"../../{asset}" in from_paths, f"research extension missing from desktop bundle: {asset}")

integrity = text("desktop/electron/scripts/generate-integrity.cjs")
for asset in ASSETS:
    need(f"'{asset}'" in integrity, f"research extension missing from desktop integrity set: {asset}")

for name in [".github/workflows/qa.yml", ".github/workflows/open-desktop-build.yml", ".github/workflows/microsoft-store-msix.yml"]:
    need("python qa_research.py" in text(name), f"research QA not run by {name}")
open_build = text(".github/workflows/open-desktop-build.yml")
for asset in ASSETS:
    need(f"- '{asset}'" in open_build, f"desktop build trigger missing research extension: {asset}")

for asset in ASSETS:
    p = subprocess.run(["node", "--check", str(ROOT / asset)], capture_output=True, text=True)
    need(p.returncode == 0, f"{asset}: {p.stderr}")

p = subprocess.run([sys.executable, str(ROOT / "qa_governed_research_applicability.py")], cwd=ROOT, capture_output=True, text=True)
need(p.returncode == 0, "governed research applicability QA failed: " + (p.stderr or p.stdout))

p = subprocess.run([sys.executable, str(ROOT / "qa_engineering_research_context.py")], cwd=ROOT, capture_output=True, text=True)
need(p.returncode == 0, "engineering research context QA failed: " + (p.stderr or p.stdout))

print(f"MouldMaster research QA passed ({len(passes)} research passes + governed mechanism applicability + engineering case context)")

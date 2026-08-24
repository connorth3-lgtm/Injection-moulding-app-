from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent
ASSET = "reference-research-extension.js"


def text(name):
    return (ROOT / name).read_text(encoding="utf-8")


def need(cond, msg):
    if not cond:
        raise AssertionError(msg)


need((ROOT / ASSET).exists(), "research extension missing")
research = text(ASSET)
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

index = text("index.html")
need('<script src="./reference-research-extension.js">' in index, "research extension not loaded by shell")
need(index.index('reference-deep-dive.js') < index.index('reference-research-extension.js') < index.index('reference-sources.js'), "research extension load order is wrong")
need("'./reference-research-extension.js'" in text("service-worker.js"), "research extension not cached offline")

pkg = json.loads(text("desktop/electron/package.json"))
from_paths = {x.get("from") for x in pkg["build"]["extraResources"] if isinstance(x, dict)}
need("../../reference-research-extension.js" in from_paths, "research extension missing from desktop bundle")
need("'reference-research-extension.js'" in text("desktop/electron/scripts/generate-integrity.cjs"), "research extension missing from desktop integrity set")

for name in [".github/workflows/qa.yml", ".github/workflows/open-desktop-build.yml", ".github/workflows/microsoft-store-msix.yml"]:
    need("python qa_research.py" in text(name), f"research QA not run by {name}")
need("- 'reference-research-extension.js'" in text(".github/workflows/open-desktop-build.yml"), "desktop build trigger missing research extension")

p = subprocess.run(["node", "--check", str(ROOT / ASSET)], capture_output=True, text=True)
need(p.returncode == 0, f"{ASSET}: {p.stderr}")
print("MouldMaster plugin-backed research extension QA passed")

from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent


def text(name):
    return (ROOT / name).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


expansion = text("reference-2026-expansion.js")
page = text("reference-data.html")
index = text("index.html")
sw = text("service-worker.js")
pkg = json.loads(text("desktop/electron/package.json"))
integrity = text("desktop/electron/scripts/generate-integrity.cjs")

for marker in [
    "MM_REFERENCE_2026_EXPANSION",
    "Glass-fibre-reinforced polyamide",
    "Post-consumer recycled polyolefin compound",
    "Cavity-to-cavity imbalance",
    "Material moisture actual",
    "Gate-seal mass plateau study",
    "Cavity-separated capability study",
    "Check-ring repeatability study",
    "Purge and startup exclusion zone",
    "ISO 294-5:2026",
    "ISO 1183-1:2025",
    "ISO 179-1:2026",
    "Shin et al. (2025), Sensors and Actuators A",
    "Dawoud & Taha (2024), Polymers",
    "no universal production setpoints",
]:
    require(marker in expansion, f"2026 reference expansion marker missing: {marker}")

require("http://" not in expansion, "expanded reference sources must use HTTPS")
entries = re.findall(r"\{\s*name\s*:\s*'", expansion)
urls = set(re.findall(r"https://[^'\"\s<]+", expansion))
require(len(entries) >= 55, f"2026 reference expansion unexpectedly small: {len(entries)} entries")
require(len(urls) >= 15, f"2026 source expansion unexpectedly small: {len(urls)} source URLs")

full_stack = [
    "source-library.js",
    "reference-data.js",
    "reference-deep-dive.js",
    "reference-research-extension.js",
    "reference-20x-extension.js",
    "reference-2026-expansion.js",
]
positions = []
for asset in full_stack:
    marker = f'<script src="./{asset}"></script>'
    require(marker in page, f"standalone Reference Data page missing full-library asset: {asset}")
    positions.append(page.index(marker))
require(positions == sorted(positions), "standalone Reference Data scripts must load in dependency order")
require("standalone-document-full-library" in page, "standalone Reference Data full-library runtime marker missing")

require("reference-2026-expansion.js" in index, "main app must load the 2026 reference expansion")
revision_match = re.search(r"CACHE_REVISION='([^']+)'", sw)
require(revision_match is not None and "${CACHE_VERSION}-${CACHE_REVISION}" in sw, "PWA cache revision marker missing")
revision_dates = [int(x) for x in re.findall(r"20\d{6}", revision_match.group(1))]
require(revision_dates and max(revision_dates) >= 20260824, "PWA cache revision must not predate the reference expansion")
for asset in ["reference-data.html", "reference-2026-expansion.js"]:
    require(f"'./{asset}'" in sw, f"PWA offline cache missing expanded reference asset: {asset}")

extra = pkg["build"]["extraResources"]
from_paths = {x.get("from") for x in extra if isinstance(x, dict)}
for asset in ["reference-data.html", "reference-2026-expansion.js"]:
    require(f"../../{asset}" in from_paths, f"desktop package missing expanded reference asset: {asset}")
    require(f"'{asset}'" in integrity, f"desktop integrity generator missing expanded reference asset: {asset}")

p = subprocess.run(["node", "--check", str(ROOT / "reference-2026-expansion.js")], capture_output=True, text=True)
require(p.returncode == 0, p.stderr or "reference-2026-expansion.js syntax check failed")

print(f"MouldMaster expanded reference QA passed ({len(entries)} new structured entries, {len(urls)} source URLs)")

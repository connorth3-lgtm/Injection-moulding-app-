from __future__ import annotations

from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
import json
import runpy

ROOT = Path(__file__).resolve().parent
IMPL = ROOT / "qa_content_scale_targets_impl.py"
TARGETS = ROOT / "data/content-scale-targets.json"
INVENTORY = ROOT / "data/measured-dataset-inventory-v1.json"
PRIMARY = ROOT / "data/primary-measured-evidence-registry-v1.json"

if not IMPL.exists():
    raise AssertionError("content-scale target implementation is missing")

# Execute the complete mature audit unchanged. Its historical final print line
# contained a stale literal family count, so suppress implementation stdout and
# emit one summary derived from the exact JSON values that the audit validates.
_capture = StringIO()
with redirect_stdout(_capture):
    runpy.run_path(str(IMPL), run_name="__main__")

targets = json.loads(TARGETS.read_text(encoding="utf-8"))["targets"]
inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
profiled = targets["fully_profiled_measured_datasets"]["currentAccepted"]
samples = targets["measured_time_series_samples"]["currentAccepted"]
summary = inventory["summary"]
verified = primary["summary"]["publisherVerifiedPeerReviewedPrimaryMeasured"]

print(
    "MouldMaster content-scale target integrity QA passed "
    f"({summary['datasets']} measured datasets inventoried; "
    f"{profiled} fully profiled families including 2 restricted educational/noncommercial profiles; "
    f"{samples:,} accepted real measured time-series values; "
    f"{verified} publisher-verified primary measured studies; "
    f"{summary['automatedIngestionAllowed']} sources legally executable)"
)

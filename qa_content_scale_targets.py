from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
TARGETS = ROOT / "data" / "content-scale-targets.json"
DATASET_CATALOG = ROOT / "data" / "measured-dataset-catalog.json"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


obj = json.loads(TARGETS.read_text(encoding="utf-8"))
need(obj.get("schema") == 1, "content-scale target schema drifted")
need("synthetic" in obj.get("scope", "").lower(), "scope must explicitly exclude synthetic evidence from measured counts")

targets = obj.get("targets", {})
expected = {
    "fully_profiled_measured_datasets": (30, 50),
    "measured_time_series_samples": (1_000_000, 5_000_000),
    "material_profiles": (250, 300),
    "defect_mechanisms": (300, 400),
    "sensor_machine_health_concepts": (200, 250),
    "assessment_education_items": (1000, 1500),
    "peer_reviewed_research_records": (1500, 2000),
    "primary_measured_studies": (800, 1000),
}
need(set(targets) == set(expected), f"content-scale target areas drifted: {set(targets)}")

for key, (minimum, preferred) in expected.items():
    rec = targets[key]
    need(rec.get("minimum") == minimum, f"{key} minimum target drifted")
    need(rec.get("preferred") == preferred, f"{key} preferred target drifted")
    need(isinstance(rec.get("acceptance"), str) and len(rec["acceptance"]) >= 120, f"{key} needs a substantive acceptance definition")
    need(isinstance(rec.get("currentAccepted"), int) and rec["currentAccepted"] >= 0, f"{key} currentAccepted must be a non-negative integer")
    need(rec["currentAccepted"] <= preferred, f"{key} accepted count cannot exceed preferred target without revising the programme")

# Dedicated measured-dataset discovery catalog. Discovery is not profiling.
need(DATASET_CATALOG.exists(), "measured dataset catalog missing")
catalog = json.loads(DATASET_CATALOG.read_text(encoding="utf-8"))
need(catalog.get("schema") == 1, "measured dataset catalog schema drifted")
datasets = catalog.get("datasets") or []
need(len(datasets) >= 14, f"measured dataset discovery catalog unexpectedly small: {len(datasets)}")
ids = [d.get("id") for d in datasets]
need(len(ids) == len(set(ids)) and all(ids), "measured dataset catalog IDs must be unique and non-empty")
for d in datasets:
    need(isinstance(d.get("signals"), list) and d["signals"], f"{d.get('id')} needs signal/outcome discovery metadata")
    need(isinstance(d.get("profileRequirement"), str) and len(d["profileRequirement"]) >= 35, f"{d.get('id')} needs an explicit profiling requirement")
    need(d.get("profiled") is False, f"{d.get('id')} must not be marked profiled without a source-file profile record")
need(targets["fully_profiled_measured_datasets"].get("currentDiscovered") == len(datasets), "target ledger discovery count must equal measured-dataset catalog length")
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == sum(1 for d in datasets if d.get("profiled") is True), "accepted profiled-dataset count must equal catalog profile state")

# Hard truthfulness boundaries. These are intentionally conservative and should
# only be raised when a dedicated registry/QA proves the higher count.
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == 0, "do not claim a fully profiled real dataset until actual publisher files were profiled")
need(targets["measured_time_series_samples"]["currentAccepted"] == 0, "do not count synthetic cycles as measured samples")
need(targets["material_profiles"]["currentAccepted"] == 20, "base material count must match the currently explicit reference-data profiles until a dedicated registry supersedes it")
need(targets["defect_mechanisms"]["currentAccepted"] == 20, "base defect count must stay conservative until mechanisms are normalized into a dedicated registry")
need(targets["sensor_machine_health_concepts"]["currentAccepted"] == 0, "do not infer a sensor/health count from mixed reference cards")
need(targets["assessment_education_items"]["currentAccepted"] == 157, "accepted learner-item count must match the current evidence-gated keyed-question baseline")
need(targets["peer_reviewed_research_records"]["currentAccepted"] == 0, "do not relabel mixed research reference cards as deduplicated master paper records")
need(targets["primary_measured_studies"]["currentAccepted"] >= 40, "measured-evidence baseline must preserve at least 40 reviewed primary measured studies")

rules = " ".join(obj.get("nonCountingRules", [])).lower()
for marker in [
    "synthetic process-data cases never count",
    "actual source files",
    "openalex candidate is not",
    "generated assessment drafts",
]:
    need(marker in rules, f"content-scale non-counting rule missing: {marker}")

report = {
    "schema": 1,
    "version": obj.get("version"),
    "reviewed": obj.get("reviewed"),
    "measuredDatasetDiscovery": {
        "catalogCount": len(datasets),
        "profiledAccepted": sum(1 for d in datasets if d.get("profiled") is True),
        "embargoedRecords": sum(1 for d in datasets if "embargoed" in (d.get("access") or "")),
    },
    "areas": {
        key: {
            "accepted": targets[key]["currentAccepted"],
            "minimum": targets[key]["minimum"],
            "preferred": targets[key]["preferred"],
            "remainingToMinimum": max(0, targets[key]["minimum"] - targets[key]["currentAccepted"]),
            "remainingToPreferred": max(0, targets[key]["preferred"] - targets[key]["currentAccepted"]),
        }
        for key in expected
    },
    "boundary": "No synthetic, metadata-only, generated-draft or heuristic-candidate evidence is counted as completed measured/reviewed content unless its area-specific acceptance definition is satisfied."
}
(ROOT / "content-scale-targets-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"MouldMaster content-scale target integrity QA passed ({len(datasets)} measured datasets discovered; 0 falsely profiled)")

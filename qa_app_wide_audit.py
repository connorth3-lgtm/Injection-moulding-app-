from __future__ import annotations

from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent


def need(ok, message):
    if not ok:
        raise AssertionError(message)


def text(path):
    return (ROOT / path).read_text(encoding="utf-8")


def strict_json(path):
    path = Path(path)

    def no_duplicates(pairs):
        obj = {}
        for key, value in pairs:
            if key in obj:
                raise AssertionError(f"duplicate JSON key in {path}: {key!r}")
            obj[key] = value
        return obj

    def reject_constant(value):
        raise AssertionError(f"non-finite JSON number in {path}: {value}")

    try:
        return json.loads(
            path.read_text(encoding="utf-8"),
            object_pairs_hook=no_duplicates,
            parse_constant=reject_constant,
        )
    except UnicodeDecodeError as exc:
        raise AssertionError(f"non-UTF-8 tracked JSON data: {path}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise AssertionError(f"invalid JSON in {path}: {exc}") from exc


# Parse every tracked JSON/webmanifest strictly. This catches malformed files,
# duplicate keys that the normal json decoder would silently overwrite, and
# NaN/Infinity values that are not valid interoperable JSON.
raw = subprocess.check_output(
    ["git", "ls-files", "-z", "--", "*.json", "*.webmanifest"],
    cwd=ROOT,
)
tracked_json = [ROOT / p.decode("utf-8") for p in raw.split(b"\0") if p]
need(len(tracked_json) >= 100, f"tracked JSON audit unexpectedly small: {len(tracked_json)} files")
for path in tracked_json:
    strict_json(path)

# Syntax-check every root JavaScript file rather than maintaining a fragile
# hand-curated subset in the workflow.
root_js = sorted(ROOT.glob("*.js"))
need(len(root_js) >= 40, f"root JavaScript audit unexpectedly small: {len(root_js)} files")
for path in root_js:
    run = subprocess.run(["node", "--check", path.name], cwd=ROOT, capture_output=True, text=True)
    need(run.returncode == 0, f"JavaScript syntax failure in {path.name}: {run.stderr}")

# Exact browser-runtime/offline parity. Cover both scripts assembled directly
# from index.html and the two deliberately late-loaded integration assets.
index = text("index.html")
finalizer = text("app-shell-finalize.js")
service_worker = text("service-worker.js")
body_scripts = set(re.findall(r"\['(\./[^']+\.js)'\s*,\s*'<script", index))
late_scripts = {f"./{name}" for name in re.findall(r"loadAsset\('([^']+\.js)'", finalizer)}
runtime_scripts = body_scripts | late_scripts
offline_assets = set(re.findall(r"^\s*'(\./[^']+)'\s*,?\s*$", service_worker, flags=re.M))
need(len(body_scripts) >= 40, f"runtime BODY_SCRIPTS extraction unexpectedly small: {len(body_scripts)}")
need({'./assessment-bank-expansion.js', './app-integration-v3.js'} <= late_scripts, f"expected late integration assets not discovered: {sorted(late_scripts)}")
missing_files = sorted(src for src in runtime_scripts if not (ROOT / src.removeprefix("./")).is_file())
need(not missing_files, f"browser runtime scripts are missing: {missing_files}")
missing_offline = sorted(runtime_scripts - offline_assets)
need(not missing_offline, f"browser runtime scripts missing from service-worker install set: {missing_offline}")

# App-wide audit hardening must preserve blank/missing process values as missing,
# make anonymous cohort export/import structurally round-trip safe, and keep
# learner reset wording separate from the device/site process workspace.
integration = text("app-integration-v3.js")
for marker in [
    "presentSignalValue",
    "missingBefore:Math.max(0,beforeRows.length-before.length)",
    "FORBIDDEN_COHORT_KEYS",
    "rejectCohortFields(payload)",
    "cleanupDatasetReferences",
    "Reset learner data",
]:
    need(marker in integration, f"app-wide audit hardening marker missing: {marker}")
need("const text=JSON.stringify(payload);if(/learner" not in integration, "cohort import must not reject its own privacy prose by scanning the entire JSON string")

# Frozen legacy recovery feed must stay tied to its recovery lane without a
# duplicated desktop release number that inevitably becomes stale.
version = strict_json(ROOT / "version.json")
latest = strict_json(ROOT / "latest.json")
need(latest.get("version") == version.get("windows_recovery_release"), "legacy recovery feed/version.json recovery version drift")
need(latest.get("app_url", "").endswith("/MouldMaster_Core_App.html"), "legacy recovery app URL no longer points to the audited core")
notes = str(latest.get("notes", ""))
need("tagged GitHub Release recorded in version.json" in notes, "legacy recovery note must defer current desktop release identity to version.json")
need(re.search(r"Desktop\s+\d{4}\.\d{2}\.\d{2}\.\d+", notes) is None, "legacy recovery note must not duplicate a desktop release number")

# Canonical measured-data base and extension chain.
base_inv = strict_json(ROOT / "data/measured-dataset-inventory-v1.json")
base_exec = strict_json(ROOT / "data/measured-dataset-execution-ledger-v1.json")
wave2 = strict_json(ROOT / "data/measured-dataset-wave2-extension-v1.json")
batch4 = strict_json(ROOT / "data/measured-dataset-wave2-batch4-extension-v1.json")
batch5 = strict_json(ROOT / "data/measured-dataset-wave2-batch5-extension-v1.json")

need(base_inv["summary"]["datasets"] == len(base_inv["datasets"]) == 25, "landed measured inventory base must remain 25 sources")
need(base_inv["summary"]["automatedIngestionAllowed"] == 14, "landed measured inventory executable base must remain 14")
need(base_exec["summary"]["total"] == len(base_exec["sources"]) == 25, "landed measured execution base must remain 25 sources")
need(base_exec["summary"]["acceptedProfiled"] == 12, "landed measured execution accepted-profiled base must remain 12")

base_inv_ids = [x["datasetId"] for x in base_inv["datasets"]]
base_exec_ids = [x["datasetId"] for x in base_exec["sources"]]
need(len(base_inv_ids) == len(set(base_inv_ids)), "duplicate datasetId in landed measured inventory")
need(len(base_exec_ids) == len(set(base_exec_ids)), "duplicate datasetId in landed measured execution ledger")
need(set(base_inv_ids) == set(base_exec_ids), "landed measured inventory/execution dataset ID sets diverge")

metrics = (
    "inventoriedMeasuredSources",
    "automatedIngestionAllowed",
    "fullyProfiledMeasuredFamilies",
    "acceptedInjectionProcessTimeSeriesValues",
)


def reconcile_extension(ext, base_key, label):
    base = ext[base_key]
    delta = ext["delta"]
    effective = ext["effective"]
    for metric in metrics:
        need(
            base[metric] + delta[metric] == effective[metric],
            f"{label} arithmetic drift for {metric}: {base[metric]} + {delta[metric]} != {effective[metric]}",
        )


reconcile_extension(wave2, "baseCheckpoint", "Wave-2 XRD/XPS extension")
reconcile_extension(batch4, "baseEffective", "Wave-2 batch-4 extension")
reconcile_extension(batch5, "baseEffective", "Wave-2 batch-5 extension")
need(wave2["baseCheckpoint"]["inventoriedMeasuredSources"] == 25, "Wave-2 extension no longer starts from landed 25-source base")
need(wave2["effective"]["inventoriedMeasuredSources"] == batch4["baseEffective"]["inventoriedMeasuredSources"] == 31, "Wave-2 -> batch-4 inventory handoff drift")
need(wave2["effective"]["fullyProfiledMeasuredFamilies"] == batch4["baseEffective"]["fullyProfiledMeasuredFamilies"] == 14, "Wave-2 -> batch-4 family handoff drift")
need(batch4["effective"]["inventoriedMeasuredSources"] == batch5["baseEffective"]["inventoriedMeasuredSources"] == 32, "batch-4 -> batch-5 inventory handoff drift")
need(batch4["effective"]["fullyProfiledMeasuredFamilies"] == batch5["baseEffective"]["fullyProfiledMeasuredFamilies"] == 16, "batch-4 -> batch-5 family handoff drift")
need(batch4["effective"]["acceptedInjectionProcessTimeSeriesValues"] == batch5["baseEffective"]["acceptedInjectionProcessTimeSeriesValues"] == 66_521_519, "batch-4 -> batch-5 waveform handoff drift")
need(batch5["effective"]["inventoriedMeasuredSources"] == 34, "effective measured inventory must be 34 after batch 5")
need(batch5["effective"]["automatedIngestionAllowed"] == 21, "effective rights-executable measured source count must be 21 after batch 5")
need(batch5["effective"]["fullyProfiledMeasuredFamilies"] == 17, "effective fully-profiled measured family count must be 17 after batch 5")
need(batch5["effective"]["acceptedInjectionProcessTimeSeriesValues"] == 85_569_824, "effective process waveform total must be 85,569,824 after batch 5")

# Materialize the effective inventory/execution ID sets from the same layered
# operations used by the compiler, so duplicate additions or missing update
# targets cannot be hidden by summary numbers.
inv = {x["datasetId"]: x for x in base_inv["datasets"]}
for record in wave2["inventoryEntries"]:
    did = record["datasetId"]
    need(did not in inv, f"Wave-2 inventory addition duplicates existing datasetId: {did}")
    inv[did] = record
for update in batch4["inventoryUpdates"]:
    did = update["datasetId"]
    need(did in inv, f"batch-4 inventory update target missing: {did}")
    need(update["replacement"]["datasetId"] == did, f"batch-4 inventory replacement changes datasetId: {did}")
    inv[did] = update["replacement"]
for record in batch4["inventoryAdditions"]:
    did = record["datasetId"]
    need(did not in inv, f"batch-4 inventory addition duplicates existing datasetId: {did}")
    inv[did] = record
for record in batch5["inventoryAdditions"]:
    did = record["datasetId"]
    need(did not in inv, f"batch-5 inventory addition duplicates existing datasetId: {did}")
    inv[did] = record

execution = {x["datasetId"]: x for x in base_exec["sources"]}
for record in wave2["executionEntries"]:
    did = record["datasetId"]
    need(did not in execution, f"Wave-2 execution addition duplicates existing datasetId: {did}")
    execution[did] = record
for update in batch4["executionUpdates"]:
    did = update["datasetId"]
    need(did in execution, f"batch-4 execution update target missing: {did}")
    need(update["replacement"]["datasetId"] == did, f"batch-4 execution replacement changes datasetId: {did}")
    execution[did] = update["replacement"]
for record in batch4["executionAdditions"]:
    did = record["datasetId"]
    need(did not in execution, f"batch-4 execution addition duplicates existing datasetId: {did}")
    execution[did] = record
for record in batch5["executionAdditions"]:
    did = record["datasetId"]
    need(did not in execution, f"batch-5 execution addition duplicates existing datasetId: {did}")
    execution[did] = record

need(len(inv) == len(execution) == 34, "effective measured inventory/execution materialization must contain 34 unique dataset IDs")
need(set(inv) == set(execution), "effective measured inventory/execution dataset ID sets diverge")
need(sum(1 for x in inv.values() if x.get("automatedIngestionAllowed") is True) == 21, "effective automated-ingestion rights count does not reconcile to 21")

zen = inv["zenodo-energy-20338544"]
ad = inv["ad-stgn-injection-moulding-v1"]
need(zen["count"]["acceptedMeasuredTimeSeriesSamples"] == 19_048_305, "Zenodo energy accepted waveform count drifted")
need(ad["count"]["acceptedMeasuredTimeSeriesSamples"] == 0 and "blocked" in ad["accessState"], "AD-STGN must remain retrieval-blocked and zero-value until payload delivery")
ztkc = inv["mendeley-ztkc87d6sr-v1"]
need(ztkc.get("alternateSource") == "https://doi.org/10.17632/47k6jswwg7.1", "SiC/Nylon-6 alternate-source recovery drifted")
need(ztkc["count"]["acceptedRecordLevelMeasuredValues"] == 40, "SiC/Nylon-6 recovered measured-value count drifted")
need(sum(1 for did in inv if did == "mendeley-ztkc87d6sr-v1") == 1, "alternate SiC/Nylon-6 release must not create a second family")

# CI governance: the required general integrity gate must include both the deep
# repository audit and the focused cross-app integration contract. Post-merge
# data workflows must also run on main while native protection is external.
release_qa = text(".github/workflows/qa.yml")
master_workflow = text(".github/workflows/master-data-compile.yml")
ledger_workflow = text(".github/workflows/measured-dataset-wave2-ledger.yml")
need("run: python qa_app_wide_audit.py" in release_qa, "Release QA does not run app-wide data/runtime audit")
need("run: python qa_app_wide_integration.py" in release_qa, "Release QA does not run focused app-wide integration audit")
need("run: python qa_master_data_compile.py" in release_qa, "Release QA required integrity gate does not run canonical master-data reconciliation")
need("\n  push:\n    branches: [main]" in master_workflow, "master-data compilation lacks post-merge main trigger")
need("data/measured-dataset-wave2-batch5-extension-v1.json" in master_workflow, "master-data workflow does not track batch-5 extension")
need("\n  push:\n    branches: [main]" in ledger_workflow, "Wave-2 ledger lacks post-merge main trigger")
for marker in [
    "data/measured-dataset-wave2-batch4-extension-v1.json",
    "data/measured-dataset-wave2-batch5-extension-v1.json",
    "tools/compile_master_data_wave2_*.py",
]:
    need(marker in ledger_workflow, f"Wave-2 ledger trigger coverage missing: {marker}")

print(
    "MouldMaster app-wide deep audit passed: "
    f"{len(tracked_json)} strict JSON/webmanifest files; {len(root_js)} root JS files; "
    f"{len(runtime_scripts)} assembled/late runtime scripts offline-covered; effective measured state "
    "34 inventoried / 21 rights-executable / 17 fully profiled / 85,569,824 waveform values"
)

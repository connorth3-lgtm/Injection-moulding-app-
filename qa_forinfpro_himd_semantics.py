from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/forinfpro-himd-v1.json"
REVIEW = ROOT / "data/forinfpro-himd-semantic-review-2026-08-30.json"
INVENTORY = ROOT / "data/measured-dataset-inventory-v1.json"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
review = json.loads(REVIEW.read_text(encoding="utf-8"))
inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
row = next(x for x in inventory["datasets"] if x.get("datasetId") == "forinfpro-himd-v1")

semantic = contract.get("semanticAcceptance") or {}
need(contract.get("status") == "accepted-profiled-partially-semantic-resolved", "FORinFPRO contract state drifted")
need(semantic.get("acceptedMeasuredChannels") == 16, "FORinFPRO accepted channel count drifted")
need(semantic.get("acceptedMeasuredRowsPerChannel") == 10132, "FORinFPRO accepted row count drifted")
need(semantic.get("acceptedMeasuredTimeSeriesSamples") == 162112, "FORinFPRO accepted sample count drifted")
need(semantic.get("engineeringUnit") == "degC", "FORinFPRO accepted unit drifted")
need(semantic.get("timestampOrderingVerified") is True, "FORinFPRO time ordering must stay verified")
need(semantic.get("fixedSamplingIntervalAssumed") is False, "FORinFPRO must not invent a fixed sampling interval")
need(len(semantic.get("acceptedMeasuredColumns") or []) == 16, "FORinFPRO accepted column set must stay exactly 16")
need(all("Heating.sv_Zone" in x and x.endswith(".rActualTemp") for x in semantic["acceptedMeasuredColumns"]), "FORinFPRO accepted column namespace widened")

excluded = semantic.get("excludedScopes") or {}
need(excluded.get("HeatingOven1.rActualTemp") is not None, "HeatingOven1 scope must remain excluded")
need(excluded.get("cycle_001_pt.csv") is not None, "generic cavity PT file must remain excluded")
need(excluded.get("cycle_001_us_rms.csv") is not None, "ultrasonic RMS file must remain excluded")

count = row.get("count") or {}
need(count.get("acceptedMeasuredChannels") == 16, "inventory FORinFPRO channel count drifted")
need(count.get("acceptedMachineRows") == 10132, "inventory FORinFPRO row count drifted")
need(count.get("acceptedMeasuredTimeSeriesSamples") == 162112, "inventory FORinFPRO sample count drifted")
need(count.get("acceptedCountFormula") == "16 * 10132", "inventory FORinFPRO count formula drifted")

need(review.get("decision") == "accept-16-engel-heating-zone-actual-temperature-traces", "FORinFPRO review decision drifted")
need(review.get("acceptedMeasuredTimeSeriesSamples") == 162112, "FORinFPRO review count drifted")
need(review.get("familyCountChanges") is False, "FORinFPRO must not increment already-profiled family count")
need(review.get("rawRowsOrCellValuesEmitted") is False, "FORinFPRO review must remain aggregate-only")

print("FORinFPRO semantic QA passed (16 ENGEL heating-zone actual-temperature channels / 162,112 measured values)")

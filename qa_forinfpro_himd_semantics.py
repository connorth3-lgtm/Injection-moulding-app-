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
time = semantic.get("timeOrdering") or {}
need(contract.get("status") == "accepted-profiled-partially-semantic-resolved", "FORinFPRO contract state drifted")
need(semantic.get("acceptedMeasuredChannels") == 16, "FORinFPRO accepted channel count drifted")
need(semantic.get("rowsPerAcceptedChannel") == 10132, "FORinFPRO accepted row count drifted")
need(semantic.get("acceptedMeasuredTimeSeriesSamples") == 162112, "FORinFPRO accepted sample count drifted")
need(semantic.get("acceptedEngineeringUnit") == "degC", "FORinFPRO accepted unit drifted")
need(time.get("parsedRows") == 10132, "FORinFPRO timestamp parse coverage drifted")
need(time.get("strictlyIncreasing") is True, "FORinFPRO time ordering must stay verified")
need(time.get("fixedSamplingIntervalAssumed") is False, "FORinFPRO must not invent a fixed sampling interval")
need(time.get("absoluteTimestampsEmitted") is False, "FORinFPRO QA must not expose absolute timestamps")
need(len(semantic.get("acceptedMeasuredColumns") or []) == 16, "FORinFPRO accepted column set must stay exactly 16")
need(all("Heating.sv_Zone" in x and x.endswith(".rActualTemp") for x in semantic["acceptedMeasuredColumns"]), "FORinFPRO accepted column namespace widened")

excluded = semantic.get("excluded") or {}
need(excluded.get("HeatingOven1RActualTemp") is not None, "HeatingOven1 scope must remain excluded")
need(excluded.get("cycle_001_pt.csv") is not None, "generic cavity PT file must remain excluded")
need(excluded.get("cycle_001_us_rms.csv") is not None, "ultrasonic RMS file must remain excluded")

count = row.get("count") or {}
need(count.get("acceptedMeasuredChannels") == 16, "inventory FORinFPRO channel count drifted")
need(count.get("acceptedMachineRows") == 10132, "inventory FORinFPRO row count drifted")
need(count.get("acceptedMeasuredTimeSeriesSamples") == 162112, "inventory FORinFPRO sample count drifted")
need(count.get("acceptedCountFormula") == "16 * 10132", "inventory FORinFPRO count formula drifted")

accepted_def = review.get("acceptedChannelDefinition") or {}
counting = review.get("counting") or {}
executed = review.get("executedEvidence") or {}
need(review.get("decision") == "partial-measured-channel-acceptance", "FORinFPRO review decision drifted")
need(accepted_def.get("acceptedMeasuredChannels") == 16, "FORinFPRO review channel count drifted")
need(accepted_def.get("rowsPerChannel") == 10132, "FORinFPRO review row count drifted")
need(accepted_def.get("acceptedMeasuredTimeSeriesSamples") == 162112, "FORinFPRO review count drifted")
need(accepted_def.get("engineeringUnit") == "degC", "FORinFPRO review engineering unit drifted")
need(counting.get("fullyProfiledFamilyCountChange") == 0, "FORinFPRO must not increment already-profiled family count")
need(executed.get("rawRowsOrCellValuesEmitted") is False, "FORinFPRO review must remain aggregate-only")
need(executed.get("absoluteTimestampsEmitted") is False, "FORinFPRO review must not emit absolute timestamps")

print("FORinFPRO semantic QA passed (16 ENGEL heating-zone actual-temperature channels / 162,112 measured values)")

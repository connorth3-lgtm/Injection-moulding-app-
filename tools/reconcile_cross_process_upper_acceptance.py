#!/usr/bin/env python3
'''Reconcile accepted cross-process upper specialist-parser evidence into project ledgers.'''

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json"

UPPER_FILES = 10_697
UPPER_ROWS = 21_907_374
UPPER_ACCEPTED = 43_814_748
LOWER_ACCEPTED = 7_426_743
CROSS_ACCEPTED = LOWER_ACCEPTED + UPPER_ACCEPTED
OLD_TOTAL = 21_356_311
NEW_TOTAL = OLD_TOTAL + UPPER_ACCEPTED
EXPECTED_MD5 = "md5:069e190338b2ca29f736b21fabf407ba"


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def load(path: str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def write(path: str, value: dict) -> None:
    (ROOT / path).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    need(text.count(old) == 1, f"expected one replacement marker in {path}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


def replace_exact_count(path: str, old: str, new: str, count: int) -> None:
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    need(text.count(old) == count, f"expected {count} replacement markers in {path}: {old[:100]!r}")
    p.write_text(text.replace(old, new), encoding="utf-8")


result = json.loads(RESULT.read_text(encoding="utf-8"))
profile = result.get("profile") or {}
need(result.get("status") == "completed-source-defined-upper-workpiece-partial-acceptance", "upper specialist result status drifted")
need((result.get("source") or {}).get("publisherChecksum") == EXPECTED_MD5, "upper publisher checksum drifted")
need(profile.get("upperWorkpieceSerialCsvFilesAccepted") == UPPER_FILES, "upper accepted file count drifted")
need(profile.get("upperWorkpieceSerialCsvFilesRejected") == 0, "upper source contract rejected files")
need(profile.get("upperWorkpieceRowsAccepted") == UPPER_ROWS, "upper accepted row count drifted")
need(profile.get("acceptedMeasuredChannelsPerRow") == 2, "upper accepted channel count drifted")
need(profile.get("acceptedMeasuredTimeSeriesSamples") == UPPER_ACCEPTED == UPPER_ROWS * 2, "upper measured arithmetic drifted")
need(profile.get("pressureTargetValuesExcludedFromMeasuredCount") == UPPER_ROWS, "upper target exclusion drifted")
need(profile.get("pressureActualValuesExcludedPendingUnit") == UPPER_ROWS, "upper pressure-unit blocker drifted")
need(profile.get("stateValuesExcludedPendingSemantics") == UPPER_ROWS, "upper state blocker drifted")
need(profile.get("rawRowsOrCellValuesEmitted") is False, "upper parser must not emit raw rows")
need(profile.get("deliveredTimeIncrementFileCounts") == [{
    "deliveredIncrement": 0.0099999997764825,
    "canonicalKey": "0.00999999977648",
    "files": UPPER_FILES,
    "engineeringUnit": None,
}], "upper delivered time increment distribution drifted")
need([x.get("code") for x in profile.get("observedStateCodeCounts") or []] == [0, 1, 2, 4, 8], "upper observed state-code set drifted")
channels = {x.get("canonicalName"): x for x in result.get("channels") or []}
need({name for name, rec in channels.items() if rec.get("acceptedMeasuredValue")} == {"melt_volume", "injection_velocity"}, "upper promoted channel set drifted")
need(channels["injection_pressure_actual"].get("unit") is None and channels["injection_pressure_actual"].get("acceptedMeasuredValue") is False, "upper pressure actual must remain unit-blocked")
need(channels["state"].get("unit") is None and channels["state"].get("acceptedMeasuredValue") is False, "upper state must remain non-counting")

targets = load("data/content-scale-targets.json")
need(targets["targets"]["fully_profiled_measured_datasets"]["currentAccepted"] == 7, "fully profiled baseline must remain seven")
need(targets["targets"]["measured_time_series_samples"]["currentAccepted"] == OLD_TOTAL, "expected pre-upper measured baseline missing")
targets["version"] = "2026.08.29.6"
targets["targets"]["fully_profiled_measured_datasets"]["notes"] = (
    "Seven exact-source measured dataset families satisfy the profiling acceptance definition. "
    "The cross-process archive now has accepted source-defined lower and upper streams: lower contributes "
    "7,426,743 values from 4,989 TXT files / 2,475,581 rows, while the specialist upper parser accepts "
    "10,697/10,697 cycle CSVs / 21,907,374 rows and contributes 43,814,748 values from melt volume (cm³) "
    "and volumetric injection velocity (cm³/s). Cross-process does not become an eighth fully profiled family "
    "because the upper pressure engineering unit and state-code semantics remain unresolved and non-counting. "
    "ImPure remains structurally profiled but its 2,376,696 numeric cycle values are still unit/analogue-semantics limited. "
    "PET, Warwick and RWTH retain their documented semantic, format and retrieval blockers."
)
targets["targets"]["measured_time_series_samples"]["currentAccepted"] = NEW_TOTAL
targets["targets"]["measured_time_series_samples"]["notes"] = (
    "Accepted real time-series evidence totals 65,171,059 values. AVAPS contributes 13,631,488 values from "
    "3,328 quality-linked cycles x two delivered signals x 2,048 stored values per signal. OpenMMS-T4G contributes "
    "298,080 values from 29,808 ordered rows x 10 source-defined sensor channels. Cross-process contributes "
    "51,241,491 accepted values: 7,426,743 lower-workpiece actual values plus 43,814,748 upper-workpiece values "
    "from 21,907,374 validated rows x two source-backed measured channels (melt volume cm³ and volumetric injection velocity cm³/s). "
    "Lower and upper pressure-target command values are excluded. Upper pressure actual remains excluded pending its authoritative unit, "
    "and upper state codes remain excluded pending authoritative semantics. iGuzzini is record-level and contributes zero high-frequency "
    "time-series samples. The existing 19,008 process-data learning cycles remain synthetic and excluded."
)
write("data/content-scale-targets.json", targets)

ledger = load("data/measured-dataset-execution-ledger-v1.json")
need((ledger.get("summary") or {}).get("acceptedProfiled") == 7, "execution accepted-profiled baseline drifted")
source = next(x for x in ledger["sources"] if x.get("datasetId") == "cross-process-chain-17240390")
need(source.get("state") == "partial-accepted-lower-profiled-upper-unit-blocked", "cross-process pre-upper state drifted")
ledger["version"] = "2026.08.29.8"
source.update({
    "state": "partial-accepted-lower-and-upper-pressure-state-blocked",
    "action": "keep lower and upper source-native parsers/results regression-pinned; obtain the authoritative upper pressure engineering unit and state-code semantic mapping before full-family promotion",
    "reason": "exact publisher archive specialist run accepted 10,697/10,697 upper cycle CSVs and 21,907,374 rows; melt volume (cm³) and volumetric injection velocity (cm³/s) add 43,814,748 measured values. Together with 7,426,743 accepted lower actual values, cross-process contributes 51,241,491 accepted values. Upper pressure actual remains unit-blocked, pressure target remains command evidence and state remains semantics-blocked."
})
need((ledger.get("summary") or {}).get("partiallyAcceptedNotFullyProfiled") == 1, "cross-process must remain the single partially accepted family")
write("data/measured-dataset-execution-ledger-v1.json", ledger)

inventory = load("data/measured-dataset-inventory-v1.json")
cross = next(x for x in inventory["datasets"] if x.get("datasetId") == "cross-process-chain-17240390")
count = cross.get("count") or {}
need(count.get("acceptedMeasuredTimeSeriesSamples") == LOWER_ACCEPTED, "expected lower-only cross-process baseline missing")
inventory["version"] = "2026.08.29.4"
cross["accessState"] = "public-open-partially-accepted-lower-upper-pressure-state-unresolved"
count.update({
    "upperWorkpieceFilesAccepted": UPPER_FILES,
    "upperWorkpieceRowsAccepted": UPPER_ROWS,
    "upperAcceptedMeasuredChannelsPerRow": 2,
    "upperAcceptedMeasuredTimeSeriesSamples": UPPER_ACCEPTED,
    "upperPressureTargetValuesExcluded": UPPER_ROWS,
    "upperPressureActualValuesUnitBlocked": UPPER_ROWS,
    "upperStateValuesSemanticBlocked": UPPER_ROWS,
    "acceptedMeasuredTimeSeriesSamples": CROSS_ACCEPTED,
})
cross["count"] = count
cross["signals"] = [
    "lower: injection pressure target (command, bar; excluded from measured total)",
    "lower: injection pressure actual (bar)",
    "lower: screw volume actual (cm³)",
    "lower: injection flow actual (cm³/s)",
    "upper: melt volume / screw-volume coordinate (cm³)",
    "upper: volumetric injection velocity (cm³/s)",
    "upper: injection pressure target (command; unit unresolved, excluded)",
    "upper: injection pressure actual (unit unresolved, excluded)",
    "upper: state code (semantics unresolved, excluded)",
    "downstream screw-driving streams (excluded from injection-moulding counts)",
]
cross["sampling"] = (
    "lower: 4,989 source-conforming TXT files, each declaring 0.0300 s and matching observed time deltas (33.333... Hz); "
    "upper: 10,697/10,697 source-conforming cycle CSVs, each with a validated explicit delivered time increment "
    "of 0.0099999997764825 in the source time coordinate; no engineering unit is assigned to the upper time column; "
    "two injection static_data.csv tables and screw-driving streams are excluded from this time-series acceptance"
)
cross["statusNote"] = (
    "Exact CC BY 4.0 archive passed publisher MD5, local SHA-256 and ZIP CRC. The lower parser accepts 4,989 TXT files / "
    "2,475,581 rows and 7,426,743 actual measured values. The specialist upper parser accepts 10,697/10,697 cycle CSVs / "
    "21,907,374 rows and 43,814,748 measured values from source-backed melt volume (cm³) and volumetric injection velocity (cm³/s). "
    "Cross-process therefore contributes 51,241,491 accepted measured time-series values. Upper pressure actual remains excluded "
    "pending an authoritative engineering unit; pressure target is command evidence; state remains excluded pending semantic mapping. "
    "The family remains partially accepted rather than fully profiled."
)
write("data/measured-dataset-inventory-v1.json", inventory)

upper = load("data/cross-process-upper-workpiece-dictionary-v1.json")
need(upper.get("version") == "2026.08.29.2", "upper dictionary pre-reconciliation version drifted")
upper["version"] = "2026.08.29.3"
upper["status"] = "partially-accepted-pressure-and-state-blocked"
for field in upper["fields"]:
    field["promotionEligible"] = field["column"] in {"melt_volume", "injection_velocity"}
upper["specialistParserResult"] = {
    "path": "data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json",
    "publisherChecksum": EXPECTED_MD5,
    "upperWorkpieceSerialCsvFilesAccepted": UPPER_FILES,
    "upperWorkpieceSerialCsvFilesRejected": 0,
    "upperWorkpieceRowsAccepted": UPPER_ROWS,
    "acceptedMeasuredChannelsPerRow": 2,
    "acceptedMeasuredTimeSeriesSamples": UPPER_ACCEPTED,
}
upper["evidenceBoundary"]["additionalAcceptedMeasuredTimeSeriesSamples"] = UPPER_ACCEPTED
upper["evidenceBoundary"]["projectAcceptedMeasuredBaselineRemains"] = NEW_TOTAL
upper["evidenceBoundary"]["fullyProfiledFamily"] = False
upper["evidenceBoundary"]["fullyProfiledFamiliesRemain"] = 7
write("data/cross-process-upper-workpiece-dictionary-v1.json", upper)

replace_once(
    "tools/compile_master_data.py",
    '            "cross-process-lower-workpiece-source-contract": load_json("data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json"),\n',
    '            "cross-process-lower-workpiece-source-contract": load_json("data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json"),\n'
    '            "cross-process-upper-workpiece-source-contract": load_json("data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json"),\n',
)

replace_once(
    "qa_content_scale_targets.py",
    'ACCEPTED_CROSS_LOWER = ROOT / "data" / "public-benchmark-results" / "cross-process-lower-workpiece-source-contract-v1.json"\n',
    'ACCEPTED_CROSS_LOWER = ROOT / "data" / "public-benchmark-results" / "cross-process-lower-workpiece-source-contract-v1.json"\n'
    'ACCEPTED_CROSS_UPPER = ROOT / "data" / "public-benchmark-results" / "cross-process-upper-workpiece-source-contract-v1.json"\n',
)
replace_once(
    "qa_content_scale_targets.py",
    '''accepted_measured_total = av_profile["acceptedMeasuredTimeSeriesSamples"] + om_profile["acceptedMeasuredTimeSeriesSamples"] + cl_profile["acceptedMeasuredTimeSeriesSamples"]
need(accepted_measured_total == 21_356_311, "combined real measured-sample arithmetic drifted")
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == 7, "partial cross-process lower acceptance must not inflate the fully profiled family count")
need(targets["measured_time_series_samples"]["currentAccepted"] == accepted_measured_total, "measured sample count must equal AVAPS plus OpenMMS plus accepted cross-process lower evidence")
''',
    '''cross_upper = json.loads(ACCEPTED_CROSS_UPPER.read_text(encoding="utf-8"))
cu_profile = cross_upper.get("profile") or {}
need(cross_upper.get("status") == "completed-source-defined-upper-workpiece-partial-acceptance", "cross-process upper accepted profile status drifted")
need(cu_profile.get("upperWorkpieceSerialCsvFilesAccepted") == 10_697 and cu_profile.get("upperWorkpieceSerialCsvFilesRejected") == 0, "cross-process upper file acceptance drifted")
need(cu_profile.get("upperWorkpieceRowsAccepted") == 21_907_374, "cross-process upper row count drifted")
need(cu_profile.get("acceptedMeasuredChannelsPerRow") == 2, "cross-process upper accepted channel count drifted")
need(cu_profile.get("acceptedMeasuredTimeSeriesSamples") == 43_814_748, "cross-process upper accepted sample count drifted")
need(cu_profile.get("pressureActualValuesExcludedPendingUnit") == 21_907_374, "cross-process upper pressure-unit exclusion drifted")
need(cu_profile.get("stateValuesExcludedPendingSemantics") == 21_907_374, "cross-process upper state exclusion drifted")
need(cu_profile.get("rawRowsOrCellValuesEmitted") is False, "cross-process upper result must not emit raw values")
accepted_measured_total = av_profile["acceptedMeasuredTimeSeriesSamples"] + om_profile["acceptedMeasuredTimeSeriesSamples"] + cl_profile["acceptedMeasuredTimeSeriesSamples"] + cu_profile["acceptedMeasuredTimeSeriesSamples"]
need(accepted_measured_total == 65_171_059, "combined real measured-sample arithmetic drifted")
need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == 7, "partial cross-process acceptance must not inflate the fully profiled family count")
need(targets["measured_time_series_samples"]["currentAccepted"] == accepted_measured_total, "measured sample count must equal AVAPS plus OpenMMS plus accepted cross-process lower and upper evidence")
''',
)
replace_once(
    "qa_content_scale_targets.py",
    '            {"path": "data/public-benchmark-results/openmms-t4g-v1.json", "accepted": om_profile["acceptedMeasuredTimeSeriesSamples"]},\n',
    '            {"path": "data/public-benchmark-results/openmms-t4g-v1.json", "accepted": om_profile["acceptedMeasuredTimeSeriesSamples"]},\n'
    '            {"path": "data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json", "accepted": cl_profile["acceptedMeasuredTimeSeriesSamples"]},\n'
    '            {"path": "data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json", "accepted": cu_profile["acceptedMeasuredTimeSeriesSamples"]},\n',
)

replace_once("qa_master_data_compile.py", 'need(expected_samples == 21_356_311, "audited measured-sample baseline drifted")', 'need(expected_samples == 65_171_059, "audited measured-sample baseline drifted")')
replace_once(
    "qa_master_data_compile.py",
    'need(set(review_results) == {"pet-preform-v2", "warwick-demoulding", "rwth-pcr-2025", "cross-process-chain-17240390", "cross-process-lower-workpiece-source-contract"}, "retrieved/review/partial-acceptance result set drifted")',
    'need(set(review_results) == {"pet-preform-v2", "warwick-demoulding", "rwth-pcr-2025", "cross-process-chain-17240390", "cross-process-lower-workpiece-source-contract", "cross-process-upper-workpiece-source-contract"}, "retrieved/review/partial-acceptance result set drifted")',
)
replace_once(
    "qa_master_data_compile.py",
    '    need((review_results["cross-process-lower-workpiece-source-contract"].get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 7_426_743, "cross-process lower accepted sample count drifted")\n',
    '    need((review_results["cross-process-lower-workpiece-source-contract"].get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 7_426_743, "cross-process lower accepted sample count drifted")\n'
    '    need(review_results["cross-process-upper-workpiece-source-contract"].get("status") == "completed-source-defined-upper-workpiece-partial-acceptance", "cross-process upper accepted source-contract state drifted")\n'
    '    need((review_results["cross-process-upper-workpiece-source-contract"].get("profile") or {}).get("upperWorkpieceSerialCsvFilesAccepted") == 10_697, "cross-process upper accepted file count drifted")\n'
    '    need((review_results["cross-process-upper-workpiece-source-contract"].get("profile") or {}).get("upperWorkpieceRowsAccepted") == 21_907_374, "cross-process upper accepted row count drifted")\n'
    '    need((review_results["cross-process-upper-workpiece-source-contract"].get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 43_814_748, "cross-process upper accepted sample count drifted")\n',
)
replace_once(
    "qa_master_data_compile.py",
    '    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-lower-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] == expected_samples, "compiled measured benchmark sample totals do not reconcile")',
    '    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-lower-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-upper-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] == expected_samples, "compiled measured benchmark sample totals do not reconcile")',
)
replace_once(
    ".github/workflows/master-data-compile.yml",
    "# The measured-sample assertion below is reconciled to the source-defined lower cross-process acceptance.",
    "# The measured-sample assertion below is reconciled to source-defined lower and specialist upper cross-process acceptance.",
)
replace_once(".github/workflows/master-data-compile.yml", "assert c['measuredTimeSeriesSamplesAccepted']==21356311", "assert c['measuredTimeSeriesSamplesAccepted']==65171059")

replace_once(
    "qa_measured_data_blocker_contracts.py",
    'need(upper_fields["melt_volume"]["engineeringUnit"] == "cm3", "Upper melt-volume unit must remain source-backed cm3")\nneed(upper_fields["injection_velocity"]["engineeringUnit"] == "cm3/s", "Upper injection-velocity unit must remain source-backed cm3/s")\n',
    'need(upper_fields["melt_volume"]["engineeringUnit"] == "cm3", "Upper melt-volume unit must remain source-backed cm3")\n'
    'need(upper_fields["melt_volume"]["promotionEligible"] is True, "Upper melt volume must remain promoted after deterministic archive-wide profiling")\n'
    'need(upper_fields["injection_velocity"]["engineeringUnit"] == "cm3/s", "Upper injection-velocity unit must remain source-backed cm3/s")\n'
    'need(upper_fields["injection_velocity"]["promotionEligible"] is True, "Upper injection velocity must remain promoted after deterministic archive-wide profiling")\n',
)
replace_once(
    "qa_measured_data_blocker_contracts.py",
    'need(upper["evidenceBoundary"]["additionalAcceptedMeasuredTimeSeriesSamples"] == 0, "Upper dictionary must not silently add measured values")',
    'need(upper["evidenceBoundary"]["additionalAcceptedMeasuredTimeSeriesSamples"] == 43_814_748, "Upper specialist-parser accepted value count drifted")',
)
replace_once(
    "qa_measured_data_blocker_contracts.py",
    'need(upper["evidenceBoundary"]["projectAcceptedMeasuredBaselineRemains"] == 21356311, "Project measured baseline must remain 21,356,311")',
    'need(upper["evidenceBoundary"]["projectAcceptedMeasuredBaselineRemains"] == 65_171_059, "Project measured baseline must remain 65,171,059")',
)
replace_once(
    "qa_measured_data_blocker_contracts.py",
    'need(len(upper["remainingAuthoritativeEvidenceRequired"]) == 2, "Upper blocker must remain narrowed to pressure unit and state semantics")\n\nimpure = load("data/impure-pascoe-channel-dictionary-v1.json")',
    'need(len(upper["remainingAuthoritativeEvidenceRequired"]) == 2, "Upper blocker must remain narrowed to pressure unit and state semantics")\n'
    'upper_result = load("data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json")\n'
    'upper_profile = upper_result.get("profile") or {}\n'
    'need(upper_result.get("status") == "completed-source-defined-upper-workpiece-partial-acceptance", "Upper specialist-parser result missing")\n'
    'need(upper_profile.get("upperWorkpieceSerialCsvFilesAccepted") == 10_697 and upper_profile.get("upperWorkpieceSerialCsvFilesRejected") == 0, "Upper specialist-parser file acceptance drifted")\n'
    'need(upper_profile.get("upperWorkpieceRowsAccepted") == 21_907_374, "Upper specialist-parser row count drifted")\n'
    'need(upper_profile.get("acceptedMeasuredTimeSeriesSamples") == 43_814_748, "Upper specialist-parser measured total drifted")\n'
    'need(upper_profile.get("pressureActualValuesExcludedPendingUnit") == 21_907_374, "Upper pressure actual must remain excluded pending unit")\n'
    'need(upper_profile.get("stateValuesExcludedPendingSemantics") == 21_907_374, "Upper state must remain excluded pending semantics")\n'
    'need(upper_profile.get("rawRowsOrCellValuesEmitted") is False, "Upper specialist parser must not emit raw rows")\n\n'
    'impure = load("data/impure-pascoe-channel-dictionary-v1.json")',
)
replace_exact_count(
    ".github/workflows/measured-data-blocker-contracts.yml",
    "      - 'data/cross-process-upper-workpiece-dictionary-v1.json'\n",
    "      - 'data/cross-process-upper-workpiece-dictionary-v1.json'\n"
    "      - 'data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json'\n"
    "      - 'tools/profile_cross_process_upper_workpiece.py'\n"
    "      - 'qa_cross_process_upper_contract.py'\n",
    2,
)

replace_once(
    "sources/MASTER_DATA_COMPILATION.md",
    "- **21,356,311** accepted measured time-series values: **13,631,488** from scatimdata/AVAPS, **298,080** from OpenMMS-T4G and **7,426,743** from the source-defined cross-process lower-workpiece actual signals.",
    "- **65,171,059** accepted measured time-series values: **13,631,488** from scatimdata/AVAPS, **298,080** from OpenMMS-T4G and **51,241,491** from cross-process (7,426,743 lower-workpiece + 43,814,748 specialist upper-workpiece accepted values).",
)
replace_once(
    "sources/MASTER_DATA_COMPILATION.md",
    "- Cross-process lower-workpiece data now contribute **7,426,743** accepted actual measured values from 4,989 source-conforming TXT files; the family remains only partially accepted because upper-workpiece engineering units are unresolved.",
    "- Cross-process now contributes **51,241,491** accepted measured values: **7,426,743** lower-workpiece actual values plus **43,814,748** upper-workpiece values from 10,697/10,697 cycle CSVs and 21,907,374 rows. Upper melt volume (cm³) and volumetric injection velocity (cm³/s) are accepted; upper pressure actual and state remain non-counting pending an authoritative pressure unit and state-code semantics, so the family remains only partially accepted.",
)
replace_once(
    "sources/MASTER_DATA_COMPILATION.md",
    "- **Cross-process upper-workpiece definitions** — the lower TXT stream is now source-defined and accepted; authoritative engineering units for the upper-workpiece CSV still need to be established before the family can become fully profiled. Do not extrapolate lower units to the upper files without source evidence.",
    "- **Cross-process remaining upper definitions** — the specialist parser now accepts melt volume (cm³) and volumetric injection velocity (cm³/s) across all 10,697 upper cycle CSVs. The remaining blockers are only the authoritative upper pressure engineering unit and semantic mapping of state codes; pressure actual and state stay non-counting until those are sourced.",
)

replace_once(
    "sources/CONTENT_SCALE_PROGRAMME.md",
    "- **21,356,311** accepted measured time-series values;",
    "- **65,171,059** accepted measured time-series values;",
)
replace_once(
    "sources/CONTENT_SCALE_PROGRAMME.md",
    "The accepted measured time-series total is **13,631,488** delivered AVAPS pressure/flow values plus **298,080** OpenMMS-T4G sensor values plus **7,426,743** source-defined cross-process lower-workpiece actual values. The cross-process pressure-target command channel is excluded. The current **19,008** generated learning cycles remain synthetic and are intentionally excluded.",
    "The accepted measured time-series total is **13,631,488** delivered AVAPS pressure/flow values plus **298,080** OpenMMS-T4G sensor values plus **51,241,491** cross-process values. Cross-process comprises **7,426,743** lower-workpiece actual values and **43,814,748** specialist upper-workpiece values from **21,907,374** validated upper rows x two source-backed channels: melt volume (cm³) and volumetric injection velocity (cm³/s). Pressure-target commands are excluded; upper pressure actual remains unit-blocked and state remains semantics-blocked. The current **19,008** generated learning cycles remain synthetic and are intentionally excluded.",
)
replace_once(
    "sources/CONTENT_SCALE_PROGRAMME.md",
    "- **Cross-process upper workpiece** — the lower TXT stream is now source-defined and contributes 7,426,743 accepted actual values; authoritative upper-CSV engineering units remain unresolved, so the dataset family is not yet promoted to fully profiled.",
    "- **Cross-process upper workpiece** — all 10,697 upper cycle CSVs are now deterministically parsed; melt volume (cm³) and volumetric injection velocity (cm³/s) contribute 43,814,748 accepted values. The family remains not fully profiled only because the authoritative upper pressure unit and state-code semantic mapping are unresolved.",
)

print(json.dumps({
    "crossProcessUpperRowsAccepted": UPPER_ROWS,
    "crossProcessUpperMeasuredValuesAccepted": UPPER_ACCEPTED,
    "crossProcessTotalMeasuredValuesAccepted": CROSS_ACCEPTED,
    "projectMeasuredTimeSeriesSamplesAccepted": NEW_TOTAL,
    "fullyProfiledMeasuredDatasets": 7,
}, indent=2))

#!/usr/bin/env python3
"""Reconcile the accepted cross-process lower-workpiece profile into project ledgers.

This is intentionally fail-closed: it only promotes the exact aggregate profile
produced by the source-native lower-workpiece parser, keeps pressure target values
out of measured counts, and leaves the cross-process dataset family outside the
fully-profiled count until upper-workpiece engineering units are established.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json"
NEW_TOTAL = 21_356_311
CROSS_ACCEPTED = 7_426_743
LOWER_ROWS = 2_475_581
LOWER_FILES = 4_989


def load(path: str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def write(path: str, value: dict) -> None:
    (ROOT / path).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    need(text.count(old) == 1, f"expected exactly one reconciliation marker in {path}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


result = json.loads(RESULT.read_text(encoding="utf-8"))
profile = result.get("profile") or {}
need(result.get("status") == "completed-source-defined-lower-workpiece-profile", "cross-process lower profile status drifted")
need((result.get("source") or {}).get("publisherChecksum") == "md5:069e190338b2ca29f736b21fabf407ba", "cross-process publisher checksum drifted")
need(profile.get("lowerWorkpieceTxtFilesAccepted") == LOWER_FILES, "cross-process lower accepted file count drifted")
need(profile.get("lowerWorkpieceTxtFilesRejected") == 0, "cross-process lower source contract has rejected files")
need(profile.get("lowerWorkpieceRowsAccepted") == LOWER_ROWS, "cross-process lower accepted row count drifted")
need(profile.get("acceptedActualChannelsPerRow") == 3, "cross-process lower accepted channel count drifted")
need(profile.get("commandChannelsPerRow") == 1, "cross-process lower command channel count drifted")
need(profile.get("acceptedMeasuredTimeSeriesSamples") == CROSS_ACCEPTED == LOWER_ROWS * 3, "cross-process lower measured total drifted")
need(profile.get("commandTargetValuesExcludedFromMeasuredCount") == LOWER_ROWS, "cross-process target exclusion drifted")
need(profile.get("rawRowsOrCellValuesEmitted") is False, "cross-process profile must not emit raw values")
need(profile.get("samplingIntervalSecondsFileCounts") == [{"intervalSeconds": 0.03, "files": LOWER_FILES, "derivedHz": 33.333333333333336}], "cross-process lower sampling contract drifted")

# Target ledger: measured-value acceptance changes; fully-profiled family count does not.
targets = load("data/content-scale-targets.json")
need(targets["targets"]["fully_profiled_measured_datasets"]["currentAccepted"] == 7, "fully profiled baseline must stay seven")
need(targets["targets"]["measured_time_series_samples"]["currentAccepted"] == 13_929_568, "expected pre-reconciliation measured baseline missing")
targets["version"] = "2026.08.29.5"
targets["targets"]["fully_profiled_measured_datasets"]["notes"] = (
    "Seven exact-source measured dataset families satisfy the profiling acceptance definition. "
    "The cross-process archive now has a source-defined accepted lower-workpiece stream: 4,989/4,989 TXT files, "
    "2,475,581 rows and 7,426,743 accepted actual-signal values, with target-pressure commands excluded. "
    "It does not become an eighth fully profiled family because authoritative engineering units for the upper-workpiece CSV remain unresolved. "
    "ImPure remains structurally profiled but its 2,376,696 numeric cycle values are still unit/analogue-semantics limited. "
    "PET, Warwick and RWTH retain their documented semantic, format and retrieval blockers."
)
targets["targets"]["measured_time_series_samples"]["currentAccepted"] = NEW_TOTAL
targets["targets"]["measured_time_series_samples"]["notes"] = (
    "Accepted real time-series evidence totals 21,356,311 values. AVAPS contributes 13,631,488 values from 3,328 quality-linked cycles x two delivered signals x 2,048 stored values per signal. "
    "OpenMMS-T4G contributes 298,080 values from 29,808 ordered rows x 10 source-defined sensor channels. "
    "The cross-process lower-workpiece source contract contributes 7,426,743 actual measured values from 2,475,581 rows x three source-defined actual channels: pressure (bar), screw volume (cm³) and injection flow (cm³/s). "
    "Its 2,475,581 pressure-target command values are excluded. The cross-process upper-workpiece stream remains outside accepted counts until engineering units are source-defined. "
    "iGuzzini is record-level and contributes zero high-frequency time-series samples. The existing 19,008 process-data learning cycles remain synthetic and excluded."
)
write("data/content-scale-targets.json", targets)

# Execution ledger: cross-process is partially accepted, not fully profiled.
ledger = load("data/measured-dataset-execution-ledger-v1.json")
need((ledger.get("summary") or {}).get("acceptedProfiled") == 7, "execution accepted-profiled baseline drifted")
source = next(x for x in ledger["sources"] if x.get("datasetId") == "cross-process-chain-17240390")
need(source.get("state") == "profiled-scope-limited-semantic-review", "cross-process pre-reconciliation state drifted")
ledger["version"] = "2026.08.29.7"
source.update({
    "state": "partial-accepted-lower-profiled-upper-unit-blocked",
    "action": "keep the source-native lower TXT parser/dictionary and 7,426,743 accepted lower actual-signal values regression-pinned; resolve authoritative upper-workpiece engineering units before full-family promotion",
    "reason": "exact publisher archive re-run accepted 4,989/4,989 lower TXT files and 2,475,581 rows with source-defined units and timing; three actual channels contribute 7,426,743 measured values while 2,475,581 pressure-target command values are excluded; upper CSV units remain unresolved"
})
summary = ledger["summary"]
summary["retrievedNotAccepted"] = 2
summary["partiallyAcceptedNotFullyProfiled"] = 1
need(summary["acceptedProfiled"] == 7, "cross-process partial acceptance must not change fully-profiled family count")
write("data/measured-dataset-execution-ledger-v1.json", ledger)

# Inventory: retain full structural archive scope but add accepted lower evidence explicitly.
inventory = load("data/measured-dataset-inventory-v1.json")
cross = next(x for x in inventory["datasets"] if x.get("datasetId") == "cross-process-chain-17240390")
count = cross.get("count") or {}
need(count.get("acceptedMeasuredTimeSeriesSamples") == 0, "expected pre-reconciliation cross-process accepted count missing")
inventory["version"] = "2026.08.29.3"
cross["accessState"] = "public-open-partially-accepted-lower-upper-units-unresolved"
count.update({
    "lowerWorkpieceFilesAccepted": LOWER_FILES,
    "lowerWorkpieceRowsAccepted": LOWER_ROWS,
    "lowerAcceptedActualChannelsPerRow": 3,
    "lowerAcceptedMeasuredTimeSeriesSamples": CROSS_ACCEPTED,
    "lowerCommandTargetValuesExcluded": LOWER_ROWS,
    "acceptedMeasuredTimeSeriesSamples": CROSS_ACCEPTED
})
cross["count"] = count
cross["signals"] = [
    "lower: injection pressure target (command, bar; excluded from measured total)",
    "lower: injection pressure actual (bar)",
    "lower: screw volume actual (cm³)",
    "lower: injection flow actual (cm³/s)",
    "upper: pressure target/actual, melt volume, injection velocity, state (engineering units unresolved)",
    "downstream screw-driving streams (excluded from injection-moulding counts)"
]
cross["sampling"] = (
    "lower: 4,989 source-conforming TXT files, each declaring 0.0300 s and matching observed time deltas (33.333... Hz); "
    "upper: 10,697 CSV cycle files remain structurally available but unit-limited; screw-driving streams excluded"
)
cross["statusNote"] = (
    "Exact CC BY 4.0 archive passed publisher MD5, local SHA-256 and ZIP CRC. A source-native lower-workpiece parser validated 4,989/4,989 TXT files, 2,475,581 rows and the exact units/labels/signal codes. "
    "Three actual channels contribute 7,426,743 accepted measured values; 2,475,581 pressure-target command values are retained but excluded. "
    "The family remains scope-limited because authoritative engineering units for the upper-workpiece CSV are not yet established."
)
write("data/measured-dataset-inventory-v1.json", inventory)

# Compiler carries the accepted partial-source result as a review/partial-acceptance result.
replace_once(
    "tools/compile_master_data.py",
    '            "cross-process-chain-17240390": load_json("data/public-benchmark-results/cross-process-chain-17240390-v1.json"),\n',
    '            "cross-process-chain-17240390": load_json("data/public-benchmark-results/cross-process-chain-17240390-v1.json"),\n'
    '            "cross-process-lower-workpiece-source-contract": load_json("data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json"),\n'
)

# Content-scale QA: include the exact accepted lower result in arithmetic and semantic assertions.
replace_once(
    "qa_content_scale_targets.py",
    'REVIEW_CROSS = ROOT / "data" / "public-benchmark-results" / "cross-process-chain-17240390-v1.json"\n',
    'REVIEW_CROSS = ROOT / "data" / "public-benchmark-results" / "cross-process-chain-17240390-v1.json"\n'
    'ACCEPTED_CROSS_LOWER = ROOT / "data" / "public-benchmark-results" / "cross-process-lower-workpiece-source-contract-v1.json"\n'
)
replace_once(
    "qa_content_scale_targets.py",
    'accepted_measured_total = av_profile["acceptedMeasuredTimeSeriesSamples"] + om_profile["acceptedMeasuredTimeSeriesSamples"]\n'
    'need(accepted_measured_total == 13_929_568, "combined real measured-sample arithmetic drifted")\n'
    'need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == 7, "fully profiled measured dataset count must include ImPure plus the established benchmark families")\n'
    'need(targets["measured_time_series_samples"]["currentAccepted"] == accepted_measured_total, "measured sample count must equal AVAPS plus OpenMMS delivered-file evidence")\n',
    'cross_lower = json.loads(ACCEPTED_CROSS_LOWER.read_text(encoding="utf-8"))\n'
    'cl_profile = cross_lower.get("profile") or {}\n'
    'need(cross_lower.get("status") == "completed-source-defined-lower-workpiece-profile", "cross-process lower accepted profile status drifted")\n'
    'need(cl_profile.get("lowerWorkpieceTxtFilesAccepted") == 4_989 and cl_profile.get("lowerWorkpieceTxtFilesRejected") == 0, "cross-process lower file acceptance drifted")\n'
    'need(cl_profile.get("lowerWorkpieceRowsAccepted") == 2_475_581, "cross-process lower row count drifted")\n'
    'need(cl_profile.get("acceptedMeasuredTimeSeriesSamples") == 7_426_743, "cross-process lower accepted sample count drifted")\n'
    'need(cl_profile.get("commandTargetValuesExcludedFromMeasuredCount") == 2_475_581, "cross-process lower command exclusion drifted")\n'
    'need(cl_profile.get("rawRowsOrCellValuesEmitted") is False, "cross-process lower result must not emit raw values")\n'
    'accepted_measured_total = av_profile["acceptedMeasuredTimeSeriesSamples"] + om_profile["acceptedMeasuredTimeSeriesSamples"] + cl_profile["acceptedMeasuredTimeSeriesSamples"]\n'
    'need(accepted_measured_total == 21_356_311, "combined real measured-sample arithmetic drifted")\n'
    'need(targets["fully_profiled_measured_datasets"]["currentAccepted"] == 7, "partial cross-process lower acceptance must not inflate the fully profiled family count")\n'
    'need(targets["measured_time_series_samples"]["currentAccepted"] == accepted_measured_total, "measured sample count must equal AVAPS plus OpenMMS plus accepted cross-process lower evidence")\n'
)

# Master compilation QA and workflow arithmetic.
replace_once("qa_master_data_compile.py", 'need(expected_samples == 13_929_568, "audited measured-sample baseline drifted")', 'need(expected_samples == 21_356_311, "audited measured-sample baseline drifted")')
replace_once(
    "qa_master_data_compile.py",
    'need(set(review_results) == {"pet-preform-v2", "warwick-demoulding", "rwth-pcr-2025", "cross-process-chain-17240390"}, "retrieved/review/blocker result set drifted")',
    'need(set(review_results) == {"pet-preform-v2", "warwick-demoulding", "rwth-pcr-2025", "cross-process-chain-17240390", "cross-process-lower-workpiece-source-contract"}, "retrieved/review/partial-acceptance result set drifted")'
)
replace_once(
    "qa_master_data_compile.py",
    '    need(review_results["cross-process-chain-17240390"].get("status") == "completed-public-measured-benchmark-scope-limited", "cross-process review state drifted")\n',
    '    need(review_results["cross-process-chain-17240390"].get("status") == "completed-public-measured-benchmark-scope-limited", "cross-process review state drifted")\n'
    '    need(review_results["cross-process-lower-workpiece-source-contract"].get("status") == "completed-source-defined-lower-workpiece-profile", "cross-process lower accepted source-contract state drifted")\n'
    '    need((review_results["cross-process-lower-workpiece-source-contract"].get("profile") or {}).get("acceptedMeasuredTimeSeriesSamples") == 7_426_743, "cross-process lower accepted sample count drifted")\n'
)
replace_once(
    "qa_master_data_compile.py",
    '    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] == expected_samples, "compiled measured benchmark sample totals do not reconcile")',
    '    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-lower-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] == expected_samples, "compiled measured benchmark sample totals do not reconcile")'
)
replace_once(".github/workflows/master-data-compile.yml", "assert c['measuredTimeSeriesSamplesAccepted']==13929568", "assert c['measuredTimeSeriesSamplesAccepted']==21356311")

# Human-readable status follows, but does not define, machine-readable counts.
replace_once(
    "sources/MASTER_DATA_COMPILATION.md",
    '- **13,929,568** accepted measured time-series values: **13,631,488** from scatimdata/AVAPS plus **298,080** from OpenMMS-T4G.',
    '- **21,356,311** accepted measured time-series values: **13,631,488** from scatimdata/AVAPS, **298,080** from OpenMMS-T4G and **7,426,743** from the source-defined cross-process lower-workpiece actual signals.'
)
replace_once(
    "sources/MASTER_DATA_COMPILATION.md",
    '- Cross-process-chain data are archive-verified and structurally profiled, but contribute **0** accepted measured values pending source-specific parsing and semantic mapping.',
    '- Cross-process lower-workpiece data now contribute **7,426,743** accepted actual measured values from 4,989 source-conforming TXT files; the family remains only partially accepted because upper-workpiece engineering units are unresolved.'
)
replace_once(
    "sources/MASTER_DATA_COMPILATION.md",
    '- **Cross-process data definitions** — confirm units and exact field meanings, including actual-versus-target semantics, and implement the lower-workpiece TXT preamble/chart format parser. The archive is downloaded, checksum/CRC verified and structurally profiled, but its values cannot yet be safely counted.',
    '- **Cross-process upper-workpiece definitions** — the lower TXT stream is now source-defined and accepted; authoritative engineering units for the upper-workpiece CSV still need to be established before the family can become fully profiled. Do not extrapolate lower units to the upper files without source evidence.'
)
replace_once("sources/CONTENT_SCALE_PROGRAMME.md", '- **13,929,568** accepted measured time-series values;', '- **21,356,311** accepted measured time-series values;')
replace_once(
    "sources/CONTENT_SCALE_PROGRAMME.md",
    'The accepted measured time-series total is **13,631,488** delivered AVAPS pressure/flow values plus **298,080** OpenMMS-T4G sensor values. The current **19,008** generated learning cycles remain synthetic and are intentionally excluded.',
    'The accepted measured time-series total is **13,631,488** delivered AVAPS pressure/flow values plus **298,080** OpenMMS-T4G sensor values plus **7,426,743** source-defined cross-process lower-workpiece actual values. The cross-process pressure-target command channel is excluded. The current **19,008** generated learning cycles remain synthetic and are intentionally excluded.'
)
replace_once(
    "sources/CONTENT_SCALE_PROGRAMME.md",
    '- **Cross-process chain** — archive downloaded and verified, but exact units/field meanings, actual-versus-target mapping and the lower-workpiece TXT preamble/chart format still need a source-specific parser before any values are counted.',
    '- **Cross-process upper workpiece** — the lower TXT stream is now source-defined and contributes 7,426,743 accepted actual values; authoritative upper-CSV engineering units remain unresolved, so the dataset family is not yet promoted to fully profiled.'
)

print(f"Reconciled cross-process lower acceptance: +{CROSS_ACCEPTED:,} measured values -> {NEW_TOTAL:,}; fully profiled families remain 7")

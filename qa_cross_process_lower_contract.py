#!/usr/bin/env python3
"""QA for the cross-process lower-workpiece source contract."""

from __future__ import annotations

import io
import json
from pathlib import Path

from tools.profile_cross_process_lower_workpiece import parse_lower_txt

ROOT = Path(__file__).resolve().parent
DICTIONARY = ROOT / "data" / "cross-process-lower-workpiece-dictionary-v1.json"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


def fixture(*, labels=None, times=(0.0, 0.03, 0.06)) -> bytes:
    labels = labels or "time;Einspritzdruck, Soll;Einspritzdruck, Ist;Schneckenvolumen, Ist;Einspritzstrom, Ist"
    rows = [
        f"{time:.4f};1200;{100 + index};{40 - index:.1f};{50 + index:.2f}"
        for index, time in enumerate(times)
    ]
    text = "\n".join(
        [
            "content;chart data",
            "source;synthetic_contract_fixture",
            "machine no.;synthetic",
            "program;synthetic",
            "filename;synthetic.txt",
            "time;synthetic",
            "data complete;yes",
            "-header-",
            "signals;4",
            f"plotting points;{len(rows)}",
            "delay;0.00",
            "sampling rate;0.0300",
            "-column description-",
            "s;bar;bar;cm³;cm³/s",
            labels,
            ";p3001S;p3001I;V3001I;Q3001I",
            "-start data-",
            *rows,
        ]
    )
    return (text + "\n").encode("utf-8")


contract = json.loads(DICTIONARY.read_text(encoding="utf-8"))
need(contract["format"]["expectedUnitsRow"] == ["s", "bar", "bar", "cm³", "cm³/s"], "source unit row drifted")
need(contract["acceptance"]["acceptedActualChannelsPerRow"] == 3, "expected exactly three accepted actual channels")
need(contract["acceptance"]["commandChannelsPerRow"] == 1, "expected exactly one command channel")
flow = next(channel for channel in contract["channels"] if channel["canonicalName"] == "injection_flow_actual")
need(flow["unit"] == "cm³/s", "lower fifth channel must retain volumetric-flow unit")
need("injection_velocity" in flow["semanticCorrection"], "normalized velocity-name caveat is missing")

profile = parse_lower_txt(io.BytesIO(fixture()), "synthetic.txt", contract)
need(profile["rows"] == 3, "valid synthetic source contract row count failed")
need(profile["acceptedMeasuredValues"] == 9, "measured-value count must be three actual channels per row")
need(profile["commandTargetValues"] == 3, "command target must be tracked separately")
need(abs(profile["derivedSamplingFrequencyHz"] - (1 / 0.03)) < 1e-9, "sampling frequency derivation failed")
need(profile["rawRowsOrCellValuesEmitted"] is False, "parser must not emit raw rows")

try:
    parse_lower_txt(
        io.BytesIO(fixture(labels="time;Einspritzdruck, Soll;Einspritzdruck, Ist;Schneckenvolumen, Ist;Einspritzgeschwindigkeit, Ist")),
        "bad-label.txt",
        contract,
    )
except ValueError:
    pass
else:
    raise AssertionError("source-label drift must fail closed")

try:
    parse_lower_txt(io.BytesIO(fixture(times=(0.0, 0.03, 0.07))), "bad-time.txt", contract)
except ValueError:
    pass
else:
    raise AssertionError("time-step drift must fail closed")

print("Cross-process lower-workpiece source contract QA passed")

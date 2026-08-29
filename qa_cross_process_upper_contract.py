#!/usr/bin/env python3
"""QA for the cross-process upper-workpiece specialist parser contract."""

from __future__ import annotations

import io
import json
from pathlib import Path

from tools.profile_cross_process_upper_workpiece import parse_upper_csv

ROOT = Path(__file__).resolve().parent
DICTIONARY = ROOT / "data" / "cross-process-upper-workpiece-dictionary-v1.json"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


def fixture(
    *,
    header=",time,injection_pressure_target,injection_pressure_actual,melt_volume,injection_velocity,state",
    times=(0.0, 0.01, 0.02),
    indices=(0, 1, 2),
    states=(1, 2, 8),
) -> bytes:
    rows = [
        f"{index},{time},1500,{100 + i},{40 - i},{60 + i},{state}"
        for i, (index, time, state) in enumerate(zip(indices, times, states, strict=True))
    ]
    return (header + "\n" + "\n".join(rows) + "\n").encode("utf-8")


contract = json.loads(DICTIONARY.read_text(encoding="utf-8"))
need(
    contract["exactDeliveredSchema"]
    == [
        "time",
        "injection_pressure_target",
        "injection_pressure_actual",
        "melt_volume",
        "injection_velocity",
        "state",
    ],
    "upper delivered schema drifted",
)

eligible = [
    field
    for field in contract["fields"]
    if field.get("promotionEligibleAfterDeterministicProfile") is True
]
need(
    [field["column"] for field in eligible] == ["melt_volume", "injection_velocity"],
    "only upper melt volume and injection velocity may be promoted by this parser",
)
need(
    [field["engineeringUnit"] for field in eligible] == ["cm3", "cm3/s"],
    "upper accepted-channel units drifted",
)
pressure_actual = next(field for field in contract["fields"] if field["column"] == "injection_pressure_actual")
state = next(field for field in contract["fields"] if field["column"] == "state")
need(pressure_actual["engineeringUnit"] is None, "upper pressure unit must remain unresolved")
need(
    pressure_actual.get("promotionEligibleAfterDeterministicProfile") is False,
    "upper pressure actual must remain non-counting",
)
need(state["sourceDefinedMeaning"] is None, "upper state semantics must remain unresolved")
need(
    state.get("promotionEligibleAfterDeterministicProfile") is False,
    "upper state must remain non-counting",
)

profile = parse_upper_csv(io.BytesIO(fixture()), "upper.csv", contract)
need(profile["rows"] == 3, "valid upper fixture row count failed")
need(profile["acceptedMeasuredChannelsPerRow"] == 2, "upper accepted channel count must be two")
need(profile["acceptedMeasuredValues"] == 6, "upper measured-value arithmetic must be two per row")
need(profile["pressureTargetValuesExcluded"] == 3, "upper pressure target exclusion drifted")
need(profile["pressureActualValuesUnitBlocked"] == 3, "upper pressure actual unit blocker drifted")
need(profile["stateValuesSemanticBlocked"] == 3, "upper state semantic blocker drifted")
need(abs(profile["deliveredTimeIncrement"] - 0.01) < 1e-9, "upper delivered time increment failed")
need(profile["stateCodeCounts"] == {1: 1, 2: 1, 8: 1}, "upper state aggregation failed")
need(profile["rawRowsOrCellValuesEmitted"] is False, "upper parser must not emit raw rows")

# State codes remain structurally parseable but semantically non-counting; do not
# turn the checked example's code set into an invented exhaustive dictionary.
profile_unknown_state = parse_upper_csv(
    io.BytesIO(fixture(states=(0, 16, 4))),
    "upper-new-state.csv",
    contract,
)
need(profile_unknown_state["acceptedMeasuredValues"] == 6, "unknown state code must not alter measured arithmetic")
need(profile_unknown_state["stateCodeCounts"] == {0: 1, 4: 1, 16: 1}, "state codes must be aggregated without inferred meanings")

try:
    parse_upper_csv(
        io.BytesIO(
            fixture(
                header=",time,injection_pressure_target,injection_pressure_actual,injection_velocity,melt_volume,state"
            )
        ),
        "bad-header.csv",
        contract,
    )
except ValueError:
    pass
else:
    raise AssertionError("upper header/order drift must fail closed")

try:
    parse_upper_csv(
        io.BytesIO(fixture(indices=(0, 2, 3))),
        "bad-index.csv",
        contract,
    )
except ValueError:
    pass
else:
    raise AssertionError("upper row-index drift must fail closed")

try:
    parse_upper_csv(
        io.BytesIO(fixture(times=(0.0, 0.01, 0.021))),
        "bad-time.csv",
        contract,
    )
except ValueError:
    pass
else:
    raise AssertionError("upper irregular time vector must fail closed")

try:
    parse_upper_csv(
        io.BytesIO(fixture(states=(1, 2.5, 4))),
        "bad-state.csv",
        contract,
    )
except ValueError:
    pass
else:
    raise AssertionError("non-integer upper state code must fail closed")

print("Cross-process upper-workpiece specialist parser QA passed")

#!/usr/bin/env python3
"""Shared deterministic helpers for MouldMaster Measured Learning Library V2."""
from __future__ import annotations

import hashlib
import json
import math
import statistics
from pathlib import Path
from typing import Any

SHA256_PREFIX = "sha256:"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def canonical_sha(value: Any) -> str:
    return SHA256_PREFIX + hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def normalize_text(value: str) -> str:
    return " ".join(str(value).strip().lower().split())


def x_direction(values: list[float], declared: str | None = None) -> str:
    """Validate a monotonic numeric axis without forcing source order to be ascending.

    Existing bindings may omit xDirection; omission keeps the historical increasing-axis
    contract. A source whose physical coordinate legitimately runs downward (for example
    a cooling trace plotted against temperature) must explicitly declare ``decreasing``.
    """
    direction = declared or "increasing"
    if direction not in {"increasing", "decreasing"}:
        raise ValueError("xDirection must be increasing or decreasing")
    pairs = list(zip(values, values[1:]))
    if direction == "increasing":
        if not all(float(a) <= float(b) for a, b in pairs):
            raise ValueError("x axis does not match declared increasing direction")
    else:
        if not all(float(a) >= float(b) for a, b in pairs):
            raise ValueError("x axis does not match declared decreasing direction")
    return direction


def percentile(values: list[float], q: float) -> float:
    if not values:
        raise ValueError("percentile requires values")
    if not 0 <= q <= 1:
        raise ValueError("percentile q must be in [0,1]")
    ordered = sorted(float(v) for v in values)
    if len(ordered) == 1:
        return ordered[0]
    pos = (len(ordered) - 1) * q
    lo = math.floor(pos)
    hi = math.ceil(pos)
    if lo == hi:
        return ordered[lo]
    frac = pos - lo
    return ordered[lo] * (1 - frac) + ordered[hi] * frac


def rankdata(values: list[float]) -> list[float]:
    indexed = sorted(enumerate(values), key=lambda item: item[1])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(indexed):
        j = i + 1
        while j < len(indexed) and indexed[j][1] == indexed[i][1]:
            j += 1
        average_rank = (i + 1 + j) / 2.0
        for k in range(i, j):
            ranks[indexed[k][0]] = average_rank
        i = j
    return ranks


def pearson(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or len(a) < 2:
        raise ValueError("pearson requires equal arrays with at least two values")
    ma = statistics.fmean(a)
    mb = statistics.fmean(b)
    da = [x - ma for x in a]
    db = [y - mb for y in b]
    denom = math.sqrt(sum(x * x for x in da) * sum(y * y for y in db))
    if denom == 0:
        raise ValueError("pearson undefined for constant input")
    return sum(x * y for x, y in zip(da, db)) / denom


def _single_signal(inputs: list[dict]) -> dict:
    if len(inputs) != 1:
        raise ValueError("feature requires exactly one signal input")
    return inputs[0]


def _two_aligned_signals(inputs: list[dict]) -> tuple[dict, dict]:
    if len(inputs) != 2:
        raise ValueError("feature requires exactly two signal inputs")
    a, b = inputs
    ax = a["representation"]["x"]
    bx = b["representation"]["x"]
    if len(ax) != len(bx) or any(float(x) != float(y) for x, y in zip(ax, bx)):
        raise ValueError("two-signal feature requires identical aligned x values")
    return a, b


def calculate_method(method: str, inputs: list[dict], params: dict | None = None) -> tuple[float, str | None]:
    params = params or {}
    if method in {
        "mean", "median", "standard_deviation", "interquartile_range",
        "coefficient_of_variation", "percentile_range", "robust_slope",
        "early_late_shift", "outlier_frequency", "cycle_to_cycle_delta",
        "peak_value", "peak_position", "range",
    }:
        signal = _single_signal(inputs)
        y = [float(v) for v in signal["representation"]["y"]]
        x = [float(v) for v in signal["representation"]["x"]]
        unit = signal.get("unit")
        if method == "mean":
            return statistics.fmean(y), unit
        if method == "median":
            return statistics.median(y), unit
        if method == "standard_deviation":
            return statistics.pstdev(y), unit
        if method == "interquartile_range":
            return percentile(y, 0.75) - percentile(y, 0.25), unit
        if method == "coefficient_of_variation":
            mean = statistics.fmean(y)
            if mean == 0:
                raise ValueError("coefficient_of_variation undefined for zero mean")
            return statistics.pstdev(y) / abs(mean), None
        if method == "percentile_range":
            low = float(params.get("low", 0.10))
            high = float(params.get("high", 0.90))
            if not 0 <= low < high <= 1:
                raise ValueError("percentile_range requires 0 <= low < high <= 1")
            return percentile(y, high) - percentile(y, low), unit
        if method == "robust_slope":
            slopes = []
            for i in range(len(x)):
                for j in range(i + 1, len(x)):
                    dx = x[j] - x[i]
                    if dx != 0:
                        slopes.append((y[j] - y[i]) / dx)
            if not slopes:
                raise ValueError("robust_slope requires at least two distinct x values")
            x_unit = signal["representation"].get("xUnit")
            return statistics.median(slopes), f"{unit}/{x_unit}" if unit and x_unit else None
        if method == "early_late_shift":
            fraction = float(params.get("fraction", 0.20))
            if not 0 < fraction <= 0.5:
                raise ValueError("early_late_shift fraction must be in (0, 0.5]")
            n = max(1, int(math.ceil(len(y) * fraction)))
            return statistics.fmean(y[-n:]) - statistics.fmean(y[:n]), unit
        if method == "outlier_frequency":
            multiplier = float(params.get("iqrMultiplier", 1.5))
            q1, q3 = percentile(y, 0.25), percentile(y, 0.75)
            iqr = q3 - q1
            low, high = q1 - multiplier * iqr, q3 + multiplier * iqr
            return sum(1 for v in y if v < low or v > high) / len(y), None
        if method == "cycle_to_cycle_delta":
            if len(y) < 2:
                raise ValueError("cycle_to_cycle_delta requires at least two values")
            return statistics.fmean(abs(b - a) for a, b in zip(y, y[1:])), unit
        if method == "peak_value":
            return max(y), unit
        if method == "peak_position":
            idx = max(range(len(y)), key=y.__getitem__)
            return x[idx], signal["representation"].get("xUnit")
        if method == "range":
            return max(y) - min(y), unit

    if method in {"pearson_correlation", "spearman_correlation"}:
        a, b = _two_aligned_signals(inputs)
        ay = [float(v) for v in a["representation"]["y"]]
        by = [float(v) for v in b["representation"]["y"]]
        if method == "pearson_correlation":
            return pearson(ay, by), None
        return pearson(rankdata(ay), rankdata(by)), None

    if method == "ratio_of_sums_percent":
        numerator, denominator = _two_aligned_signals(inputs)
        numerator_values = [float(v) for v in numerator["representation"]["y"]]
        denominator_values = [float(v) for v in denominator["representation"]["y"]]
        denominator_sum = sum(denominator_values)
        if denominator_sum <= 0:
            raise ValueError("ratio_of_sums_percent requires aggregate denominator > 0")
        return 100.0 * sum(numerator_values) / denominator_sum, "%"

    raise ValueError(f"unsupported feature method: {method}")


def calculate_feature(feature_spec: dict, signals_by_id: dict[str, dict], method_versions: dict[str, int]) -> dict:
    feature_id = feature_spec.get("id")
    method = feature_spec.get("method")
    version = int(feature_spec.get("methodVersion", 0))
    if method not in method_versions:
        raise ValueError(f"feature {feature_id}: unregistered method {method}")
    if version != int(method_versions[method]):
        raise ValueError(f"feature {feature_id}: method version drift")
    input_refs = feature_spec.get("inputs") or []
    if not input_refs:
        raise ValueError(f"feature {feature_id}: inputs are required")
    inputs = []
    for ref in input_refs:
        if not isinstance(ref, str) or not ref.startswith("signal:"):
            raise ValueError(f"feature {feature_id}: only signal:<id> inputs are supported")
        signal_id = ref.split(":", 1)[1]
        if signal_id not in signals_by_id:
            raise ValueError(f"feature {feature_id}: unknown input signal {signal_id}")
        inputs.append(signals_by_id[signal_id])
    params = feature_spec.get("params") or {}
    input_payload = {
        "signals": [
            {
                "id": s["id"], "semantic": s["semantic"], "unit": s["unit"],
                "xSemantic": s["representation"]["xSemantic"], "xUnit": s["representation"]["xUnit"],
                "xDirection": s["representation"].get("xDirection", "increasing"),
                "x": s["representation"]["x"], "y": s["representation"]["y"],
            }
            for s in inputs
        ],
        "params": params,
    }
    input_fingerprint = canonical_sha(input_payload)
    value, inferred_unit = calculate_method(method, inputs, params)
    if not finite_number(value):
        raise ValueError(f"feature {feature_id}: calculation produced a non-finite value")
    declared_unit = feature_spec.get("unit")
    if declared_unit not in (None, "") and inferred_unit not in (None, declared_unit):
        raise ValueError(f"feature {feature_id}: declared unit {declared_unit!r} does not match inferred {inferred_unit!r}")
    unit = declared_unit if declared_unit not in ("",) else inferred_unit
    calculation_fingerprint = canonical_sha({
        "method": method, "methodVersion": version, "inputFingerprint": input_fingerprint,
        "params": params, "value": value, "unit": unit,
    })
    return {
        "id": feature_id,
        "label": feature_spec.get("label", feature_id),
        "method": method,
        "methodVersion": version,
        "inputs": input_refs,
        "params": params,
        "calculationScope": feature_spec.get("calculationScope", "displayed-reviewed-representation"),
        "inputFingerprint": input_fingerprint,
        "calculationFingerprint": calculation_fingerprint,
        "value": value,
        "unit": unit,
    }


def normalized_window(extraction: dict) -> dict:
    window = extraction.get("window")
    if not isinstance(window, dict):
        raise ValueError("extraction.window is required")
    kind = window.get("kind")
    axis = window.get("axis")
    if kind not in {"range", "id_set"}:
        raise ValueError("window.kind must be range or id_set")
    if not axis:
        raise ValueError("window.axis is required")
    scope = window.get("scope")
    if kind == "range":
        start = window.get("start")
        end = window.get("endExclusive")
        if not finite_number(start) or not finite_number(end) or float(end) <= float(start):
            raise ValueError("range window requires finite start < endExclusive")
        return {"kind":"range","axis":str(axis),"scope":scope,"start":float(start),"endExclusive":float(end),"unit":window.get("unit")}
    ids = window.get("ids")
    if not isinstance(ids, list) or not ids:
        raise ValueError("id_set window requires non-empty ids")
    return {"kind":"id_set","axis":str(axis),"scope":scope,"ids":sorted({str(v) for v in ids})}


def raw_window_fingerprint(source_fingerprint: str, source_artifact: str, source_member: str | None, extraction: dict) -> str:
    return canonical_sha({
        "sourceFingerprint": source_fingerprint,
        "sourceArtifact": source_artifact,
        "sourceMember": source_member,
        "window": normalized_window(extraction),
    })


def representation_fingerprint(raw_window_fp: str, signals: list[dict]) -> str:
    return canonical_sha({
        "rawWindowFingerprint": raw_window_fp,
        "signals": [
            {"id": signal["id"], "sourceChannel": signal["sourceChannel"], "representation": signal["representation"]}
            for signal in sorted(signals, key=lambda item: item["id"])
        ],
    })


def window_overlap(a: dict, b: dict) -> float:
    """Overlap coefficient in [0,1], or 0 for incomparable windows."""
    a = normalized_window({"window": a})
    b = normalized_window({"window": b})
    if a["kind"] != b["kind"] or a["axis"] != b["axis"] or a.get("scope") != b.get("scope"):
        return 0.0
    if a["kind"] == "range":
        left = max(a["start"], b["start"])
        right = min(a["endExclusive"], b["endExclusive"])
        intersection = max(0.0, right - left)
        denom = min(a["endExclusive"] - a["start"], b["endExclusive"] - b["start"])
        return intersection / denom if denom else 0.0
    aset, bset = set(a["ids"]), set(b["ids"])
    denom = min(len(aset), len(bset))
    return len(aset & bset) / denom if denom else 0.0

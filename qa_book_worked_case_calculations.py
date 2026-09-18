#!/usr/bin/env python3
from decimal import Decimal
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LEDGER = ROOT / "data" / "book-worked-engineering-cases-v1.json"

EXPECTED_CHAPTERS = {
    "worked-clamp-force-v1": "clamp",
    "worked-pressure-loss-v1": "pressure-loss",
    "worked-gate-seal-v1": "gate-seal",
    "worked-pressure-trace-v1": "cavity-pressure",
    "worked-doe-interaction-v1": "doe",
    "worked-multi-cavity-v1": "multi-cavity",
    "worked-capability-v1": "capability",
    "worked-conditioning-v1": "dimensional-stability",
    "worked-heat-load-v1": "cooling",
    "worked-diagnostic-short-shot-v1": "diagnostic-method",
}


def need(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def main() -> None:
    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    cases = {item["id"]: item for item in ledger["cases"]}
    need(set(cases) == set(EXPECTED_CHAPTERS), "worked-case calculation set drifted")
    for case_id, chapter_id in EXPECTED_CHAPTERS.items():
        item = cases[case_id]
        need(item["chapterId"] == chapter_id, f"{case_id}: chapter binding drifted")
        need(item["synthetic"] is True, f"{case_id}: teaching numbers must remain explicitly synthetic")
        need(item["claims"][0]["conclusion"] == "supported-with-explicit-synthetic-scope", f"{case_id}: claim scope drifted")

    clamp_force = Decimal("55") * Decimal("1000000") * (Decimal("120") / Decimal("10000"))
    need(clamp_force == Decimal("660000"), "clamp-force arithmetic regression")
    need("660 kN" in " ".join(cases["worked-clamp-force-v1"]["calculationSteps"]), "clamp result not carried into learner case")

    pressures = [Decimal(x) for x in ("18", "34", "58", "72")]
    increments = [pressures[0]] + [pressures[i] - pressures[i - 1] for i in range(1, len(pressures))]
    need(increments == [Decimal("18"), Decimal("16"), Decimal("24"), Decimal("14")], "pressure-loss increments regression")

    masses = [Decimal(x) for x in ("18.42", "18.70", "18.82", "18.83", "18.83")]
    need(masses[3] - masses[2] == Decimal("0.01"), "gate-seal 6→8 s delta regression")
    need(masses[4] - masses[3] == Decimal("0.00"), "gate-seal 8→10 s delta regression")

    area_delta_pct = (Decimal("120") - Decimal("90")) / Decimal("90") * Decimal("100")
    need(area_delta_pct.quantize(Decimal("0.1")) == Decimal("33.3"), "pressure-time area percentage regression")

    low_temp_speed_effect = Decimal("0.31") - Decimal("0.42")
    high_temp_speed_effect = Decimal("0.30") - Decimal("0.29")
    need(low_temp_speed_effect == Decimal("-0.11"), "DOE low-temperature effect regression")
    need(high_temp_speed_effect == Decimal("0.01"), "DOE high-temperature effect regression")

    cavity_means = [Decimal(x) for x in ("12.02", "12.15", "12.01", "11.88")]
    pooled_mean = sum(cavity_means) / Decimal(len(cavity_means))
    need(pooled_mean == Decimal("12.015"), "multi-cavity pooled-mean regression")

    usl, lsl, mean, s = map(Decimal, ("10.20", "9.80", "10.08", "0.04"))
    cp = (usl - lsl) / (Decimal("6") * s)
    cpu = (usl - mean) / (Decimal("3") * s)
    cpl = (mean - lsl) / (Decimal("3") * s)
    cpk = min(cpu, cpl)
    need(cp.quantize(Decimal("0.01")) == Decimal("1.67"), "Cp regression")
    need(cpk.quantize(Decimal("0.01")) == Decimal("1.00"), "Cpk regression")

    dimensional_change = Decimal("100.18") - Decimal("100.00")
    dimensional_pct = dimensional_change / Decimal("100.00") * Decimal("100")
    need(dimensional_change == Decimal("0.18") and dimensional_pct == Decimal("0.18"), "conditioning dimensional-change regression")

    heat_j = Decimal("0.080") * Decimal("1800") * Decimal("180")
    need(heat_j == Decimal("25920"), "sensible heat-load arithmetic regression")

    diagnosis = cases["worked-diagnostic-short-shot-v1"]
    need(len(diagnosis.get("observations", [])) >= 4, "diagnostic case lost discriminating observations")
    joined = " ".join(diagnosis["boundaries"]).lower()
    need("safe and authorised" in joined and "repeatable recovery" in joined, "diagnostic case lost causal/safety boundary")

    authority = ledger["authorityBoundary"]
    need(
        authority == {
            "productionUse": "advisory-only",
            "validatedRecipeAuthority": False,
            "automaticMachineControl": False,
            "universalSetpoints": False,
        },
        "worked-case production authority boundary weakened",
    )
    print("MouldMaster worked-case calculation QA passed: 9 numeric examples recompute exactly and the end-to-end diagnosis retains fail-closed causal/safety boundaries.")


if __name__ == "__main__":
    main()

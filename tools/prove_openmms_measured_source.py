#!/usr/bin/env python3
"""Retrieve and prove the pinned OpenMMS public source without committing raw rows.

Outputs a compact proof plus an explicitly UNREVIEWED candidate window around the
largest observed cavity-pressure sample. The candidate is evidence for pipeline testing,
not a promoted learner case and contains no causal diagnosis.
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import tempfile
import urllib.request
from pathlib import Path

URL = "https://raw.githubusercontent.com/TEPGomes/OpenMMS-T4G/cfa6e23c7fc02a645e31e06d299021cb0a3ce3e7/Real_World_Test/Case_Study_Raw_Data.csv"
EXPECTED_SHA256 = "aa78e659bc4b7a0361882d2eaa516a0010bfb573d413a3600baad98aae397bf6"
EXPECTED_HEADER = ["t","T1","T2","P","F","Ax","Ay","Az","Gx","Gy","Gz","t2"]
EXPECTED_ROWS = 29808


def main() -> int:
    out_dir = Path("measured-source-proof")
    out_dir.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=True) as tmp:
        with urllib.request.urlopen(URL, timeout=60) as response:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                tmp.write(chunk)
        tmp.flush()
        tmp.seek(0)
        digest = hashlib.sha256(tmp.read()).hexdigest()
        if digest != EXPECTED_SHA256:
            raise SystemExit(f"OpenMMS SHA-256 mismatch: {digest}")
        tmp.seek(0)
        rows = []
        text = (line.decode("utf-8-sig") for line in tmp)
        reader = csv.DictReader(text)
        if reader.fieldnames != EXPECTED_HEADER:
            raise SystemExit(f"OpenMMS header mismatch: {reader.fieldnames}")
        for row_index, row in enumerate(reader):
            parsed = {key: float(row[key]) for key in EXPECTED_HEADER}
            if not all(math.isfinite(value) for value in parsed.values()):
                raise SystemExit(f"non-finite value at row {row_index}")
            rows.append(parsed)
    if len(rows) != EXPECTED_ROWS:
        raise SystemExit(f"OpenMMS row-count mismatch: {len(rows)}")
    if not all(a["t"] <= b["t"] and a["t2"] <= b["t2"] for a,b in zip(rows, rows[1:])):
        raise SystemExit("OpenMMS time-base ordering mismatch")

    peak_index = max(range(len(rows)), key=lambda i: rows[i]["P"])
    start = max(0, peak_index - 60)
    end = min(len(rows), peak_index + 61)
    selected = rows[start:end]
    candidate = {
        "schemaVersion": 1,
        "status": "unreviewed-source-window-candidate",
        "promotionAllowed": False,
        "datasetId": "openmms-t4g",
        "sourceArtifact": "Real_World_Test/Case_Study_Raw_Data.csv",
        "sourceFingerprint": "sha256:" + digest,
        "selection": {
            "basis": "deterministic window centred on global maximum delivered cavity-pressure sample",
            "rowStart": start,
            "rowEndExclusive": end,
            "peakPressureRow": peak_index,
            "displayedRows": len(selected)
        },
        "signals": {
            "t_s": [row["t"] for row in selected],
            "cavity_pressure_bar": [row["P"] for row in selected],
            "extraction_force_N": [row["F"] for row in selected]
        },
        "boundary": "This is an automatically selected compact source window for engineering review. It is not a promoted learner case and does not establish a causal mechanism."
    }
    proof = {
        "schemaVersion": 1,
        "status": "source-proof-passed",
        "datasetId": "openmms-t4g",
        "url": URL,
        "sha256": "sha256:" + digest,
        "rows": len(rows),
        "header": EXPECTED_HEADER,
        "tStrictlyOrdered": all(a["t"] < b["t"] for a,b in zip(rows,rows[1:])),
        "t2StrictlyOrdered": all(a["t2"] < b["t2"] for a,b in zip(rows,rows[1:])),
        "pressureRangeBar": [min(r["P"] for r in rows), max(r["P"] for r in rows)],
        "forceRangeN": [min(r["F"] for r in rows), max(r["F"] for r in rows)],
        "candidateWindow": {"rowStart":start,"rowEndExclusive":end,"peakPressureRow":peak_index},
        "rawSourceRetained": False
    }
    (out_dir / "openmms-source-proof.json").write_text(json.dumps(proof, indent=2) + "\n", encoding="utf-8")
    (out_dir / "openmms-unreviewed-candidate-window.json").write_text(json.dumps(candidate, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(proof, separators=(",",":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

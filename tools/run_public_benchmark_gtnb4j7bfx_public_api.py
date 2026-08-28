#!/usr/bin/env python3
"""Public Mendeley download adapter for the gtnb4j7bfx v1 benchmark.

Mendeley's api.data.mendeley.com API requires OAuth/OIDC. The public dataset website
also exposes a credential-free public-api endpoint for file metadata. This adapter uses
only that public endpoint and then delegates all process separation, hashing, profiling,
missingness and no-raw-output controls to run_public_benchmark_gtnb4j7bfx.py.

If process separation cannot yet be proven, the adapter prints schema-only diagnostics
(column names, row/column counts and aggregate machine-code classes) and then fails
closed. It never prints individual rows or measurement values.
"""

from __future__ import annotations

import json
import re
import urllib.parse

import run_public_benchmark_gtnb4j7bfx as benchmark

PUBLIC_FILES_ENDPOINT = (
    f"https://data.mendeley.com/public-api/datasets/{benchmark.DATASET_ID}/files"
    f"?folder_id=root&version={urllib.parse.quote(benchmark.DATASET_VERSION)}"
)

_original_fetch = benchmark.fetch_public_file_list
_original_select = benchmark.select_injection_candidate


def fetch_public_file_list():
    errors = []
    try:
        payload = json.loads(
            benchmark.http_get(PUBLIC_FILES_ENDPOINT, accept="application/json").decode("utf-8")
        )
        files = benchmark.flatten_files(payload) if isinstance(payload, dict) else payload
        if isinstance(files, list) and files:
            return files, PUBLIC_FILES_ENDPOINT
        errors.append("public-api returned an empty file list")
    except Exception as exc:
        errors.append(str(exc))

    try:
        return _original_fetch()
    except Exception as exc:
        errors.append(str(exc))
    raise RuntimeError("all publisher retrieval routes failed; " + " | ".join(errors))


def machine_class_counts(candidate):
    header_map = {benchmark.norm(name): index for index, name in enumerate(candidate.get("headers", []))}
    index = header_map.get("machine")
    if index is None:
        return None
    counts = {"injection_prefix": 0, "blow_prefix": 0, "blank": 0, "other": 0}
    for row in candidate.get("rows", []):
        value = str(row[index] if index < len(row) else "").strip().upper()
        if not value:
            counts["blank"] += 1
        elif re.fullmatch(r"I(?:-|_)?\d+", value) or value.startswith("INY"):
            counts["injection_prefix"] += 1
        elif re.fullmatch(r"S(?:-|_)?\d+", value) or value.startswith("SOP"):
            counts["blow_prefix"] += 1
        else:
            counts["other"] += 1
    return counts


def safe_candidate_diagnostic(candidate):
    source = candidate.get("source_item") or {}
    return {
        "publisher_filename": source.get("publisher_filename") or source.get("name"),
        "publisher_file_id": source.get("publisher_file_id") or source.get("id"),
        "sheet": candidate.get("sheet"),
        "row_count": int(candidate.get("row_count", 0)),
        "column_count": len(candidate.get("headers", [])),
        "headers": list(candidate.get("headers", [])),
        "injection_header_matches": list(candidate.get("injection_hits", [])),
        "blow_header_matches": list(candidate.get("blow_hits", [])),
        "selection_score": candidate.get("score"),
        "machine_class_counts": machine_class_counts(candidate),
        "raw_rows_printed": False,
        "measurement_values_printed": False,
    }


def select_injection_candidate_with_safe_diagnostics(candidates):
    try:
        return _original_select(candidates)
    except Exception:
        print("MOULDMASTER_SAFE_BENCHMARK_SCHEMA_DIAGNOSTICS_BEGIN")
        for candidate in candidates:
            print(json.dumps(safe_candidate_diagnostic(candidate), ensure_ascii=False, sort_keys=True))
        print("MOULDMASTER_SAFE_BENCHMARK_SCHEMA_DIAGNOSTICS_END")
        raise


benchmark.fetch_public_file_list = fetch_public_file_list
benchmark.select_injection_candidate = select_injection_candidate_with_safe_diagnostics

if __name__ == "__main__":
    benchmark.main()

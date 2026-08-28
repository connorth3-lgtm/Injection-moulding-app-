#!/usr/bin/env python3
"""Public Mendeley download adapter for the gtnb4j7bfx v1 benchmark.

Mendeley's api.data.mendeley.com API requires OAuth/OIDC. The public dataset website
also exposes a credential-free public-api endpoint for file metadata. This adapter uses
only that public endpoint and then delegates all process separation, hashing, profiling,
missingness and no-raw-output controls to run_public_benchmark_gtnb4j7bfx.py.
"""

from __future__ import annotations

import json
import urllib.parse

import run_public_benchmark_gtnb4j7bfx as benchmark

PUBLIC_FILES_ENDPOINT = (
    f"https://data.mendeley.com/public-api/datasets/{benchmark.DATASET_ID}/files"
    f"?folder_id=root&version={urllib.parse.quote(benchmark.DATASET_VERSION)}"
)

_original_fetch = benchmark.fetch_public_file_list


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


benchmark.fetch_public_file_list = fetch_public_file_list

if __name__ == "__main__":
    benchmark.main()

#!/usr/bin/env python3
"""Verify a deployed MouldMaster GitHub Pages artifact against the source build."""

from __future__ import annotations

import argparse
import hashlib
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

FORBIDDEN_PROBES = (
    ".github/workflows/pages.yml",
    "qa_release.py",
    "qa_question_quality_50_pass_runtime.py",
    "tools/compile_master_data.py",
    "sources/LIVE_RELEASE_READINESS.md",
    "desktop/electron/package.json",
    "credentials/README.md",
    "data/live-release-readiness.json",
)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def make_url(base_url: str, path: str, source_sha: str) -> str:
    base = base_url.rstrip("/") + "/"
    url = urljoin(base, quote(path, safe="/"))
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}deploy={quote(source_sha)}"


def fetch(base_url: str, path: str, source_sha: str, timeout: float = 20.0) -> tuple[int, bytes]:
    request = Request(
        make_url(base_url, path, source_sha),
        headers={
            "Cache-Control": "no-cache, no-store, max-age=0",
            "Pragma": "no-cache",
            "User-Agent": "MouldMaster-Pages-Deployment-Verifier/1",
        },
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            return int(response.status), response.read()
    except HTTPError as exc:
        return int(exc.code), exc.read()
    except URLError as exc:
        raise RuntimeError(f"Network error for {path}: {exc}") from exc


def wait_for_source(base_url: str, source_sha: str, attempts: int = 24) -> dict:
    last = ""
    for attempt in range(1, attempts + 1):
        status, body = fetch(base_url, "deployment.json", source_sha)
        if status == 200:
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception as exc:
                last = f"invalid deployment.json: {exc}"
            else:
                if payload.get("source_sha") == source_sha:
                    return payload
                last = f"source_sha={payload.get('source_sha')!r}"
        else:
            last = f"HTTP {status}"
        if attempt < attempts:
            time.sleep(5)
    raise SystemExit(
        f"Live deployment did not converge to source {source_sha} "
        f"after {attempts} checks; last result: {last}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--source-sha", required=True)
    parser.add_argument("--dist", default=".pages-dist")
    args = parser.parse_args()

    dist = Path(args.dist)
    local_manifest_path = dist / "pages-manifest.json"
    local_deployment_path = dist / "deployment.json"
    if not local_manifest_path.is_file() or not local_deployment_path.is_file():
        raise SystemExit("Build the Pages artifact before live verification")

    local_manifest_bytes = local_manifest_path.read_bytes()
    local_manifest = json.loads(local_manifest_bytes.decode("utf-8"))
    local_deployment = json.loads(local_deployment_path.read_text(encoding="utf-8"))

    if local_manifest.get("source_sha") != args.source_sha:
        raise SystemExit("Local Pages manifest source SHA does not match requested deployment")
    if local_deployment.get("source_sha") != args.source_sha:
        raise SystemExit("Local deployment metadata source SHA does not match requested deployment")

    live_deployment = wait_for_source(args.base_url, args.source_sha)
    for key in (
        "source_sha",
        "assessment_runtime",
        "service_worker_cache_version",
        "service_worker_cache_revision",
        "artifact_policy",
    ):
        if live_deployment.get(key) != local_deployment.get(key):
            raise SystemExit(
                f"Live deployment metadata mismatch for {key}: "
                f"{live_deployment.get(key)!r} != {local_deployment.get(key)!r}"
            )

    status, live_manifest_bytes = fetch(args.base_url, "pages-manifest.json", args.source_sha)
    if status != 200:
        raise SystemExit(f"Live pages-manifest.json returned HTTP {status}")
    if live_manifest_bytes != local_manifest_bytes:
        raise SystemExit("Live pages-manifest.json does not byte-match the source artifact")

    failures: list[str] = []
    assets = local_manifest["assets"]

    def check_asset(item: tuple[str, dict]) -> str | None:
        rel, meta = item
        status_code, body = fetch(args.base_url, rel, args.source_sha)
        if status_code != 200:
            return f"{rel}: HTTP {status_code}"
        actual = digest(body)
        if actual != meta["sha256"]:
            return f"{rel}: sha256 {actual} != {meta['sha256']}"
        if len(body) != meta["bytes"]:
            return f"{rel}: bytes {len(body)} != {meta['bytes']}"
        return None

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(check_asset, item): item[0] for item in assets.items()}
        for future in as_completed(futures):
            try:
                problem = future.result()
            except Exception as exc:
                problem = f"{futures[future]}: {exc}"
            if problem:
                failures.append(problem)

    for probe in FORBIDDEN_PROBES:
        status_code, _ = fetch(args.base_url, probe, args.source_sha)
        if status_code != 404:
            failures.append(f"forbidden path {probe}: expected HTTP 404, got {status_code}")

    if failures:
        details = "\n".join(f"  - {item}" for item in sorted(failures))
        raise SystemExit(f"Live Pages verification failed:\n{details}")

    print(
        f"Live Pages verification passed for {args.source_sha[:12]}: "
        f"{len(assets)} assets hash-matched, runtime "
        f"{live_deployment['assessment_runtime']}, and "
        f"{len(FORBIDDEN_PROBES)} internal-path probes returned 404."
    )


if __name__ == "__main__":
    main()

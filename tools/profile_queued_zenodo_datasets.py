#!/usr/bin/env python3
"""Profile queued CC BY 4.0 Zenodo datasets without retaining raw rows."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
from pathlib import Path
import tempfile
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "data" / "public-benchmark-results"
USER_AGENT = "MouldMaster-data-profiler/1.0 (aggregate research profiling)"


def fetch_json(url: str) -> dict:
    for attempt in range(7):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=90) as response:
                return json.load(response)
        except HTTPError as exc:
            if exc.code not in {429, 500, 502, 503, 504} or attempt == 6:
                raise
            time.sleep(min(60, 2 ** attempt))
    raise AssertionError("unreachable")


def download(url: str, target: Path, expected_size: int | None = None) -> tuple[str, str]:
    md5 = hashlib.md5(usedforsecurity=False)
    sha256 = hashlib.sha256()
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=180) as response, target.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
            md5.update(chunk)
            sha256.update(chunk)
    if expected_size is not None and target.stat().st_size != expected_size:
        raise AssertionError(f"size mismatch for {target.name}: {target.stat().st_size} != {expected_size}")
    return md5.hexdigest(), sha256.hexdigest()


def checksum_value(value: str | None) -> tuple[str | None, str | None]:
    if not value or ":" not in value:
        return None, None
    return tuple(value.lower().split(":", 1))


def csv_profile(binary, name: str) -> dict:
    wrapper = io.TextIOWrapper(binary, encoding="utf-8-sig", errors="replace", newline="")
    sample = wrapper.read(16384)
    wrapper.seek(0)
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(wrapper, dialect)
    header = next(reader, [])
    header = [str(x).strip() for x in header]
    rows = 0
    nonempty = [0] * len(header)
    numeric = [0] * len(header)
    width_mismatches = 0
    for row in reader:
        if not any(str(x).strip() for x in row):
            continue
        rows += 1
        if len(row) != len(header):
            width_mismatches += 1
        for i, raw in enumerate(row[: len(header)]):
            value = str(raw).strip()
            if not value:
                continue
            nonempty[i] += 1
            try:
                float(value.replace(",", "."))
                numeric[i] += 1
            except ValueError:
                pass
    return {
        "name": name,
        "rows": rows,
        "columns": len(header),
        "headers": header,
        "nonEmptyValues": sum(nonempty),
        "numericValues": sum(numeric),
        "widthMismatchRows": width_mismatches,
        "delimiter": getattr(dialect, "delimiter", None),
    }


def profile_impure() -> dict:
    record = fetch_json("https://zenodo.org/api/records/6913660")
    licence = ((record.get("metadata") or {}).get("license") or {}).get("id")
    if licence != "cc-by-4.0":
        raise AssertionError(f"ImPure licence drifted: {licence}")
    manifest = []
    profiles = []
    with tempfile.TemporaryDirectory(prefix="mouldmaster-impure-") as temp:
        temp_path = Path(temp)
        for index, item in enumerate(record.get("files") or []):
            name = item["key"]
            target = temp_path / f"{index:04d}.bin"
            md5, sha256 = download(item["links"]["self"], target, item.get("size"))
            algorithm, expected = checksum_value(item.get("checksum"))
            if algorithm == "md5" and md5 != expected:
                raise AssertionError(f"publisher MD5 mismatch: {name}")
            manifest.append({"name": name, "sizeBytes": target.stat().st_size, "publisherChecksum": item.get("checksum"), "sha256": sha256})
            if name.lower().endswith((".csv", ".txt")):
                with target.open("rb") as source:
                    profiles.append(csv_profile(source, name))
    cycle_profiles = [x for x in profiles if "cycle" in x["name"].lower()]
    headers = sorted({tuple(x["headers"]) for x in cycle_profiles})
    return {
        "schema_version": 1,
        "status": "completed-public-measured-benchmark",
        "retrieved_date": time.strftime("%Y-%m-%d", time.gmtime()),
        "source": {"datasetId": "impure-pascoe-2022", "recordId": 6913660, "license": "CC BY 4.0", "licenseEvidence": "official Zenodo records API metadata.license.id"},
        "manifest": manifest,
        "profile": {
            "publisherFiles": len(manifest),
            "publisherBytes": sum(x["sizeBytes"] for x in manifest),
            "tabularFiles": len(profiles),
            "cycleFiles": len(cycle_profiles),
            "cycleRows": sum(x["rows"] for x in cycle_profiles),
            "cycleSchemaFamilies": len(headers),
            "cycleNumericValues": sum(x["numericValues"] for x in cycle_profiles),
            "widthMismatchRows": sum(x["widthMismatchRows"] for x in profiles),
            "rawRowsOrCellValuesEmitted": False,
        },
        "schemas": profiles,
        "retrieval": {"rawPublisherFilesCommitted": False, "rawRowsUploadedAsArtifact": False},
        "limitations": ["Numeric values are profiled structurally; acceptance as measured signals remains limited to source-defined sensor columns with explicit semantics and units."],
    }


def injection_member(name: str) -> bool:
    lowered = name.lower().replace("\\", "/")
    return any(token in lowered for token in ("injection", "spritz", "upper_workpiece", "lower_workpiece")) and "screw" not in lowered


def profile_cross_process() -> dict:
    record = fetch_json("https://zenodo.org/api/records/17240390")
    licence = ((record.get("metadata") or {}).get("license") or {}).get("id")
    if licence != "cc-by-4.0":
        raise AssertionError(f"cross-process licence drifted: {licence}")
    files = record.get("files") or []
    if len(files) != 1:
        raise AssertionError(f"expected one cross-process archive, found {len(files)}")
    item = files[0]
    with tempfile.TemporaryDirectory(prefix="mouldmaster-cross-") as temp:
        archive = Path(temp) / "publisher.zip"
        md5, sha256 = download(item["links"]["self"], archive, item.get("size"))
        algorithm, expected = checksum_value(item.get("checksum"))
        if algorithm == "md5" and md5 != expected:
            raise AssertionError("cross-process publisher MD5 mismatch")
        profiles = []
        members = []
        with zipfile.ZipFile(archive) as zf:
            bad_member = zf.testzip()
            if bad_member:
                raise AssertionError(f"ZIP CRC failure: {bad_member}")
            for info in zf.infolist():
                if info.is_dir():
                    continue
                scoped = injection_member(info.filename)
                members.append({"name": info.filename, "sizeBytes": info.file_size, "compressedBytes": info.compress_size, "injectionScope": scoped})
                if scoped and info.filename.lower().endswith((".csv", ".txt")):
                    with zf.open(info) as source:
                        profiles.append(csv_profile(source, info.filename))
    return {
        "schema_version": 1,
        "status": "completed-public-measured-benchmark-scope-limited",
        "retrieved_date": time.strftime("%Y-%m-%d", time.gmtime()),
        "source": {"datasetId": "cross-process-chain-17240390", "recordId": 17240390, "license": "CC BY 4.0", "licenseEvidence": "official Zenodo records API metadata.license.id", "publisherChecksum": item.get("checksum"), "sha256": sha256, "sizeBytes": item.get("size")},
        "profile": {
            "archiveMembers": len(members),
            "injectionScopeMembers": sum(x["injectionScope"] for x in members),
            "injectionTabularFiles": len(profiles),
            "injectionRows": sum(x["rows"] for x in profiles),
            "injectionNumericValuesProfiled": sum(x["numericValues"] for x in profiles),
            "widthMismatchRows": sum(x["widthMismatchRows"] for x in profiles),
            "acceptedMeasuredTimeSeriesSamples": 0,
            "rawRowsOrCellValuesEmitted": False,
        },
        "members": members,
        "schemas": profiles,
        "retrieval": {"rawPublisherFilesCommitted": False, "rawRowsUploadedAsArtifact": False},
        "limitations": ["Screw-driving members are excluded from injection-moulding counts.", "Measured-value acceptance remains zero until source units and actual-versus-target semantics are mapped from the delivered schema."],
    }


def main() -> None:
    RESULTS.mkdir(parents=True, exist_ok=True)
    selected = os.environ.get("MOULDMASTER_ZENODO_PROFILE", "all")
    jobs = []
    if selected in {"all", "impure"}:
        jobs.append(("impure-pascoe-2022-v1.json", profile_impure))
    if selected in {"all", "cross"}:
        jobs.append(("cross-process-chain-17240390-v1.json", profile_cross_process))
    for filename, function in jobs:
        result = function()
        (RESULTS / filename).write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"datasetId": result["source"]["datasetId"], "status": result["status"], "profile": result["profile"]}))


if __name__ == "__main__":
    main()


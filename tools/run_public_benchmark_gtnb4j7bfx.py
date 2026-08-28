#!/usr/bin/env python3
"""Run MouldMaster's first public measured-data benchmark without retaining raw data.

This source-specific runner retrieves Mendeley Data 10.17632/gtnb4j7bfx.1 version 1,
discovers the actual published file/sheet structure, isolates injection-moulding records,
maps actual headers to the version-pinned source contract, and delegates aggregate
profiling to profile_public_benchmark.py.

Raw files and any temporary filtered/normalised table stay inside --work-dir and are
never included in the JSON result. CI deletes the work directory before artifact upload.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import zipfile

from profile_public_benchmark import build_report, file_sha256, read_table

DATASET_ID = "gtnb4j7bfx"
DATASET_VERSION = "1"
DOI = "10.17632/gtnb4j7bfx.1"
TITLE = "Data Model for Injection Molding and Blow Molding"
LICENSE = "CC BY 4.0"
PUBLISHER = "Mendeley Data"
API_ROOT = "https://api.data.mendeley.com"
DATASET_PAGE = "https://data.mendeley.com/datasets/gtnb4j7bfx/1"
SUPPORTED_SUFFIXES = {".csv", ".tsv", ".txt", ".xlsx"}
INJECTION_HEADER_TOKENS = {
    "injectionpressure", "retentionpressure", "injectionspeed",
    "coolingtimeinjection", "ejectiontimeinjection", "retentiontimeinjection",
}
BLOW_HEADER_TOKENS = {
    "pressureblown", "blownairflow", "blowntime", "blownejectiontime",
    "timeextrusionparisianblow", "blownmoldclosingtime",
}
RAW_KEY_BLOCKLIST = {"rows", "records", "samples", "sample_values", "raw_values", "raw_rows"}


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value).lower())


def http_get(url: str, *, accept: str = "application/json") -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": accept,
            "User-Agent": "MouldMaster-Academy-public-benchmark/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        body = exc.read(4096).decode("utf-8", "replace")
        raise RuntimeError(f"publisher request failed: HTTP {exc.code} for {url}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"publisher request failed for {url}: {exc.reason}") from exc


def json_get(url: str):
    return json.loads(http_get(url).decode("utf-8"))


def flatten_files(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("results", "files", "items", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    raise RuntimeError("publisher file-list response did not contain a file array")


def fetch_public_file_list():
    errors = []
    urls = [
        f"{API_ROOT}/datasets/{DATASET_ID}/files?version={DATASET_VERSION}",
        f"{API_ROOT}/datasets/publics/{DATASET_ID}/files?version={DATASET_VERSION}",
    ]
    for url in urls:
        try:
            files = flatten_files(json_get(url))
            if files:
                return files, url
        except Exception as exc:
            errors.append(str(exc))
    raise RuntimeError("could not retrieve public dataset file list; " + " | ".join(errors))


def file_name(item) -> str:
    return str(item.get("filename") or item.get("name") or "").strip()


def file_uuid(item) -> str:
    return str(item.get("id") or item.get("file_id") or item.get("uuid") or "").strip()


def file_download_url(item) -> str | None:
    details = item.get("content_details") or item.get("contentDetails") or {}
    for candidate in (
        details.get("download_url"),
        details.get("downloadUrl"),
        item.get("download_url"),
        item.get("downloadUrl"),
    ):
        if candidate:
            return str(candidate)
    fid = file_uuid(item)
    if fid:
        return f"{API_ROOT}/datasets/{DATASET_ID}/files/{fid}/file_downloaded?version={DATASET_VERSION}"
    return None


def safe_filename(name: str, fallback: str) -> str:
    leaf = Path(name).name.strip()
    if not leaf or leaf in {".", ".."}:
        leaf = fallback
    return re.sub(r"[^A-Za-z0-9._ -]+", "_", leaf)


def download_dataset_files(work_dir: Path):
    work_dir.mkdir(parents=True, exist_ok=True)
    files, listing_url = fetch_public_file_list()
    downloaded = []
    for index, item in enumerate(files, 1):
        name = file_name(item)
        suffix = Path(name).suffix.lower()
        if suffix not in SUPPORTED_SUFFIXES and suffix != ".zip":
            continue
        url = file_download_url(item)
        if not url:
            continue
        target = work_dir / safe_filename(name, f"file-{index}{suffix or '.bin'}")
        target.write_bytes(http_get(url, accept="*/*"))
        downloaded.append(
            {
                "path": target,
                "publisher_file_id": file_uuid(item) or None,
                "publisher_filename": name or target.name,
                "download_url_source": "publisher-file-endpoint",
                "sha256": file_sha256(target),
                "size_bytes": target.stat().st_size,
            }
        )
    if not downloaded:
        raise RuntimeError(
            "publisher returned no downloadable CSV/TSV/TXT/XLSX/ZIP file; "
            f"file-list endpoint was {listing_url}"
        )
    return downloaded, listing_url


def safe_extract_zip(path: Path, out_dir: Path):
    extracted = []
    out_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path) as archive:
        for member in archive.infolist():
            if member.is_dir():
                continue
            relative = Path(member.filename)
            if relative.is_absolute() or ".." in relative.parts:
                raise RuntimeError(f"unsafe zip member rejected: {member.filename}")
            suffix = relative.suffix.lower()
            if suffix not in SUPPORTED_SUFFIXES:
                continue
            target = out_dir / safe_filename(relative.name, "dataset-file" + suffix)
            with archive.open(member) as src, target.open("wb") as dst:
                shutil.copyfileobj(src, dst)
            extracted.append(target)
    return extracted


def xlsx_sheet_names(path: Path):
    import xml.etree.ElementTree as ET

    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("xl/workbook.xml"))
    sheets = root.find(f"{{{ns}}}sheets")
    return [s.attrib.get("name", "") for s in list(sheets or [])]


def table_candidates(downloaded, work_dir: Path):
    candidates = []
    for item in downloaded:
        path = item["path"]
        paths = [path]
        if path.suffix.lower() == ".zip":
            paths = safe_extract_zip(path, work_dir / f"unzipped-{path.stem}")
        for table_path in paths:
            if table_path.suffix.lower() == ".xlsx":
                sheets = xlsx_sheet_names(table_path)
                if not sheets:
                    continue
                for sheet in sheets:
                    try:
                        headers, rows, _ = read_table(table_path, sheet)
                    except Exception:
                        continue
                    candidates.append(candidate_record(item, table_path, sheet, headers, rows))
            else:
                try:
                    headers, rows, _ = read_table(table_path, None)
                except Exception:
                    continue
                candidates.append(candidate_record(item, table_path, None, headers, rows))
    return candidates


def candidate_record(source_item, path: Path, sheet, headers, rows):
    header_norms = {norm(h) for h in headers}
    injection_hits = sorted(header_norms & INJECTION_HEADER_TOKENS)
    blow_hits = sorted(header_norms & BLOW_HEADER_TOKENS)
    name_text = norm(f"{path.name} {sheet or ''}")
    injection_name = any(x in name_text for x in ("injection", "inyector", "inyeccion"))
    blow_name = any(x in name_text for x in ("blow", "soplado", "sopladora"))
    score = len(injection_hits) * 4 - len(blow_hits) * 4 + (5 if injection_name else 0) - (5 if blow_name else 0)
    return {
        "source_item": source_item,
        "path": path,
        "sheet": sheet,
        "headers": headers,
        "rows": rows,
        "row_count": len(rows),
        "injection_hits": injection_hits,
        "blow_hits": blow_hits,
        "score": score,
    }


def filter_injection_rows_by_machine(candidate):
    header_map = {norm(name): index for index, name in enumerate(candidate["headers"])}
    machine_index = header_map.get("machine")
    if machine_index is None:
        return None
    selected = []
    injection_count = blow_count = other_count = 0
    for row in candidate["rows"]:
        value = str(row[machine_index] if machine_index < len(row) else "").strip().upper()
        if re.fullmatch(r"I(?:-|_)?\d+", value) or value.startswith("INY"):
            selected.append(row)
            injection_count += 1
        elif re.fullmatch(r"S(?:-|_)?\d+", value) or value.startswith("SOP"):
            blow_count += 1
        elif value:
            other_count += 1
    if injection_count and blow_count and other_count == 0:
        filtered = dict(candidate)
        filtered["rows"] = selected
        filtered["row_count"] = len(selected)
        filtered["machine_partition_counts"] = {
            "injection_rows": injection_count,
            "blow_rows_excluded": blow_count,
            "unclassified_rows": other_count,
        }
        return filtered
    return None


def select_injection_candidate(candidates):
    if not candidates:
        raise RuntimeError("no readable tabular file/sheet was found in the publisher dataset")
    plausible = [c for c in candidates if c["injection_hits"] and not c["blow_hits"]]
    if len(plausible) == 1:
        return plausible[0], "schema-isolated"
    if plausible:
        plausible.sort(key=lambda c: (c["score"], c["row_count"]), reverse=True)
        top = plausible[0]
        if len(plausible) == 1 or (top["score"], top["row_count"]) != (
            plausible[1]["score"], plausible[1]["row_count"]
        ):
            return top, "schema-ranked"

    # The associated peer-reviewed source states that injection machines use I/INY
    # identifiers and blow machines use S/SOP identifiers. If the publisher supplies
    # one mixed table, partition only on that documented source convention.
    mixed = []
    for candidate in candidates:
        if candidate["injection_hits"] and candidate["blow_hits"]:
            filtered = filter_injection_rows_by_machine(candidate)
            if filtered:
                mixed.append(filtered)
    if len(mixed) == 1:
        return mixed[0], "documented-machine-prefix-row-filter"
    if mixed:
        mixed.sort(key=lambda c: c["row_count"], reverse=True)
        if mixed[0]["row_count"] > mixed[1]["row_count"]:
            return mixed[0], "documented-machine-prefix-row-filter-ranked"

    ranked = sorted(candidates, key=lambda c: (c["score"], c["row_count"]), reverse=True)
    top = ranked[0]
    if top["score"] > 0 and (len(ranked) == 1 or top["score"] > ranked[1]["score"]):
        return top, "name/schema-ranked"
    raise RuntimeError(
        "could not prove an injection-only file/sheet automatically; "
        "refusing to profile a potentially mixed injection/blow table"
    )


def canonical_mapping(headers, contract):
    actual_by_norm = {norm(h): h for h in headers}
    mapping = []
    for column in contract["columns"]:
        actual = actual_by_norm.get(norm(column["name"]))
        mapping.append(
            {
                "canonical_name": column["name"],
                "actual_name": actual,
                "present": actual is not None,
                "unit": column.get("unit"),
                "class": column.get("class"),
                "command_actual": column.get("command_actual"),
            }
        )
    return mapping


def assert_report_safe(report):
    def walk(value, path="root"):
        if isinstance(value, dict):
            for key, child in value.items():
                if key.lower() in RAW_KEY_BLOCKLIST:
                    raise RuntimeError(f"unsafe raw-value key in benchmark report: {path}.{key}")
                walk(child, f"{path}.{key}")
        elif isinstance(value, list):
            for index, child in enumerate(value):
                walk(child, f"{path}[{index}]")
    walk(report)
    if report.get("raw_values_emitted") is not False:
        raise RuntimeError("benchmark profiler did not certify raw_values_emitted=false")
    if report.get("missing_value_policy", {}).get("zero_fill_performed") is not False:
        raise RuntimeError("benchmark profiler did not preserve missingness")


def build_benchmark_result(candidate, contract, args, listing_url):
    source_item = candidate["source_item"]
    report = build_report(
        candidate["path"],
        candidate["headers"],
        candidate["rows"],
        candidate["sheet"],
        contract,
        args,
    )
    assert_report_safe(report)
    mapping = canonical_mapping(candidate["headers"], contract)
    present = sum(1 for item in mapping if item["present"])
    report["status"] = "public-measured-benchmark-profile-generated-review-required"
    report["retrieval"] = {
        "mode": "automated-public-publisher-retrieval",
        "dataset_page": DATASET_PAGE,
        "file_listing_endpoint": listing_url,
        "retrieved_at_utc": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "raw_files_retained_in_report": False,
        "raw_files_intended_for_artifact_upload": False,
    }
    report["source_container"] = {
        "publisher_filename": source_item["publisher_filename"],
        "publisher_file_id": source_item["publisher_file_id"],
        "size_bytes": source_item["size_bytes"],
        "sha256": source_item["sha256"],
    }
    report["process_context"]["selection_evidence"] = {
        "method": candidate.get("selection_method"),
        "worksheet": candidate["sheet"],
        "injection_specific_header_matches": candidate["injection_hits"],
        "blow_specific_header_matches": candidate["blow_hits"],
        "mixed_process_rows_emitted": False,
        "machine_partition_counts": candidate.get("machine_partition_counts"),
    }
    report["normalization"] = {
        "row_values_written_to_report": False,
        "contract_columns": len(mapping),
        "contract_columns_present": present,
        "contract_columns_missing": len(mapping) - present,
        "column_mapping": mapping,
        "unit_policy": "Units come from the version-pinned source contract; no unit conversion is performed without explicit source semantics.",
        "identifier_policy": "Operational identifiers remain metadata/context and are not emitted as raw values in the benchmark report.",
        "command_actual_policy": "Target/command versus actual remains unresolved wherever the source contract says unknown.",
    }
    report["published_context_check"] = {
        "associated_article_injection_records": 4502,
        "associated_article_blow_records": 1855,
        "row_count_is_not_forced_to_publication_count": True,
        "reason": "The downloaded version is profiled as delivered; published modelling preprocessing may have removed duplicates or zero-filled nulls.",
    }
    report["benchmark_boundary"] = (
        "External measured-data pathway evidence only; not a site pilot, root-cause proof, "
        "validated setting window or production-change authority."
    )
    assert_report_safe(report)
    return report


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", type=Path, default=Path("data/public-benchmark-contracts/gtnb4j7bfx-v1.json"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--work-dir", type=Path, default=Path(".benchmark-work/gtnb4j7bfx-v1"))
    parser.add_argument("--retrieved-date", default=dt.date.today().isoformat())
    parser.add_argument("--keep-work-dir", action="store_true")
    return parser.parse_args()


def main():
    cli = parse_args()
    contract = json.loads(cli.contract.read_text(encoding="utf-8"))
    if contract["dataset"]["doi"] != DOI or str(contract["dataset"]["version"]) != DATASET_VERSION:
        raise RuntimeError("source contract does not match benchmark runner dataset/version")
    work_dir = cli.work_dir.resolve()
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(parents=True)
    try:
        downloaded, listing_url = download_dataset_files(work_dir / "publisher")
        candidates = table_candidates(downloaded, work_dir / "expanded")
        candidate, selection_method = select_injection_candidate(candidates)
        candidate["selection_method"] = selection_method

        class Args:
            title = TITLE
            doi = DOI
            dataset_version = DATASET_VERSION
            license = LICENSE
            retrieved_date = cli.retrieved_date
            process_context = "injection-moulding"
            confirm_process_separated = True

        result = build_benchmark_result(candidate, contract, Args, listing_url)
        cli.output.parent.mkdir(parents=True, exist_ok=True)
        cli.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(
            f"Public measured benchmark profiled: {result['file']['data_rows']} rows / "
            f"{result['file']['columns']} columns; raw values not emitted"
        )
        print(f"Source container SHA-256: {result['source_container']['sha256']}")
    finally:
        if not cli.keep_work_dir:
            shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    main()

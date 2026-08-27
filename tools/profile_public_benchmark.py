#!/usr/bin/env python3
"""Profile a local, licensed public injection-moulding benchmark without emitting raw rows.

This tool is deliberately local-only. It records provenance, schema coverage, aggregate
missingness/type information, and source-contract interpretation boundaries. It does
not download data, copy raw values into the report, infer production limits, or claim
root cause from correlation.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

MISSING_TOKENS = {"", "na", "n/a", "null", "none", "nan"}
PROCESS_CONTEXT = "injection-moulding"


def fail(message: str) -> None:
    raise ValueError(message)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def clean(value) -> str:
    return "" if value is None else str(value).strip()


def is_missing(value) -> bool:
    return clean(value).lower() in MISSING_TOKENS


def as_number(value):
    text = clean(value)
    if is_missing(text):
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def read_delimited(path: Path):
    text = path.read_text(encoding="utf-8-sig")
    sample = text[:8192]
    if path.suffix.lower() == ".tsv":
        dialect = csv.excel_tab
    else:
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        except csv.Error:
            dialect = csv.excel
    rows = list(csv.reader(text.splitlines(), dialect))
    if not rows:
        fail("input contains no rows")
    headers = [clean(v) for v in rows[0]]
    if not any(headers):
        fail("input header row is empty")
    if len(headers) != len(set(headers)):
        fail("input contains duplicate column names; resolve them before profiling")
    data = []
    for raw in rows[1:]:
        if not any(clean(v) for v in raw):
            continue
        data.append([clean(raw[i]) if i < len(raw) else "" for i in range(len(headers))])
    return headers, data, None


def _xlsx_col_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha()).upper()
    if not letters:
        return 0
    index = 0
    for ch in letters:
        index = index * 26 + (ord(ch) - 64)
    return index - 1


def _xlsx_shared_strings(archive: zipfile.ZipFile):
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    values = []
    for item in root.findall("m:si", ns):
        values.append("".join(node.text or "" for node in item.findall(".//m:t", ns)))
    return values


def _xlsx_sheet_target(archive: zipfile.ZipFile, requested: str | None):
    main_ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    office_rel_ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    package_rel_ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    sheets = workbook.find(f"{{{main_ns}}}sheets")
    if sheets is None or not list(sheets):
        fail("xlsx workbook contains no worksheets")
    options = [(s.attrib.get("name", ""), s.attrib.get(f"{{{office_rel_ns}}}id", "")) for s in sheets]
    if requested:
        matches = [item for item in options if item[0] == requested]
        if not matches:
            fail(f"worksheet {requested!r} not found; available sheets: {[name for name, _ in options]}")
        name, rel_id = matches[0]
    elif len(options) == 1:
        name, rel_id = options[0]
    else:
        fail(f"xlsx has multiple worksheets; select one with --sheet. Available: {[name for name, _ in options]}")
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    target = None
    for rel in rels.findall(f"{{{package_rel_ns}}}Relationship"):
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib.get("Target")
            break
    if not target:
        fail(f"could not resolve worksheet relationship for {name!r}")
    if target.startswith("/"):
        path = target.lstrip("/")
    else:
        path = os.path.normpath(os.path.join("xl", target)).replace("\\", "/")
    return name, path


def read_xlsx(path: Path, requested_sheet: str | None):
    main_ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    with zipfile.ZipFile(path) as archive:
        shared = _xlsx_shared_strings(archive)
        sheet_name, sheet_path = _xlsx_sheet_target(archive, requested_sheet)
        root = ET.fromstring(archive.read(sheet_path))
        parsed_rows = []
        max_index = -1
        for row in root.findall(f".//{{{main_ns}}}row"):
            cells = {}
            for cell in row.findall(f"{{{main_ns}}}c"):
                idx = _xlsx_col_index(cell.attrib.get("r", "A1"))
                max_index = max(max_index, idx)
                cell_type = cell.attrib.get("t", "")
                if cell_type == "inlineStr":
                    value = "".join(n.text or "" for n in cell.findall(f".//{{{main_ns}}}t"))
                else:
                    value_node = cell.find(f"{{{main_ns}}}v")
                    value = "" if value_node is None else (value_node.text or "")
                    if cell_type == "s" and value:
                        try:
                            value = shared[int(value)]
                        except (ValueError, IndexError):
                            pass
                cells[idx] = clean(value)
            parsed_rows.append(cells)
        if not parsed_rows:
            fail("xlsx worksheet contains no rows")
        width = max_index + 1
        matrix = [[row.get(i, "") for i in range(width)] for row in parsed_rows]
        headers = [clean(v) for v in matrix[0]]
        if len(headers) != len(set(headers)):
            fail("input contains duplicate column names; resolve them before profiling")
        data = [row for row in matrix[1:] if any(clean(v) for v in row)]
        return headers, data, sheet_name


def read_table(path: Path, requested_sheet: str | None):
    suffix = path.suffix.lower()
    if suffix in {".csv", ".tsv", ".txt"}:
        return read_delimited(path)
    if suffix == ".xlsx":
        return read_xlsx(path, requested_sheet)
    fail("supported local benchmark formats are .csv, .tsv, .txt and .xlsx")


def infer_column(values):
    missing = sum(1 for value in values if is_missing(value))
    present_values = [value for value in values if not is_missing(value)]
    numeric_values = [as_number(value) for value in present_values]
    numeric_count = sum(value is not None for value in numeric_values)
    numeric_fraction = numeric_count / len(present_values) if present_values else 0.0
    inferred = "numeric" if present_values and numeric_fraction >= 0.90 else "text"
    zero_count = sum(1 for value in numeric_values if value is not None and value == 0)
    return {
        "inferred_type": inferred,
        "missing_count": missing,
        "missing_rate": round(missing / len(values), 6) if values else 0.0,
        "nonmissing_count": len(values) - missing,
        "numeric_fraction_of_nonmissing": round(numeric_fraction, 6),
        "zero_count": zero_count,
    }


def normalized_lookup(columns):
    def norm(name):
        return re.sub(r"[^a-z0-9]+", "", name.lower())
    lookup = {}
    for column in columns:
        key = norm(column["name"])
        if key in lookup:
            fail(f"contract columns collide after normalization: {column['name']!r}")
        lookup[key] = column
    return lookup, norm


def validate_metadata(contract, args):
    expected = contract["dataset"]
    supplied = {
        "title": args.title,
        "doi": args.doi,
        "version": args.dataset_version,
        "license": args.license,
    }
    for key, value in supplied.items():
        if clean(value) != clean(expected[key]):
            fail(f"{key} mismatch: supplied {value!r}, contract requires {expected[key]!r}")
    required_context = contract["benchmark_scope"]["required_process_context"]
    if args.process_context != required_context:
        fail(f"process context must be {required_context!r} for this contract")
    if not args.confirm_process_separated:
        fail("refusing mixed-process profiling: pass --confirm-process-separated only after selecting/filtering injection-moulding records")
    try:
        dt.date.fromisoformat(args.retrieved_date)
    except ValueError:
        fail("--retrieved-date must be ISO YYYY-MM-DD")


def build_report(path: Path, headers, rows, sheet_name, contract, args):
    contract_columns = contract["columns"]
    lookup, norm = normalized_lookup(contract_columns)
    header_norms = {norm(header): header for header in headers}
    present_expected = []
    missing_expected = []
    for column in contract_columns:
        if norm(column["name"]) in header_norms:
            present_expected.append(column["name"])
        else:
            missing_expected.append(column["name"])
    unexpected = [header for header in headers if norm(header) not in lookup]

    profiles = []
    for idx, header in enumerate(headers):
        expected = lookup.get(norm(header))
        values = [row[idx] if idx < len(row) else "" for row in rows]
        profile = {
            "name": header,
            "contract_name": expected["name"] if expected else None,
            "expected": bool(expected),
            "unit": expected.get("unit") if expected else None,
            "class": expected.get("class") if expected else "unmapped",
            "share_action": expected.get("share_action") if expected else "review",
            "command_actual": expected.get("command_actual") if expected else "unknown",
        }
        profile.update(infer_column(values))
        profiles.append(profile)

    command_actual_unknown = [
        p["name"] for p in profiles
        if p["command_actual"] in {"unknown", "unknown_source_semantics", "measured_or_derived_unknown"}
    ]
    derived_or_quality = [
        p["name"] for p in profiles
        if p["class"] in {"quality_outcome", "derived_quality_metric", "quality_measurement"}
    ]

    report = {
        "schema_version": 1,
        "status": "profile-generated-review-required",
        "generated_at_utc": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "source": {
            "title": args.title,
            "doi": args.doi,
            "version": args.dataset_version,
            "license": args.license,
            "publisher": contract["dataset"]["publisher"],
            "retrieved_date": args.retrieved_date,
            "associated_article": contract.get("source_article"),
        },
        "file": {
            "filename": path.name,
            "size_bytes": path.stat().st_size,
            "sha256": file_sha256(path),
            "worksheet": sheet_name,
            "data_rows": len(rows),
            "columns": len(headers),
        },
        "process_context": {
            "declared": args.process_context,
            "separation_confirmed_by_operator": True,
            "record_resolution": contract["benchmark_scope"]["record_resolution"],
            "separation_rule": contract["benchmark_scope"]["separation_rule"],
            "site_pilot_status": contract["benchmark_scope"]["site_pilot_status"],
        },
        "raw_values_emitted": False,
        "missing_value_policy": {
            "tokens_treated_as_missing": sorted(MISSING_TOKENS),
            "zero_fill_performed": False,
            "note": "Missingness is profiled only; source cells are never rewritten by this tool."
        },
        "schema": {
            "expected_column_count": len(contract_columns),
            "present_expected_columns": present_expected,
            "missing_expected_columns": missing_expected,
            "unexpected_columns": unexpected,
            "columns": profiles,
        },
        "interpretation": {
            "command_actual_unresolved_columns": command_actual_unknown,
            "quality_or_derived_columns_not_root_causes": derived_or_quality,
            "guardrails": contract["preprocessing_guardrails"],
            "evidence_gaps": [
                "Production-order/run-level data are not assumed to be shot-resolved.",
                "No controlled intervention or recovery sequence is assumed unless independently present in the source file/documentation.",
                "No cavity-pressure, cavity-temperature or other discriminating in-mould trace is assumed unless independently present.",
                "Historical process records do not establish a validated setting window or universal production recipe.",
                "Correlation with reject/flash/defect metrics does not establish physical root cause."
            ],
            "boundary": "External measured-data pathway evidence only. Human engineering review is required; no result authorises a production change."
        }
    }
    return report


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Local licensed CSV/TSV/TXT/XLSX file")
    parser.add_argument("--contract", required=True, type=Path, help="Version-pinned source contract JSON")
    parser.add_argument("--output", required=True, type=Path, help="Output JSON profile; raw rows are never written")
    parser.add_argument("--title", required=True)
    parser.add_argument("--doi", required=True)
    parser.add_argument("--dataset-version", required=True)
    parser.add_argument("--license", required=True)
    parser.add_argument("--retrieved-date", required=True)
    parser.add_argument("--process-context", required=True, choices=[PROCESS_CONTEXT])
    parser.add_argument("--confirm-process-separated", action="store_true")
    parser.add_argument("--sheet", help="Required for multi-sheet XLSX workbooks")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    if not args.input.is_file():
        fail(f"input file not found: {args.input}")
    if not args.contract.is_file():
        fail(f"contract file not found: {args.contract}")
    contract = json.loads(args.contract.read_text(encoding="utf-8"))
    validate_metadata(contract, args)
    before = file_sha256(args.input)
    headers, rows, sheet_name = read_table(args.input, args.sheet)
    if not rows:
        fail("input contains a header but no data rows")
    report = build_report(args.input, headers, rows, sheet_name, contract, args)
    after = file_sha256(args.input)
    if before != after:
        fail("input file changed while profiling; refusing to write a report")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Profiled {report['file']['data_rows']} rows / {report['file']['columns']} columns without emitting raw values")
    print(f"SHA-256: {report['file']['sha256']}")
    print(f"Review required: {args.output}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, csv.Error, zipfile.BadZipFile, ET.ParseError, json.JSONDecodeError) as exc:
        print(f"benchmark preflight failed: {exc}", file=sys.stderr)
        raise SystemExit(2)

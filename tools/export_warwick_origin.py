#!/usr/bin/env python3
"""Export the five Warwick OPJU projects through a real Windows Origin/OriginPro session.

This script is intentionally not runnable as a CI substitute for issue #75. It requires
Origin/OriginPro plus OriginLab's external-Python `originpro` package on Windows. Raw
OPJU and exported tables stay in operator-selected local directories; only the aggregate
manifest is suitable for later repository review.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import re
import sys
from pathlib import Path

EXPECTED_FILES = [
    "data1_09.06.2023_Material_Jetting.opju",
    "data1_16.06.2023_b2b.opju",
    "data_visualisation.opju",
    "representative_curves_14.06.2023.opju",
    "surface_parameters_27.10.2023.opju",
]


def need(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_name(value: object, fallback: str) -> str:
    text = str(value or "").strip() or fallback
    text = re.sub(r"[^A-Za-z0-9._-]+", "_", text).strip("._")
    return text[:100] or fallback


def unique_headers(values: list[object]) -> list[str]:
    used: dict[str, int] = {}
    out: list[str] = []
    for index, value in enumerate(values, start=1):
        base = str(value or "").strip() or f"col_{index:04d}"
        n = used.get(base, 0) + 1
        used[base] = n
        out.append(base if n == 1 else f"{base}__{n}")
    return out


def labels(sheet: object, code: str, width: int) -> list[str]:
    try:
        result = list(sheet.get_labels(code))  # type: ignore[attr-defined]
    except Exception:
        result = []
    return [str(result[i] or "") if i < len(result) else "" for i in range(width)]


def sheet_name(sheet: object, fallback: str) -> str:
    return str(getattr(sheet, "name", "") or fallback)


def book_name(book: object, fallback: str) -> str:
    return str(getattr(book, "name", "") or fallback)


def worksheet_export(sheet: object, output: Path, workbook: str, index: int) -> dict | None:
    try:
        frame = sheet.to_df()  # type: ignore[attr-defined]
    except Exception as exc:
        raise RuntimeError(f"Origin worksheet {workbook}/{sheet_name(sheet, str(index))} could not be read: {exc}") from exc
    if frame is None or len(getattr(frame, "columns", [])) == 0 or len(frame.index) == 0:
        return None
    headers = unique_headers(list(frame.columns))
    frame = frame.copy()
    frame.columns = headers
    output.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(output, index=False, encoding="utf-8", lineterminator="\n")
    width = len(headers)
    long_names = labels(sheet, "L", width)
    units = labels(sheet, "U", width)
    comments = labels(sheet, "C", width)
    formulas = labels(sheet, "O", width)
    designations = labels(sheet, "D", width)
    columns = []
    for i, header in enumerate(headers):
        columns.append({
            "name": header,
            "originLongName": long_names[i] or None,
            "originComment": comments[i] or None,
            "unitStatus": "unresolved",
            "unit": None,
            "role": "unknown",
            "quantity": None,
            "originDesignation": designations[i] if designations[i] in {"X", "Y", "Z"} else "NONE",
            "originFormula": formulas[i] or None,
            "acceptedNumericCount": 0,
        })
    return {
        "objectType": "worksheet",
        "workbook": workbook,
        "sheet": sheet_name(sheet, f"sheet-{index}"),
        "sheetIndex": index,
        "dataBearing": True,
        "trialIdentity": {"status": "not-applicable", "value": None},
        "export": {
            "path": output.as_posix(),
            "format": "csv",
            "sha256": sha256(output),
            "rowCount": int(len(frame.index)),
            "columnCount": width,
        },
        "columns": columns,
        "timeBasis": {"kind": "not-applicable"},
        "forceConversion": {"status": "not-applicable", "source": "semantic review pending"},
    }


def matrix_array(sheet: object):
    for method in ("to_np2d", "to_np"):
        fn = getattr(sheet, method, None)
        if callable(fn):
            try:
                return fn()
            except Exception:
                pass
    raise RuntimeError(f"Origin matrix sheet {sheet_name(sheet, 'matrix')} has no usable originpro array export method")


def matrix_export(sheet: object, output: Path, workbook: str, index: int) -> dict | None:
    array = matrix_array(sheet)
    try:
        rows = int(array.shape[0])
        cols = int(array.shape[1]) if len(array.shape) > 1 else 1
    except Exception as exc:
        raise RuntimeError(f"Origin matrix {workbook}/{sheet_name(sheet, str(index))} returned an unsupported array") from exc
    if rows == 0 or cols == 0:
        return None
    output.parent.mkdir(parents=True, exist_ok=True)
    headers = [f"matrix_col_{i+1:04d}" for i in range(cols)]
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(headers)
        for row in array:
            values = list(row) if hasattr(row, "__iter__") else [row]
            writer.writerow(values)
    columns = [{
        "name": name,
        "originLongName": None,
        "originComment": None,
        "unitStatus": "unresolved",
        "unit": None,
        "role": "unknown",
        "quantity": None,
        "originDesignation": "NONE",
        "originFormula": None,
        "acceptedNumericCount": 0,
    } for name in headers]
    return {
        "objectType": "matrix",
        "workbook": workbook,
        "sheet": sheet_name(sheet, f"matrix-{index}"),
        "sheetIndex": index,
        "dataBearing": True,
        "trialIdentity": {"status": "not-applicable", "value": None},
        "export": {
            "path": output.as_posix(),
            "format": "csv",
            "sha256": sha256(output),
            "rowCount": rows,
            "columnCount": cols,
        },
        "columns": columns,
        "timeBasis": {"kind": "not-applicable"},
        "forceConversion": {"status": "not-applicable", "source": "semantic review pending"},
    }


def iter_sheets(book: object):
    try:
        return list(book)
    except Exception as exc:
        raise RuntimeError(f"Origin page {book_name(book, 'book')} is not iterable through originpro") from exc


def relative_export_path(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def process_project(op: object, source: Path, exports_root: Path, project_index: int) -> dict:
    try:
        op.new()  # type: ignore[attr-defined]
        op.open(file=str(source), readonly=True)  # type: ignore[attr-defined]
    except Exception as exc:
        raise RuntimeError(f"Origin failed to open {source.name} read-only: {exc}") from exc

    workbooks = list(op.pages("w"))  # type: ignore[attr-defined]
    matrixbooks = list(op.pages("m"))  # type: ignore[attr-defined]
    objects: list[dict] = []
    total_sheets = 0
    data_bearing = 0
    project_dir = exports_root / f"project-{project_index+1:02d}-{safe_name(source.stem, 'project')}"

    for book_index, book in enumerate(workbooks):
        workbook = book_name(book, f"workbook-{book_index}")
        for sheet_index, sheet in enumerate(iter_sheets(book)):
            total_sheets += 1
            out = project_dir / f"w-{book_index:03d}-{safe_name(workbook, 'book')}-{sheet_index:03d}-{safe_name(sheet_name(sheet, 'sheet'), 'sheet')}.csv"
            obj = worksheet_export(sheet, out, workbook, sheet_index)
            if obj is not None:
                data_bearing += 1
                obj["export"]["path"] = relative_export_path(exports_root, out)
                objects.append(obj)

    for book_index, book in enumerate(matrixbooks):
        workbook = book_name(book, f"matrixbook-{book_index}")
        for sheet_index, sheet in enumerate(iter_sheets(book)):
            total_sheets += 1
            out = project_dir / f"m-{book_index:03d}-{safe_name(workbook, 'matrixbook')}-{sheet_index:03d}-{safe_name(sheet_name(sheet, 'matrix'), 'matrix')}.csv"
            obj = matrix_export(sheet, out, workbook, sheet_index)
            if obj is not None:
                data_bearing += 1
                obj["export"]["path"] = relative_export_path(exports_root, out)
                objects.append(obj)

    need(data_bearing > 0, f"{source.name}: Origin opened the project but no data-bearing worksheet/matrix was found")
    return {
        "sourceFile": source.name,
        "publisherDisplaySize": None,
        "sourceSha256": sha256(source),
        "originOpened": True,
        "projectReconciliation": {
            "originWorkbookCount": len(workbooks) + len(matrixbooks),
            "originWorksheetOrMatrixCount": total_sheets,
            "dataBearingWorksheetOrMatrixCount": data_bearing,
            "exportedDataBearingObjectCount": len(objects),
            "skippedDataBearingObjectCount": 0,
        },
        "objects": objects,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--opju-root", required=True, type=Path, help="Local directory containing the exact five publisher OPJU files")
    parser.add_argument("--exports-root", required=True, type=Path, help="Local private output directory for CSV exports")
    parser.add_argument("--manifest-out", required=True, type=Path, help="Aggregate manifest output path")
    parser.add_argument("--origin-product", choices=("Origin", "OriginPro"), required=True, help="Product shown by the installed Origin environment")
    parser.add_argument("--origin-build", required=True, help="Exact Origin build from Help > About")
    parser.add_argument("--show-origin", action="store_true")
    args = parser.parse_args()

    need(sys.platform == "win32", "Warwick export must run on Windows with real Origin/OriginPro installed")
    try:
        import originpro as op  # type: ignore
    except ImportError as exc:
        raise SystemExit("originpro is not installed; install OriginLab's external-Python package in the real Origin/OriginPro environment") from exc

    sources = [args.opju_root / name for name in EXPECTED_FILES]
    missing = [path.name for path in sources if not path.is_file()]
    need(not missing, "missing required OPJU files: " + ", ".join(missing))
    extras = sorted(path.name for path in args.opju_root.glob("*.opju") if path.name not in EXPECTED_FILES)
    need(not extras, "unexpected OPJU files present; use a clean five-file source directory: " + ", ".join(extras))
    args.exports_root.mkdir(parents=True, exist_ok=True)

    try:
        op.set_show(bool(args.show_origin))
        version = str(op.org_ver())
        projects = [process_project(op, source, args.exports_root, i) for i, source in enumerate(sources)]
    finally:
        try:
            op.exit()
        except Exception:
            pass

    manifest = {
        "schema": 1,
        "version": "2026.09.05.1",
        "datasetId": "warwick-demoulding",
        "datasetDoi": "10.17632/x9hc7hf6xd.2",
        "license": "CC BY 4.0",
        "status": "exported-awaiting-semantic-review",
        "originEnvironment": {
            "platform": "Windows",
            "product": args.origin_product,
            "version": version,
            "build": args.origin_build,
            "validatedOpenOfAllProjects": True,
        },
        "sourceProjects": projects,
        "acceptance": {
            "allFiveProjectsReconciled": True,
            "dataBearingObjectsSkipped": 0,
            "acceptedMeasuredValues": 0,
            "acceptedTrialCount": 0,
            "acceptedChannelCount": 0,
            "rawRowsCommittedToRepository": False,
        },
        "operatorNextStep": "Review every exported column against Origin long-name/unit/designation/formula metadata, classify direct measured vs derived/command/time/unknown, establish trial identities and force/time-basis evidence, then run tools/validate_warwick_origin_export.py before any counting promotion.",
    }
    args.manifest_out.parent.mkdir(parents=True, exist_ok=True)
    args.manifest_out.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Warwick Origin export complete: {sum(len(p['objects']) for p in projects)} data-bearing object(s); semantic review still required; acceptedMeasuredValues=0")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import tempfile
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath

import openpyxl
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/pmc4753395-hdpe-cenosphere-v1.json"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"


def get_bytes(url: str):
    req = urllib.request.Request(url, headers={"Accept": "application/zip,*/*", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read(), r.geturl(), r.headers.get("Content-Type")


def safe_member(name: str) -> bool:
    p = PurePosixPath(name)
    return not p.is_absolute() and ".." not in p.parts


def compact_text(v):
    if not isinstance(v, str):
        return None
    s = re.sub(r"\s+", " ", v).strip()
    if not s:
        return None
    return s[:160]


def profile_xlsx(data: bytes, member_name: str):
    with tempfile.NamedTemporaryFile(suffix=".xlsx") as f:
        f.write(data)
        f.flush()
        raw_sheets = pd.read_excel(f.name, sheet_name=None, header=None)
        wb_formula = openpyxl.load_workbook(f.name, data_only=False, read_only=True)
        out = []
        for sheet_name, df in raw_sheets.items():
            df = df.dropna(axis=0, how="all").dropna(axis=1, how="all")
            numeric_cells = 0
            text_labels = []
            seen = set()
            for value in df.to_numpy().ravel().tolist():
                if isinstance(value, bool):
                    continue
                if isinstance(value, (int, float)) and not pd.isna(value):
                    numeric_cells += 1
                else:
                    label = compact_text(value)
                    if label and label not in seen:
                        seen.add(label)
                        text_labels.append(label)
            formula_cells = 0
            if sheet_name in wb_formula.sheetnames:
                ws = wb_formula[sheet_name]
                for row in ws.iter_rows():
                    for cell in row:
                        if cell.data_type == "f":
                            formula_cells += 1
            out.append({
                "sheet": str(sheet_name),
                "rows": int(len(df)),
                "columns": int(len(df.columns)),
                "numericCells": int(numeric_cells),
                "formulaCells": int(formula_cells),
                "textLabels": text_labels[:120],
                "rawNumericValuesEmitted": False
            })
        return {
            "member": member_name,
            "sheetCount": len(out),
            "sheets": out,
            "rawRowsOrNumericValuesEmitted": False
        }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    url = contract["source"]["supplementUrl"]
    data, final_url, content_type = get_bytes(url)
    archive_sha = hashlib.sha256(data).hexdigest()
    valid_zip = zipfile.is_zipfile(io.BytesIO(data))
    members = []
    workbook_profiles = []
    if valid_zip:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                if not safe_member(info.filename):
                    raise RuntimeError(f"unsafe archive member: {info.filename}")
                payload = zf.read(info)
                ext = Path(info.filename).suffix.lower()
                members.append({
                    "name": info.filename,
                    "extension": ext,
                    "sizeBytes": len(payload),
                    "compressedSizeBytes": int(info.compress_size),
                    "crc32": f"{info.CRC:08x}",
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "isMeasuredCandidateByName": Path(info.filename).name.lower() == "tensile-data.xlsx",
                    "isTheoreticalModelByName": "porfiri" in Path(info.filename).name.lower(),
                    "rawPayloadEmitted": False
                })
                if ext == ".xlsx":
                    workbook_profiles.append(profile_xlsx(payload, info.filename))
    names = [Path(x["name"]).name.lower() for x in members]
    measured_present = "tensile-data.xlsx" in names
    theoretical_present = any("porfiri" in n and n.endswith(".xlsx") for n in names)
    status = "retrieved-profile-needs-semantic-review" if valid_zip and measured_present else "retrieval-or-structure-blocked"
    result = {
        "schema": 1,
        "status": status,
        "retrievedDate": args.retrieved_date,
        "source": {
            "datasetId": contract["datasetId"],
            "datasetDoi": contract["source"]["datasetDoi"],
            "pmcid": contract["source"]["pmcid"],
            "license": contract["source"]["license"],
            "supplementUrl": url,
            "resolvedUrl": final_url,
            "contentType": content_type,
            "retrievedSizeBytes": len(data),
            "sha256": archive_sha,
            "zipStructureValid": valid_zip
        },
        "archiveProfile": {
            "memberCount": len(members),
            "members": members,
            "measuredWorkbookPresent": measured_present,
            "theoreticalWorkbookPresent": theoretical_present,
            "workbooks": workbook_profiles,
            "rawArchiveCommitted": False,
            "rawMembersUploadedAsArtifact": False,
            "rawRowsOrNumericValuesEmitted": False
        },
        "acceptance": {
            "stage1ProfileComplete": status == "retrieved-profile-needs-semantic-review",
            "countsAsFullyProfiledMeasuredDataset": False,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "stage2SemanticReviewRequired": status == "retrieved-profile-needs-semantic-review"
        },
        "evidenceBoundary": contract["evidenceBoundary"]
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": status,
        "archiveSha256": archive_sha,
        "sizeBytes": len(data),
        "memberCount": len(members),
        "measuredWorkbookPresent": measured_present,
        "theoreticalWorkbookPresent": theoretical_present,
        "workbookNames": [x["member"] for x in workbook_profiles]
    }, indent=2))


if __name__ == "__main__":
    main()

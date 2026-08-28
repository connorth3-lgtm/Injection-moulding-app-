#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import io
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

DATASET_ID = "6f9x8yg8nj"
VERSION = "1"
DOI = "10.17632/6f9x8yg8nj.1"
TITLE = "AD-STGN for RCA in CMMS"
PAGE = f"https://data.mendeley.com/datasets/{DATASET_ID}/{VERSION}"
API = f"https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}"
UA = "MouldMaster-Automotive-Injection-Profiler/1.0"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def get(url: str, accept: str = "*/*"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=240) as response:
        return response.read(), response.headers, response.geturl()


def flatten(value):
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        for key in ("results", "files", "items", "data"):
            if isinstance(value.get(key), list):
                return value[key]
    return []


def discover():
    found = []
    try:
        raw, _, _ = get(API, "application/json")
        for item in flatten(json.loads(raw.decode("utf-8"))):
            url = item.get("download_url") or item.get("downloadUrl") or (item.get("content_details") or {}).get("download_url")
            name = item.get("name") or item.get("filename") or item.get("file_name")
            if url:
                found.append({"name": name, "url": url, "publisherId": item.get("id")})
    except Exception:
        pass
    if found:
        return found

    raw, _, _ = get(PAGE, "text/html")
    text = html.unescape(raw.decode("utf-8", "replace")).replace("\\u002F", "/").replace("\\/", "/")
    pattern = re.compile(rf"https://data\.mendeley\.com/public-files/datasets/{DATASET_ID}/files/([0-9a-fA-F-]{{36}})/file_downloaded")
    seen = set()
    for match in pattern.finditer(text):
        url = match.group(0)
        if url not in seen:
            seen.add(url)
            found.append({"name": None, "url": url, "publisherId": match.group(1)})
    if not found:
        raise RuntimeError("No version-pinned Mendeley file links discovered")
    return found


def filename(final_url, headers, fallback):
    cd = headers.get("Content-Disposition")
    if cd:
        match = re.search(r"filename\*?=(?:UTF-8''|\")?([^\";]+)", cd, re.I)
        if match:
            return urllib.parse.unquote(match.group(1).strip().strip('"'))
    candidate = Path(urllib.parse.urlparse(final_url).path).name
    return candidate if Path(candidate).suffix else fallback


def table_profile(text: str):
    sample = text[:65536]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except Exception:
        dialect = csv.excel
    rows = list(csv.reader(io.StringIO(text), dialect))
    if not rows:
        return {"rows": 0, "columns": 0, "header": [], "numericColumns": 0, "missingCells": 0}
    header = [str(x).strip() for x in rows[0]]
    body = [row for row in rows[1:] if any(str(x).strip() for x in row)]
    numeric = [0] * len(header)
    missing = 0
    for row in body:
        vals = list(row[: len(header)]) + [""] * max(0, len(header) - len(row))
        for idx, value in enumerate(vals):
            if str(value).strip() == "":
                missing += 1
                continue
            try:
                float(str(value).strip())
                numeric[idx] += 1
            except Exception:
                pass
    numeric_cols = sum(1 for count in numeric if body and count >= max(1, int(len(body) * 0.95)))
    return {
        "rows": len(body),
        "columns": len(header),
        "header": header,
        "numericColumns": numeric_cols,
        "missingCells": missing,
    }


def classify(name: str, header_text: str):
    hay = (name + " " + header_text).lower()
    if any(token in hay for token in ("swat", "secure water", "tep", "tennessee")):
        return "non-injection-benchmark"
    if any(token in hay for token in ("injection", "molding", "moulding", "pmt", "automotive", "tianjin")):
        return "automotive-injection-candidate"
    return "unresolved"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="automotive-injection-6f9x8yg8nj-v1.json")
    args = parser.parse_args()

    files = []
    candidate_rows = 0
    candidate_tables = 0
    excluded_rows = 0
    for index, record in enumerate(discover(), 1):
        raw, headers, final_url = get(record["url"])
        name = record.get("name") or filename(final_url, headers, f"publisher-file-{index}")
        suffix = Path(name).suffix.lower()
        item = {
            "name": name,
            "publisherId": record.get("publisherId"),
            "sizeBytes": len(raw),
            "sha256": sha256(raw),
            "suffix": suffix,
            "format": suffix.lstrip(".") or "unknown",
        }
        header_text = ""
        if suffix in {".csv", ".tsv", ".txt"}:
            text = raw.decode("utf-8-sig", "replace")
            profile = table_profile(text)
            item["table"] = profile
            header_text = " ".join(profile["header"])
        elif suffix == ".json":
            try:
                parsed = json.loads(raw.decode("utf-8-sig"))
                item["jsonType"] = type(parsed).__name__
                if isinstance(parsed, dict):
                    item["jsonKeys"] = sorted(str(k) for k in parsed)[:100]
                    header_text = " ".join(item["jsonKeys"])
            except Exception:
                item["jsonParseable"] = False
        item["processClassification"] = classify(name, header_text)
        if item["processClassification"] == "automotive-injection-candidate" and item.get("table"):
            candidate_tables += 1
            candidate_rows += item["table"]["rows"]
        elif item["processClassification"] == "non-injection-benchmark" and item.get("table"):
            excluded_rows += item["table"]["rows"]
        files.append(item)

    payload = {
        "schema": 1,
        "status": "exact-file-discovery-profile-review-required",
        "completedDate": "2026-08-28",
        "source": {
            "datasetId": DATASET_ID,
            "version": VERSION,
            "doi": DOI,
            "title": TITLE,
            "publisher": "Mendeley Data",
            "page": PAGE,
            "license": "CC BY 4.0",
            "publishedIndustrialContext": "Real-world injection-moulding production line at an automotive electronics manufacturer in Tianjin; data collected 2025-02-02 through 2025-03-14.",
            "publishedSystem": {"continuousMeasurements": 66, "discreteControls": 7, "terminalIndicator": "X66"},
            "publishedNormalSamples": {"training": 88000, "validation": 22614},
            "publishedProcessStages": ["clamping", "injection", "holding", "cooling", "ejection", "robot picking/placing"],
        },
        "files": files,
        "fileCount": len(files),
        "automotiveInjectionCandidateTables": candidate_tables,
        "automotiveInjectionCandidateRowsObserved": candidate_rows,
        "nonInjectionBenchmarkRowsObserved": excluded_rows,
        "acceptedMeasuredRecords": 0,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "rawSourceFilesCommitted": False,
        "boundary": "This Mendeley package bundles Tennessee Eastman, SWaT and one real automotive injection-moulding case. Only exact source files proven to belong to the automotive injection line may be promoted. TEP/SWaT rows never count as injection-moulding evidence. Promotion additionally requires exact table identity, channel/control reconciliation, time/sample ordering and anomaly/defect-label semantics.",
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "fileCount": len(files),
        "files": [(f["name"], f["sizeBytes"], f["sha256"], f["processClassification"], (f.get("table") or {}).get("rows")) for f in files],
        "automotiveInjectionCandidateTables": candidate_tables,
        "automotiveInjectionCandidateRowsObserved": candidate_rows,
        "nonInjectionBenchmarkRowsObserved": excluded_rows,
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Retrieve PMC4753395 supplementary data and prove the benchmarked tensile workbook.

PMC completed its article-dataset distribution migration in August 2026. The
current primary distribution route is the public ``pmc-oa-opendata`` S3 bucket.
Container/member names are distribution metadata, not measurement identity, so
this proof locates the workbook by the immutable SHA-256 already accepted by the
MouldMaster benchmark. No workbook numeric values are emitted by this proof.
"""
from __future__ import annotations

import hashlib
import io
import json
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

PMCID = "PMC4753395"
S3_BASE = "https://pmc-oa-opendata.s3.amazonaws.com"
LEGACY_URLS = [
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC4753395/bin/mmc1.zip",
    "https://pmc.ncbi.nlm.nih.gov/articles/instance/4753395/bin/mmc1.zip",
]
EXPECTED_WORKBOOK_SHA = "6e376e0acdfc614b6c16e0fef99e0e74cace8bc4d931a08a729e05dfc2cd7783"
HISTORICAL_WORKBOOK_NAME = "Tensile-Data.xlsx"
USER_AGENT = "MouldMaster-measured-learning/2.2"
NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
RELNS = "{http://schemas.openxmlformats.org/package/2006/relationships}"
S3NS = "{http://s3.amazonaws.com/doc/2006-03-01/}"


def fetch(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


def list_current_pmc_objects() -> list[str]:
    query = urllib.parse.urlencode({"list-type": "2", "prefix": PMCID + "."})
    root = ET.fromstring(fetch(f"{S3_BASE}/?{query}"))
    keys = [node.text for node in root.findall(f".//{S3NS}Key") if node.text]
    if not keys:
        raise RuntimeError(f"PMC AWS listing returned no objects for {PMCID}")
    return sorted(keys)


def object_url(key: str) -> str:
    return f"{S3_BASE}/{urllib.parse.quote(key, safe='/')}"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def workbook_from_object(key: str, data: bytes) -> tuple[bytes, str | None, list[str]]:
    """Return the exact benchmarked workbook regardless of current package name."""
    if sha256(data) == EXPECTED_WORKBOOK_SHA:
        return data, None, [key.rsplit("/", 1)[-1]]

    member_names: list[str] = []
    if data.startswith(b"PK") and key.lower().endswith(".zip"):
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            members = [info for info in archive.infolist() if not info.is_dir()]
            member_names = [info.filename for info in members]
            for info in members:
                # mmc1.zip is small. The ceiling protects this diagnostic probe
                # from unexpectedly hashing a huge unrelated packaged object.
                if info.file_size > 64 * 1024 * 1024:
                    continue
                payload = archive.read(info)
                if sha256(payload) == EXPECTED_WORKBOOK_SHA:
                    return payload, info.filename, member_names
    preview = member_names[:40]
    raise LookupError(
        "object does not contain benchmarked workbook SHA "
        f"{EXPECTED_WORKBOOK_SHA}; members={preview}"
    )


def retrieve_workbook() -> tuple[str, str | None, bytes, list[str], list[str]]:
    errors: list[str] = []
    discovered: list[str] = []
    try:
        discovered = list_current_pmc_objects()
        ranked = sorted(
            discovered,
            key=lambda key: (
                0 if key.lower().endswith((".xlsx", ".xls")) else
                1 if "mmc1" in key.lower() else
                2 if key.lower().endswith(".zip") else 3,
                key,
            ),
        )
        for key in ranked:
            if not key.lower().endswith((".xlsx", ".xls", ".zip")):
                continue
            try:
                url = object_url(key)
                workbook, member, members = workbook_from_object(key, fetch(url, timeout=120))
                return url, member, workbook, discovered, members
            except Exception as exc:
                errors.append(f"AWS {key}: {exc}")
    except Exception as exc:
        errors.append(f"AWS listing: {exc}")

    for url in LEGACY_URLS:
        try:
            data = fetch(url)
            workbook, member, members = workbook_from_object(url, data)
            return url, member, workbook, discovered, members
        except Exception as exc:
            errors.append(f"{url}: {exc}")
    raise SystemExit("PMC supplementary retrieval failed: " + "; ".join(errors[-12:]))


def string_schema(blob: bytes) -> list[dict]:
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for si in root.findall("m:si", NS):
                shared.append("".join(t.text or "" for t in si.iterfind(".//m:t", NS)))
        wb = ET.fromstring(archive.read("xl/workbook.xml"))
        relroot = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rels = {rel.attrib["Id"]: rel.attrib["Target"] for rel in relroot.findall(f"{RELNS}Relationship")}
        sheets: list[dict] = []
        for sheet in wb.find("m:sheets", NS):
            name = sheet.attrib["name"]
            target = rels[sheet.attrib[f"{{{NS['r']}}}id"]]
            target = "xl/" + target.lstrip("/") if not target.startswith("xl/") else target
            xml = ET.fromstring(archive.read(target))
            labels: list[dict] = []
            for row in xml.findall(".//m:sheetData/m:row", NS):
                if int(row.attrib.get("r", "0")) > 30:
                    continue
                for cell in row.findall("m:c", NS):
                    typ = cell.attrib.get("t")
                    text = None
                    if typ == "s":
                        value = cell.find("m:v", NS)
                        if value is not None and value.text is not None:
                            text = shared[int(value.text)]
                    elif typ == "inlineStr":
                        text = "".join(t.text or "" for t in cell.iterfind(".//m:t", NS))
                    elif typ == "str":
                        value = cell.find("m:v", NS)
                        text = value.text if value is not None else None
                    if text and text.strip():
                        labels.append({"cell": cell.attrib.get("r"), "text": text.strip()[:240]})
            sheets.append({"name": name, "boundedTextLabels": labels[:160]})
        return sheets


def main() -> int:
    out = Path("measured-source-proof")
    out.mkdir(exist_ok=True)
    url, source_member, workbook, discovered, package_members = retrieve_workbook()
    digest = sha256(workbook)
    if digest != EXPECTED_WORKBOOK_SHA:
        raise SystemExit(f"PMC measured workbook SHA mismatch: {digest}")
    schema = string_schema(workbook)
    proof = {
        "schemaVersion": 3,
        "status": "source-proof-passed",
        "datasetId": "pmc4753395-hdpe-cenosphere-v1",
        "distributionRoute": "PMC Article Datasets AWS" if "amazonaws.com" in url else "legacy PMC fallback",
        "retrievalUrl": url,
        "historicalWorkbookName": HISTORICAL_WORKBOOK_NAME,
        "currentSourceMember": source_member,
        "workbookSha256": "sha256:" + digest,
        "identityRule": "workbook bytes must match the benchmarked SHA-256; package/member naming may change across PMC distribution migrations",
        "discoveredObjectCount": len(discovered),
        "discoveredObjectNames": [key.rsplit("/", 1)[-1] for key in discovered[:80]],
        "selectedPackageMemberCount": len(package_members),
        "selectedPackageMemberNames": package_members[:80],
        "sheets": schema,
        "rawNumericValuesEmitted": False,
        "rawSourceRetained": False,
    }
    (out / "pmc-hdpe-tensile-source-proof.json").write_text(json.dumps(proof, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": proof["status"],
        "datasetId": proof["datasetId"],
        "distributionRoute": proof["distributionRoute"],
        "currentSourceMember": proof["currentSourceMember"],
        "workbookSha256": proof["workbookSha256"],
        "sheets": [sheet["name"] for sheet in schema],
    }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

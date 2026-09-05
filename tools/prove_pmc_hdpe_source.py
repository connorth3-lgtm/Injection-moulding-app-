#!/usr/bin/env python3
"""Retrieve PMC4753395 supplementary data and prove the benchmarked tensile workbook.

PMC completed its article-dataset distribution migration in August 2026. The
current primary distribution route is the public ``pmc-oa-opendata`` S3 bucket,
where article-version directories expose media and supplementary objects. This
probe discovers the current objects for PMC4753395, then still requires the
historically benchmarked SHA-256 of ``Tensile-Data.xlsx`` before emitting any
schema evidence. Legacy article-bin URLs remain diagnostic fallbacks only.
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
WORKBOOK = "Tensile-Data.xlsx"
USER_AGENT = "MouldMaster-measured-learning/2.1"
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
    # Prefix with PMCID plus '.' so all article versions (e.g. .1, .2) are visible.
    query = urllib.parse.urlencode({"list-type": "2", "prefix": PMCID + "."})
    xml = fetch(f"{S3_BASE}/?{query}")
    root = ET.fromstring(xml)
    keys = [node.text for node in root.findall(f".//{S3NS}Key") if node.text]
    if not keys:
        raise RuntimeError(f"PMC AWS listing returned no objects for {PMCID}")
    return sorted(keys)


def object_url(key: str) -> str:
    return f"{S3_BASE}/{urllib.parse.quote(key, safe='/')}"


def workbook_from_object(key: str, data: bytes) -> tuple[bytes, str | None]:
    if key.lower().endswith("/" + WORKBOOK.lower()) or key.lower().endswith(WORKBOOK.lower()):
        return data, None
    if data.startswith(b"PK") and key.lower().endswith((".zip", ".xlsx")):
        # An XLSX is itself a ZIP; only treat it as the target workbook when the
        # object name matched above. Otherwise inspect ordinary ZIP supplements.
        if key.lower().endswith(".zip"):
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                matches = [
                    name for name in archive.namelist()
                    if name.lower().endswith("/" + WORKBOOK.lower()) or name.lower() == WORKBOOK.lower()
                ]
                if len(matches) == 1:
                    return archive.read(matches[0]), matches[0]
    raise LookupError("object does not contain the benchmarked tensile workbook")


def retrieve_workbook() -> tuple[str, str | None, bytes, list[str]]:
    errors: list[str] = []
    discovered: list[str] = []
    try:
        discovered = list_current_pmc_objects()
        # Prefer a direct workbook, then likely supplementary archives, then any
        # other ZIP object. This remains fail-closed on the final workbook SHA.
        ranked = sorted(
            discovered,
            key=lambda key: (
                0 if key.lower().endswith(WORKBOOK.lower()) else
                1 if "mmc1" in key.lower() else
                2 if key.lower().endswith(".zip") else 3,
                key,
            ),
        )
        for key in ranked:
            if not (key.lower().endswith(WORKBOOK.lower()) or key.lower().endswith(".zip")):
                continue
            try:
                url = object_url(key)
                data = fetch(url, timeout=120)
                workbook, member = workbook_from_object(key, data)
                return url, member, workbook, discovered
            except Exception as exc:  # keep trying other article objects
                errors.append(f"AWS {key}: {exc}")
    except Exception as exc:
        errors.append(f"AWS listing: {exc}")

    # Diagnostic fallback for pre-migration paths. These are not expected to be
    # durable after August 2026 but keep the proof usable if PMC redirects them.
    for url in LEGACY_URLS:
        try:
            data = fetch(url)
            if not data.startswith(b"PK"):
                errors.append(f"{url}: not zip ({len(data)} bytes)")
                continue
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                matches = [
                    name for name in archive.namelist()
                    if name.lower().endswith("/" + WORKBOOK.lower()) or name.lower() == WORKBOOK.lower()
                ]
                if len(matches) != 1:
                    errors.append(f"{url}: expected one {WORKBOOK}, found {matches}")
                    continue
                return url, matches[0], archive.read(matches[0]), discovered
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
        rels = {r.attrib["Id"]: r.attrib["Target"] for r in relroot.findall(f"{RELNS}Relationship")}
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
    url, source_member, workbook, discovered = retrieve_workbook()
    digest = hashlib.sha256(workbook).hexdigest()
    if digest != EXPECTED_WORKBOOK_SHA:
        raise SystemExit(f"PMC measured workbook SHA mismatch: {digest}")
    schema = string_schema(workbook)
    proof = {
        "schemaVersion": 2,
        "status": "source-proof-passed",
        "datasetId": "pmc4753395-hdpe-cenosphere-v1",
        "distributionRoute": "PMC Article Datasets AWS" if "amazonaws.com" in url else "legacy PMC fallback",
        "retrievalUrl": url,
        "sourceMember": source_member,
        "workbookSha256": "sha256:" + digest,
        "discoveredObjectCount": len(discovered),
        "discoveredObjectNames": [key.rsplit("/", 1)[-1] for key in discovered[:80]],
        "sheets": schema,
        "rawNumericValuesEmitted": False,
        "rawSourceRetained": False,
    }
    (out / "pmc-hdpe-tensile-source-proof.json").write_text(json.dumps(proof, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": proof["status"],
        "datasetId": proof["datasetId"],
        "distributionRoute": proof["distributionRoute"],
        "workbookSha256": proof["workbookSha256"],
        "sheets": [sheet["name"] for sheet in schema],
    }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

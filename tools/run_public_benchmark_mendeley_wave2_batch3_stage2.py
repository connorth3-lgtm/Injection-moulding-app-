#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/public-benchmark-results/mendeley-wave2-batch3-stage1.json"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"
API_ROOT = "https://api.data.mendeley.com"
NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main"


def get(url: str) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read(), r.geturl()


def listing(dataset_id: str, version: int):
    url = f"https://data.mendeley.com/public-api/datasets/{dataset_id}/files?folder_id=root&version={version}"
    raw, _ = get(url)
    x = json.loads(raw.decode("utf-8"))
    if isinstance(x, list): return x
    if isinstance(x, dict):
        for key in ("results", "files", "items", "data"):
            if isinstance(x.get(key), list): return x[key]
    return []


def fid(item): return str(item.get("id") or item.get("file_id") or item.get("uuid") or "")


def furl(dataset_id: str, version: int, item):
    d = item.get("content_details") or item.get("contentDetails") or {}
    for key in ("download_url", "downloadUrl"):
        if d.get(key): return str(d[key])
        if item.get(key): return str(item[key])
    return f"{API_ROOT}/datasets/{dataset_id}/files/{fid(item)}/file_downloaded?version={version}"


def sanitize_text(value: str, max_len: int = 180):
    text = " ".join(str(value).replace("\x00", " ").split())
    if not text or not re.search(r"[A-Za-z]", text): return None
    # Preserve semantic labels while ensuring raw numeric measurements cannot leak.
    text = re.sub(r"(?<![A-Za-z])[-+]?\d+(?:[.,]\d+)?(?:[Ee][-+]?\d+)?(?![A-Za-z])", "<n>", text)
    if len(text) > max_len: text = text[:max_len] + "…"
    return text


def unique_limited(values, limit=250):
    out, seen = [], set()
    for v in values:
        if not v or v in seen: continue
        seen.add(v); out.append(v)
        if len(out) >= limit: break
    return out


def xml_texts(raw: bytes, tag: str):
    try: root = ET.fromstring(raw)
    except ET.ParseError: return []
    return [el.text or "" for el in root.iter(tag) if el.text]


def profile_docx(data: bytes):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        docs = [n for n in names if n == "word/document.xml" or n.startswith("word/header") or n.startswith("word/footer")]
        labels = []
        table_count = 0
        paragraph_count = 0
        for n in docs:
            raw = z.read(n)
            try: root = ET.fromstring(raw)
            except ET.ParseError: continue
            if n == "word/document.xml":
                table_count += sum(1 for _ in root.iter(f"{{{NS_W}}}tbl"))
                paragraph_count += sum(1 for _ in root.iter(f"{{{NS_W}}}p"))
            for t in root.iter(f"{{{NS_W}}}t"):
                s = sanitize_text(t.text or "")
                if s: labels.append(s)
        return {
            "format": "docx", "zipMembers": len(names), "paragraphCount": paragraph_count, "tableCount": table_count,
            "embeddedObjects": sorted(n for n in names if n.startswith("word/embeddings/"))[:100],
            "mediaCount": sum(1 for n in names if n.startswith("word/media/")),
            "safeSemanticTextLabels": unique_limited(labels), "rawNumericValuesEmitted": False,
        }


def profile_pptx(data: bytes):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        slide_names = sorted(n for n in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", n))
        labels = []
        per_slide = []
        for n in slide_names:
            raw = z.read(n)
            vals = [sanitize_text(x) for x in xml_texts(raw, f"{{{NS_A}}}t")]
            vals = unique_limited([x for x in vals if x], 100)
            labels.extend(vals)
            per_slide.append({"slideXml": n, "safeSemanticTextLabels": vals})
        chart_names = sorted(n for n in names if re.fullmatch(r"ppt/charts/chart\d+\.xml", n))
        chart_labels = []
        for n in chart_names:
            vals = [sanitize_text(x) for x in xml_texts(z.read(n), f"{{{NS_A}}}t")]
            chart_labels.extend(x for x in vals if x)
        embeddings = sorted(n for n in names if n.startswith("ppt/embeddings/"))
        return {
            "format": "pptx", "zipMembers": len(names), "slideCount": len(slide_names), "chartCount": len(chart_names),
            "embeddedObjects": embeddings, "embeddedWorkbookCount": sum(1 for n in embeddings if n.lower().endswith((".xlsx", ".xlsm", ".xls"))),
            "mediaCount": sum(1 for n in names if n.startswith("ppt/media/")),
            "safeSemanticTextLabels": unique_limited(labels + chart_labels, 350), "slides": per_slide,
            "rawNumericValuesEmitted": False,
        }


def profile_pdf(data: bytes):
    reader = PdfReader(io.BytesIO(data))
    pages = []
    all_labels = []
    for idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        lines = []
        for line in text.splitlines():
            s = sanitize_text(line)
            if s: lines.append(s)
        lines = unique_limited(lines, 80)
        all_labels.extend(lines)
        image_count = 0
        try: image_count = len(page.images)
        except Exception: pass
        pages.append({"page": idx + 1, "safeSemanticTextLines": lines, "imageCount": image_count})
    meta = {}
    for k, v in (reader.metadata or {}).items():
        s = sanitize_text(v)
        if s: meta[str(k)] = s
    return {
        "format": "pdf", "pageCount": len(reader.pages), "metadata": meta,
        "safeSemanticTextLabels": unique_limited(all_labels, 350), "pages": pages,
        "rawNumericValuesEmitted": False,
    }


def numeric_line(line: str):
    return bool(re.fullmatch(r"\s*[-+]?\d+(?:[.,]\d+)?(?:[Ee][-+]?\d+)?\s*", line))


def profile_vms(data: bytes):
    text = data.decode("utf-8", "replace")
    lines = text.splitlines()
    alpha = []
    numeric_count = 0
    runs, current = [], 0
    for line in lines:
        if numeric_line(line):
            numeric_count += 1; current += 1
        else:
            if current: runs.append(current); current = 0
            s = sanitize_text(line)
            if s: alpha.append(s)
    if current: runs.append(current)
    long_runs = sorted((r for r in runs if r >= 20), reverse=True)
    keywords = {}
    upper = text.upper()
    for key in ["VAMAS", "XPS", "REGULAR", "BINDING ENERGY", "KINETIC ENERGY", "COUNTS", "COUNT RATE", "CASAXPS", "SURVEY", "C1S", "O1S", "F1S", "SI2P", "N1S"]:
        keywords[key] = upper.count(key)
    return {
        "format": "vms", "lineCount": len(lines), "numericOnlyLineCount": numeric_count,
        "numericRunCount": len(runs), "longNumericRunLengthsTop50": long_runs[:50],
        "safeSemanticTextLabels": unique_limited(alpha, 400), "keywordOccurrences": keywords,
        "rawNumericValuesEmitted": False,
    }


def profile_opju(data: bytes):
    printable = re.findall(rb"[ -~]{8,120}", data)
    labels = []
    for b in printable:
        try: s = sanitize_text(b.decode("latin1", "replace"))
        except Exception: s = None
        if s: labels.append(s)
    return {
        "format": "opju", "binarySizeBytes": len(data), "leadingBytesHex": data[:16].hex(),
        "safePrintableLabels": unique_limited(labels, 150), "rawNumericValuesEmitted": False,
    }


def profile_payload(name: str, data: bytes):
    low = name.lower()
    if low.endswith(".docx"): return profile_docx(data)
    if low.endswith(".pptx"): return profile_pptx(data)
    if low.endswith(".pdf"): return profile_pdf(data)
    if low.endswith(".vms"): return profile_vms(data)
    if low.endswith(".opju"): return profile_opju(data)
    return {"format": Path(name).suffix.lower().lstrip("."), "rawNumericValuesEmitted": False}


def profile_source(source, dataset_id: str, version: int):
    pub = {fid(x): x for x in listing(dataset_id, version)}
    files = []
    for expected in source["apiFiles"]:
        item = pub.get(expected["id"])
        if item is None: raise RuntimeError(f"publisher file id disappeared: {expected['id']}")
        data, final = get(furl(dataset_id, version, item))
        digest = hashlib.sha256(data).hexdigest()
        if digest.lower() != expected["sha256"].lower(): raise RuntimeError(f"publisher SHA mismatch for {expected['name']}")
        files.append({
            "fileId": expected["id"], "fileName": expected["name"], "sizeBytes": len(data), "sha256": digest,
            "publisherSha256Matched": True, "resolvedUrl": final, "structuralProfile": profile_payload(expected["name"], data),
            "rawPublisherFileCommitted": False, "rawNumericValuesEmitted": False,
        })
    return files


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--output", type=Path, required=True); ap.add_argument("--retrieved-date", required=True); args = ap.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    specs = {"mendeley-8c8fjwcw86-v1": ("8c8fjwcw86",1), "mendeley-597jrsm9zm-v1": ("597jrsm9zm",1), "mendeley-crmb7xjymg-v1": ("crmb7xjymg",1)}
    sources = []
    for s in manifest["sources"]:
        did, ver = specs[s["datasetId"]]
        sources.append({
            "datasetId": s["datasetId"], "doi": s["doi"], "license": s["license"],
            "status": "retrieved-structural-profile-needs-semantic-review", "files": profile_source(s, did, ver),
            "countsAsFullyProfiledMeasuredDataset": False, "acceptedMeasuredTimeSeriesSamples": 0,
        })
    result = {
        "schema": 1, "status": "retrieved-structural-profiles-needing-semantic-review", "retrievedDate": args.retrieved_date, "sources": sources,
        "summary": {"sourcesRetrieved":3,"filesRetrieved":sum(len(x["files"]) for x in sources),"fullyProfiledAccepted":0,"acceptedMeasuredTimeSeriesSamples":0,"rawPublisherFilesCommitted":False,"rawNumericValuesEmitted":False},
        "evidenceBoundary": "Exact publisher payloads are temporarily retrieved and SHA-verified. Only sanitized semantic labels, document/slide/page/file structure, formulas/embedded-object counts and measurement-array length diagnostics are emitted. Raw numeric values and publisher files are never retained."
    }
    args.output.parent.mkdir(parents=True, exist_ok=True); args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps(result["summary"], indent=2))

if __name__ == "__main__": main()

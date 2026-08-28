#!/usr/bin/env python3
from __future__ import annotations

import argparse, csv, hashlib, io, json, os, urllib.request, zipfile
from pathlib import Path

URL = "https://publications.rwth-aachen.de/record/1016199/files/ExperimentalData.zip"
DOI = "10.18154/RWTH-2025-06809"
UA = "MouldMaster-RWTH-PCR-profiler/1.0"


def digest_bytes(data: bytes, algo="sha256"):
    h = hashlib.new(algo); h.update(data); return h.hexdigest()


def download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/zip,*/*"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def inspect_csv(data: bytes):
    text = data.decode("utf-8-sig", errors="replace")
    sample = text[:20000]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
        delim = dialect.delimiter
    except Exception:
        delim = ","
    reader = csv.reader(io.StringIO(text), delimiter=delim)
    rows = []
    for i, row in enumerate(reader):
        rows.append(row)
        if i >= 4: break
    line_count = text.count("\n") + (1 if text and not text.endswith("\n") else 0)
    return {"delimiter": delim, "lineCount": line_count, "header": rows[0] if rows else [], "previewRowWidths": [len(r) for r in rows]}


def inspect_mat(data: bytes):
    tmp = Path(".rwth_tmp.mat"); tmp.write_bytes(data)
    out = {"format": "mat", "variables": []}
    try:
        import scipy.io
        for name, shape, dtype in scipy.io.whosmat(tmp):
            out["variables"].append({"name": name, "shape": list(shape), "dtype": dtype})
    except Exception as e:
        out["scipyError"] = type(e).__name__
        try:
            import h5py
            with h5py.File(tmp, "r") as f:
                def visit(name, obj):
                    if hasattr(obj, "shape"):
                        out["variables"].append({"name": name, "shape": list(obj.shape), "dtype": str(obj.dtype)})
                f.visititems(visit)
        except Exception as e2:
            out["hdf5Error"] = type(e2).__name__
    tmp.unlink(missing_ok=True)
    return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--output", default="rwth-pcr-v1.json"); args = ap.parse_args()
    raw = download(URL)
    if not zipfile.is_zipfile(io.BytesIO(raw)):
        raise RuntimeError("RWTH download is not a ZIP archive")
    members = []
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        for info in z.infolist():
            if info.is_dir(): continue
            data = z.read(info.filename)
            rec = {"path": info.filename, "sizeBytes": len(data), "sha256": digest_bytes(data), "suffix": Path(info.filename).suffix.lower()}
            suffix = rec["suffix"]
            if suffix in {".csv", ".txt", ".tsv"} and len(data) <= 100_000_000:
                rec["tableInspection"] = inspect_csv(data)
            elif suffix == ".mat":
                rec["matInspection"] = inspect_mat(data)
            elif suffix in {".json", ".md", ".yaml", ".yml"} and len(data) <= 5_000_000:
                rec["textPreview"] = data.decode("utf-8", errors="replace")[:2500]
            members.append(rec)
    payload = {
        "schema": 1,
        "status": "profile-generated-review-required",
        "completedDate": "2026-08-28",
        "source": {
            "title": "Injection Molding Process Data for Post-Consumer-Recycled Materials",
            "doi": DOI,
            "recordUrl": "https://publications.rwth-aachen.de/record/1016199/",
            "downloadUrl": URL,
            "publisher": "RWTH Publications",
            "license": "CC BY 4.0",
            "openAccess": True,
            "peerReviewedCompanion": "10.1016/j.jprocont.2026.103725"
        },
        "archive": {"name": "ExperimentalData.zip", "sizeBytes": len(raw), "sha256": digest_bytes(raw), "members": len(members)},
        "members": members,
        "publishedContext": {
            "materials": ["Systalen PP-24000 gr000 PCR", "SABIC PP579S virgin PP"],
            "machine": "Arburg Allrounder 520 A 1500-800",
            "mouldGeometry": "flat plate",
            "signals": ["screw-antechamber pressure", "cavity pressure", "controller output", "screw velocity", "screw-antechamber volume"],
            "quality": ["part mass", "part-mass reference"],
            "controllers": ["learning-based nonlinear MPC", "proportional cavity-pressure control", "part-mass control"]
        },
        "acceptedMeasuredCycles": 0,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "boundary": "Discovery profile only. Promotion requires reconciling experiment/cycle cardinality, signal matrices, units/time basis, controller/setpoint versus direct measurements, and part-mass linkage from the exact archive."
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps({"archive": payload["archive"], "memberCount": len(members), "members": [{"path": m["path"], "sizeBytes": m["sizeBytes"], "suffix": m["suffix"], "table": m.get("tableInspection"), "mat": m.get("matInspection")} for m in members]}, indent=2, ensure_ascii=False))

if __name__ == "__main__": main()

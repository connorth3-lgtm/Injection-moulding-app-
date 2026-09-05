#!/usr/bin/env python3
"""Retrieve the pinned AVAPS dataset1 archive and emit schema-only source proof.

No raw third-party rows are committed. The proof records the exact archive hash,
member names, sizes and bounded text/CSV header samples so source-channel semantics
can be governed from delivered files rather than inferred.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import tempfile
import urllib.request
import zipfile
from pathlib import Path

URL = "https://raw.githubusercontent.com/sc4t1m/scatimdata/7bd35941d75c97a3f276439377dc430ab47402be/dataset1.zip"
EXPECTED_SHA256 = "f8c7f6363ecbd541735b374746ce8549aaa50dae754aaaa2efa980c227b19c09"


def main() -> int:
    out_dir = Path("measured-source-proof")
    out_dir.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=True) as tmp:
        with urllib.request.urlopen(URL, timeout=90) as response:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                tmp.write(chunk)
        tmp.flush(); tmp.seek(0)
        digest = hashlib.sha256(tmp.read()).hexdigest()
        if digest != EXPECTED_SHA256:
            raise SystemExit(f"AVAPS dataset1 SHA mismatch: {digest}")
        tmp.seek(0)
        with zipfile.ZipFile(tmp) as archive:
            members = []
            for info in archive.infolist():
                item = {"name":info.filename,"sizeBytes":info.file_size,"compressedBytes":info.compress_size}
                lower = info.filename.lower()
                if not info.is_dir() and (lower.endswith('.csv') or lower.endswith('.txt')):
                    raw = archive.read(info.filename)[:65536]
                    text = raw.decode('utf-8-sig', errors='replace')
                    rows = list(csv.reader(io.StringIO(text)))[:3]
                    item["firstRows"] = rows
                members.append(item)
    proof = {
        "schemaVersion":1,"status":"source-proof-passed","datasetId":"scatimdata-avaps",
        "sourceArtifact":"dataset1.zip","url":URL,"sha256":"sha256:"+digest,
        "members":members,"rawSourceRetained":False,
        "boundary":"Schema/header proof only. Bounded first-row samples are emitted solely to resolve delivered source structure; this artifact is not a learner case."
    }
    path=out_dir/'avaps-dataset1-source-proof.json'
    path.write_text(json.dumps(proof, indent=2)+"\n", encoding='utf-8')
    print(json.dumps({"status":proof["status"],"datasetId":proof["datasetId"],"sha256":proof["sha256"],"memberCount":len(members),"members":[m["name"] for m in members]}, separators=(',',':')))
    return 0

if __name__=='__main__':
    raise SystemExit(main())

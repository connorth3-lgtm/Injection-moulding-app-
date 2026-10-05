#!/usr/bin/env python3
"""Validate the derived 20-chapter Book reader architecture and editorial expansion boundary."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
PACKAGED=ROOT/"src/domains/learning/book-data"

def load(path: Path) -> dict:
    value=json.loads(path.read_text(encoding="utf-8"))
    assert isinstance(value,dict), f"{path} must contain an object"
    return value

def git_blob(path: Path) -> str:
    data=path.read_bytes()
    return hashlib.sha1(f"blob {len(data)}\0".encode()+data).hexdigest()

version=load(ROOT/"version.json")
binding=load(ROOT/"data/book-sme-release-binding-v1.json")
book_release=binding.get("contentRelease")
assert binding.get("boundWebRelease")==version.get("web_release")
manifest=load(ROOT/"data/book-manifest-v1.json")
reader=load(ROOT/"data/book-reader-architecture-v2.json")
editorial=load(ROOT/"data/book-editorial-expansion-review-v1.json")
auth=load(ROOT/"data/book-publication-authorization-v1.json")
sme=load(ROOT/"data/book-sme-review-v1.json")
runtime=(ROOT/"src/domains/learning/book-runtime.js").read_text(encoding="utf-8")
sw=(ROOT/"service-worker.js").read_text(encoding="utf-8")

assert (ROOT/"data/book-reader-architecture-v2.json").read_bytes()==(PACKAGED/"book-reader-architecture-v2.json").read_bytes()
assert (ROOT/"data/book-editorial-expansion-review-v1.json").read_bytes()==(PACKAGED/"book-editorial-expansion-review-v1.json").read_bytes()

module_ids=[c["id"] for part in manifest["parts"] for c in part["chapters"]]
assert len(module_ids)==46 and len(set(module_ids))==46
assert reader.get("schema")==1 and reader.get("bookId")=="mouldmaster-book"
assert reader.get("release")==book_release
assert reader.get("status")=="governed-derived-reader-map"
readers=reader.get("readerChapters") or []
assert len(readers)==20 and len({r.get("id") for r in readers})==20
covered=[]
for row in readers:
    assert row.get("id") and row.get("title") and row.get("goal")
    mids=row.get("moduleIds") or []
    assert mids and len(mids)==len(set(mids))
    assert set(mids)<=set(module_ids)
    assert not any(k in row for k in ("claims","sourceIds","state","publicationStatus","smeStatus")), "reader grouping must not become a second claim/status authority"
    covered.extend(mids)
assert len(covered)==46 and len(set(covered))==46 and set(covered)==set(module_ids)
target=reader.get("targetWordsPerReaderChapter") or {}
assert target.get("nominal")==1000 and target.get("range")==[850,1400]
assert "structural groupings only" in reader.get("governanceBoundary","")

claim_paths=[
    "data/book-claim-review-high-risk-v1.json",
    "data/book-claim-review-process-tooling-v1.json",
    "data/book-claim-review-foundations-materials-machine-v1.json",
    "data/book-claim-review-troubleshooting-v1.json",
    "data/book-claim-review-engineering-advanced-v1.json",
]
claims_by_chapter={}
for path in claim_paths:
    ledger=load(ROOT/path)
    for chapter in ledger.get("chapters",[]):
        claims_by_chapter[chapter["chapterId"]]={c["claimId"] for c in chapter.get("claims",[])}

assert editorial.get("schemaVersion")==1 and editorial.get("bookId")=="mouldmaster-book"
assert editorial.get("release")==book_release
assert editorial.get("status")=="repository-technical-review-complete"
reviews=editorial.get("reviewedModules") or []
assert len(reviews)==37 and len({x.get("moduleId") for x in reviews})==37
for row in reviews:
    mid=row["moduleId"]
    assert mid in set(module_ids)
    path=ROOT/row["authoredPath"]
    assert path.is_file()
    assert row["authoredGitBlobSha1"]==git_blob(path)
    governed=set(row.get("governedClaimIds") or [])
    assert governed and governed==claims_by_chapter[mid], f"editorial review claim coverage drift for {mid}"
    assert row.get("conclusion")=="compatible-with-existing-governed-claim-scope"
    assert any("Independent human SME status remains HOLD" in x for x in row.get("restrictions",[]))
assert editorial.get("readerArchitecture",{}).get("gitBlobSha1")==git_blob(ROOT/"data/book-reader-architecture-v2.json")
assert editorial.get("acceptanceRules",{}).get("independentSmeStatus")=="hold"

permit=auth.get("readerArchitectureAuthorization") or {}
assert permit.get("status")=="authorized-derived-structure" and permit.get("release")==book_release
assert permit.get("readerChapterCount")==20 and permit.get("governedModuleCount")==46 and permit.get("noNewTechnicalClaims") is True
edit_permit=auth.get("editorialExpansionAuthorization") or {}
assert edit_permit.get("status")=="authorized-repository-technical-source-review"
assert edit_permit.get("release")==book_release and edit_permit.get("moduleCount")==37 and edit_permit.get("noNewClaimIds") is True
hashes=auth.get("runtimeIntegrity",{}).get("gitBlobSha1ByFile",{})
for name in ("book-reader-architecture-v2.json","book-editorial-expansion-review-v1.json"):
    assert hashes.get(name)==git_blob(PACKAGED/name), f"authorization hash drift for {name}"

assert sme.get("status")=="hold" and sme.get("reviews")==[] and len(sme.get("chapterIds",[]))==46
for marker in ("READER_PATH","EDITORIAL_REVIEW_PATH","validateReaderArchitecture","validateEditorialExpansionReview","showReaderChapter","readerChapterHtml","20 substantial chapters","46 governed modules","getReaderArchitecture","getEditorialExpansionReview"):
    assert marker in runtime, f"reader runtime marker missing: {marker}"
for asset in ("./src/domains/learning/book-data/book-reader-architecture-v2.json","./src/domains/learning/book-data/book-editorial-expansion-review-v1.json"):
    assert asset in sw, f"reader governance asset missing from atomic cache: {asset}"

print("PASS: 20 reader chapters derive exactly once from all 46 governed modules; no second claim/status authority was introduced.")
print("PASS: expanded prose is exact-byte bound to the complete existing claim inventory for all 37 expanded modules; independent human SME remains HOLD.")

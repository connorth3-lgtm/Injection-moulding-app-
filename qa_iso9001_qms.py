#!/usr/bin/env python3
"""Fail-closed QA for the ISO 9001 quality-management support layer."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "data" / "quality-management-iso9001-v1.json"
RUNTIME = ROOT / "src" / "domains" / "quality" / "data" / "quality-management-iso9001-v1.json"
RUNTIME_JS = ROOT / "source-library.js"
BOOK_SOURCE = ROOT / "data" / "book-evidence-enrichment-v1.json"
BOOK_RUNTIME = ROOT / "src" / "domains" / "learning" / "book-data" / "book-evidence-enrichment-v1.json"

def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

need(SOURCE.is_file() and RUNTIME.is_file(), "ISO 9001 QMS source/runtime contract missing")
need(SOURCE.read_bytes() == RUNTIME.read_bytes(), "ISO 9001 QMS source/runtime contract drifted")
data = load(SOURCE)
need(data.get("schema") == 1 and data.get("id") == "mouldmaster-iso9001-qms-support", "QMS contract identity mismatch")
need(data.get("status") == "technical-review", "QMS support must remain technical-review")
need(data.get("checked") == "2026-09-15", "QMS source-status check date drifted")

standards = {x["id"]: x for x in data.get("standards", [])}
need(set(standards) == {"ISO-9001-2015","ISO-9001-2015-AMD1-2024","ISO-9000-2026","ISO-9001-ED6-2026"}, "QMS standards set mismatch")
need(standards["ISO-9001-2015"]["currentState"] == "published", "ISO 9001:2015 must remain the published requirements basis until superseded")
need(standards["ISO-9001-2015-AMD1-2024"]["currentState"] == "published", "ISO 9001:2015/Amd 1:2024 state mismatch")
need(standards["ISO-9000-2026"]["currentState"] == "published", "ISO 9000:2026 vocabulary state mismatch")
need(standards["ISO-9001-ED6-2026"]["currentState"] == "under-publication", "Edition 6 must not be promoted before ISO publishes it")
need(standards["ISO-9001-ED6-2026"]["role"] == "transition-watch", "Edition 6 must remain transition-watch")

mapping = data.get("supportMap", [])
need([x.get("clause") for x in mapping] == list("456789") + ["10"], "QMS support map must cover clauses 4-10 in order")
levels = {x.get("supportLevel") for x in mapping}
need(levels <= {"limited","partial","strong-support"}, "unsupported QMS support level")
for row in mapping:
    need(row.get("mouldmasterSupport") and row.get("notProvided"), f"clause {row.get('clause')} must separate support from exclusions")

templates = {x.get("id"): x for x in data.get("recordTemplates", [])}
need(set(templates) == {"audit-evidence","nonconformity-capa","measurement-resource","competence","document-change"}, "QMS record-template set mismatch")
need("closed" in templates["nonconformity-capa"]["states"], "CAPA workflow lacks closed state")
need("effectivenessEvidence" in templates["nonconformity-capa"]["fields"], "CAPA closure lacks effectiveness evidence")
need("traceabilityRef" in templates["measurement-resource"]["fields"], "measurement evidence lacks traceability reference")
need("authorized-by-organisation" in templates["competence"]["states"], "competence template must keep organizational authorization explicit")
need("supersedesRef" in templates["document-change"]["fields"], "change control must preserve superseded identity")

blob = SOURCE.read_text(encoding="utf-8").lower()
need(re.search(r"\bshall\b", blob) is None, "QMS support appears to reproduce normative ISO wording")
for forbidden in data["claimBoundary"]["forbidden"]:
    need(forbidden.lower() not in (data["purpose"] + " " + data["copyrightBoundary"]).lower(), "forbidden claim leaked into QMS purpose text")

runtime = RUNTIME_JS.read_text(encoding="utf-8")
for marker in [
    "ISO 9001 support — evidence, not certification",
    "does not establish organisational conformity, certification, accreditation or auditor approval",
    "Clause-to-feature map",
    "Evidence templates",
    "NCR / CAPA flow",
    "Edition 6 is a watch item",
    "MM_ISO9001_QMS",
]:
    need(marker in runtime, f"QMS runtime marker missing: {marker}")
qms_runtime = runtime[runtime.index('/* MouldMaster ISO 9001 QMS support — 2026.09.15.2 */'):]
need("localStorage" not in qms_runtime and "indexedDB" not in qms_runtime, "QMS support must remain read-only and must not create a shadow controlled-record store")
need("fetch(DATA_URL" in qms_runtime, "QMS runtime must load governed data contract")

need(BOOK_SOURCE.read_bytes() == BOOK_RUNTIME.read_bytes(), "Book enrichment source/runtime pair drifted")
book = load(BOOK_SOURCE)
doc = next((x for x in book.get("chapterPatches", []) if x.get("chapterId") == "documentation"), None)
need(doc is not None, "documentation Book patch missing")
need({"ISO-9001-2015","ISO-9001-2015-AMD1-2024","ISO-9000-2026"} <= set(doc.get("sourceIds", [])), "documentation chapter lacks ISO 9001/9000 anchors")
need(any(x.get("title") == "Quality records need evidence, not just completion" for x in doc.get("sections", [])), "QMS Book section missing")

index = (ROOT / "index.html").read_text(encoding="utf-8")
sw = (ROOT / "service-worker.js").read_text(encoding="utf-8")
version = load(ROOT / "version.json")
need(version.get("web_release") == "2026.09.15.2", "QMS learner-runtime integration requires web release 2026.09.15.2")
need("['./quality-management.js','<script src=\"./quality-management.js\">']" not in index, "QMS support must not add a new bootstrap script")
need("['./source-library.js','<script src=\"./source-library.js\">']" in index, "governed source-library runtime missing from shell")
for asset in [
    "'./source-library.js'",
    "'./src/domains/quality/data/quality-management-iso9001-v1.json'",
]:
    need(asset in sw, f"QMS offline asset missing: {asset}")

register = (ROOT / "sources" / "AUTHORITATIVE_SOURCE_REGISTER.md").read_text(encoding="utf-8")
for marker in [
    "ISO 9001:2015",
    "ISO 9001:2015/Amd 1:2024",
    "ISO 9000:2026",
    "ISO 9001 Edition 6",
    "under publication",
    "does not make MouldMaster ISO 9001 certified",
]:
    need(marker in register, f"authoritative source register missing QMS boundary: {marker}")

source_lib = (ROOT / "source-library.js").read_text(encoding="utf-8")
for marker in ["ISO 9001:2015","ISO 9000:2026","quality:[","qms|audit|nonconform|capa|competence|corrective|calibrat"]:
    need(marker in source_lib, f"source library missing QMS integration: {marker}")

print("PASS: ISO 9001 QMS support is current-status-aware, copyright-safe, claim-bounded, read-only, Book-linked and release-governed.")

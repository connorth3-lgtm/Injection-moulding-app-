#!/usr/bin/env python3
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "sources" / "BOOK_WORKED_ENGINEERING_CASES_NEXT_RELEASE.md"
LEDGER = ROOT / "data" / "book-worked-engineering-cases-v1.json"
RUNTIME_LEDGER = ROOT / "src" / "domains" / "learning" / "book-data" / LEDGER.name
AUTH = ROOT / "data" / "book-publication-authorization-v1.json"
SME = ROOT / "data" / "book-sme-review-v1.json"
VERSION = ROOT / "version.json"
BOOK_RUNTIME = ROOT / "src" / "domains" / "learning" / "book-runtime.js"
SW = ROOT / "service-worker.js"

EXPECTED = {
    "worked-clamp-force-v1": "clamp",
    "worked-pressure-loss-v1": "pressure-loss",
    "worked-gate-seal-v1": "gate-seal",
    "worked-pressure-trace-v1": "cavity-pressure",
    "worked-doe-interaction-v1": "doe",
    "worked-multi-cavity-v1": "multi-cavity",
    "worked-capability-v1": "capability",
    "worked-conditioning-v1": "dimensional-stability",
    "worked-heat-load-v1": "cooling",
    "worked-diagnostic-short-shot-v1": "diagnostic-method",
}


def git_blob_sha(path: Path) -> str:
    data = path.read_bytes()
    return hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()


def need(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def main() -> None:
    text = SOURCE.read_text(encoding="utf-8")
    lower = text.lower()
    version = json.loads(VERSION.read_text(encoding="utf-8"))
    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    auth = json.loads(AUTH.read_text(encoding="utf-8"))
    sme = json.loads(SME.read_text(encoding="utf-8"))
    runtime = BOOK_RUNTIME.read_text(encoding="utf-8")
    sw = SW.read_text(encoding="utf-8")

    need(version.get("web_release") == "2026.09.24.13", "worked-case learner integration requires deliberate web release 2026.09.24.13")
    need(ledger.get("release") == "2026.09.24.13", "worked-case ledger release mismatch")
    need(LEDGER.read_bytes() == RUNTIME_LEDGER.read_bytes(), "authoritative/runtime worked-case ledgers differ")

    cases = ledger.get("cases") or []
    need(len(cases) == 10, f"expected ten governed worked cases, found {len(cases)}")
    by_id = {item.get("id"): item for item in cases}
    need(set(by_id) == set(EXPECTED), "worked-case identity set drifted")
    need(len(by_id) == len(cases), "duplicate worked-case IDs")
    claim_ids = set()
    for case_id, chapter_id in EXPECTED.items():
        item = by_id[case_id]
        need(item.get("chapterId") == chapter_id, f"{case_id}: chapter binding drifted")
        need(item.get("synthetic") is True, f"{case_id}: numeric teaching data must remain explicitly synthetic")
        need(item.get("setup") and item.get("interpretation"), f"{case_id}: incomplete worked-case narrative")
        need(item.get("calculationSteps"), f"{case_id}: calculation/reasoning steps missing")
        need(item.get("boundaries"), f"{case_id}: applicability/safety boundaries missing")
        need(item.get("sourceIds"), f"{case_id}: evidence anchors missing")
        claims = item.get("claims") or []
        need(len(claims) == 1, f"{case_id}: expected one case-level governed claim")
        claim = claims[0]
        need(claim.get("id") and claim["id"] not in claim_ids, f"{case_id}: duplicate/missing claim ID")
        claim_ids.add(claim["id"])
        need(claim.get("conclusion") == "supported-with-explicit-synthetic-scope", f"{case_id}: claim scope weakened")
        need(claim.get("sourceIds"), f"{case_id}: case claim lacks source IDs")

    source_ids = {source.get("id") for source in ledger.get("sourceSeeds") or []}
    need(len(source_ids) == len(ledger.get("sourceSeeds") or []), "duplicate worked-case evidence source IDs")
    need(all(source.get("title") and source.get("url") and source.get("scope") for source in ledger.get("sourceSeeds") or []), "incomplete worked-case evidence source")

    authority = ledger.get("authorityBoundary") or {}
    need(authority.get("productionUse") == "advisory-only", "worked cases must remain advisory-only")
    for key in ("validatedRecipeAuthority", "automaticMachineControl", "universalSetpoints"):
        need(authority.get(key) is False, f"worked-case authority unexpectedly enabled: {key}")

    expected_ids = list(EXPECTED)
    need(sme.get("release") == "2026.09.24.13", "Book SME contract was not advanced with the worked cases")
    need(sme.get("status") == "hold" and sme.get("reviews") == [], "worked-case integration must not manufacture human SME approval")
    need(sme.get("workedCaseIds") == expected_ids, "Book SME contract does not enumerate all worked-case IDs")

    worked_auth = auth.get("workedCasesAuthorization") or {}
    need(worked_auth.get("status") == "authorized", "worked-case publication authorization missing")
    need(worked_auth.get("release") == "2026.09.24.13", "worked-case authorization release mismatch")
    need(worked_auth.get("caseCount") == 10 and worked_auth.get("claimCount") == 10, "worked-case authorization counts drifted")
    need(worked_auth.get("independentSmeStatus") == "hold", "worked-case authorization falsely promotes SME status")
    hashes = (auth.get("runtimeIntegrity") or {}).get("gitBlobSha1ByFile") or {}
    need(hashes.get(LEDGER.name) == git_blob_sha(RUNTIME_LEDGER), "worked-case ledger is not exact-byte authorized")
    need(hashes.get(SME.name) == git_blob_sha(ROOT / "src" / "domains" / "learning" / "book-data" / SME.name), "worked-case SME scope is not exact-byte authorized")

    for marker in ("WORKED_CASES_PATH", "validateWorkedCases", "workedCaseHtml", "getWorkedCases"):
        need(marker in runtime, f"Book runtime worked-case integration marker missing: {marker}")
    need("./src/domains/learning/book-data/book-worked-engineering-cases-v1.json" in sw, "worked-case ledger missing from atomic offline cache")

    need("integrated into governed" in lower and "2026.09.24.13" in lower and "learner runtime" in lower, "source pack integration status is stale")
    headings = re.findall(r"^## (\d+)\. ", text, flags=re.M)
    need(headings == [str(i) for i in range(1, 11)], f"expected ten ordered source cases, found {headings}")
    need(text.count("SYNTHETIC") >= 10, "worked values must remain visibly synthetic")
    for boundary in (
        "not universal production settings",
        "does not establish a generic hold time",
        "does not by itself prove",
        "not a cooling-time formula",
        "not automatically the required machine clamp rating",
    ):
        need(boundary in lower, f"worked-case fail-closed boundary missing: {boundary}")

    unsafe_patterns = [
        r"(?<!not )universal production setting(?:s)?(?:\s+(?:is|are|applies?|for))",
        r"guaranteed root cause(?:\s+(?:is|has|was|identified|confirmed))",
        r"automatic machine-control authority is granted",
    ]
    for pattern in unsafe_patterns:
        need(not re.search(pattern, lower), f"unsafe worked-case claim detected: {pattern}")

    print("MouldMaster governed worked-case integration QA passed: 10 learner-facing synthetic cases, 10 case claims, exact-byte authorization, explicit SME HOLD and no production-control authority.")


if __name__ == "__main__":
    main()

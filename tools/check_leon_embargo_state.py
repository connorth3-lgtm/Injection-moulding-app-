#!/usr/bin/env python3
"""Check whether the two Universidad de León Zenodo records remain embargoed.

Exit codes:
  0 expected embargo still active before the planned release date
  2 release detected; activation review required
  3 planned release date reached/passed but source still reports embargoed
  4 source state or licence could not be safely reconciled
  1 network/transport failure
"""

from __future__ import annotations

import datetime as dt
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/leon-embargo-activation-contract-2026-08-30.json"
USER_AGENT = "MouldMaster-Leon-Embargo-Watch/1.0"
EXPECTED_LICENSE_IDS = {"cc-by-4.0", "cc-by-4.0-international"}


def load_contract() -> dict:
    return json.loads(CONTRACT.read_text(encoding="utf-8"))


def fetch_json(url: str, attempts: int = 3, timeout: int = 30) -> dict:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            )
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Unable to retrieve {url}: {last_error}")


def extract_license_ids(payload: dict) -> set[str]:
    ids: set[str] = set()
    metadata = payload.get("metadata") or {}

    legacy = metadata.get("license")
    if isinstance(legacy, dict) and legacy.get("id"):
        ids.add(str(legacy["id"]).lower())
    elif isinstance(legacy, str):
        ids.add(legacy.lower())

    for right in metadata.get("rights") or []:
        if isinstance(right, dict):
            value = right.get("id") or right.get("title")
            if value:
                ids.add(str(value).lower())

    return ids


def derive_state(payload: dict) -> tuple[str, str | None]:
    """Return (state, embargo_until) from current or legacy Zenodo JSON."""
    access = payload.get("access") or {}
    embargo = access.get("embargo") or {}
    metadata = payload.get("metadata") or {}

    embargo_until = embargo.get("until") or metadata.get("embargo_date")
    active = embargo.get("active")
    files_access = str(access.get("files") or access.get("status") or "").lower()
    record_access = str(access.get("record") or "").lower()
    legacy_access = str(metadata.get("access_right") or "").lower()

    if active is True or legacy_access == "embargoed" or files_access == "embargoed":
        return "embargoed", embargo_until

    if files_access in {"public", "open"} or legacy_access == "open":
        return "open", embargo_until

    # In InvenioRDM, an embargo normally presents a public metadata record with
    # restricted files plus an active embargo object. Restricted files without
    # an explicit active embargo are not treated as a public release.
    if files_access == "restricted":
        return "embargoed" if embargo_until else "restricted", embargo_until

    if record_access in {"public", "open"} and not files_access:
        return "unknown", embargo_until

    return "unknown", embargo_until


def classify_record(record: dict, payload: dict, today: dt.date) -> dict:
    state, observed_until = derive_state(payload)
    expected_until = dt.date.fromisoformat(record["embargoUntil"])
    licences = extract_license_ids(payload)
    licence_ok = bool(licences & EXPECTED_LICENSE_IDS)

    if state == "open":
        result = "release-detected" if licence_ok else "release-license-review"
    elif state == "embargoed" and today < expected_until:
        result = "expected-embargo-active"
    elif state == "embargoed":
        result = "embargo-past-planned-date"
    else:
        result = "unknown-source-state"

    return {
        "datasetId": record["datasetId"],
        "zenodoRecordId": record["zenodoRecordId"],
        "state": state,
        "observedEmbargoUntil": observed_until,
        "expectedEmbargoUntil": record["embargoUntil"],
        "observedLicenseIds": sorted(licences),
        "expectedLicense": record["license"],
        "licenseMatchesExpected": licence_ok,
        "result": result,
    }


def main() -> int:
    contract = load_contract()
    today = dt.datetime.now(dt.timezone.utc).date()
    outcomes = []

    try:
        for record in contract["records"]:
            payload = fetch_json(record["apiRecordUrl"])
            outcomes.append(classify_record(record, payload, today))
    except RuntimeError as exc:
        print(json.dumps({"status": "transport-error", "error": str(exc)}, indent=2))
        return 1

    print(json.dumps({"checkedOnUtc": str(today), "records": outcomes}, indent=2))

    results = {item["result"] for item in outcomes}
    if "release-detected" in results:
        print("León release detected: complete the activation checklist before ingestion.")
        return 2
    if "release-license-review" in results or "unknown-source-state" in results:
        print("León source state/licence requires manual review; remaining fail closed.")
        return 4
    if "embargo-past-planned-date" in results:
        print("León planned release date has passed but Zenodo still reports embargoed access.")
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

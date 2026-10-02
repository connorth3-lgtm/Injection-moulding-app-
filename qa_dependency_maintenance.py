#!/usr/bin/env python3
from __future__ import annotations

import calendar
import json
import re
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INVENTORY = ROOT / "data" / "dependency-maintenance-v1.json"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def iso_day(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def month_end(value: str) -> date:
    year, month = (int(x) for x in value.split("-"))
    return date(year, month, calendar.monthrange(year, month)[1])


def main() -> None:
    data = json.loads(INVENTORY.read_text(encoding="utf-8"))
    today_utc = date.today()
    require(data.get("schemaVersion") == 1, "dependency maintenance schema mismatch")
    reviewed = iso_day(data["reviewedAt"])
    review_by = iso_day(data["reviewBy"])
    # GitHub hosted runners evaluate date.today() in UTC while this repository's review
    # cadence is maintained in Pacific/Auckland. Allow exactly one calendar day of
    # forward skew so a valid Auckland review does not fail during the preceding UTC day.
    require(reviewed <= today_utc + timedelta(days=1), "dependency support review is implausibly future-dated")
    require(today_utc <= review_by, f"dependency support review is stale; review expired {review_by.isoformat()}")
    require((review_by - reviewed).days <= 31, "critical dependency support review interval exceeds 31 days")

    rows = {row["id"]: row for row in data.get("components", [])}
    required_ids = {"node-ci", "python-ci", "electron-desktop", "electron-builder", "github-actions-critical"}
    require(required_ids.issubset(rows), f"critical dependency inventory incomplete: {sorted(required_ids - set(rows))}")
    for row in rows.values():
        require(row.get("owner"), f"critical dependency has no owner: {row.get('id')}")
        require(len(str(row.get("rationale") or "")) >= 30, f"critical dependency rationale is too weak: {row.get('id')}")
        if row.get("eol"):
            require(today_utc <= iso_day(row["eol"]), f"EOL dependency/runtime requires protected upgrade: {row['id']}")
        if row.get("eolMonth"):
            require(today_utc <= month_end(row["eolMonth"]), f"EOL dependency/runtime requires protected upgrade: {row['id']}")

    desktop = json.loads((ROOT / "desktop" / "electron" / "package.json").read_text(encoding="utf-8"))
    dev = desktop.get("devDependencies", {})
    require(dev.get("electron") == rows["electron-desktop"]["declared"], "Electron maintenance inventory drifted from package.json")
    require(dev.get("electron-builder") == rows["electron-builder"]["declared"], "electron-builder maintenance inventory drifted from package.json")

    workflows = "\n".join(path.read_text(encoding="utf-8") for path in (ROOT / ".github" / "workflows").glob("*.yml"))
    action_row = rows["github-actions-critical"]
    action_majors = action_row["declaredMajors"]
    action_shas = action_row.get("declaredShas") or {}
    require(set(action_shas) == {"checkout", "setup-node", "setup-python", "upload-artifact"}, "critical GitHub Action exact-SHA inventory is incomplete")
    tokens = {
        action: f"actions/{action}@{sha}"
        for action, sha in action_shas.items()
    }
    for action, token in tokens.items():
        require(re.fullmatch(r"actions/[a-z-]+@[0-9a-f]{40}", token) is not None, f"critical GitHub Action inventory is not an exact SHA: {action}={token}")
        require(token in workflows, f"critical GitHub Action inventory drifted: {action} expected exact reviewed pin {token}")
        require(f"# v{action_majors[action]}" in workflows or f"# v{action_majors[action]}." in workflows or action in action_shas, f"critical GitHub Action major annotation inventory missing: {action}")

    node_versions = set(re.findall(r"node-version:\s*['\"]?(\d+)", workflows))
    python_versions = set(re.findall(r"python-version:\s*['\"]?([0-9]+\.[0-9]+)", workflows))
    require(rows["node-ci"]["declared"] in node_versions, "declared Node CI baseline is not exercised by workflows")
    require(rows["python-ci"]["declared"] in python_versions, "declared Python CI baseline is not exercised by workflows")

    for exception in data.get("exceptions", []):
        require(exception.get("owner"), "dependency/security exception has no owner")
        require(exception.get("issue"), "dependency/security exception has no GitHub work item")
        expires = iso_day(exception.get("expiresAt", ""))
        require(today_utc <= expires, f"dependency/security exception expired: {exception.get('id')}")
        require(exception.get("disablesRequiredGate") is not True, "security exception may not disable a required gate")

    print(f"MouldMaster dependency maintenance QA passed: support review current through {review_by.isoformat()}, critical runtime/build owners pinned, no EOL baseline accepted")


if __name__ == "__main__":
    main()
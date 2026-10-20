from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
LATEST = ROOT / "latest.json"
LAUNCHER = ROOT / "MouldMasterAcademy.exe"

RECOVERY_APP_COMMIT = "3e7144b68c5dfe79232cf2ba0180060f1395ffcc"
RECOVERY_LAUNCHER_COMMIT = "bf23f8aca724e75080ae74ebfb0bc87c3801d989"
RECOVERY_APP_SHA256 = "96ed07e1487633538359eb12073fe50bfe595d9d5aaa807173e0a764b9123754"
RECOVERY_LAUNCHER_SHA256 = "db7abc4da613a6d1409fdb129cb788b8ac396e5ac2d161963521c844d0ee771c"
RAW_RE = re.compile(
    r"^https://raw\.githubusercontent\.com/connorth3-lgtm/Injection-moulding-app-/([0-9a-f]{40})/([^?#]+)$"
)


def digest(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def raw_target(url: str, label: str) -> tuple[str, str]:
    match = RAW_RE.fullmatch(str(url or ""))
    if not match:
        raise AssertionError(f"{label} must be a commit-pinned raw.githubusercontent.com URL")
    commit, path = match.groups()
    if commit in {"main", "master"}:
        raise AssertionError(f"{label} must not use a mutable branch ref")
    return commit, path


def main() -> None:
    latest = json.loads(LATEST.read_text(encoding="utf-8"))

    app_commit, app_path = raw_target(latest.get("app_url", ""), "latest.app_url")
    launcher_commit, launcher_path = raw_target(latest.get("launcher_url", ""), "latest.launcher_url")

    assert app_commit == RECOVERY_APP_COMMIT, "frozen recovery app commit changed without a governed recovery release"
    assert app_path == "MouldMaster_Core_App.html", "frozen recovery app path changed"
    assert latest.get("sha256") == RECOVERY_APP_SHA256, "frozen recovery app SHA-256 changed"

    assert launcher_commit == RECOVERY_LAUNCHER_COMMIT, "frozen recovery launcher commit changed without a governed recovery release"
    assert launcher_path == "MouldMasterAcademy.exe", "frozen recovery launcher path changed"
    assert latest.get("launcher_sha256") == RECOVERY_LAUNCHER_SHA256, "frozen recovery launcher SHA-256 changed"
    assert digest(LAUNCHER) == RECOVERY_LAUNCHER_SHA256, "repository recovery launcher bytes do not match the frozen SHA-256"

    notes = str(latest.get("notes", "")).lower()
    assert "frozen legacy windows recovery feed" in notes
    assert "immutable" in notes and "sha-256" in notes, "recovery note must explain immutable URL and hash locks"

    print("MouldMaster frozen recovery immutability QA passed")


if __name__ == "__main__":
    main()

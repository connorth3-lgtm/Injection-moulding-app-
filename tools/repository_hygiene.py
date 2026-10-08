#!/usr/bin/env python3
"""Repository-wide tracked-file hygiene audit (offline, read-only).

Do not delete provenance/history or collapse governed source/runtime mirrors:
this gate detects unsafe additions and mirror drift before a release.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_BOOK = "src/domains/learning/book-data/"
SOURCE_QUALITY = "src/domains/quality/data/"
ALLOWED_BINARY_ARTIFACTS = frozenset({
    "MouldMasterAcademy.exe",  # audited frozen Windows recovery, hash-governed in qa_release.py
    "audit/source-freshness/2026-08-26-run-32916120936/source-freshness-reports.zip",
})
SOURCE_PFX = ("src/", "tools/", "tests/", ".github/", "qa/", "data/")
BAD_BASENAMES = {"id_rsa", "id_ed25519", ".ds_store", "thumbs.db"}
DANGEROUS_SUFFIXES = (".pem", ".p12", ".pfx")
KEY_START = "-----BEGIN " + "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"
PRIVATE_KEY_RE = re.compile(KEY_START)
ACTION_RE = re.compile(r"^\s*-?\s*uses:\s*([^#\s]+)")
HEX_SHA = re.compile(r"^[a-f0-9]{40}$")
TOP_DIRS = frozenset({
    ".github", "assets", "audit", "certification", "credentials",
    "data", "desktop", "docs", "machine-research", "qa", "research",
    "sources", "src", "tests", "tools",
})


def tracked(root: Path) -> list[tuple[str, str]]:
    """Read the authoritative Git index; do not chase working-tree symlinks."""
    out = subprocess.check_output(
        ["git", "-C", str(root), "ls-files", "--stage", "-z"]
    )
    entries = []
    for item in out.split(b"\0"):
        if not item:
            continue
        meta, sep, raw = item.partition(b"\t")
        if not sep:
            raise AssertionError("unparseable Git index entry")
        mode = meta.split(b" ", 1)[0].decode("ascii")
        name = raw.decode("utf-8")
        entries.append((name, mode))
    return entries


def path_findings(entries: list[tuple[str, str]]) -> list[str]:
    problems: list[str] = []
    seen: dict[str, str] = {}
    for name, mode in entries:
        pieces = name.split("/")
        folded = name.casefold()
        if folded in seen and seen[folded] != name:
            problems.append(f"case-colliding tracked paths: {seen[folded]} vs {name}")
        seen[folded] = name
        if (not name or name.startswith("/") or "\\" in name
            or any(not p or p in {".", ".."} or p.endswith((" ", ".")) for p in pieces)
            or any(ord(c) < 32 or ord(c) == 127 for c in name)):
            problems.append(f"unsafe or non-portable tracked path: {name!r}")
        if mode not in {"100644", "100755"}:
            problems.append(f"unexpected tracked Git mode {mode}: {name}")
        if len(pieces) > 1 and pieces[0] not in TOP_DIRS:
            problems.append(f"unreviewed top-level directory: {pieces[0]}")
        lower = pieces[-1].casefold()
        if (lower in BAD_BASENAMES or lower == ".env"
            or lower.startswith(".env.") or lower.endswith(DANGEROUS_SUFFIXES)
            or re.match(r"^id_(?:rsa|ed25519)(?:\.|$)", lower)):
            problems.append(f"credential or OS debris filename must not be committed: {name}")
        if name.lower().endswith((".exe", ".dll", ".msi", ".zip", ".jar", ".dmg")) and name not in ALLOWED_BINARY_ARTIFACTS:
            problems.append(f"unexpected shipped binary/archive needs explicit owner review: {name}")
    return problems


def mirror_pairs(names: set[str]) -> list[tuple[str, str]]:
    """Required copies are intentional publish assets, not redundant scratch."""
    pairs: list[tuple[str, str]] = []
    for path in sorted(names):
        if path.startswith(SOURCE_BOOK) and path.endswith(".json"):
            pairs.append((f"data/{Path(path).name}", path))
        elif path.startswith(SOURCE_QUALITY) and path.endswith(".json"):
            pairs.append((f"data/{Path(path).name}", path))
    return pairs


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def content_findings(root: Path, entries: list[tuple[str, str]]) -> tuple[list[str], dict]:
    problems: list[str] = []
    names = {name for name, _ in entries}
    counts = Counter()
    for name, mode in entries:
        path = root / name
        if not path.is_file() or path.is_symlink():
            problems.append(f"tracked file absent or symlink: {name}")
            continue
        size = path.stat().st_size
        counts["bytes"] += size
        counts["files"] += 1
        if size > 8 * 1024 * 1024:
            problems.append(f"file exceeds 8 MiB and needs a governed data/artifact budget: {name}")
        if name.endswith(".json"):
            counts["json"] += 1
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except (ValueError, UnicodeError) as exc:
                problems.append(f"invalid tracked JSON {name}: {exc}")
        if name.startswith(".github/workflows/") and name.endswith((".yml", ".yaml")):
            counts["workflows"] += 1
            try:
                lines = path.read_text(encoding="utf-8").splitlines()
            except UnicodeError:
                problems.append(f"invalid workflow encoding: {name}")
                continue
            for lineno, line in enumerate(lines, 1):
                match = ACTION_RE.match(line)
                if not match:
                    continue
                ref = match.group(1)
                if ref.startswith("./"):
                    continue
                if ref.startswith("docker://"):
                    if "@sha256:" not in ref:
                        problems.append(f"unlocked Docker action image {name}:{lineno}: {ref}")
                    continue
                if "@" not in ref or not HEX_SHA.fullmatch(ref.rsplit("@", 1)[1]):
                    problems.append(f"unlocked GitHub Action {name}:{lineno}: {ref}")
        if (
            (name.startswith(SOURCE_PFX) or name in {"index.html", "support.html", "privacy.html"})
            and size <= 8 * 1024 * 1024
            and not name.endswith((".zip", ".png", ".exe"))
        ):
            # Guard actual committed private-key blocks; test/QA rules use a
            # concatenated marker so the scanner cannot flag its own source.
            try:
                if PRIVATE_KEY_RE.search(path.read_text(encoding="utf-8", errors="replace")):
                    problems.append(f"embedded private-key block in tracked file: {name}")
            except OSError as exc:
                problems.append(f"cannot inspect tracked text {name}: {exc}")
    mirrors = mirror_pairs(names)
    counts["governed_mirrors"] = len(mirrors)
    for canonical, deployed in mirrors:
        if canonical not in names:
            problems.append(f"deployed mirror has no canonical source: {deployed} -> {canonical}")
            continue
        if sha256(root / canonical) != sha256(root / deployed):
            problems.append(f"canonical/published data drift: {canonical} != {deployed}")
    return problems, dict(counts)


def audit(root: Path) -> dict:
    entries = tracked(root)
    problems = path_findings(entries)
    content_problems, counts = content_findings(root, entries)
    problems.extend(content_problems)
    counts["top_level_areas"] = len({
        name.split("/", 1)[0] if "/" in name else "[root]" for name, _ in entries
    })
    return {"status": "PASS" if not problems else "FAIL", "counts": counts,
            "findings": sorted(problems)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", help="optional JSON report path (relative to repo)")
    args = parser.parse_args()
    report = audit(ROOT)
    if args.report:
        path = ROOT / args.report
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("Repository hygiene: " + report["status"] + " " + json.dumps(report["counts"], sort_keys=True))
    for issue in report["findings"][:40]:
        print(" - " + issue)
    if len(report["findings"]) > 40:
        print(f" - ... and {len(report['findings']) - 40} more findings")
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())

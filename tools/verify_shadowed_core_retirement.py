"""Fail-closed, read-only retirement proof for shadowed frozen-core functions.

The generated learner runtime is governed; this script NEVER writes it. It
constructs an in-memory/temporary candidate that removes earlier shadowed
function declarations (classic-script hoisting makes later declarations active),
then performs a syntax check. A new governed web/cache release, exact runtime
fingerprint and browser/device reviews are required to ship any removal.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
GENERATED_CORE = ROOT / "src/core-runtime/core-inline-004.js"
KNOWN_NAMES = (
    "updateGlobalProgress", "renderDashboard", "renderPath", "renderLesson",
    "renderExams", "startExam", "gradeExam", "renderCertificates",
    "certificateCard", "renderProfile",
)
DECL = re.compile(r"(?m)^function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(")


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def declaration_inventory(source: str) -> dict[str, list[int]]:
    found: dict[str, list[int]] = {}
    for m in DECL.finditer(source):
        found.setdefault(m.group(1), []).append(m.start())
    return found


def preview_retirement(source: str, *, names: tuple[str, ...] = KNOWN_NAMES) -> dict:
    """Build a throwaway candidate without touching the governed source file."""
    need(len(names) == len(set(names)), "duplicate retirement selection")
    need(not (set(names) - set(KNOWN_NAMES)), "unknown core function retirement selection")
    found = declaration_inventory(source)
    unexpected = {name for name, positions in found.items()
                  if len(positions) > 1 and name not in KNOWN_NAMES}
    need(not unexpected, f"unreviewed duplicate declarations: {sorted(unexpected)}")
    need(all(len(found.get(name, [])) in (1, 2) for name in KNOWN_NAMES),
         "known top-level declaration missing or multiply duplicated")

    selected = [name for name in names if len(found[name]) == 2]
    anchors = list(DECL.finditer(source))
    positions = sorted(m.start() for m in anchors)
    deletions: list[tuple[int, int, str]] = []
    for name in selected:
        start = found[name][0]
        following = next((position for position in positions if position > start), None)
        need(following is not None, f"missing bounded function after {name}")
        dead = source[start:following]
        # The observed shadowed declarations occupy their entire top-level
        # block before the next top-level function. If surrounding statement
        # layout changes, fail closed instead of deleting non-function code.
        need(dead.startswith(f"function {name}("), f"retirement anchor moved: {name}")
        need(dead.rstrip().endswith("}"), f"unsafe trailing statement after {name}")
        need(dead.count("\nfunction ") == 0,
             f"nested/multiple top-level declaration boundary near {name}")
        need(re.search(r"(?m)^(?:const|let|var|class|if|for|while|try|throw|return)\b", dead) is None,
             f"unexpected column-zero statement in retired span: {name}")
        need(len(dead) > 30, f"suspiciously small declaration: {name}")
        deletions.append((start, following, name))

    # Work from the end so original positions remain valid.
    candidate = source
    for start, end, _ in sorted(deletions, reverse=True):
        candidate = candidate[:start] + candidate[end:]
    after = declaration_inventory(candidate)
    need(all(len(after.get(name, [])) == 1 for name in selected),
         "shadowed function not reduced to exactly one active declaration")
    need(all(len(after.get(name, [])) == len(found.get(name, []))
             for name in found if name not in selected),
         "a non-selected function was altered")
    need(candidate == source if not deletions else candidate != source,
         "retirement dry-run change count mismatch")
    need(all(source[pos:pos + len(f"function {name}(")] == f"function {name}("
             for name in selected for pos in found[name][1:]),
         "active later declaration reference drifted")

    node = os.environ.get("MM_NODE", "node")
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8",
                                         suffix=".js", delete=False) as temp:
            temp.write(candidate)
            temp_path = Path(temp.name)
        check = subprocess.run([node, "--check", str(temp_path)], text=True,
                               capture_output=True, check=False, timeout=30)
        need(check.returncode == 0,
             "retirement candidate JavaScript syntax failed: " + check.stderr[-1600:])
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)

    return {
        "source_sha256": hashlib.sha256(source.encode("utf-8")).hexdigest(),
        "candidate_sha256": hashlib.sha256(candidate.encode("utf-8")).hexdigest(),
        "candidate_not_published": True,
        "removed_earlier_declarations": selected,
        "still_shadowed_names": sorted(name for name, ps in after.items() if len(ps) > 1),
        "javascript_syntax": "pass",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", action="append", choices=KNOWN_NAMES,
                        help="Limit in-memory proof to a named earlier declaration")
    opts = parser.parse_args()
    result = preview_retirement(
        GENERATED_CORE.read_text(encoding="utf-8"),
        names=tuple(opts.name) if opts.name else KNOWN_NAMES,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

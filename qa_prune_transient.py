#!/usr/bin/env python3
"""Synthetic mock-gh regression for the read-only retry / fail-closed pruner.

Never calls GitHub; both workflow job scripts are executed with a fake gh CLI.
"""
from __future__ import annotations

import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import textwrap

ROOT = Path(__file__).resolve().parent
WORKFLOW = ROOT / ".github/workflows/prune-merged-branches.yml"
HEAD = "a" * 40
DIVERGENT = "b" * 40

MOCK_GH = r"""#!/usr/bin/env python3
import json
import os
from pathlib import Path
import sys

args = sys.argv[1:]
assert args[0] == "api", "mock must only receive gh api calls"
args = args[1:]
state = Path(os.environ["MOCK_GH_STATE"])
counts = json.loads(state.read_text()) if state.exists() else {}
endpoint = next((a for a in args if a.startswith("repos/")), "")
if "/branches?" in endpoint:
    key = "branches"
elif "/compare/" in endpoint:
    key = "compare"
elif endpoint.endswith("/pulls"):
    key = "pulls"
elif "/git/ref/heads/" in endpoint:
    key = "ref"
elif "/git/refs/heads/" in endpoint:
    key = "delete"
else:
    raise SystemExit("unknown API endpoint: " + endpoint)
counts[key] = counts.get(key, 0) + 1
state.write_text(json.dumps(counts))
if key == "delete":
    with open(os.environ["MOCK_DELETE_LOG"], "a", encoding="utf-8") as out:
        out.write(endpoint + "\n")
    if os.environ.get("MOCK_DELETE_FAILURE") == "1":
        print("gh: Server Error (HTTP 502)", file=sys.stderr)
        sys.exit(1)
    sys.exit(0)

if key == os.environ.get("MOCK_FAIL_ENDPOINT"):
    mode = os.environ.get("MOCK_FAIL_MODE", "once")
    if mode == "always" or (mode == "once" and counts[key] == 1):
        if key == "branches" and os.environ.get("MOCK_PARTIAL") == "1":
            print("main\t" + "c" * 40)
            print("feat/pr-merged\t" + "a" * 40)
        print("gh: Server Error (HTTP 502)", file=sys.stderr)
        sys.exit(1)
if key == "branches":
    print("main\t" + "c" * 40)
    print("preview\t" + "c" * 40)
    print("visual-baseline/approved\t" + "c" * 40)
    print("feat/pr-merged\t" + "a" * 40)
    print("feat/pr-unmerged\t" + "b" * 40)
elif key == "compare":
    print("4" if endpoint.endswith("a" * 40) else "8")
elif key == "pulls":
    print("1" if any("feat/pr-merged" in a for a in args) else "0")
elif key == "ref":
    print("b" * 40 if os.environ.get("MOCK_LIVE_DRIFT") == "1" else "a" * 40)
"""

def need(value: bool, message: str) -> None:
    if not value:
        raise AssertionError("branch prune transient QA: " + message)

def job_script(workflow: str, label: str) -> str:
    marker = "      - name: " + label + "\n"
    need(workflow.count(marker) == 1, "missing job step: " + label)
    src = workflow.split(marker, 1)[1]
    need("        run: |\n" in src, "missing shell script")
    src = src.split("        run: |\n", 1)[1]
    lines = []
    for line in src.splitlines():
        if line and not line.startswith("          "):
            break
        lines.append(line)
    script = textwrap.dedent("\n".join(lines))
    need(script.startswith("set -euo pipefail"), "must use strict shell failure mode")
    return script

def exercise(script: str, *, fail: str = "", mode: str = "once",
             partial: bool = False, drift: bool = False,
             delete_failure: bool = False, expect_success: bool = True,
             expected_deletes: int = 0, expected_reads: int | None = None) -> None:
    with tempfile.TemporaryDirectory(prefix="prune-qa-") as tmp:
        work = Path(tmp)
        bin_dir = work / "bin"
        bin_dir.mkdir()
        mock = bin_dir / "gh"
        mock.write_text(MOCK_GH, encoding="utf-8")
        mock.chmod(0o755)
        # Avoid real sleep while testing bounded attempts.
        sleepy = bin_dir / "sleep"
        sleepy.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
        sleepy.chmod(0o755)
        env = os.environ.copy()
        env.update({
            "PATH": str(bin_dir) + os.pathsep + env["PATH"],
            "GH_REPO": "qa-owner/synthetic-repository",
            "MOCK_GH_STATE": str(work / "calls.json"),
            "MOCK_DELETE_LOG": str(work / "deletes.log"),
            "MOCK_FAIL_ENDPOINT": fail,
            "MOCK_FAIL_MODE": mode,
            "MOCK_PARTIAL": "1" if partial else "0",
            "MOCK_LIVE_DRIFT": "1" if drift else "0",
            "MOCK_DELETE_FAILURE": "1" if delete_failure else "0",
            "GITHUB_STEP_SUMMARY": str(work / "step-summary.txt"),
        })
        run = subprocess.run(
            ["bash", "-c", script], env=env, cwd=ROOT,
            capture_output=True, text=True, timeout=25, check=False,
        )
        counts = json.loads((work / "calls.json").read_text()) if (work / "calls.json").exists() else {}
        deletes = (work / "deletes.log").read_text().splitlines() if (work / "deletes.log").exists() else []
        need((run.returncode == 0) == expect_success,
             f"unexpected exit {run.returncode}, stderr={run.stderr[-500:]}")
        need(len(deletes) == expected_deletes,
             f"unexpected mutation attempts: {deletes}")
        if expected_reads is not None:
            need(counts.get(fail, 0) == expected_reads,
                 f"GET retries not bounded: {counts}")
        if expect_success:
            need("visual-baseline/approved" in run.stdout,
                 "visual baseline preservation absent")
            need("feat/pr-unmerged" in run.stdout,
                 "unmerged branch preservation absent")
        if delete_failure:
            need(counts.get("delete") == 1, "DELETE must never be retried")
        if partial and expect_success:
            need(run.stdout.count("feat/pr-merged") == 1,
                 "partial paginated listing leaked or duplicated")
        if drift:
            need("head moved" in run.stdout, "live-head guard missing")

def main() -> None:
    source = WORKFLOW.read_text(encoding="utf-8")
    manual = job_script(source, "Preview fully merged branches without deletion")
    prune = job_script(source, "Delete fully merged branches")
    for label, script in (("manual", manual), ("prune", prune)):
        need(script.count("gh_read()") == 1, "missing GET-only read helper in " + label)
        need("gh_read --paginate" in script and 'done <"$branch_snapshot"' in script,
             "non-atomic or unsafe paginated branch enumeration")
        need("grep -q $'^main\\t'" in script, "main must be present before any mutation")
        need("sleep" in script and "attempt <= 4" in script, "bounded backoff missing")
        need("gh api --method DELETE" not in script if label == "manual"
             else "gh api --method DELETE" in script,
             "write authority expanded or missing")
        exercise(script, expected_deletes=0 if label == "manual" else 1)
        exercise(script, fail="branches", partial=True,
                 expected_reads=2, expected_deletes=0 if label == "manual" else 1)
        exercise(script, fail="compare", expected_reads=3,
                 expected_deletes=0 if label == "manual" else 1)
        exercise(script, fail="branches", mode="always", expect_success=False,
                 expected_reads=4, expected_deletes=0)
    exercise(prune, drift=True, expected_deletes=0)
    exercise(prune, delete_failure=True, expect_success=False, expected_deletes=1)
    print("Merged-branch prune QA passed: bounded GET retry, atomic inventory, "
          "live-SHA recheck, immutable refs, no DELETE retries and fail-closed errors")

if __name__ == "__main__":
    main()

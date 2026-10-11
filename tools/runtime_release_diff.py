"""Select the correct Git comparison base for learner-runtime release governance.

Pull-request QA checks out the real source SHA, not a synthetic merge commit.
A previous HEAD^ implementation accidentally checked only the most recent source
commit on long-lived branches, letting an unbumped runtime cross preview -> main.
"""
from __future__ import annotations

import re
from collections.abc import Callable


def choose_comparison_base(
    git: Callable[..., str], *, event_name: str, base_ref: str
) -> str:
    if event_name != "pull_request":
        return git("rev-parse", "HEAD^").strip()

    # The only acceptable PR baseline is the fetched target branch ref. Never
    # silently fall back to HEAD^ when the target is missing or malformed.
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]{0,250}", base_ref):
        raise SystemExit("GITHUB_BASE_REF must identify the exact PR target branch")
    if base_ref.startswith("/") or base_ref.endswith("/") or "//" in base_ref:
        raise SystemExit("GITHUB_BASE_REF contains an invalid branch path")
    if any(x in {".", ".."} for x in base_ref.split("/")) or "@{" in base_ref:
        raise SystemExit("GITHUB_BASE_REF contains forbidden branch syntax")
    remote = f"refs/remotes/origin/{base_ref}"
    git("rev-parse", "--verify", remote)
    merge_base = git("merge-base", remote, "HEAD").strip()
    if not re.fullmatch(r"[a-f0-9]{40}", merge_base):
        raise SystemExit("PR merge base was not an exact commit SHA")
    return merge_base

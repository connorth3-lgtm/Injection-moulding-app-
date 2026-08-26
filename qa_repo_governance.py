from pathlib import Path

ROOT = Path(__file__).resolve().parent


def need(condition, message):
    if not condition:
        raise SystemExit(f"Repository governance QA failed: {message}")


def text(path):
    p = ROOT / path
    need(p.exists(), f"missing {path}")
    return p.read_text(encoding="utf-8")


guard = text(".github/workflows/main-pr-provenance-guard.yml")
pruner = text(".github/workflows/prune-merged-branches.yml")
release_qa = text(".github/workflows/qa.yml")

# Main must be continuously checked for merged-PR provenance. This is a
# repository-level compensating control; it does not claim GitHub's native
# branch-protection/ruleset setting is enabled.
for marker in [
    "name: Main PR Provenance Guard",
    "push:",
    "branches: [main]",
    "contents: write",
    "pull-requests: read",
    "HEAD_SHA: ${{ github.sha }}",
    "BEFORE_SHA: ${{ github.event.before }}",
    "commits/$HEAD_SHA/pulls",
    "merged_at != null",
    "base.ref == \\\"main\\\"",
    "merge_commit_sha == \\\"$HEAD_SHA\\\"",
    "git/refs/heads/main",
    "sha=\"$BEFORE_SHA\"",
    "force=true",
]:
    need(marker in guard, f"main provenance guard missing marker: {marker}")

need(
    '"$ACTOR" == "github-actions[bot]" && "$HEAD_MESSAGE" == "Lock open desktop dependencies"' in guard,
    "dependency-lock bot exemption must remain actor- and message-scoped",
)
need("exit 1" in guard, "unauthorised direct pushes must fail after rollback")

# Branch pruning must happen only after the main provenance guard succeeds (or
# by explicit manual dispatch), so an unauthorised transient main push cannot
# drive destructive cleanup. A branch is removable only when it has no commits
# ahead of main or its exact current head is proven as a merged PR head.
for marker in [
    "name: Prune Fully Merged Branches",
    "workflow_dispatch:",
    "workflow_run:",
    'workflows: ["Main PR Provenance Guard"]',
    "types: [completed]",
    "branches: [main]",
    "github.event.workflow_run.conclusion == 'success'",
    "group: prune-fully-merged-branches",
    "cancel-in-progress: false",
    '[[ -z "$branch" || "$branch" == "main" ]] && continue',
    'compare/main...$sha',
    "select(.merged_at != null and .head.sha == \\\"$sha\\\")",
    'git/refs/heads/$branch',
]:
    need(marker in pruner, f"merged-branch pruner missing marker: {marker}")

need("\n  push:\n" not in pruner, "pruner must not race the provenance guard on raw main pushes")
need("superseded" not in pruner.lower(), "one-time superseded-branch deletion allowlist must not remain")
for stale_branch in [
    "codex/source-freshness-coherence-20260826",
    "feature/lesson-evidence-expansion",
    "feature/question-two-source-evidence",
    "qa/reference-question-500-pass-20260824",
]:
    need(stale_branch not in pruner, f"historical cleanup branch still hard-coded: {stale_branch}")

need("run: python qa_repo_governance.py" in release_qa, "release QA must run repository governance regression checks")

print(
    "MouldMaster repository governance QA passed "
    "(PR provenance rollback, guard-gated safe branch pruning, no historical deletion exceptions)"
)

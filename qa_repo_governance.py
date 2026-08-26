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
dep_lock = text(".github/workflows/desktop-dependency-lock.yml")
release_qa = text(".github/workflows/qa.yml")

# Main must be continuously checked for merged-PR provenance and for the same
# three pre-merge workflows intended for native branch protection. This is a
# repository-level compensating control; it does not claim GitHub's native
# branch-protection/ruleset setting is enabled.
for marker in [
    "name: Main PR Provenance Guard",
    "push:",
    "branches: [main]",
    "contents: write",
    "pull-requests: read",
    "actions: read",
    "HEAD_SHA: ${{ github.sha }}",
    "BEFORE_SHA: ${{ github.event.before }}",
    "commits/$HEAD_SHA/pulls",
    "merged_at != null",
    "merge_commit_sha",
    "rollback_main",
    "MouldMaster Release QA",
    "Mobile Browser QA",
    "Open Desktop Build",
    "actions/runs?head_sha=$PR_HEAD_SHA&event=pull_request",
    "all_required_success",
    "git/refs/heads/main",
    "force=true",
]:
    need(marker in guard, f"main provenance guard missing marker: {marker}")

need("github-actions[bot]" not in guard, "main provenance guard must not exempt direct bot pushes")
need("Lock open desktop dependencies" not in guard, "legacy dependency-lock direct-push exemption remains")
need("conclusion\" != \"success" in guard, "required PR workflows must fail closed when not successful")
need("exit 1" in guard, "unauthorised or unverified main pushes must fail after rollback")

# Dependency-lock generation must be a verification gate, never a privileged
# direct writer to main. Both package.json and package-lock.json changes are
# covered on PRs and on main as a post-merge consistency check.
for marker in [
    "name: Desktop Dependency Lock",
    "pull_request:",
    "push:",
    "branches: [main]",
    "desktop/electron/package.json",
    "desktop/electron/package-lock.json",
    "contents: read",
    "npm install --package-lock-only",
    "git diff --exit-code -- package-lock.json",
    "package-lock.json is not synchronized with package.json",
]:
    need(marker in dep_lock, f"dependency-lock verification missing marker: {marker}")

for forbidden in [
    "contents: write",
    "git push",
    "git commit",
    "git add",
    "Lock open desktop dependencies",
]:
    need(forbidden not in dep_lock, f"dependency-lock workflow must not write directly to main: {forbidden}")

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
    "merged_at != null",
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
    "(no direct-main bot exception; merged-PR + required-check rollback; read-only lock verification; guard-gated safe pruning)"
)

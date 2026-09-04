from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent


def need(condition, message):
    if not condition:
        raise SystemExit(f"Repository governance QA failed: {message}")


def text(path):
    p = ROOT / path
    need(p.exists(), f"missing {path}")
    return p.read_text(encoding="utf-8")


guard = text(".github/workflows/main-pr-provenance-guard.yml")
pages = text(".github/workflows/pages.yml")
pruner = text(".github/workflows/prune-merged-branches.yml")
dep_lock = text(".github/workflows/desktop-dependency-lock.yml")
release_qa = text(".github/workflows/qa.yml")
mobile_qa = text(".github/workflows/mobile-browser-qa.yml")
desktop_build = text(".github/workflows/open-desktop-build.yml")
question_quality = text(".github/workflows/question-quality-50-pass.yml")
protection_helper = text(".github/scripts/apply-main-ruleset.sh")
protection_doc = text(".github/MAIN_PROTECTION.md")
ruleset_verifier = text("tools/verify_main_ruleset.py")
production_verifier = text("tools/verify_production_source.py")

# Main provenance is now a read-only post-push audit. Prevention belongs to
# GitHub's native ruleset. The audit may report a policy failure, but it must
# never rewrite history in reaction to slow or eventually-consistent CI state.
for marker in [
    "name: Main PR Provenance Guard",
    "push:",
    "branches: [main]",
    "contents: read",
    "pull-requests: read",
    "actions: read",
    "actions/checkout@v7",
    "GITHUB_TOKEN: ${{ github.token }}",
    "HEAD_SHA: ${{ github.sha }}",
    "commits/$HEAD_SHA/pulls",
    "merged_at != null",
    "merge_commit_sha",
    "fail_audit",
    "GitHub reports main protected=false",
    "this audit will not mutate or roll back main",
    "tools/verify_main_ruleset.py --repository",
    "MouldMaster Release QA",
    "Mobile Browser QA",
    "Open Desktop Build",
    "Question Quality 50-Pass",
    "actions/runs?head_sha=$PR_HEAD_SHA&event=pull_request",
    "all_required_success",
    "native protection is authoritative",
]:
    need(marker in guard, f"main provenance guard missing marker: {marker}")

for forbidden in [
    "contents: write",
    "BEFORE_SHA",
    "rollback_main",
    "git/refs/heads/main",
    "force=true",
    "--method PATCH",
    "github-actions[bot]",
    "Lock open desktop dependencies",
]:
    need(forbidden not in guard, f"post-push provenance audit must never mutate or exempt main: {forbidden}")
need("conclusion\" != \"success" in guard, "required PR workflows must still fail audit when completed unsuccessfully")
need("for attempt in {1..60}" in guard, "read-only workflow audit must tolerate long-running required checks")

# Effective ruleset verification must reject the two real failure modes seen in
# repository administration: overbroad ~ALL protection and case-mismatched Main.
for marker in [
    'RULESET_NAME = "Protect main — MouldMaster required gates"',
    'MAIN_REF = "refs/heads/main"',
    '"integrity"',
    '"mobile-browser"',
    '"build-windows"',
    '"question-quality-50-pass"',
    '"deletion"',
    '"non_fast_forward"',
    '"required_linear_history"',
    '"pull_request"',
    '"required_status_checks"',
    'allowed_merge_methods',
    'required_approving_review_count',
    'strict_required_status_checks_policy',
    'do_not_enforce_on_create',
    '"~ALL"',
    'refs/heads/Main',
    'branch.get("protected") is not True',
]:
    need(marker in ruleset_verifier, f"effective main ruleset verifier missing marker: {marker}")
need("from verify_main_ruleset import verify as verify_main_ruleset" in production_verifier,
     "production verifier must import the effective main ruleset verifier")
need("verify_main_ruleset(repository)" in production_verifier,
     "production verifier must validate the exact effective ruleset when native protection is required")

self_test = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_main_ruleset.py"), "--self-test"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
need(self_test.returncode == 0, f"effective main ruleset verifier self-test failed: {(self_test.stderr or self_test.stdout).strip()}")

# Production publication must require GitHub's effective native protection.
need("--require-native-protection" in pages, "Pages publication does not require native main protection")
need("Require merged-PR provenance before publication" in pages, "Pages stable provenance gate label is missing")
need("native protection mandatory" in pages, "Pages native-protection requirement is not explicit")
need("if: github.event_name != 'pull_request'" in pages, "Pages publication guard must remain push/manual only")

# The native-protection helper is an explicit administrator action, defaults to
# a credential-free dry run, has no bypass actors, and mirrors the exact CI job
# contexts used by this repository. It must verify GitHub's effective state
# after applying rather than treating a successful API request as proof.
for marker in [
    'MODE="${1:---dry-run}"',
    "--dry-run|--apply",
    'RULESET_NAME="Protect main — MouldMaster required gates"',
    '"bypass_actors": []',
    '"include": ["refs/heads/main"]',
    '"type": "deletion"',
    '"type": "non_fast_forward"',
    '"type": "required_linear_history"',
    '"type": "pull_request"',
    '"allowed_merge_methods": ["squash"]',
    '"required_approving_review_count": 0',
    '"type": "required_status_checks"',
    '"strict_required_status_checks_policy": true',
    '"context": "integrity"',
    '"context": "mobile-browser"',
    '"context": "build-windows"',
    '"context": "question-quality-50-pass"',
    '["build-windows","integrity","mobile-browser","question-quality-50-pass"]',
    'gh api --method POST "repos/$REPO/rulesets"',
    'gh api --method PUT "repos/$REPO/rulesets/$existing_id"',
    'gh api "repos/$REPO/branches/main" --jq',
    'protected=true',
    'all four required checks',
]:
    need(marker in protection_helper, f"native-protection helper missing marker: {marker}")
need('if [[ "$MODE" == "--apply" ]]' in protection_helper, "GitHub auth/network access must be apply-only")
need("gh auth token" not in protection_helper, "native-protection helper must not extract a GitHub token")
need("GITHUB_TOKEN=" not in protection_helper, "native-protection helper must not embed or assign a repository token")

for marker in [
    "require a pull request before merge",
    "require the branch to be up to date",
    "`integrity`",
    "`mobile-browser`",
    "`build-windows`",
    "`question-quality-50-pass`",
    "four technical gates",
    "all four are green",
    "all four required workflows green",
    "block branch deletion",
    "block non-fast-forward/force updates",
    "required_approving_review_count: 0",
    "--dry-run",
    "--apply",
    "protected: true",
    "Issue #43",
]:
    need(marker in protection_doc, f"native-protection documentation missing marker: {marker}")

# Ensure protection helper contexts remain real PR job names.
need("jobs:\n  integrity:" in release_qa, "required status context 'integrity' is no longer the Release QA job")
need("jobs:\n  mobile-browser:" in mobile_qa, "required status context 'mobile-browser' is no longer the mobile QA job")
need("jobs:\n  build-windows:" in desktop_build, "required status context 'build-windows' is no longer the desktop build job")
need("jobs:\n  question-quality-50-pass:" in question_quality, "required status context 'question-quality-50-pass' is no longer the question-quality job")
need("pull_request:\n    branches: [main]" in question_quality, "question-quality required check must run on every PR to main")

# Release QA must discover executable JavaScript from the filesystem and keep
# the architecture debt ceiling as a release gate.
for marker in [
    "find . -maxdepth 1 -type f -name '*.js'",
    "find src/domains -type f -name '*.js'",
    "find desktop/electron/src desktop/electron/scripts -type f -name '*.cjs'",
    "run: python qa_architecture_debt.py",
]:
    need(marker in release_qa, f"release QA cleanup contract missing marker: {marker}")

# Desktop lock maintenance is verification-only and never a privileged main writer.
for marker in [
    "name: Desktop Dependency Lock",
    "pull_request:",
    "push:",
    "branches: [main]",
    "desktop/electron/package.json",
    "desktop/electron/package-lock.json",
    "desktop/electron/msix-toolchain/package.json",
    "desktop/electron/msix-toolchain/package-lock.json",
    "desktop/electron/scripts/run-msix-builder.cjs",
    "contents: read",
    "actions/checkout@v7",
    "actions/setup-node@v7",
    "npm ci --prefix desktop/electron",
    "npm ci --prefix desktop/electron/msix-toolchain",
    "root electron-builder drift",
    "run-msix-builder.cjs --verify-toolchain",
    "git diff --exit-code -- desktop/electron/package-lock.json desktop/electron/msix-toolchain/package-lock.json",
]:
    need(marker in dep_lock, f"dependency-lock verification missing marker: {marker}")
for forbidden in ["contents: write", "git push", "git commit", "git add", "npm install --package-lock-only", "Lock open desktop dependencies"]:
    need(forbidden not in dep_lock, f"dependency-lock workflow must not write or regenerate locks: {forbidden}")

# Branch pruning remains downstream of a successful provenance audit. A failed
# audit (including missing native protection) therefore cannot trigger deletion.
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
need("\n  push:\n" not in pruner, "pruner must not race the provenance audit on raw main pushes")
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
    "(exact main-only ruleset semantics; post-push audit read-only; Pages requires exact native protection; "
    "four required checks audited; dual locked desktop toolchains; guard-gated pruning; architecture debt gate)"
)

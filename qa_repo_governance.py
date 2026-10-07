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
external_validation = text(".github/workflows/release-external-validation.yml")
risk_coverage = text(".github/workflows/ci-risk-coverage.yml")
protection_helper = text(".github/scripts/apply-main-ruleset.sh")
protection_doc = text(".github/MAIN_PROTECTION.md")
ruleset_verifier = text("tools/verify_main_ruleset.py")
main_policy = text("data/main-governance-policy-v1.json")
production_verifier = text("tools/verify_production_source.py")

# Main provenance is a read-only post-push audit. Native ruleset prevention is
# authoritative; audit automation must never rewrite main after the fact.
for marker in [
    "name: Main PR Provenance Guard",
    "push:",
    "branches: [main]",
    "contents: read",
    "pull-requests: read",
    "actions: read",
    "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
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
    "Exact-head CI Risk Coverage",
    "actions/runs?head_sha=$PR_HEAD_SHA&event=pull_request",
    "all_required_success",
    "repos/$GH_REPO/pulls/$PR_NUMBER",
    "Solo-maintainer manual merge decision verified",
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
need('"$conclusion" != "success"' in guard, "required PR workflows must still fail audit when completed unsuccessfully")
need("for attempt in {1..60}" in guard, "read-only workflow audit must tolerate long-running required checks")

# Effective ruleset verification must enforce the solo-maintainer owner
# merge policy and all six automated/security controls, with no bypass.
for marker in [
    'POLICY_PATH = ROOT / "data" / "main-governance-policy-v1.json"',
    'MAIN_REF = str(POLICY["targetRef"])',
    'REQUIRED_CONTEXTS = set(POLICY["requiredStatusChecks"]["contexts"])',
    '"deletion"',
    '"non_fast_forward"',
    '"required_linear_history"',
    '"pull_request"',
    '"required_status_checks"',
    '"code_scanning"',
    '"code_quality"',
    '"copilot_code_review"',
    "required_approving_review_count must be 0 for owner-authorized solo releases",
    "required_review_thread_resolution must be true",
    "dismiss_stale_reviews_on_push must be false when no approval is required",
    "require_last_push_approval must be false for a sole maintainer",
    "require_extra_approval_for_unattributed_changes must be false when no second maintainer exists",
    "strict_required_status_checks_policy",
    "do_not_enforce_on_create",
    '"~ALL"',
    "refs/heads/Main",
    'branch.get("protected") is not True',
]:
    need(marker in ruleset_verifier, f"effective main ruleset verifier missing marker: {marker}")

for marker in [
    '"targetRef": "refs/heads/main"',
    '"maintainerMode": "solo"',
    '"ownerLogin": "connorth3-lgtm"',
    '"minimumApprovals": 0',
    '"independentReviewerRequired": false',
    '"latestHeadApproval": false',
    '"reviewThreadResolution": true',
    '"dismissStaleReviews": false',
    '"extraApprovalForUnattributedChanges": false',
    '"squash"',
    '"bypassActors": []',
    '"strict": true',
    '"enforceOnCreate": true',
    '"integrationId": 15368',
    '"integrity"',
    '"mobile-browser"',
    '"build-windows"',
    '"question-quality-50-pass"',
    '"release-external-validation"',
    '"exact-head-risk-coverage"',
]:
    need(marker in main_policy, f"canonical main governance policy missing marker: {marker}")

need(
    "from verify_main_ruleset import verify as verify_main_ruleset" in production_verifier,
    "production verifier must import the effective main ruleset verifier",
)
need(
    "verify_main_ruleset(repository)" in production_verifier,
    "production verifier must validate the exact effective ruleset when native protection is required",
)

self_test = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_main_ruleset.py"), "--self-test"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
need(
    self_test.returncode == 0,
    f"effective main ruleset verifier self-test failed: {(self_test.stderr or self_test.stdout).strip()}",
)

# Production publication must require GitHub's effective native protection.
need("--require-native-protection" in pages, "Pages publication does not require native main protection")
need("Require merged-PR provenance before publication" in pages, "Pages stable provenance gate label is missing")
need("native protection mandatory" in pages, "Pages native-protection requirement is not explicit")
need("if: github.event_name != 'pull_request'" in pages, "Pages publication guard must remain push/manual only")

# The administrator helper must transform the live ruleset rather than replace
# it with a stale static payload. It must preserve existing security/review
# rules while applying solo-maintainer owner-merger semantics and the aggregate exact-head release gate.
for marker in [
    'MODE="${1:---dry-run}"',
    "--dry-run|--apply",
    'REQUIRED_CONTEXTS=(',
    '"integrity"',
    '"mobile-browser"',
    '"build-windows"',
    '"question-quality-50-pass"',
    '"release-external-validation"',
    '"exact-head-risk-coverage"',
    'gh api "repos/$REPO/rulesets/$RULESET_ID" >"$live"',
    '.parameters.required_approving_review_count = 0',
    ".parameters.required_review_thread_resolution = true",
    ".parameters.dismiss_stale_reviews_on_push = false",
    ".parameters.require_last_push_approval = false",
    ".parameters.require_extra_approval_for_unattributed_changes = false",
    ".parameters.strict_required_status_checks_policy = true",
    ".parameters.do_not_enforce_on_create = false",
    'index("code_scanning")',
    'index("code_quality")',
    'index("copilot_code_review")',
    '["refs/heads/main"]',
    'gh api --method PUT "repos/$REPO/rulesets/$RULESET_ID" --input "$payload"',
    'gh api "repos/$REPO/branches/main" --jq',
    'protected',
    "authenticated_login",
    "resolved review threads",
]:
    need(marker in protection_helper, f"native-protection helper missing marker: {marker}")

need('if [[ "$MODE" == "--dry-run" ]]' in protection_helper, "native-protection helper must expose a non-mutating dry run")
need("gh auth token" not in protection_helper, "native-protection helper must not extract a GitHub token")
need("GITHUB_TOKEN=" not in protection_helper, "native-protection helper must not embed or assign a repository token")
need(
    'gh api --method POST "repos/$REPO/rulesets"' not in protection_helper,
    "helper must not create a parallel static ruleset when a reviewed live main ruleset already exists",
)

for marker in [
    "solo-maintainer manual owner approval plus automated evidence",
    "zero required second-person approving reviews",
    "manual owner merger recorded by GitHub",
    "all review conversations resolved",
    "release decisions bound to the exact PR head",
    "`integrity`",
    "`mobile-browser`",
    "`build-windows`",
    "`question-quality-50-pass`",
    "`release-external-validation`",
    "`exact-head-risk-coverage`",
    "CodeQL",
    "code-quality",
    "Copilot code-review",
    "block branch deletion",
    "non-fast-forward/force updates blocked",
    "--dry-run",
    "--apply",
    "transforms that exact",
    "owner-authorized merge decision, all six required checks are green",
    "Automated checks do not establish external device, SME or safety validation",
    "Issue #43",
]:
    need(marker in protection_doc, f"native-protection documentation missing marker: {marker}")

# Ensure all six governed contexts remain real PR jobs.
need("jobs:\n  integrity:" in release_qa, "required status context 'integrity' is no longer the Release QA job")
need("jobs:\n  mobile-browser:" in mobile_qa, "required status context 'mobile-browser' is no longer the mobile QA job")
need("jobs:\n  build-windows:" in desktop_build, "required status context 'build-windows' is no longer the desktop build job")
need(
    "jobs:\n  question-quality-50-pass:" in question_quality,
    "required status context 'question-quality-50-pass' is no longer the question-quality job",
)
need(
    "jobs:\n  release-external-validation:" in external_validation,
    "required status context 'release-external-validation' is no longer the external-validation boundary job",
)
need(
    "jobs:\n  exact-head-risk-coverage:" in risk_coverage,
    "required status context 'exact-head-risk-coverage' is no longer the aggregate CI risk job",
)
need("pull_request:\n    branches: [main]" in risk_coverage, "exact-head risk coverage required check must run on every PR to main")
for workflow_name, workflow in [
    ("question-quality", question_quality),
    ("release-external-validation", external_validation),
]:
    need("pull_request:\n    branches: [main]" in workflow, f"{workflow_name} required check must run on every PR to main")

for marker in [
    "Verify release-specific external validation boundaries",
    "tools/verify_release_external_validation.py",
    "Exercise native ruleset verifier contract",
    "tools/verify_main_ruleset.py --self-test",
    "Verify live native main ruleset against canonical policy",
    'tools/verify_main_ruleset.py --repository "${{ github.repository }}"',
    "PASS means unsupported external-validation claims are blocked.",
    "It does not mean human AT, physical-device, Windows, SME, learner or site evidence has been performed.",
]:
    need(marker in external_validation, f"external-validation boundary workflow missing marker: {marker}")

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
    "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
    "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
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
    "(main-only solo-maintainer owner-merge native policy; six required contexts; live-preserving helper; "
    "post-push audit read-only; Pages requires exact native protection; dual locked desktop toolchains; "
    "guard-gated pruning; architecture debt gate)"
)
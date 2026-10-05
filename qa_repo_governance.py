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
preview_pages = text(".github/workflows/preview-pages.yml")
pruner = text(".github/workflows/prune-merged-branches.yml")
dep_lock = text(".github/workflows/desktop-dependency-lock.yml")
release_qa = text(".github/workflows/qa.yml")
mobile_qa = text(".github/workflows/mobile-browser-qa.yml")
desktop_build = text(".github/workflows/open-desktop-build.yml")
question_quality = text(".github/workflows/question-quality-50-pass.yml")
external_validation = text(".github/workflows/release-external-validation.yml")
risk_coverage = text(".github/workflows/ci-risk-coverage.yml")
branch_assurance = text(".github/workflows/branch-release-assurance.yml")
branch_assurance_verifier = text("tools/verify_branch_assurance.py")
protection_helper = text(".github/scripts/apply-main-ruleset.sh")
protection_doc = text(".github/MAIN_PROTECTION.md")
ruleset_verifier = text("tools/verify_main_ruleset.py")
main_policy = text("data/main-governance-policy-v1.json")
production_verifier = text("tools/verify_production_source.py")
preview_verifier = text("tools/verify_preview_source.py")
premerge_public_candidate = text(".github/workflows/premerge-public-candidate.yml")
external_live_verifier = text("tools/verify_external_validation_live_bindings.py")

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
    "PR_HEAD_REF",
    "PR_HEAD_REPO_ID",
    ".head_repository.id",
    '.user.type == "User"',
    "collaborators/$reviewer/permission",
    "write|maintain|admin",
    "Independent trusted latest-head human approval verified",
    "all_required_success",
    "pulls/$PR_NUMBER/reviews",
    "Independent latest-head human approval verified",
    '.user.type == "User"',
    "non-canonical exact head SHA",
    'any(.pull_requests[]?; (.number == $pr and .base.ref == "main"))',
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

# Effective ruleset verification must enforce the explicit independent-review
# review settings as well as the six governed automated contexts and existing
# server-side protections.
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
    "required_approving_review_count must be 1 for independent human review",
    "required_review_thread_resolution must be true",
    "dismiss_stale_reviews_on_push must be true",
    "require_last_push_approval must be true so the latest head is independently reviewed",
    "require_extra_approval_for_unattributed_changes must be true",
    "copilot_code_review.review_draft_pull_requests must be true",
    "strict_required_status_checks_policy",
    "do_not_enforce_on_create",
    '"~ALL"',
    "refs/heads/Main",
    'branch.get("protected") is not True',
]:
    need(marker in ruleset_verifier, f"effective main ruleset verifier missing marker: {marker}")

for marker in [
    '"targetRef": "refs/heads/main"',
    '"minimumApprovals": 1',
    '"independentReviewerRequired": true',
    '"latestHeadApproval": true',
    '"reviewThreadResolution": true',
    '"dismissStaleReviews": true',
    '"extraApprovalForUnattributedChanges": true',
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
need(
    "Production source must be the current main head" in production_verifier,
    "production verifier must reject historical/arbitrary manual-dispatch sources",
)
for marker in (
    "run_matches_main_pr",
    '((pr.get("base") or {}).get("ref") == "main")',
    "successful_required_workflows(runs, pr_number, pr_head_ref, pr_head_repo_id)",
    '"Exact-head CI Risk Coverage"',
    "full lowercase 40-character commit SHA",
    "no usable canonical exact head SHA",
):
    need(marker in production_verifier, f"production verifier missing exact originating-PR evidence binding: {marker}")
for marker in (
    "branches/preview",
    "direct pushes and arbitrary workflow-dispatch refs are not deployable",
    "merge_commit_sha",
    "MouldMaster Release QA",
    "Mobile Browser QA",
    "Question Quality 50-Pass",
    "Pre-merge Public Candidate",
    "run_matches_pr",
    '((pr.get("base") or {}).get("ref") == "preview")',
    "latest_required_states(runs, pr_number, pr_head_ref, pr_head_repo_id)",
    "full lowercase 40-character commit SHA",
):
    need(marker in preview_verifier, f"preview-source verifier missing marker: {marker}")
for marker in (
    "actions/runs/{run_id}/artifacts",
    "artifact.get(\"expired\") is not False",
    "live artifact digest does not match canonical webCandidate",
    "issues/{issue_number}",
    "NZQA tracker",
):
    need(marker in external_live_verifier, f"external live-binding verifier missing marker: {marker}")
for marker in (
    "name: MouldMaster Preview Candidate",
    "Require merged-PR preview provenance",
    "Require exact-head preview quality gates",
    "Build governed preview candidate",
    "Verify retained preview candidate locally",
    "Retain exact preview candidate",
    "verify_preview_source.py",
    "main is the sole live Pages publisher",
):
    need(marker in preview_pages, f"preview candidate governance missing marker: {marker}")
for forbidden in ("actions/deploy-pages@", "actions/upload-pages-artifact@", "pages: write", "id-token: write", "mouldmaster-pages-site-publish"):
    need(forbidden not in preview_pages, f"preview candidate must not publish the repository Pages site: {forbidden}")
need(
    "mouldmaster-pages-site-publish" in pages,
    "main Pages deploy must retain the sole site-wide publication concurrency domain",
)
need(
    "retain-exact-candidate" not in preview_pages.split("Require exact-head preview quality gates", 1)[1].split("Validate preview build contracts", 1)[0],
    "preview push-SHA polling must not require the PR-only public-candidate job",
)
need("pull_request:\n    branches: [ main, preview ]" in premerge_public_candidate,
     "public-candidate gate must run on every governed PR")
need("\n    paths:\n" not in premerge_public_candidate.split("pull_request:", 1)[1].split("workflow_dispatch:", 1)[0],
     "public-candidate gate must not use PR path filters; impact routing handles cheap skips")
need("Skip redundant candidate rebuild" in premerge_public_candidate and "steps.impact.outputs.runtime != 'true'" in premerge_public_candidate,
     "public-candidate gate must keep impact-based cheap skipping for non-runtime changes")

# Preview and main must also converge after merge/push on one exact SHA. This
# read-only meta-gate waits for the real branch-specific CI and deployment runs;
# it does not duplicate their work or grant mutation/publication permissions.
for marker in (
    "name: Branch Release Assurance",
    "branches: [main, preview]",
    "pull_request:",
    "contract-self-test:",
    "exact-push-assurance:",
    "actions: read",
    "BRANCH_ASSURANCE_BRANCH",
    "BRANCH_ASSURANCE_SHA",
    "tools/verify_branch_assurance.py",
):
    need(marker in branch_assurance, f"branch release assurance workflow missing marker: {marker}")
for forbidden in ("contents: write", "pages: write", "pull-requests: write"):
    need(forbidden not in branch_assurance, f"branch release assurance must remain read-only: {forbidden}")
for marker in (
    '"main": (',
    '"preview": (',
    '"MouldMaster Release QA"',
    '"Mobile Browser QA"',
    '"Question Quality 50-Pass"',
    '"MouldMaster Pages Release Readiness"',
    '"Main PR Provenance Guard"',
    '"MouldMaster Preview Candidate"',
    '"branch": branch',
    '"event": "push"',
    "head_sha",
):
    need(marker in branch_assurance_verifier, f"branch assurance verifier missing marker: {marker}")
branch_assurance_self_test = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_branch_assurance.py"), "--self-test"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
need(
    branch_assurance_self_test.returncode == 0,
    f"branch-assurance verifier self-test failed: {(branch_assurance_self_test.stderr or branch_assurance_self_test.stdout).strip()}",
)

preview_self_test = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_preview_source.py"), "--self-test"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
need(
    preview_self_test.returncode == 0,
    f"preview-source verifier self-test failed: {(preview_self_test.stderr or preview_self_test.stdout).strip()}",
)
external_live_self_test = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_external_validation_live_bindings.py"), "--self-test"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
need(
    external_live_self_test.returncode == 0,
    f"external live-binding verifier self-test failed: {(external_live_self_test.stderr or external_live_self_test.stdout).strip()}",
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
for marker in (
    "Checkout exact main source before deployment",
    "Recheck current protected-main provenance before deployment",
    "Recheck current protected-main provenance after deployment",
    "Reconfirm main is still on the deployed SHA after race window",
):
    need(marker in pages, f"Pages deploy-time current-main recheck missing: {marker}")
need("Require merged-PR provenance before publication" in pages, "Pages stable provenance gate label is missing")
need("native protection mandatory" in pages, "Pages native-protection requirement is not explicit")
need("if: github.event_name == 'push'" in pages, "Pages publication authority must be limited to protected-main push events")
need("Manual dispatch is contract-only" in pages and "Manual dispatch does not receive Pages mutation or publication authority." in pages,
     "manual Pages dispatch must remain contract-only and non-publishing")

# The administrator helper must transform the live ruleset rather than replace
# it with a stale static payload. It must preserve existing security/review
# rules while applying independent human-review semantics and the aggregate exact-head release gate.
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
    '.parameters.required_approving_review_count = 1',
    ".parameters.required_review_thread_resolution = true",
    ".parameters.dismiss_stale_reviews_on_push = true",
    ".parameters.require_last_push_approval = true",
    ".parameters.require_extra_approval_for_unattributed_changes = true",
    ".parameters.review_draft_pull_requests = true",
    ".parameters.strict_required_status_checks_policy = true",
    ".parameters.do_not_enforce_on_create = false",
    'index("code_scanning")',
    'index("code_quality")',
    'index("copilot_code_review")',
    '["refs/heads/main"]',
    'gh api --method PUT "repos/$REPO/rulesets/$RULESET_ID" --input "$payload"',
    'gh api "repos/$REPO/branches/main" --jq',
    'protected',
    "at least two trusted write-capable collaborators",
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
    "independent human review plus automated evidence",
    "one required approving review",
    "approval of the **latest pushed head**",
    "all review conversations resolved",
    "stale approvals dismissed after new pushes",
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
    "latest-head human approval, all six required checks are green",
    "Automated checks are necessary but are not equivalent to independent human review",
    "Issue #43",
]:
    need(marker in protection_doc, f"native-protection documentation missing marker: {marker}")

# Ensure all six governed contexts remain real PR jobs.
need("jobs:\n  integrity:" in release_qa, "required status context 'integrity' is no longer the Release QA job")
mobile_block = mobile_qa.split("  mobile-browser:\n", 1)[1] if "  mobile-browser:\n" in mobile_qa else ""
need(mobile_block, "required status context 'mobile-browser' is no longer the Mobile Browser aggregate job")
need("    if: always()" in mobile_block, "mobile-browser aggregate must always evaluate upstream browser evidence")
need("    needs: [browser-chromium, browser-webkit, browser-cross, app-500-reliability]" in mobile_block or
     "    needs: [impact, browser-chromium, browser-webkit, browser-cross, app-500-reliability]" in mobile_block,
     "mobile-browser aggregate must depend on every governed browser/reliability group")
for marker in (
    'test "$CHROMIUM" = "success"',
    'test "$WEBKIT" = "success"',
    'test "$CROSS_BROWSER" = "success"',
    'test "$APP_500" = "success"',
):
    need(marker in mobile_block, f"mobile-browser aggregate missing fail-closed evidence check: {marker}")
need('if [ "$CHROMIUM" = "skipped" ]' in mobile_block or 'BROWSER_IMPACT' in mobile_block,
     "mobile-browser aggregate must distinguish an intentional impact skip from a failed/cancelled browser group")
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
    need(("pull_request:\n    branches: [main]" in workflow) or ("pull_request:\n    branches: [main, preview]" in workflow), f"{workflow_name} required check must run on every PR to main")

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

for marker in (
    "- name: Repository governance integrity",
    "python qa_repo_governance.py",
    "python qa_pages_single_publisher.py",
    "python qa_release_supply_chain.py",
):
    need(marker in release_qa, f"release QA governance bundle missing marker: {marker}")

print(
    "MouldMaster repository governance QA passed "
    "(main-only independent human-review native policy; six required contexts; live-preserving helper; "
    "post-push audit read-only; main-only Pages publication source-bound; preview exact-SHA candidate retained without publish authority; Pages requires exact native protection; dual locked desktop toolchains; "
    "guard-gated pruning; preview/main exact-push release assurance; architecture debt gate)"
)
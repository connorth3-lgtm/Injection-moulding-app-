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

# The post-push audit remains read-only; prevention belongs to GitHub's native policy.
for marker in [
    "name: Main PR Provenance Guard", "push:", "branches: [main]", "contents: read",
    "pull-requests: read", "actions: read", "actions/checkout@v7", "HEAD_SHA: ${{ github.sha }}",
    "commits/$HEAD_SHA/pulls", "merged_at != null", "merge_commit_sha", "fail_audit",
    "tools/verify_main_ruleset.py --repository", "MouldMaster Release QA", "Mobile Browser QA",
    "Open Desktop Build", "Question Quality 50-Pass", "all_required_success",
    "native protection is authoritative",
]:
    need(marker in guard, f"main provenance guard missing marker: {marker}")
for forbidden in ["contents: write", "rollback_main", "git/refs/heads/main", "force=true", "--method PATCH"]:
    need(forbidden not in guard, f"post-push provenance audit must remain read-only: {forbidden}")

# Effective native policy is fail-closed and now requires genuinely independent review.
for marker in [
    'RULESET_NAME = "Protect main — MouldMaster required gates"', 'MAIN_REF = "refs/heads/main"',
    '"integrity"', '"mobile-browser"', '"build-windows"', '"question-quality-50-pass"',
    '"deletion"', '"non_fast_forward"', '"required_linear_history"', '"pull_request"',
    '"required_status_checks"', 'allowed_merge_methods', 'required_approving_review_count',
    'dismiss_stale_reviews_on_push', 'require_last_push_approval', 'required_review_thread_resolution',
    'strict_required_status_checks_policy', 'do_not_enforce_on_create', '"~ALL"', 'refs/heads/Main',
    'branch.get("protected") is not True', 'zero-review main policy must fail closed',
]:
    need(marker in ruleset_verifier, f"effective main ruleset verifier missing marker: {marker}")
need('pr_params.get("required_approving_review_count") != 1' in ruleset_verifier,
     "ruleset verifier must require exactly one approving review")
for field in ("dismiss_stale_reviews_on_push", "require_last_push_approval", "required_review_thread_resolution"):
    need(f'pr_params.get("{field}") is not True' in ruleset_verifier, f"ruleset verifier must require {field}=true")
need("from verify_main_ruleset import verify as verify_main_ruleset" in production_verifier,
     "production verifier must import the effective main ruleset verifier")
need("verify_main_ruleset(repository)" in production_verifier,
     "production verifier must validate the exact effective ruleset")

self_test = subprocess.run(
    [sys.executable, str(ROOT / "tools/verify_main_ruleset.py"), "--self-test"],
    cwd=ROOT, capture_output=True, text=True,
)
need(self_test.returncode == 0, f"effective main ruleset verifier self-test failed: {(self_test.stderr or self_test.stdout).strip()}")

# Pages publication must depend on effective native protection.
need("--require-native-protection" in pages, "Pages publication does not require native main protection")
need("Require merged-PR provenance before publication" in pages, "Pages stable provenance gate label is missing")
need("native protection mandatory" in pages, "Pages native-protection requirement is not explicit")
need("if: github.event_name != 'pull_request'" in pages, "Pages publication guard must remain push/manual only")

# The administrator helper is explicit, credential-free in dry-run, and mirrors the reviewed policy.
for marker in [
    'MODE="${1:---dry-run}"', "--dry-run|--apply", 'RULESET_NAME="Protect main — MouldMaster required gates"',
    '"bypass_actors": []', '"include": ["refs/heads/main"]', '"type": "deletion"',
    '"type": "non_fast_forward"', '"type": "required_linear_history"', '"type": "pull_request"',
    '"allowed_merge_methods": ["squash"]', '"required_approving_review_count": 1',
    '"dismiss_stale_reviews_on_push": true', '"require_last_push_approval": true',
    '"required_review_thread_resolution": true', '"type": "required_status_checks"',
    '"strict_required_status_checks_policy": true', '"context": "integrity"',
    '"context": "mobile-browser"', '"context": "build-windows"', '"context": "question-quality-50-pass"',
    '["build-windows","integrity","mobile-browser","question-quality-50-pass"]',
    'gh api --method POST "repos/$REPO/rulesets"', 'gh api --method PUT "repos/$REPO/rulesets/$existing_id"',
    'protected=true', 'one independent current-head approval',
]:
    need(marker in protection_helper, f"native-protection helper missing marker: {marker}")
need('if [[ "$MODE" == "--apply" ]]' in protection_helper, "GitHub auth/network access must be apply-only")
need("GITHUB_TOKEN=" not in protection_helper, "native-protection helper must not embed a repository token")

for marker in [
    "require a pull request before merge", "`integrity`", "`mobile-browser`", "`build-windows`",
    "`question-quality-50-pass`", "one independent approving review", "dismiss stale approvals",
    "resolve every review thread", "current head", "squash merge only", "block branch deletion",
    "block non-fast-forward/force updates", "--dry-run", "--apply", "protected: true",
]:
    need(marker in protection_doc, f"native-protection documentation missing marker: {marker}")

# Required check contexts must remain backed by real PR jobs.
need("jobs:\n  integrity:" in release_qa, "required status context 'integrity' is no longer Release QA")
need("jobs:\n  mobile-browser:" in mobile_qa, "required status context 'mobile-browser' is no longer mobile QA")
need("jobs:\n  build-windows:" in desktop_build, "required status context 'build-windows' is no longer desktop build")
need("jobs:\n  question-quality-50-pass:" in question_quality, "required status context 'question-quality-50-pass' is no longer question quality")
need("pull_request:\n    branches: [main]" in question_quality, "question-quality required check must run on every PR to main")

for marker in [
    "find . -maxdepth 1 -type f -name '*.js'", "find src/domains -type f -name '*.js'",
    "find desktop/electron/src desktop/electron/scripts -type f -name '*.cjs'", "run: python qa_architecture_debt.py",
    "run: python qa_release_claim_authority.py",
]:
    need(marker in release_qa, f"release QA governance contract missing marker: {marker}")

# Desktop lock verification remains read-only.
for marker in [
    "name: Desktop Dependency Lock", "pull_request:", "push:", "branches: [main]",
    "desktop/electron/package.json", "desktop/electron/package-lock.json",
    "desktop/electron/msix-toolchain/package.json", "desktop/electron/msix-toolchain/package-lock.json",
    "contents: read", "npm ci --prefix desktop/electron", "npm ci --prefix desktop/electron/msix-toolchain",
    "git diff --exit-code -- desktop/electron/package-lock.json desktop/electron/msix-toolchain/package-lock.json",
]:
    need(marker in dep_lock, f"dependency-lock verification missing marker: {marker}")
for forbidden in ["contents: write", "git push", "git commit", "git add", "npm install --package-lock-only"]:
    need(forbidden not in dep_lock, f"dependency-lock workflow must not write: {forbidden}")

# Branch pruning remains downstream of a successful provenance audit.
for marker in [
    "name: Prune Fully Merged Branches", "workflow_dispatch:", "workflow_run:",
    'workflows: ["Main PR Provenance Guard"]', "types: [completed]", "branches: [main]",
    "github.event.workflow_run.conclusion == 'success'", "group: prune-fully-merged-branches",
    '[[ -z "$branch" || "$branch" == "main" ]] && continue', 'compare/main...$sha',
    "merged_at != null", 'git/refs/heads/$branch',
]:
    need(marker in pruner, f"merged-branch pruner missing marker: {marker}")
need("\n  push:\n" not in pruner, "pruner must not race the provenance audit on raw main pushes")

need("run: python qa_repo_governance.py" in release_qa, "release QA must run repository governance regression checks")

print(
    "MouldMaster repository governance QA passed "
    "(main-only native policy; one independent current-head approval; stale reviews dismissed; review threads resolved; "
    "four strict required checks; read-only post-merge audit; production protection verification; no bypass actors)"
)

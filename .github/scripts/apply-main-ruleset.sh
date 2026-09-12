#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-connorth3-lgtm/Injection-moulding-app-}"
MODE="${1:---dry-run}"
RULESET_ID="${RULESET_ID:-}"
GITHUB_ACTIONS_APP_ID=15368
REQUIRED_CONTEXTS=(
  "integrity"
  "mobile-browser"
  "build-windows"
  "question-quality-50-pass"
  "release-external-validation"
)

usage() {
  cat <<'EOF'
Usage:
  REPO=owner/repo .github/scripts/apply-main-ruleset.sh --dry-run
  REPO=owner/repo .github/scripts/apply-main-ruleset.sh --apply

Both modes read the live main ruleset first. The script transforms that exact
ruleset instead of replacing it with a stale static copy, preserving unrelated
server-side protections such as CodeQL, code-quality and Copilot review rules.

This repository currently has one maintainer with write access, so the governed
policy requires pull requests and all automated/review-thread protections but
sets approving reviews to 0 and latest-push approval to false. Re-enable human
approval requirements only when a second write-capable maintainer is available.

--dry-run prints the exact transformed payload without changing GitHub.
--apply requires a local GitHub CLI identity with repository Administration
permission and writes the reviewed payload back to the same ruleset.
EOF
}

case "$MODE" in
  --dry-run|--apply) ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

for command in gh jq mktemp; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Required command not found: $command" >&2
    exit 1
  }
done
gh auth status >/dev/null
gh repo view "$REPO" --json nameWithOwner,defaultBranchRef >/dev/null

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
live="$tmpdir/live.json"
payload="$tmpdir/payload.json"

if [[ -z "$RULESET_ID" ]]; then
  mapfile -t candidates < <(
    gh api "repos/$REPO/rulesets" --jq \
      '.[] | select(.target == "branch" and .enforcement == "active") | .id'
  )
  matches=()
  for id in "${candidates[@]}"; do
    detail="$(gh api "repos/$REPO/rulesets/$id")"
    if jq -e '
      .conditions.ref_name.include == ["refs/heads/main"] and
      (.conditions.ref_name.exclude // []) == [] and
      ([.rules[].type] | index("pull_request")) != null and
      ([.rules[].type] | index("required_status_checks")) != null
    ' >/dev/null <<<"$detail"; then
      matches+=("$id")
    fi
  done
  if [[ "${#matches[@]}" -ne 1 ]]; then
    echo "Expected exactly one active main-only PR ruleset; found ${#matches[@]}." >&2
    echo "Set RULESET_ID explicitly only after administrator review." >&2
    exit 1
  fi
  RULESET_ID="${matches[0]}"
fi

gh api "repos/$REPO/rulesets/$RULESET_ID" >"$live"

jq -e '
  .target == "branch" and
  .enforcement == "active" and
  .conditions.ref_name.include == ["refs/heads/main"] and
  (.conditions.ref_name.exclude // []) == [] and
  .bypass_actors == [] and
  ([.rules[].type] | index("pull_request")) != null and
  ([.rules[].type] | index("required_status_checks")) != null
' "$live" >/dev/null || {
  echo "Live ruleset is not the reviewed main-only, no-bypass ruleset. Refusing to transform it." >&2
  exit 1
}

jq '
{
  name,
  target,
  enforcement,
  bypass_actors,
  conditions,
  rules: [
    .rules[]
    | if .type == "pull_request" then
        .parameters.required_approving_review_count = 0
        | .parameters.required_review_thread_resolution = true
        | .parameters.dismiss_stale_reviews_on_push = true
        | .parameters.require_last_push_approval = false
      elif .type == "required_status_checks" then
        .parameters.strict_required_status_checks_policy = true
        | .parameters.do_not_enforce_on_create = false
        | .parameters.required_status_checks =
            (
              .parameters.required_status_checks
              + [{"context":"release-external-validation","integration_id":15368}]
              | unique_by(.context)
            )
      else .
      end
  ]
}
' "$live" >"$payload"

jq -e --argjson app "$GITHUB_ACTIONS_APP_ID" '
  .target == "branch" and
  .enforcement == "active" and
  .bypass_actors == [] and
  .conditions.ref_name.include == ["refs/heads/main"] and
  (.conditions.ref_name.exclude // []) == [] and
  ([.rules[].type] | index("deletion")) != null and
  ([.rules[].type] | index("non_fast_forward")) != null and
  ([.rules[].type] | index("required_linear_history")) != null and
  ([.rules[].type] | index("code_scanning")) != null and
  ([.rules[].type] | index("code_quality")) != null and
  ([.rules[].type] | index("copilot_code_review")) != null and
  ([.rules[] | select(.type == "pull_request") | .parameters.allowed_merge_methods] | .[0]) == ["squash"] and
  ([.rules[] | select(.type == "pull_request") | .parameters.required_approving_review_count] | .[0]) == 0 and
  ([.rules[] | select(.type == "pull_request") | .parameters.required_review_thread_resolution] | .[0]) == true and
  ([.rules[] | select(.type == "pull_request") | .parameters.dismiss_stale_reviews_on_push] | .[0]) == true and
  ([.rules[] | select(.type == "pull_request") | .parameters.require_last_push_approval] | .[0]) == false and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy] | .[0]) == true and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.do_not_enforce_on_create] | .[0]) == false and
  (
    [.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context]
    | contains(["integrity","mobile-browser","build-windows","question-quality-50-pass","release-external-validation"])
  ) and
  (
    [.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[]
      | select(.context == "integrity" or .context == "mobile-browser" or .context == "build-windows" or .context == "question-quality-50-pass" or .context == "release-external-validation")
      | .integration_id]
    | all(. == $app)
  )
' "$payload" >/dev/null

printf 'Repository: %s\n' "$REPO"
printf 'Ruleset id: %s\n' "$RULESET_ID"
printf 'Mode: %s\n\n' "$MODE"
jq . "$payload"

if [[ "$MODE" == "--dry-run" ]]; then
  cat <<'EOF'

Dry run only. Nothing was changed.
The payload above was derived from the live ruleset, so existing unrelated
protections are retained. Review it, then rerun with --apply from a trusted
administrator shell.
EOF
  exit 0
fi

gh api --method PUT "repos/$REPO/rulesets/$RULESET_ID" --input "$payload" >/dev/null
echo "Applied solo-maintainer ruleset. Verifying effective configuration..."

effective="$(gh api "repos/$REPO/rulesets/$RULESET_ID")"
printf '%s\n' "$effective" | jq '{id,name,target,enforcement,conditions,rules,bypass_actors,updated_at}'

printf '%s\n' "$effective" | jq -e --argjson app "$GITHUB_ACTIONS_APP_ID" '
  .target == "branch" and
  .enforcement == "active" and
  .bypass_actors == [] and
  .conditions.ref_name.include == ["refs/heads/main"] and
  (.conditions.ref_name.exclude // []) == [] and
  ([.rules[].type] | index("code_scanning")) != null and
  ([.rules[].type] | index("code_quality")) != null and
  ([.rules[].type] | index("copilot_code_review")) != null and
  ([.rules[] | select(.type == "pull_request") | .parameters.required_approving_review_count] | .[0]) == 0 and
  ([.rules[] | select(.type == "pull_request") | .parameters.required_review_thread_resolution] | .[0]) == true and
  ([.rules[] | select(.type == "pull_request") | .parameters.dismiss_stale_reviews_on_push] | .[0]) == true and
  ([.rules[] | select(.type == "pull_request") | .parameters.require_last_push_approval] | .[0]) == false and
  (
    [.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context]
    | contains(["integrity","mobile-browser","build-windows","question-quality-50-pass","release-external-validation"])
  ) and
  (
    [.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[]
      | select(.context == "integrity" or .context == "mobile-browser" or .context == "build-windows" or .context == "question-quality-50-pass" or .context == "release-external-validation")
      | .integration_id]
    | all(. == $app)
  )
' >/dev/null || {
  echo "Effective ruleset does not satisfy the MouldMaster solo-maintainer main policy." >&2
  exit 1
}

for active_id in $(gh api "repos/$REPO/rulesets" --jq '.[] | select(.target == "branch" and .enforcement == "active") | .id'); do
  if gh api "repos/$REPO/rulesets/$active_id" --jq '.conditions.ref_name.include[]?' | grep -Fxq '~ALL'; then
    echo "Active branch ruleset id=$active_id targets ~ALL branches. Narrow or disable it before continuing." >&2
    exit 1
  fi
done

protected="$(gh api "repos/$REPO/branches/main" --jq '.protected')"
if [[ "$protected" != "true" ]]; then
  echo "GitHub does not report lowercase main as protected." >&2
  exit 1
fi

updated_at="$(printf '%s\n' "$effective" | jq -r '.updated_at')"
cat <<EOF
Verified: main requires pull requests, resolved review threads, all governed
automated gates, squash-only history, and retains the live security/review
controls. Human approval is intentionally disabled while this repository has
only one write-capable maintainer.

IMPORTANT: refresh .github/main-ruleset-attestation.json with:
  ruleset_id: $RULESET_ID
  ruleset_updated_at: $updated_at
after re-reading the administrator-visible detail and confirming bypass_actors=[]
and current_user_can_bypass="never".
EOF

#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-connorth3-lgtm/Injection-moulding-app-}"
MODE="${1:---dry-run}"
RULESET_NAME="Protect main — MouldMaster required gates"
GITHUB_ACTIONS_APP_ID=15368

usage() {
  cat <<'EOF'
Usage:
  REPO=owner/repo .github/scripts/apply-main-ruleset.sh --dry-run
  REPO=owner/repo .github/scripts/apply-main-ruleset.sh --apply

The default is --dry-run and is network/credential free. --apply requires a
local GitHub CLI login/token with repository Administration permission. No token
is read from or written to the repository.
EOF
}

case "$MODE" in
  --dry-run|--apply) ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

for command in jq mktemp; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Required command not found: $command" >&2
    exit 1
  }
done

if [[ "$MODE" == "--apply" ]]; then
  command -v gh >/dev/null 2>&1 || {
    echo "Required command not found: gh" >&2
    exit 1
  }
  gh auth status >/dev/null
  gh repo view "$REPO" --json nameWithOwner,defaultBranchRef >/dev/null
fi

payload="$(mktemp)"
trap 'rm -f "$payload"' EXIT

cat >"$payload" <<JSON
{
  "name": "$RULESET_NAME",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "required_linear_history"
    },
    {
      "type": "pull_request",
      "parameters": {
        "allowed_merge_methods": ["squash"],
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_approving_review_count": 0,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "do_not_enforce_on_create": false,
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          {
            "context": "integrity",
            "integration_id": $GITHUB_ACTIONS_APP_ID
          },
          {
            "context": "mobile-browser",
            "integration_id": $GITHUB_ACTIONS_APP_ID
          },
          {
            "context": "build-windows",
            "integration_id": $GITHUB_ACTIONS_APP_ID
          },
          {
            "context": "question-quality-50-pass",
            "integration_id": $GITHUB_ACTIONS_APP_ID
          }
        ]
      }
    }
  ]
}
JSON

jq -e '
  .target == "branch" and
  .enforcement == "active" and
  .bypass_actors == [] and
  .conditions.ref_name.include == ["refs/heads/main"] and
  ([.rules[].type] | index("pull_request")) != null and
  ([.rules[].type] | index("required_status_checks")) != null and
  ([.rules[].type] | index("deletion")) != null and
  ([.rules[].type] | index("non_fast_forward")) != null and
  ([.rules[].type] | index("required_linear_history")) != null and
  ([.rules[] | select(.type == "pull_request") | .parameters.allowed_merge_methods] | .[0]) == ["squash"] and
  ([.rules[] | select(.type == "pull_request") | .parameters.required_approving_review_count] | .[0]) == 0 and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.do_not_enforce_on_create] | .[0]) == false and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy] | .[0]) == true and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | sort) == (["build-windows","integrity","mobile-browser","question-quality-50-pass"] | sort)
' "$payload" >/dev/null

printf 'Repository: %s\n' "$REPO"
printf 'Ruleset: %s\n' "$RULESET_NAME"
printf 'Mode: %s\n\n' "$MODE"
jq . "$payload"

if [[ "$MODE" == "--dry-run" ]]; then
  cat <<'EOF'

Dry run only. Nothing was changed.
Review the payload above, then rerun with --apply from a trusted local shell.
EOF
  exit 0
fi

existing_id="$(gh api "repos/$REPO/rulesets" --jq ".[] | select(.name == \"$RULESET_NAME\") | .id" | head -n 1)"

if [[ -n "$existing_id" ]]; then
  echo "Updating existing ruleset id=$existing_id"
  gh api --method PUT "repos/$REPO/rulesets/$existing_id" --input "$payload" >/dev/null
  ruleset_id="$existing_id"
else
  echo "Creating ruleset"
  ruleset_id="$(gh api --method POST "repos/$REPO/rulesets" --input "$payload" --jq '.id')"
fi

echo "Applied ruleset id=$ruleset_id. Verifying effective configuration..."
effective="$(gh api "repos/$REPO/rulesets/$ruleset_id")"
printf '%s\n' "$effective" | jq '{id,name,target,enforcement,conditions,rules,bypass_actors}'

printf '%s\n' "$effective" | jq -e --arg name "$RULESET_NAME" --argjson app "$GITHUB_ACTIONS_APP_ID" '
  .name == $name and
  .target == "branch" and
  .enforcement == "active" and
  .bypass_actors == [] and
  .conditions.ref_name.include == ["refs/heads/main"] and
  .conditions.ref_name.exclude == [] and
  ([.rules[].type] | index("deletion")) != null and
  ([.rules[].type] | index("non_fast_forward")) != null and
  ([.rules[].type] | index("required_linear_history")) != null and
  ([.rules[] | select(.type == "pull_request") | .parameters.allowed_merge_methods] | .[0]) == ["squash"] and
  ([.rules[] | select(.type == "pull_request") | .parameters.required_approving_review_count] | .[0]) == 0 and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.do_not_enforce_on_create] | .[0]) == false and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy] | .[0]) == true and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | sort) == (["build-windows","integrity","mobile-browser","question-quality-50-pass"] | sort) and
  ([.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].integration_id] | all(. == $app))
' >/dev/null || {
  echo "Applied ruleset does not exactly satisfy the reviewed MouldMaster main policy." >&2
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
  echo "GitHub does not yet report lowercase main as protected after applying the ruleset." >&2
  echo "Check the ref condition is exactly refs/heads/main; ref matching is case-sensitive." >&2
  exit 1
fi

echo "Verified: exact MouldMaster ruleset is active on lowercase main and GitHub reports protected=true."
echo "Next: open a test PR and confirm all four required checks block merge while pending/failing."

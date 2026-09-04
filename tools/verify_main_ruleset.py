#!/usr/bin/env python3
"""Verify that GitHub's effective native ruleset matches MouldMaster main policy."""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess

RULESET_NAME = "Protect main — MouldMaster required gates"
MAIN_REF = "refs/heads/main"
GITHUB_ACTIONS_APP_ID = 15368
REQUIRED_CONTEXTS = {
    "integrity",
    "mobile-browser",
    "build-windows",
    "question-quality-50-pass",
}
REQUIRED_RULE_TYPES = {
    "deletion",
    "non_fast_forward",
    "required_linear_history",
    "pull_request",
    "required_status_checks",
}


def fail(message: str) -> None:
    raise SystemExit(f"Native main ruleset verification failed: {message}")


def gh_json(endpoint: str) -> object:
    if not shutil.which("gh"):
        fail("GitHub CLI (gh) is required")
    env = os.environ.copy()
    token = (env.get("GITHUB_TOKEN") or env.get("GH_TOKEN") or "").strip()
    if not token:
        fail("GITHUB_TOKEN or GH_TOKEN is required")
    env["GH_TOKEN"] = token
    result = subprocess.run(
        ["gh", "api", "--method", "GET", "-H", "Accept: application/vnd.github+json", endpoint],
        capture_output=True,
        text=True,
        env=env,
    )
    if result.returncode != 0:
        fail((result.stderr or result.stdout).strip() or f"GitHub API query failed: {endpoint}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit("Native main ruleset verification failed: GitHub returned invalid JSON") from exc


def rule_by_type(detail: dict, rule_type: str) -> dict | None:
    for rule in detail.get("rules") or []:
        if isinstance(rule, dict) and rule.get("type") == rule_type:
            return rule
    return None


def valid_main_ruleset(detail: object) -> tuple[bool, list[str]]:
    """Validate protection semantics; the human-readable ruleset name is not authoritative."""
    if not isinstance(detail, dict):
        return False, ["ruleset detail is not an object"]
    errors: list[str] = []
    if detail.get("target") != "branch":
        errors.append("target must be branch")
    if detail.get("enforcement") != "active":
        errors.append("enforcement must be active")
    if detail.get("bypass_actors") not in ([], None):
        errors.append("bypass_actors must be empty")

    ref_name = ((detail.get("conditions") or {}).get("ref_name") or {})
    include = ref_name.get("include") or []
    exclude = ref_name.get("exclude") or []
    if include != [MAIN_REF]:
        errors.append(f"ref include must be exactly [{MAIN_REF!r}], got {include!r}")
    if exclude:
        errors.append("ref exclude must be empty")

    rules = [r for r in (detail.get("rules") or []) if isinstance(r, dict)]
    types = {str(r.get("type") or "") for r in rules}
    missing_types = REQUIRED_RULE_TYPES - types
    if missing_types:
        errors.append(f"missing rule types: {sorted(missing_types)}")

    pr = rule_by_type(detail, "pull_request") or {}
    pr_params = pr.get("parameters") or {}
    if pr_params.get("allowed_merge_methods") != ["squash"]:
        errors.append("pull_request.allowed_merge_methods must be ['squash']")
    if pr_params.get("required_approving_review_count") != 0:
        errors.append("pull_request.required_approving_review_count must be 0")

    status = rule_by_type(detail, "required_status_checks") or {}
    status_params = status.get("parameters") or {}
    if status_params.get("strict_required_status_checks_policy") is not True:
        errors.append("required status checks must require an up-to-date branch")
    if status_params.get("do_not_enforce_on_create") is not False:
        errors.append("required status checks must enforce on creation")
    rows = status_params.get("required_status_checks") or []
    contexts = {str(x.get("context") or "") for x in rows if isinstance(x, dict)}
    if contexts != REQUIRED_CONTEXTS:
        errors.append(f"required contexts mismatch: {sorted(contexts)}")
    for row in rows:
        if isinstance(row, dict) and row.get("context") in REQUIRED_CONTEXTS:
            if row.get("integration_id") != GITHUB_ACTIONS_APP_ID:
                errors.append(f"{row.get('context')} must use GitHub Actions integration {GITHUB_ACTIONS_APP_ID}")

    return not errors, errors


def verify(repository: str) -> None:
    branch = gh_json(f"repos/{repository}/branches/main")
    if not isinstance(branch, dict) or branch.get("protected") is not True:
        fail("GitHub reports refs/heads/main protected=false")

    listing = gh_json(f"repos/{repository}/rulesets")
    rows = listing if isinstance(listing, list) else []
    active_branch_rows = [
        row for row in rows
        if isinstance(row, dict) and row.get("target") == "branch" and row.get("enforcement") == "active"
    ]
    if not active_branch_rows:
        fail("no active branch rulesets are visible")

    overbroad: list[str] = []
    candidates: list[tuple[str, list[str]]] = []
    matches: list[str] = []
    for row in active_branch_rows:
        ruleset_id = row.get("id")
        if not ruleset_id:
            continue
        detail = gh_json(f"repos/{repository}/rulesets/{ruleset_id}")
        if not isinstance(detail, dict):
            continue
        name = str(detail.get("name") or f"ruleset-{ruleset_id}")
        ref_name = ((detail.get("conditions") or {}).get("ref_name") or {})
        include = ref_name.get("include") or []
        exclude = ref_name.get("exclude") or []
        if "~ALL" in include:
            overbroad.append(f"active ruleset {name!r} targets ~ALL branches")
            continue
        if include != [MAIN_REF] or exclude:
            continue
        ok, errors = valid_main_ruleset(detail)
        if ok:
            matches.append(name)
        else:
            candidates.append((name, errors))

    if overbroad:
        fail("; ".join(overbroad))
    if not matches:
        detail_text = "; ".join(
            f"{name!r}: {', '.join(errors)}" for name, errors in candidates
        )
        suffix = f" ({detail_text})" if detail_text else ""
        fail(f"no active ruleset exactly matches required MouldMaster main policy{suffix}")

    print(
        f"Verified effective native policy on {MAIN_REF} via active ruleset(s): "
        f"{', '.join(repr(name) for name in matches)}; all four required checks."
    )


def self_test() -> None:
    good = {
        "name": RULESET_NAME,
        "target": "branch",
        "enforcement": "active",
        "bypass_actors": [],
        "conditions": {"ref_name": {"include": [MAIN_REF], "exclude": []}},
        "rules": [
            {"type": "deletion"},
            {"type": "non_fast_forward"},
            {"type": "required_linear_history"},
            {"type": "pull_request", "parameters": {"allowed_merge_methods": ["squash"], "required_approving_review_count": 0}},
            {"type": "required_status_checks", "parameters": {
                "do_not_enforce_on_create": False,
                "strict_required_status_checks_policy": True,
                "required_status_checks": [
                    {"context": context, "integration_id": GITHUB_ACTIONS_APP_ID}
                    for context in sorted(REQUIRED_CONTEXTS)
                ],
            }},
        ],
    }
    ok, errors = valid_main_ruleset(good)
    assert ok and not errors
    renamed = json.loads(json.dumps(good))
    renamed["name"] = "connor"
    assert valid_main_ruleset(renamed)[0], "ruleset display name must not affect semantic validity"
    bad_case = json.loads(json.dumps(good))
    bad_case["conditions"]["ref_name"]["include"] = ["refs/heads/Main"]
    assert not valid_main_ruleset(bad_case)[0]
    bad_checks = json.loads(json.dumps(good))
    bad_checks["rules"][-1]["parameters"]["required_status_checks"].pop()
    assert not valid_main_ruleset(bad_checks)[0]
    print("Native main ruleset verifier self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.repository:
        fail("--repository is required")
    verify(args.repository)


if __name__ == "__main__":
    main()

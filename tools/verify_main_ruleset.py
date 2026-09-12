#!/usr/bin/env python3
"""Verify GitHub's effective native ruleset matches MouldMaster solo-maintainer main policy."""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

MAIN_REF = "refs/heads/main"
GITHUB_ACTIONS_APP_ID = 15368
ATTESTATION_PATH = Path(__file__).resolve().parents[1] / ".github" / "main-ruleset-attestation.json"
REQUIRED_CONTEXTS = {
    "integrity",
    "mobile-browser",
    "build-windows",
    "question-quality-50-pass",
    "release-external-validation",
}
REQUIRED_RULE_TYPES = {
    "deletion",
    "non_fast_forward",
    "required_linear_history",
    "pull_request",
    "required_status_checks",
    "code_scanning",
    "code_quality",
    "copilot_code_review",
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


def load_attestation(path: Path = ATTESTATION_PATH) -> dict | None:
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        fail(f"ruleset bypass attestation is unreadable or invalid JSON: {path}")
    if not isinstance(payload, dict):
        fail("ruleset bypass attestation must be a JSON object")
    return payload


def normalized_timestamp(value: object) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(timezone.utc)


def rule_by_type(detail: dict, rule_type: str) -> dict | None:
    for rule in detail.get("rules") or []:
        if isinstance(rule, dict) and rule.get("type") == rule_type:
            return rule
    return None


def bypass_errors(detail: dict, attestation: dict | None, repository: str | None) -> list[str]:
    bypass = detail.get("bypass_actors", "__missing__")
    if bypass != "__missing__":
        errors: list[str] = []
        if bypass != []:
            errors.append("bypass_actors must be present and empty")
        current = detail.get("current_user_can_bypass")
        if current is not None and current != "never":
            errors.append(f"current_user_can_bypass must be 'never' when reported, got {current!r}")
        return errors

    if not isinstance(attestation, dict):
        return ["bypass_actors is redacted/missing and no exact-version administrator attestation is available"]

    errors = []
    if attestation.get("schema") != 1:
        errors.append("bypass attestation schema must be 1")
    if attestation.get("source") != "admin-verified-ruleset-detail":
        errors.append("bypass attestation source must be admin-verified-ruleset-detail")
    if repository is not None and attestation.get("repository") != repository:
        errors.append("bypass attestation repository does not match")
    if attestation.get("ruleset_id") != detail.get("id"):
        errors.append("bypass attestation ruleset_id does not match")
    live_updated = normalized_timestamp(detail.get("updated_at"))
    attested_updated = normalized_timestamp(attestation.get("ruleset_updated_at"))
    if live_updated is None or attested_updated is None or live_updated != attested_updated:
        errors.append("bypass attestation does not match the live ruleset updated_at instant")
    if attestation.get("bypass_actors", "__missing__") != []:
        errors.append("bypass attestation must explicitly record empty bypass_actors")
    if attestation.get("current_user_can_bypass") != "never":
        errors.append("bypass attestation must record current_user_can_bypass='never'")
    return errors


def valid_main_ruleset(
    detail: object,
    attestation: dict | None = None,
    repository: str | None = None,
) -> tuple[bool, list[str]]:
    if not isinstance(detail, dict):
        return False, ["ruleset detail is not an object"]

    errors: list[str] = []
    if detail.get("target") != "branch":
        errors.append("target must be branch")
    if detail.get("enforcement") != "active":
        errors.append("enforcement must be active")
    errors.extend(bypass_errors(detail, attestation, repository))

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

    pr_params = (rule_by_type(detail, "pull_request") or {}).get("parameters") or {}
    if pr_params.get("allowed_merge_methods") != ["squash"]:
        errors.append("pull_request.allowed_merge_methods must be ['squash']")
    if pr_params.get("required_approving_review_count") != 0:
        errors.append("pull_request.required_approving_review_count must be 0 for the solo-maintainer repository")
    if pr_params.get("required_review_thread_resolution") is not True:
        errors.append("pull_request.required_review_thread_resolution must be true")
    if pr_params.get("dismiss_stale_reviews_on_push") is not True:
        errors.append("pull_request.dismiss_stale_reviews_on_push must be true")
    if pr_params.get("require_last_push_approval") is not False:
        errors.append("pull_request.require_last_push_approval must be false for the solo-maintainer repository")

    status_params = (rule_by_type(detail, "required_status_checks") or {}).get("parameters") or {}
    if status_params.get("strict_required_status_checks_policy") is not True:
        errors.append("required status checks must require an up-to-date branch")
    if status_params.get("do_not_enforce_on_create") is not False:
        errors.append("required status checks must enforce on creation")
    rows = status_params.get("required_status_checks") or []
    contexts = {str(x.get("context") or "") for x in rows if isinstance(x, dict)}
    missing_contexts = REQUIRED_CONTEXTS - contexts
    if missing_contexts:
        errors.append(f"missing required contexts: {sorted(missing_contexts)}")
    for row in rows:
        if isinstance(row, dict) and row.get("context") in REQUIRED_CONTEXTS:
            if row.get("integration_id") != GITHUB_ACTIONS_APP_ID:
                errors.append(f"{row.get('context')} must use GitHub Actions integration {GITHUB_ACTIONS_APP_ID}")

    scan_params = (rule_by_type(detail, "code_scanning") or {}).get("parameters") or {}
    tools = scan_params.get("code_scanning_tools") or []
    codeql = [row for row in tools if isinstance(row, dict) and row.get("tool") == "CodeQL"]
    if not codeql:
        errors.append("code_scanning must require CodeQL")
    else:
        row = codeql[0]
        if row.get("security_alerts_threshold") != "medium_or_higher":
            errors.append("CodeQL security_alerts_threshold must be medium_or_higher")
        if row.get("alerts_threshold") != "all":
            errors.append("CodeQL alerts_threshold must be all")

    quality_params = (rule_by_type(detail, "code_quality") or {}).get("parameters") or {}
    if quality_params.get("severity") != "all":
        errors.append("code_quality.severity must be all")

    copilot_params = (rule_by_type(detail, "copilot_code_review") or {}).get("parameters") or {}
    if copilot_params.get("review_on_push") is not True:
        errors.append("copilot_code_review.review_on_push must be true")

    return not errors, errors


def verify(repository: str) -> None:
    branch = gh_json(f"repos/{repository}/branches/main")
    if not isinstance(branch, dict) or branch.get("protected") is not True:
        fail("GitHub reports refs/heads/main protected=false")

    listing = gh_json(f"repos/{repository}/rulesets")
    rows = listing if isinstance(listing, list) else []
    active = [
        row for row in rows
        if isinstance(row, dict) and row.get("target") == "branch" and row.get("enforcement") == "active"
    ]
    if not active:
        fail("no active branch rulesets are visible")

    attestation = load_attestation()
    overbroad: list[str] = []
    candidates: list[tuple[str, list[str]]] = []
    matches: list[str] = []
    for row in active:
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
        ok, errors = valid_main_ruleset(detail, attestation, repository)
        if ok:
            matches.append(name)
        else:
            candidates.append((name, errors))

    if overbroad:
        fail("; ".join(overbroad))
    if not matches:
        detail_text = "; ".join(f"{name!r}: {', '.join(errors)}" for name, errors in candidates)
        fail(f"no active ruleset exactly matches MouldMaster solo-maintainer main policy"
             + (f" ({detail_text})" if detail_text else ""))

    print(
        f"Verified protected solo-maintainer policy on {MAIN_REF}: pull requests, resolved threads, "
        f"{len(REQUIRED_CONTEXTS)} required checks, squash-only history and security/review controls."
    )


def self_test() -> None:
    good = {
        "id": 123,
        "updated_at": "2026-09-11T00:00:00Z",
        "target": "branch",
        "enforcement": "active",
        "bypass_actors": [],
        "current_user_can_bypass": "never",
        "conditions": {"ref_name": {"include": [MAIN_REF], "exclude": []}},
        "rules": [
            {"type": "deletion"},
            {"type": "non_fast_forward"},
            {"type": "required_linear_history"},
            {"type": "code_scanning", "parameters": {"code_scanning_tools": [{
                "tool": "CodeQL",
                "security_alerts_threshold": "medium_or_higher",
                "alerts_threshold": "all",
            }]}},
            {"type": "code_quality", "parameters": {"severity": "all"}},
            {"type": "copilot_code_review", "parameters": {"review_on_push": True, "review_draft_pull_requests": True}},
            {"type": "pull_request", "parameters": {
                "allowed_merge_methods": ["squash"],
                "required_approving_review_count": 0,
                "required_review_thread_resolution": True,
                "dismiss_stale_reviews_on_push": True,
                "require_last_push_approval": False,
            }},
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
    assert ok, errors

    def bad(mutator):
        candidate = json.loads(json.dumps(good))
        mutator(candidate)
        assert not valid_main_ruleset(candidate)[0]

    bad(lambda x: x["rules"][-2]["parameters"].update(required_approving_review_count=1))
    bad(lambda x: x["rules"][-2]["parameters"].update(required_review_thread_resolution=False))
    bad(lambda x: x["rules"][-2]["parameters"].update(dismiss_stale_reviews_on_push=False))
    bad(lambda x: x["rules"][-2]["parameters"].update(require_last_push_approval=True))
    bad(lambda x: x["rules"][-1]["parameters"]["required_status_checks"].pop())
    bad(lambda x: x["rules"].__setitem__(3, {"type": "code_scanning", "parameters": {"code_scanning_tools": []}}))
    bad(lambda x: x["conditions"]["ref_name"].update(include=["refs/heads/Main"]))

    matching_attestation = {
        "schema": 1,
        "source": "admin-verified-ruleset-detail",
        "repository": "example/project",
        "ruleset_id": 123,
        "ruleset_updated_at": "2026-09-11T12:00:00+12:00",
        "bypass_actors": [],
        "current_user_can_bypass": "never",
    }
    missing_bypass = json.loads(json.dumps(good))
    missing_bypass.pop("bypass_actors")
    assert valid_main_ruleset(missing_bypass, matching_attestation, "example/project")[0]
    stale = dict(matching_attestation, ruleset_updated_at="2026-09-10T12:00:00+12:00")
    assert not valid_main_ruleset(missing_bypass, stale, "example/project")[0]

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

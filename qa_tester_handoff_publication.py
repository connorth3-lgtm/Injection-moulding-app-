#!/usr/bin/env python3
"""Synthetic GitHub API contract fixtures: no network, no release authorization."""
from qa_tester_handoff import check_publication_provenance

SHA = "a" * 40
OTHER = "b" * 40
BRANCH = {"commit": {"sha": SHA}}
SUCCESS = {
    "name": "MouldMaster Pages Release Readiness",
    "path": ".github/workflows/pages.yml",
    "event": "push",
    "head_branch": "main",
    "head_sha": SHA,
    "status": "completed",
    "conclusion": "success",
}


def rejects(branch, records, expected, reason):
    try:
        check_publication_provenance(branch, records, expected)
    except AssertionError as exc:
        assert reason in str(exc).lower(), (reason, str(exc))
        return
    raise AssertionError("Rejected publication provenance unexpectedly passed: " + reason)


check_publication_provenance(BRANCH, {"workflow_runs": [SUCCESS]}, SHA)
check_publication_provenance(BRANCH, {"workflow_runs": [{**SUCCESS, "status": "failure"}, SUCCESS]}, SHA)
rejects({"commit": {"sha": OTHER}}, {"workflow_runs": [SUCCESS]}, SHA, "stale")
rejects({"commit": {}}, {"workflow_runs": [SUCCESS]}, SHA, "stale")
rejects(BRANCH, {"workflow_runs": []}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "event": "pull_request"}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "event": "workflow_dispatch"}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "head_branch": "preview"}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "head_sha": OTHER}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "path": ".github/workflows/legacy.yml"}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "conclusion": "failure"}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "conclusion": "cancelled"}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "status": "in_progress", "conclusion": None}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{**SUCCESS, "status": "queued", "conclusion": None}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [{"name": SUCCESS["name"]}]}, SHA, "no successful")
rejects(BRANCH, {"workflow_runs": [None]}, SHA, "no successful")
rejects(BRANCH, [], SHA, "malformed")
rejects(BRANCH, {"workflow_runs": {}}, SHA, "malformed")
rejects([], {"workflow_runs": [SUCCESS]}, SHA, "invalid")
rejects(BRANCH, {"workflow_runs": [SUCCESS]}, "not-a-commit", "invalid")
print("Tester handoff publication-provenance QA passed: 1 success and 18 negative synthetic GitHub fixtures. No external testing signoff claimed.")

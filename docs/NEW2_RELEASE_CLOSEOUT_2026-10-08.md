# New2 release governance closeout — 8 October 2026

This is an evidence-based handoff, not approval to weaken CI or declare external validation PASS.

## Observed current state

- Release candidate: `2026.10.08.6`, main and preview both at `5df9c6fb22337d570c5012ead9cd1f06989be55c`.
- Live main ruleset `22155472` is active with six required status contexts but reports `required_approving_review_count=0`, `require_last_push_approval=false`, `dismiss_stale_reviews_on_push=false`. The canonical one-independent-approval/latest-head policy is not yet effective.
- Preview Candidate run 37737028019 failed the **merged-PR provenance** step on a direct preview synchronization. Branch Release Assurance run 37737027991 failed because Preview Candidate is a required upstream dependency. Do not mark either green merely because main/preview match.
- The separately triggered main Branch Release Assurance succeeded; these results should not be conflated.
- Release QA and mobile browser checks are not substitutes for physical devices, independent SMEs, accessibility specialists or authorized production trials.

## Administrator-only gate (issue #43)

1. Obtain authorized GitHub repository administrator access and at least one genuinely independent latest-head reviewer.
2. Run `.github/scripts/apply-main-ruleset.sh --dry-run`, then use its `--apply` mode after reviewing the policy diff.
3. Verify the **live** ruleset using `python3 tools/verify_main_ruleset.py --repository connorth3-lgtm/Injection-moulding-app-`.
4. Confirm one required independent approval, last-push approval, stale approvals dismissed, six required contexts, no bypass actors, squash/linear history and review-thread resolution.
5. Do not close #43 until the live server settings match the canonical policy. The connected GitHub App lacks Administration permission; a repository source change cannot apply this rule.

## Preview provenance recovery

1. Do not direct-push or force-sync main to preview as a release-validation shortcut.
2. Create a reviewable feature branch, run the required exact-head checks, then merge an approved PR **targeting preview** using the repo's allowed merge method.
3. Confirm the resulting preview head is attributable to exactly one merged preview PR with the required PR-head workflows successful, as required by `tools/verify_preview_source.py`.
4. Re-run Preview Candidate and Branch Release Assurance on that **new exact preview SHA**. Record links and keep HOLD if either fails.
5. Promote to main only through its separately governed PR path; physical-device release authorization remains an independent HOLD.

## Engineering release boundary

Pending engineering work is tracked in #442. Geometry and educational screens do not establish pressure-drop models, cycle-time predictions, material limits or production recipe authority. Production-facing promotion requires controlling machine/mould/material sources and published or physical validation.

References: issues #43, #414, #442; `GOVERNANCE_STATUS.md`; `qa/PWA_PHYSICAL_DEVICE_2026.10.08.6.md`.

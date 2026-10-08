# New2 release/preview governance closeout — 8 October 2026

This is an exact-head workflow handoff, **not** authorization to weaken controls or promote external validation HOLDs.

## Verified current release and ruleset

- Current learner-facing version: `2026.10.08.6`. At the starting audit, main and preview shared commit `5df9c6fb22337d570c5012ead9cd1f06989be55c`.
- Live `main` ruleset `22155472`, `connor`, is active, main-only, with no bypass, required pull requests, squash/linear history, review-thread resolution, CodeQL/code-quality/Copilot gates and all six required status checks.
- `data/main-governance-policy-v1.json` (version `2026.10.07.solo1`) and `.github/MAIN_PROTECTION.md` specify a **solo-maintainer manual owner-merge policy**, explicitly requiring **zero** second-person approvals and no last-push or stale-approval requirement. The observed live rule settings match these aspects of the current policy.
- Automated release/health documentation already reports native main governance **enforced**. No ruleset change is proposed here; a GitHub App without Administration permission cannot change live rulesets.
- Open issue #43 describes a historical, superseded independent-review policy. Reconcile the issue with current live evidence rather than treating its old text as a new ruleset defect.

## Actual current preview failure

- Preview Candidate run `37737028019` failed the **merged-PR preview provenance** step. The preview head had been directly synchronized to the main commit rather than created by a qualifying merged PR targeting `preview`.
- Branch Release Assurance run `37737027991` failed as a consequence, because a successful Preview Candidate is a required exact-preview-push dependency.
- On that same SHA, the separately triggered main Branch Release Assurance succeeded. Do not conflate distinct branch workflows even when their SHAs are identical.
- Strict preview provenance is intentional; do **not** disable it, manually set a check success, or call this an application-runtime failure.

## Reviewable preview recovery

1. Create a feature branch and a PR **targeting preview**; never use an unreviewed direct push/force-sync as a release-validation shortcut.
2. Run Release QA, Mobile Browser QA, Question Quality 50-Pass and Pre-merge Public Candidate on the **exact PR head**. Resolve any failing gate.
3. The maintainer deliberately reviews the diff and performs the permitted squash merge into preview; no independent GitHub approval is falsely claimed under the current solo-owner policy.
4. Confirm that the resulting preview SHA belongs uniquely to that merged preview PR, as required by `tools/verify_preview_source.py`.
5. Verify Preview Candidate and Branch Release Assurance are successful on the **new exact preview SHA**. Keep preview blocked if either fails.
6. A later main promotion still needs a separate owner-authorized main PR, exact-head checks and its own external-validation decision.

## Engineering promotion boundary

Additional calculation work is tracked under #442. New geometry/teaching helpers cannot imply validated pressure loss, flow partition, crystallization/solidification, cycle time, machine suitability or production recipes. Promotion requires controlling source evidence, QA integration, appropriate published/physical validation and canonical runtime/release governance.

References: issues #43, #414, #442; `GOVERNANCE_STATUS.md`; `qa/PWA_PHYSICAL_DEVICE_2026.10.08.6.md`.

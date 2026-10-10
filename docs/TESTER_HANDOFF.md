# MouldMaster — controlled tester handoff

**Release family:** `2026.10.09.6`  
**Status:** PREPARED, **not cleared to circulate** until the protected-main hosted preview and human checks below are verified.

This is an owner-facing rollout playbook for a **small, voluntary, non-production usability cohort**. It is **not** production-root launch approval, physical-device authorization, formal real-AT testing, a learner-outcomes study, NZQA/provider approval or machine-control authorisation.

## Distribution decision

MouldMaster has separate destinations:

- **Protected `main`** supplies the hosted Pages publication workflow. The root stays a release-hold page until its exact-runtime physical-device gate is satisfied.
- **`/preview/`** is the only permitted non-production hosted learner testing path while that HOLD remains. The root hold may automatically forward visitors to this preview, but always distribute the *explicit preview link*.
- **`preview` Git branch is not the live Pages `/preview/` URL.** Merging into the Git branch alone **does not deploy** the new learner runtime; the protected-main promotion and Pages publication still have to occur through the repository's normal controls.
- **Pre-merge exact candidate artifacts** are immutable technical evidence. They are not a human/device validation result and not proof that the hosted site contains the same bytes.

## Automated preflight — required

1. From the intended source checkout, run `python3 qa_tester_handoff.py` for repository/invitation/privacy consistency.
2. Complete the governed protected-main promotion manually. Do not bypass required exact-head branch rules, authorisation, software QA, or the existing release candidate contract. A merged `preview` PR alone is **not** a hosted deployment.
3. Record the **actual protected-main commit SHA** from the Pages publication run. After the **MouldMaster Pages Release Readiness** deployment is successful, run:

   ```sh
   python3 qa_tester_handoff.py --live --expected-source-sha <ACTUAL_PROTECTED_MAIN_COMMIT_SHA>
   ```

   The command first independently checks the GitHub API: the supplied SHA **must equal the latest protected `main` HEAD**, and that same HEAD must have a **successful `push` execution of the governed Pages workflow**. A stale commit, still-running or failed run, successful PR-only candidate, manual dispatch, GitHub API failure or old preview must be treated as **STOP / no-send**, even when the old preview's release/version and its own asset manifest are internally consistent. The command then verifies the live root HOLD, `/preview/` markers, deployment source, manifest/asset integrity, public/private asset boundary, and `version.json` release identity. It must exit **zero**. Do not substitute the PR's pre-merge SHA for the protected-main merge commit. GitHub API connectivity is mandatory for this operator-only check; the normal offline repository QA remains network-free.
4. Capture a non-sensitive record of the checked release, deployed SHA, checked date, Pages run link, result and operator in the handoff notes. No private tester identifiers belong in public source control.

## Manual preflight — required

Use a fresh personal browser profile (no production/customer information). At least **one desktop browser and one touch-sized viewport** must be tried by the operator for this informal release; real device/AT certification remain separate governed workstreams.

- [ ] The explicit `https://connorth3-lgtm.github.io/Injection-moulding-app-/preview/` link loads the **current** intended release; there is no stale redirect to a different release or broken startup.
- [ ] The **Non-production preview** warning remains visible and its safety and physical-device boundaries are clear.
- [ ] A pseudonymous learner can open Home, Learn, a lesson, Book, Practice and Mission Control; back/navigation controls work with touch/keyboard.
- [ ] A fictional mission and its evidence survive reload for the same local learner; switching A→B→A never reveals the wrong learner's title, evidence or progress.
- [ ] The Support and Privacy pages load from `/preview/support.html` and `/preview/privacy.html`; the safe diagnostic copy and learner-problem report link are discoverable.
- [ ] Text scaling and mobile navigation do not make core actions inaccessible; capture only *non-sensitive* reproduction descriptions.
- [ ] If inviting installed-PWA testers, test first online load, install (where supported), offline reopening and update recovery with disposable local data. Do not claim formal physical-device validation from this informal check.
- [ ] Issue template and a **private fallback reply route to the inviter** are workable, including for people without GitHub accounts.
- [ ] The contact/invitation wording explicitly forbids real production data, private backups and training-as-production usage.
- [ ] The owner has triage capacity for P0/P1 reports and can pause additional invitations promptly.

## Android screenshot regression — active Mission Control mobile Home

A user-supplied Android-style portrait capture (10 October 2026) shows an eight-step Mission Control timeline visually covering the Book card/CTA, alongside a horizontally clipped machine/mould/material context row. The screenshot does **not** identify its release SHA, installed service-worker generation, browser/PWA mode or device/zoom settings, so it must be treated as an **unresolved mobile visual report**, not proof that the current source passes or fails on that exact device.

Before sending invitations, reproduce an active **fictional** mission on Home at mobile widths 320, 360, 390 and 412 CSS px and at 200% zoom. Verify:

- [ ] The numbered mission timeline occupies **normal document flow immediately above** Today’s focus; it is not a floating strip over Book, lesson or the bottom tabs.
- [ ] All five context fields can be reached and read without sideways page scrolling; labels wrap rather than being cut off.
- [ ] Book’s **Open Book** action, the five mobile tabs, all stage buttons and **Next** remain touch reachable. Confirm when scrolled to Book, not only on initial load.
- [ ] Record the **App version** shown on the in-app update card (where available), exact `/preview/` URL or installed-PWA mode, phone/browser, zoom/text scale, steps and **non-sensitive** before/after screenshots. Do not send learner exports or industrial identifiers.
- [ ] If a PWA seems stale, first close its open windows/tabs completely, reconnect and reopen. If still stale, the in-app **Repair app files** option is a scoped service-worker/cache repair; it is *not* permission to clear site storage or erase profiles. Recheck the app version, screenshot geometry and learner A→B→A isolation after repair.

Automated CSS assertions and browser viewport regressions are helpful but **do not replace physical device/user visual evidence**. Keep #520 and the relevant device/AT release gates on HOLD until actual bound verification is recorded.

## STOP / no-send conditions

Any failing automated live preflight; mismatched deploy SHA or web release; absent preview notice; production-root learner runtime while the physical gate is HOLD; inaccessible first-run learning; cross-learner data leakage; unsafe machine advice; unverified destructive learner reset; inability to receive problem reports; or loss of the privacy/Support boundary means **do not distribute** until repaired and rechecked.

If the Pages URL cannot be reached to run the live check, treat it as **NOT VERIFIED**, not a pass.

## What can be shared after a pass

Send the text in [TESTER_INVITATION.md](TESTER_INVITATION.md) with the [tester quick start](TESTER_QUICK_START.md). Begin with a small invited group and ask for device/browser, what was attempted, expectation, actual behaviour and minimal reproduction steps. Do not request raw production data, learner exports or identifying data.

Triage reports using [TESTER_FEEDBACK_TRIAGE.md](TESTER_FEEDBACK_TRIAGE.md); use [SECURITY.md](../SECURITY.md) for private security disclosure. Participation in a *formal* real-learner study needs separately governed information and consent under `data/learner-pilot-v1.json`.

## Boundaries retained

The current release ledger `data/release-external-validation-v1.json` keeps **physical-device**, **real assistive technology**, **Windows signed distribution**, **Book SME**, **curriculum SME**, **learner outcomes** and **NZQA/provider** as **HOLD**. Public release/accreditation/validated-production claims are prohibited until the distinct evidence and approvals exist. MouldMaster remains advisory-only.

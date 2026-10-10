# Real assistive-technology validation — staged 2026.10.09.5

**STATUS: HOLD — NOT APPROVED / NO HUMAN VALIDATION.**

The proposed `2026.10.09.5` UI-timing candidate improves More-dialog isolation, first-run onboarding polish and removes an obsolete certificate statline mutator. Its web/PWA identity is separate from the deployed `2026.10.09.4` preview. **A protected-main code merge and non-production preview deployment are not independent human/device acceptance, certification or production-root approval. All release-specific external validation remains HOLD.**

**Required evidence:** Human NVDA/Firefox, NVDA/Chromium and VoiceOver/macOS/iOS interaction matrix; keyboard, focus, live-region, modal transitions and 200% zoom.

The earlier `2026.10.09.4` retained candidate (source `ff53e2958d7c97d99aba890a23ba7caf4f21d3c6`, public fingerprint `sha256:7776a3ccccd8d049e7b9a5167e957651220d8f98a8da3b51b046ab85ae0f53a8`) is **history only** and must not authorize this changed runtime. Retained technical candidate: source `581e08e58f0b9ec3c7a3501f9a3a71d47ed2c184`, public-runtime fingerprint `sha256:216ec18dc5687ffbbb6aecee36b595533b65deb6c25c2c2bb7693f0bc6a97bcf`, successful producer run `37878945696`, artifact `11593612154` (SHA-256 `sha256:d5309909602f89c47afda61418489e1543eccfbdd3b71dbefc892fdbaf5990eb`, expires `2027-01-07T03:22:06Z`). This identifies technical test bytes only; PR-head CI, human visual acceptance, real devices, NVDA/VoiceOver, SMEs, learner outcomes, NZQA/provider evidence and production authorization remain independent HOLDs. Browser automation and emulation are not physical/device or human validation.

The `2026.10.09.5` visual check compares against previous owner-approved `.4` baseline with the strict 12-pixel limit. Any changed imagery still requires scoped visual acceptance. All seven external-validation streams, production-root launch, provider/accreditation assertions, signed Windows package distribution and manufacturing/recipe authority remain **HOLD**. See `qa/EXTERNAL_VALIDATION_2026.10.09.5.md` and issue #379.

## Required human NVDA/VoiceOver tasks — NOT EXECUTED

1. `AT-01` Navigate the primary product areas through Mission Control, confirm the persistent context/timeline remain understandable, and return focus predictably.
2. `AT-02` Search and paginate exact commercial material grades.
3. `AT-03` Open sourced exact-grade details and understand property/process evidence boundaries.
4. `AT-04` Complete core learner assessment interactions and confirm state/errors are announced meaningfully.
5. `AT-05` Create or edit a Mould Master evidence case without losing semantic context.
6. `AT-06` Search for a Book topic from the global search, open a late Book chapter from deep in the contents, confirm focus/reading starts at the chapter heading, then return to contents without losing the reader's place.
7. `AT-07` Exercise the collapsed Book publication/review and accuracy/assurance disclosures; confirm their summaries, expanded content and independent-SME HOLD remain understandable without excessive verbosity.
8. `AT-08` Exercise Mission Control command search and evidence drawer plus dialogs, menus, tab-like controls, expandable regions and form validation with keyboard/AT navigation.
9. `AT-09` Confirm status changes that matter to task completion are announced without forcing excessive verbosity.
10. `AT-10` Confirm headings, landmarks, accessible names and focus order remain understandable at realistic zoom/text settings, including the Home hierarchy where Today's focus precedes the Book/Keep Reading surface and specialist tools. From Home, activate Keep Reading and confirm the resumed semantic heading/context is understandable with the named assistive technology rather than relying on scroll position alone.
11. `AT-11` Open Standards & readiness and confirm ISO/NZQA boundaries, current-vs-expired standards, and external HOLD language remain understandable without implying certification, approval or competence.
12. `AT-12` In affected Book chapters, navigate the worked-example heading, data table/list content, calculation steps, boundaries and evidence anchors; confirm the synthetic-data and independent-SME-HOLD wording is understandable with the named real assistive technology.

Every task remains pending for NVDA/Firefox, NVDA/Chromium, VoiceOver/macOS and VoiceOver/iOS. Reviewer/date/evidence fields are null; this is checklist parity only, **not** testing.

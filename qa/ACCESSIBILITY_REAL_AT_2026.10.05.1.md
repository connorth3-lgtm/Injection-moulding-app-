# MouldMaster real assistive-technology validation — 2026.10.05.1

This packet governs **human** assistive-technology validation for web release `2026.10.05.1`. Automated accessibility checks, browser regressions and synthetic screen-reader simulations do not satisfy this boundary.

## Exact release boundary

- web release: `2026.10.05.1`
- retained pre-merge public candidate source commit: `7da05c2e33ea2239943648a815e457cdc9a4fcec`
- public-runtime fingerprint: `sha256:6001f1e7c6b5a15d1f422d2892eed3e24424c93c62dabb5bd4130b242d1f090e`
- retained physical candidate: `physical-pwa-candidate-7da05c2e33ea2239943648a815e457cdc9a4fcec` (`11311939188`)
- candidate build run: `37226962981` (`Pre-merge Public Candidate`)
- artifact ZIP digest: `sha256:71fb5f698230a4cd5722f98e0737e2d1f4a7bb307eb95a44014d0c6bd836c4ae`
- artifact retention expiry: `2027-01-02T19:05:58Z`
- evidence contract: `data/accessibility-real-at-validation-v1.json`

This is a candidate **rebind**, not new AT evidence. Release `2026.10.05.1` is bound to exact pre-merge learner-runtime candidate `7da05c2e33ea2239943648a815e457cdc9a4fcec` / `sha256:6001f1e7c6b5a15d1f422d2892eed3e24424c93c62dabb5bd4130b242d1f090e`. No earlier human or device evidence is relabelled. If learner-facing runtime bytes change again, this packet must be rebound before new validation is recorded; the mutable `preview` branch tip is never validation identity.

## Required matrix

Every row must be tested by a human reviewer using the named real assistive technology:

| Matrix row | Platform | Browser | Assistive technology | Current status |
| --- | --- | --- | --- | --- |
| `nvda-firefox-windows` | Windows | Firefox | NVDA | pending |
| `nvda-chromium-windows` | Windows | Chrome/Chromium | NVDA | pending |
| `voiceover-safari-macos` | macOS | Safari | VoiceOver | pending |
| `voiceover-safari-ios` | iOS | Safari | VoiceOver | pending |

## Required tasks for each row

1. `AT-01` — Navigate the primary product areas and return focus predictably.
2. `AT-02` — Search and paginate exact commercial material grades.
3. `AT-03` — Open sourced exact-grade details and understand property/process evidence boundaries.
4. `AT-04` — Complete core learner assessment interactions and confirm state/errors are announced meaningfully.
5. `AT-05` — Create or edit a Mould Master evidence case without losing semantic context.
6. `AT-06` — Search for a Book topic from the global search, open a late Book chapter from deep in the contents, confirm focus/reading starts at the chapter heading, then return to contents without losing the reader's place.
7. `AT-07` — Exercise the collapsed Book publication/review and accuracy/assurance disclosures; confirm their summaries, expanded content and independent-SME HOLD remain understandable without excessive verbosity.
8. `AT-08` — Exercise dialogs, menus, tab-like controls, expandable regions and form validation with keyboard/AT navigation.
9. `AT-09` — Confirm status changes that matter to task completion are announced without forcing excessive verbosity.
10. `AT-10` — Confirm headings, landmarks, accessible names and focus order remain understandable at realistic zoom/text settings, including the Home page hierarchy where Today's focus precedes the secondary Workbench and the compact desktop More-tools navigation where applicable.
11. `AT-11` — Open Standards & readiness and confirm ISO/NZQA boundaries, current-vs-expired standards, and external HOLD language remain understandable without implying certification, approval or competence.
12. `AT-12` — In affected Book chapters, navigate the worked-example heading, data table/list content, calculation steps, boundaries and evidence anchors; confirm the synthetic-data and independent-SME-HOLD wording is understandable with the named real assistive technology.

## Evidence rules

For each validated matrix row, record only public-safe metadata in `data/accessibility-real-at-validation-v1.json`:

- `testedAt` with timezone;
- all 12 `taskEvidence` entries marked `pass`, each with a non-sensitive task-level `evidenceRef`; 
- a non-sensitive `reviewer` reference;
- a non-sensitive `evidenceRef` pointing to externally retained notes/evidence.

Do not commit recordings, screenshots with personal data, customer/site identifiers, credentials or proprietary process information.

## Completion boundary

The top-level accessibility status may move from `hold` to `validated` only after all four matrix rows genuinely pass and `python qa_accessibility_real_at_contract.py` plus `python tools/verify_release_external_validation.py` both pass for this exact release/candidate.

Until then, real-AT validation remains **HOLD**.

> Merge-candidate CI governance note: release identity is `2026.10.05.1`; this packet is documentation-only and does not assert fresh physical-device or assistive-technology validation.

> Final CI provenance note: this packet remains HOLD for human validation; repository CI evidence is not a substitute for real-device/assistive-technology validation.

## Deep-review regression focus

Confirm that **Source evidence reviewed** and **Independent human SME review: pending** are distinguishable by the named assistive technology, and that material-grade details expose evidence provenance separately from commercial/source currentness.
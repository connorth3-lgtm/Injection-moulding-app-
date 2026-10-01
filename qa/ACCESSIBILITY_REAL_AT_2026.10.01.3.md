# MouldMaster real assistive-technology validation — 2026.10.01.3

This packet governs **human** assistive-technology validation for web release `2026.10.01.3`. Automated accessibility checks, browser regressions and synthetic screen-reader simulations do not satisfy this boundary.

## Exact release boundary

- web release: `2026.10.01.3`
- retained pre-merge public candidate source commit: `077d3ff1b484592fa03f4c4e8532b2c1d7cb5553`
- public-runtime fingerprint: `sha256:13b0f7631036134e3acc786806fe9eca547de62aa5b1d2c57c08d386cbe95010`
- retained physical candidate: `physical-pwa-candidate-077d3ff1b484592fa03f4c4e8532b2c1d7cb5553` (`11136740498`)
- candidate build run: `36803075482` (`Pre-merge Public Candidate`)
- artifact ZIP digest: `sha256:4dc9ddc82f8c9b5d4176ab257d0415a96ee2e55ff023342231a87f04a64f1fdc`
- artifact retention expiry: `2026-10-31T01:51:33Z`
- evidence contract: `data/accessibility-real-at-validation-v1.json`

This is a candidate **rebind**, not new AT evidence. Release `2026.10.01.3` is bound to exact pre-merge learner-runtime candidate `077d3ff1b484592fa03f4c4e8532b2c1d7cb5553` / `sha256:13b0f7631036134e3acc786806fe9eca547de62aa5b1d2c57c08d386cbe95010`. No earlier human or device evidence is relabelled. If learner-facing runtime bytes change again, this packet must be rebound before new validation is recorded.

## Required matrix

Every row must be tested by a human reviewer using the named real assistive technology:

| Matrix row | Platform | Browser | Assistive technology | Current status |
| --- | --- | --- | --- | --- |
| `nvda-firefox-windows` | Windows | Firefox | NVDA | pending |
| `nvda-chromium-windows` | Windows | Chrome/Chromium | NVDA | pending |
| `voiceover-safari-macos` | macOS | Safari | VoiceOver | pending |
| `voiceover-safari-ios` | iOS | Safari | VoiceOver | pending |

## Required tasks for each row

1. Navigate the primary product areas and return focus predictably.
2. Search and paginate exact commercial material grades.
3. Open sourced exact-grade details and understand property/process evidence boundaries.
4. Complete core learner assessment interactions and confirm state/errors are announced meaningfully.
5. Create or edit a Mould Master evidence case without losing semantic context.
6. Search for a Book topic from the global search, open a late Book chapter from deep in the contents, confirm focus/reading starts at the chapter heading, then return to contents without losing the reader's place.
7. Exercise the collapsed Book publication/review and accuracy/assurance disclosures; confirm their summaries, expanded content and independent-SME HOLD remain understandable without excessive verbosity.
8. Exercise dialogs, menus, tab-like controls, expandable regions and form validation with keyboard/AT navigation.
9. Confirm status changes that matter to task completion are announced without forcing excessive verbosity.
10. Confirm headings, landmarks, accessible names and focus order remain understandable at realistic zoom/text settings, including the Home page hierarchy where Today's focus precedes the secondary Workbench and the compact desktop More-tools navigation where applicable.
11. Open Standards & readiness and confirm ISO/NZQA boundaries, current-vs-expired standards, and external HOLD language remain understandable without implying certification, approval or competence.
12. In affected Book chapters, confirm each governed engineering diagram has meaningful alternative text, readable captioning and a clear non-scale/SME-HOLD boundary; then  navigate the worked-example heading, data table/list content, calculation steps, boundaries and evidence anchors; confirm the synthetic-data and independent-SME-HOLD wording is understandable with the named real assistive technology.

## Evidence rules

For each validated matrix row, record only public-safe metadata in `data/accessibility-real-at-validation-v1.json`:

- `testedAt` with timezone;
- a non-sensitive `reviewer` reference;
- a non-sensitive `evidenceRef` pointing to externally retained notes/evidence.

Do not commit recordings, screenshots with personal data, customer/site identifiers, credentials or proprietary process information.

## Completion boundary

The top-level accessibility status may move from `hold` to `validated` only after all four matrix rows genuinely pass and `python qa_accessibility_real_at_contract.py` plus `python tools/verify_release_external_validation.py` both pass for this exact release/candidate.

Until then, real-AT validation remains **HOLD**.

> Merge-candidate CI governance note: release identity is `2026.10.01.3`; this packet is documentation-only and does not assert fresh physical-device or assistive-technology validation.

> Final CI provenance note: this packet remains HOLD for human validation; repository CI evidence is not a substitute for real-device/assistive-technology validation.

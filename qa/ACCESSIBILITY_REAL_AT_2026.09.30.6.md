# MouldMaster real assistive-technology validation — 2026.09.30.6

This packet governs **human** assistive-technology validation for web release `2026.09.30.6`. Automated accessibility checks, browser regressions and synthetic screen-reader simulations do not satisfy this boundary.

## Exact release boundary

- web release: `2026.09.30.6`
- retained pre-merge public candidate source commit: `5e5f8a8814f68c771632dc480f31e775c900f74b`
- public-runtime fingerprint: `sha256:89830ff04fb3b1b09563a1732acc9dd3353c6bb1bcd5e7219fbf2d9f7dd60a58`
- retained physical candidate: `physical-pwa-candidate-5e5f8a8814f68c771632dc480f31e775c900f74b` (`11075697503`)
- candidate build run: `36665186366` (`MouldMaster Pages Release Readiness`)
- artifact ZIP digest: `sha256:650b0b71a9a9c37d09df2037ab4a3abbe0c35990e7d9800c1b476632e58ca31e`
- artifact retention expiry: `2026-10-30T03:37:38Z`
- evidence contract: `data/accessibility-real-at-validation-v1.json`

This is a candidate **rebind**, not new AT evidence. Release `2026.09.30.6` is bound to exact protected-`main` runtime `5e5f8a8814f68c771632dc480f31e775c900f74b` / `sha256:89830ff04fb3b1b09563a1732acc9dd3353c6bb1bcd5e7219fbf2d9f7dd60a58`. No earlier human or device evidence is relabelled. If learner-facing runtime bytes change again, this packet must be rebound before new validation is recorded.

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
10. Confirm headings, landmarks, accessible names and focus order remain understandable at realistic zoom/text settings, including the balanced tablet Home workspace and compact desktop More-tools navigation where applicable.
11. Open Standards & readiness and confirm ISO/NZQA boundaries, current-vs-expired standards, and external HOLD language remain understandable without implying certification, approval or competence.
12. In affected Book chapters, navigate the worked-example heading, data table/list content, calculation steps, boundaries and evidence anchors; confirm the synthetic-data and independent-SME-HOLD wording is understandable with the named real assistive technology.

## Evidence rules

For each validated matrix row, record only public-safe metadata in `data/accessibility-real-at-validation-v1.json`:

- `testedAt` with timezone;
- a non-sensitive `reviewer` reference;
- a non-sensitive `evidenceRef` pointing to externally retained notes/evidence.

Do not commit recordings, screenshots with personal data, customer/site identifiers, credentials or proprietary process information.

## Completion boundary

The top-level accessibility status may move from `hold` to `validated` only after all four matrix rows genuinely pass and `python qa_accessibility_real_at_contract.py` plus `python tools/verify_release_external_validation.py` both pass for this exact release/candidate.

Until then, real-AT validation remains **HOLD**.


> Merge-candidate CI governance note: release identity remains the canonical `2026.09.30.6`; this packet is documentation-only and does not assert fresh physical-device or assistive-technology validation.


> Final CI provenance note: this packet remains HOLD for human validation; repository CI evidence is not a substitute for real-device/assistive-technology validation.

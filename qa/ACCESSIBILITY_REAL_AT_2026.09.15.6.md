# MouldMaster real assistive-technology validation — 2026.09.15.6

This packet governs **human** assistive-technology validation for web release `2026.09.15.6`. Automated accessibility checks, browser regressions and synthetic screen-reader simulations do not satisfy this boundary.

## Exact release boundary

- web release: `2026.09.15.6`
- protected-main source commit: `f5055cf8b156f1887dcd37aa214d37587be97493`
- public-runtime fingerprint: `sha256:5ba0738492ee3e9747150f4638ad327f91786a7a972d68162e08af276543045f`
- evidence contract: `data/accessibility-real-at-validation-v1.json`

If learner-facing runtime bytes change, this packet must be rebound to the new release/fingerprint before new validation is recorded.

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
6. Exercise dialogs, menus, tab-like controls, expandable regions and form validation with keyboard/AT navigation.
7. Confirm status changes that matter to task completion are announced without forcing excessive verbosity.
8. Confirm headings, landmarks, accessible names and focus order remain understandable at realistic zoom/text settings.

## Evidence rules

For each validated matrix row, record only public-safe metadata in `data/accessibility-real-at-validation-v1.json`:

- `testedAt` with timezone;
- a non-sensitive `reviewer` reference;
- a non-sensitive `evidenceRef` pointing to externally retained notes/evidence.

Do not commit recordings, screenshots with personal data, customer/site identifiers, credentials or proprietary process information.

## Completion boundary

The top-level accessibility status may move from `hold` to `validated` only after all four matrix rows genuinely pass and `python qa_accessibility_real_at_contract.py` plus `python tools/verify_release_external_validation.py` both pass for this exact release.

Until then, real-AT validation remains **HOLD**.
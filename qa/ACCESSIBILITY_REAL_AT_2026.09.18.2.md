# MouldMaster real assistive-technology validation — 2026.09.18.2

This packet governs **human** assistive-technology validation for web release `2026.09.18.2`. Automated accessibility checks, browser regressions and synthetic screen-reader simulations do not satisfy this boundary.

## Exact release boundary

- web release: `2026.09.18.2`
- retained pre-merge public candidate source commit: `f0bbf8410d3736da955fb0256e0c7dc1288d0712`
- public-runtime fingerprint: `sha256:dd89c6283eaae5c72abc08b22390610ab4e8326b1a5255ad97890df2fff04752`
- retained physical candidate: `physical-pwa-candidate-f0bbf8410d3736da955fb0256e0c7dc1288d0712` (`10524804805`)
- candidate build run: `35288487442` (`Pre-merge Public Candidate`)
- artifact ZIP digest: `sha256:f7b6b8cae45f1db5ce1cb53f74d195b90e848bc149f4c4a16e9bb2509e372716`
- artifact retention expiry: `2026-10-17T23:49:02Z`
- evidence contract: `data/accessibility-real-at-validation-v1.json`

This is a candidate **rebind**, not new AT evidence. The learner-facing runtime deliberately advanced to release `2026.09.18.2` for the learner-backup integrity change and coherent Book runtime/integrity identity. No earlier human/device evidence is relabelled. If learner-facing runtime bytes change again, this packet must be rebound before new validation is recorded.

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
10. Confirm headings, landmarks, accessible names and focus order remain understandable at realistic zoom/text settings, including the balanced tablet Home workspace and compact desktop More-tools navigation where applicable.\n11. In affected Book chapters, navigate the worked-example heading, data table/list content, calculation steps, boundaries and evidence anchors; confirm the synthetic-data and independent-SME-HOLD wording is understandable with the named real assistive technology.

## Evidence rules

For each validated matrix row, record only public-safe metadata in `data/accessibility-real-at-validation-v1.json`:

- `testedAt` with timezone;
- a non-sensitive `reviewer` reference;
- a non-sensitive `evidenceRef` pointing to externally retained notes/evidence.

Do not commit recordings, screenshots with personal data, customer/site identifiers, credentials or proprietary process information.

## Completion boundary

The top-level accessibility status may move from `hold` to `validated` only after all four matrix rows genuinely pass and `python qa_accessibility_real_at_contract.py` plus `python tools/verify_release_external_validation.py` both pass for this exact release/candidate.

Until then, real-AT validation remains **HOLD**.

# Integration handoff to the human-voice Book branch

Target base: `feature/book-human-voice-pass` (PR #332)

Research source: PR #333, Waves 1–9 plus the completed 12-artifact editorial pack.

The integration map is `data/research-expansion/2026-09-15/book-artifact-integration-map-v1.json` on the research branch.

## Integration rules

1. Keep every `data/` Book source file byte-identical to its matching `src/domains/learning/book-data/` runtime copy after each content change.
2. Treat every reported numerical result as case/source specific.
3. Keep synthetic worksheet/grid values explicitly labelled synthetic.
4. Do not expand publication authorization implicitly.
5. Run the full Book/release QA suite after learner-runtime changes.
6. Do not relabel the existing `2026.09.14.4` physical-device candidate; choose a deliberate new release identity if the enriched Book is released.

## Recommended first integration batch

Integrate the four highest-priority additions first:

- hot-runners — `Command is not cavity state`
- black-specks — `Build evidence before naming the cause`
- cooling — `Diagnose, restore and verify`
- mould-anatomy — advanced lifecycle callout `Mould condition changes through its life`

Then integrate the remaining eight artifacts in the order captured by the research integration map.

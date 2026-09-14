# Stacked PR notes

Base Book branch: `feature/book-human-voice-pass` (PR #332)

Research evidence branch: `research/book-data-enrichment-20260914` (PR #333)

The next Book-content change should be a separate stacked PR because it changes learner-runtime bytes. The first integration commit should update the `data/` Book source file and its matching `src/domains/learning/book-data/` copy in the same commit and verify byte identity before moving to the next chapter.

Recommended first commit scope: `hot-runners`, `black-specks`, `cooling`, and the advanced `mould-anatomy` lifecycle callout.

Do not change publication authorization or release identity in the same commit as editorial integration. Let QA expose the expected release-version boundary first, then make the release decision explicitly.

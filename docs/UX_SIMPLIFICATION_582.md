# MouldMaster Book as a book — #582

**User direction:** “Make the book just a book.” This is a reading
experience, not another learner dashboard or expert review workflow.
The Academy app retains its already compact Home/Learn/Materials/Practice/More
navigation. The Book is a single reading route, not a competing app.

## What readers see

- **Contents:** Twenty numbered **chapter titles** in one uncluttered table
  of contents. No progress badge, module counter or source-review ratio beside
  every chapter. The 46 canonical governed source modules remain accessible
  from the optional **Source module index**, *after* the chapter contents.
- **Chapter:** A chapter number, title and short introduction, followed
  directly by the **original authored prose**, readable headings, engineering
  illustrations and worked examples in a quiet one-column text layout.
  Chapter goals are kept as opening text, rather than a task dashboard.
- **Page turning:** Ordinary **Previous chapter / Contents / Next chapter**
  controls at the end; direct chapter links, Book resume, read-aloud,
  keyboard navigation and search retain their existing routes and semantics.
- **End matter:** The original Book study prompts, key terms, reader guide,
  claim/source declarations and evidence review status remain present under
  optional **Study questions** and **Notes, sources & review status**
  after the prose, not interleaved as dashboard panels while reading.
- **Review and safety boundaries:** Applicability/scope paragraphs remain
  **visible** inside each governed module. A module not source-reviewed
  retains an immediately visible incomplete-review warning; qualification,
  site and machine controls are never silently promoted or removed.
  The complete original introduction, editorial status and listening action
  remain reachable from Contents, behind a small “About this Book” disclosure.
- **No content deletion:** The Book manifest, all 46 published source modules,
  chapter content, published fingerprints, citations, diagrams, worked cases,
  learning terms, checked claims and separate SME/qualification decisions
  are unchanged. Nothing creates an exact Book-to-Academy link or awards credit.

## Why the navigation was not rewritten

Inspecting the *actual live app* showed that desktop already has five
focused primary destinations (Home, Learn, Materials, Practice, More), with
Book reachable from Home and More. An earlier sidebar rearrangement
accidentally hid Materials and failed browser UX tests; **it was reverted**.
Product improvement means removing distraction, not duplicating or breaking
existing navigation.

## Browser and release review

`qa/premium-ui.spec.js` exercises twenty plain chapter-title controls,
real Book chapter/section text, technical scope visibility, optional
endnotes, source record access, direct Previous/Next/Contents progression,
original introduction/listening/governance access, and a first chapter choice
above the fixed bottom bar at a 360×800 phone viewport. Existing Chromium,
WebKit, Book endurance, mobile visual, physical-PWA and release gates apply.

This **changes visible screenshots and public runtime bytes**, so previous
approved visual snapshots and retained release-validation candidate hashes
cannot authorize the new layout. PR #583 stays **draft** until real screenshots
are deliberately approved by the project owner, a newly successful exact
candidate is retained and all external `HOLD` identity contracts are safely
rebound with the real artifact, and the full exact-head protected CI passes.
No automation can pretend physical-device/iPad/AT, human SME, NZQA/provider,
learner outcome or production validation has happened. Those gates remain
**HOLD** until genuine independent evidence exists.

The goal is *a readable book with sources at the back* rather than an
additional course, catalogue, dashboard or engineering control panel.

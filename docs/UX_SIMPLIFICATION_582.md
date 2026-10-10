# Lean Academy navigation and Book first reading — #582

**Scope:** reversible presentation hierarchy only. No canonical Academy lesson,
Book governed module, source citation, engineering/safety text, assessment,
learner progress, storage schema, permission or PWA route is changed.

## Before and after

| Surface | Previous first screen | Simplified first screen |
| --- | --- | --- |
| Desktop sidebar | 14 core navigation entries under four labels, plus dynamically injected Book and other specialist routes | Home, My learning path, Practice scenarios and Book remain direct actions; existing Material Science, simulators, defects, coach, glossary, standards, exams, certificates, animated visuals, instructor and profile routes move **unchanged** into one native `More · Tools, reference & progress` disclosure. |
| Book contents | Intro paragraph, status, depth-band explanation, learning boundary, first-read policy, key-term guide, then 20 chapter buttons | Clear `Choose a chapter` cue, a short sentence and all 20 reader chapters. Depth-band explanation, source governance, first-read notes and key-term guide remain one optional native disclosure; 46 governed module drilldown remains in its existing optional index. |
| Book chapter | Repeated Book hero and global accuracy card, chapter goal, separate thread/terms/sequence prompts, governance disclosure, then actual prose | Book hero and global accuracy card are hidden **only while reading a 20-chapter reader view**. The chapter title/goal and authored text remain immediate. Reader thread, key terms and sequence prompts move under one optional `Chapter guide`. Module source review status, applicability, diagrams, worked examples, evidence, sources, learning checks and all technical text remain available. |

## Accessibility, safety and release boundaries

- We **move existing sidebar button nodes**, preserving `data-view`, IDs,
  attached event listeners and lesson/role gating; we do not create alternative
  view dispatchers or change storage. On programmatic view changes, an active
  button inside More reopens that disclosure, so deep links do not become
  invisible. The native details summary is reachable by keyboard.
- The mobile bottom navigation, modal More interface, learner progress,
  saved Book position, original governed chapters and read-aloud logic remain
  untouched. Existing source identity/governance and human SME limitations
  are neither promoted nor removed.
- Independent in-person iPad/touch/200%-zoom, assistive technology,
  provider/NZQA and real production-machine validation remain **HOLD**
  regardless of passing automated browser checks. Do not interpret visual
  simplification as permission to issue industrial settings or learning credit.

## Automated regression checks

`qa/premium-ui.spec.js` now verifies that only the three unchanged core
sidebar routes are displayed directly (with Book still dynamically injected),
all 11 previous secondary core routes remain accessible via More, a
programmatic secondary-route navigation reveals its active item, and
20 Book reader chapter controls and optional Book guides remain available.
It verifies that the Book hero returns on navigating back and that the first
reader chapter shows governed authored content without repeated Book chrome.
Cross-browser Premium UI QA and the existing protected release workflows
remain required before merge.

**Not yet demonstrated:** measured learner usability improvement, real
accessibility devices, source-SME signoff, or a reduced production download
payload. The Git repository's larger QA, duplicated Book source-registry
copies and desktop binary are separate packaging/retention decisions that
must not be removed solely to make the tracked tree look smaller.

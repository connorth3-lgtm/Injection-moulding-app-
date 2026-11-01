# Book / Contents / Listening — 18 October 2026 remediation register

**Scope:** presentation, navigation, listening controls and learner state on the Book surface.
**Evidence authority:** unchanged: Book governed content release 2026.10.06.5, 46 modules, 137 claims, 27 synthetic cases, 25 SVG diagrams. The independent Book SME contract remains **HOLD**. No changes to governed Book claims, source registry, published material grades, example arithmetic or external evidence decisions are made by this patch.

## Changes for review

- **Book assurance:** a visible source-evidence-reviewed / human-SME-pending / educational-only statement appears at the beginning of each reader chapter. This is deliberately independent of the publication-authorized status of its underlying 46 governed modules.
- **Original source visibility:** reader modules with an authored omission list include a nearby **Read all original source sections** disclosure. Existing contents of the full governed modules and the Notes evidence panels are unchanged. The 53 consolidated sections are therefore easier to find, but **the substantive equivalence of each omission still needs a human subject-matter review**.
- **First-read examples:** governed *synthetic* worked cases are expanded for the four shortest chapters (r07, r10, r11 and r15), to surface existing calculations and reasoning without manufacturing new claims. This does **not** assert those chapters now exceed the 850-word prose editorial target, and it does not grant competence or authorial SME approval.
- **Contents:** shows reader depth band, source-module count and review-question count. The original 46-module drill-down index is available immediately before the numbered 20-chapter list. Reader order and module-to-claim mapping are unchanged.
- **Materials:** separates 268 canonical exact-grade catalogue entries from 284 regional evidence records and the 89-profile regional reconciliation index. Discovery-only rows and conditional/partial rows display additional explicit warnings; there is **no inference of 552 validated production specifications**.
- **Book audio:** three learner-selectable audio editions: complete governed source prose, complete prose plus worked synthetic cases, or shortened first-read prose. The Material Atlas and detailed publication claim/evidence ledgers remain visual references and are not represented as a spoken production-specification source. Case examples opened for audio retain their evidence disclosures.
- **Chapter-based audio:** 20 reader audio chapter markers, chapter selection, previous/next chapter controls, optional spoken-text follow scrolling, and optional browser-device voice selection. Keep existing sentence navigation, pause, resume, speed, stop and on-device / external speech-provider disclosures.
- **Audio resume:** a learner-scoped and Book-release-bound chapter/sentence cursor is stored by the Book layer. The generic speech engine remains storage-free. Book progress events are ignored and audio is stopped when the active learner scope changes; the Book offers **Continue listening** only when a valid learner-specific cursor exists.
- **Offline revision:** service-worker cache revision is changed to invalidate stale cached script/CSS assets, without asserting a published production release. The Read Aloud component version and version.json marker move together.

## Regression review

New `qa/book-audio-deep.spec.js` covers complete/shortened/example playback, chapter seeking, audio cursor, profile switching and reader assurance. Existing `qa/read-aloud.spec.js`, `qa/book-resume.spec.js`, `qa/book-assurance.spec.js`, `qa/reference-layout.spec.js`, `qa_book_release_integration.py`, `qa_book_first_read_audit.py` and `qa_read_aloud.py` remain required. New static guard strings were added to `qa_read_aloud.py`.

**Do not merge based on source inspection alone.** CI needs to execute the focused suites and real browser/manual checks need to confirm first-tap Android/iOS voice behavior, selected-voice handling, scroll follow, long sessions, interruption recovery, and two-profile isolation. The source-only checks in this remediation are **not** equivalent to completed end-to-end browser, physical phone or human-SME evidence.

## Outstanding external and content gates (not auto-fixable)

1. Independent qualified injection moulding SME reviews of all 46 governed modules, the 27 cases and 25 diagrams; independent manufacturer/standards source-currentness validation, with special sampling of the 30 claims having one evidence source. Do not change existing SME HOLD through automation.
2. Specialist content/editorial review of the 53 streamlined omissions and substantive depth of the 12 under-target first-read chapters. The four shortest now show additional governed examples, but the first-read prose counts remain measured by the existing deterministic omission register. Any *new* engineering content requires governed review and, when necessary, evidence updates.
3. Real Android/iPhone/Windows device speech startup/background behavior, accessibility with VoiceOver/TalkBack, physical PWA validation and provider/NZQA learner-outcome gates all remain HOLD.
4. Historical document drift: `qa/BOOK_DEEP_PEER_REVIEW_2026.10.06.5.md` mentions 21 diagrams in an earlier review phase; the current authorization, diagram ledger and SME contract have **25** exact-identity diagrams. Interpret the old narrative as historical and use current authorization for release inventory.

## Recommended merge criteria

- All current Book/Listen/browser regression gates pass against the exact source commit; manually inspect Book at narrow mobile and desktop widths.
- No missing data integrity file, diagram asset, or source-currentness/production-authority promotion.
- Validation labels are consistent on Contents, Read and Listen.
- External HOLD remains visible, with no inferred human signoff.

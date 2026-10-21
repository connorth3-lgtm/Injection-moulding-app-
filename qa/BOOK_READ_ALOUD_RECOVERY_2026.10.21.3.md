# Book Read Aloud recovery review — 21 October 2026

**Release candidate:** `2026.10.21.3`  
**Scope:** the governed Book reader, speech startup and chaining, chapter/sentence position, resume cursor, phone tone test, and device speech-provider failure handling.

## Reproduction and finding

The reported phone behavior is consistent with browser speech synthesis starting and then reporting `synthesis-failed`. The two-tone test uses Web Audio and checks the browser's selected output route; it does not test the Android text-to-speech engine. Read Aloud sends Book text to the browser/operating-system speech service and does not bundle or fetch recorded narration. An Android provider can therefore emit a word and fail while the tone test remains audible.

The Book path already selects the visible reader, starts device speech from the original Listen tap, chains bounded sentence utterances, tracks chapter/sentence progress, and saves a learner-scoped cursor. The failure path had two gaps: it showed the raw provider error without a recovery path, and a later Listen tap rebuilt the queue at sentence one even when the failed sentence was later in the chapter.

## Change in this candidate

- A speech error now leaves the failed sentence selected and visible, saves its Book cursor even when Android omits `onstart`, and retries that sentence on the next Listen tap instead of resetting to the first sentence.
- Android `synthesis-failed` now explains how to retry and how to open Text-to-speech output settings to choose an engine and download/select a voice.
- Unavailable voice/language errors suggest Automatic device voice or another installed voice.
- The player does not automatically replay a partial utterance, which could repeat words the learner already heard.
- A regression test simulates a successful first sentence, then a voice that emits a failure for the second sentence without `onstart`; it asserts the failure guidance, saved cursor, and same-sentence retry.

Book content, the 20 chapter boundaries, the 46-module source edition, worked examples, streamlined edition, source disclosures, learner scoping, and privacy boundary are unchanged. No remote voice service, learner audio recording, or content upload was added.

## Verification and remaining evidence

Passed locally: JavaScript syntax; `qa_read_aloud.py`; `qa_book_release_integration.py`; `qa_book_resume.py`; `qa_web_release_identity.py`; `tools/build_pages_artifact.py`; and `qa_release.py`.

Local Playwright could not launch because the pinned Chromium binary is unavailable in this workspace. Exact-source CI completed instead: Read Aloud QA run 39641015852 passed 50 tests; Mobile Browser QA run 39641015779, Question Quality 50-Pass run 39641015590, and Combined Learn/Book QA run 39641015644 also passed. These results verify the browser/runtime contracts, not audible playback on a physical Android phone. Real Android voice-engine reliability, iOS device behavior, assistive technology, Book SME, learner, provider, production, and all other independent review evidence remain **HOLD**.

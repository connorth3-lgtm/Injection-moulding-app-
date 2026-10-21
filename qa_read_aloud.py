#!/usr/bin/env python3
"""Fail-closed QA for MouldMaster Book-only Read Aloud and app audio runtime."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


runtime = (ROOT / "read-aloud.js").read_text(encoding="utf-8")
reading_patch = (ROOT / "reading-patch.js").read_text(encoding="utf-8")
service_worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
privacy = (ROOT / "privacy.html").read_text(encoding="utf-8")
version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
package = json.loads((ROOT / "desktop/electron/package.json").read_text(encoding="utf-8"))
integrity_generator = (ROOT / "desktop/electron/scripts/generate-integrity.cjs").read_text(encoding="utf-8")

need(version.get("read_aloud_version") == "2026.10.21.2", "Read Aloud version marker mismatch")
need("const VERSION='2026.10.21.2'" in runtime, "Read Aloud runtime version mismatch")
need("function cancelDeviceSpeech(force=false)" in runtime and "cancelDeviceSpeech(cancelActive)" in runtime and "cancelDeviceSpeech(true)" in runtime,
     "speech cancellation must be limited to active queues or explicit cleanup")
need("function applyAvailableVoice(utterance)" in runtime and "if(!selectedVoice){utterance.lang='';return;}" in runtime,
     "unlisted mobile default voice must use the OS-selected language")

# The feature must be output-only speech synthesis. Microphone capture, recognition,
# recording and application-controlled telemetry/network paths are forbidden here.
for marker in ("speechSynthesis", "SpeechSynthesisUtterance", "Intl.Segmenter"):
    need(marker in runtime, f"required speech/readability capability missing: {marker}")
for forbidden in (
    "getUserMedia", "mediaDevices", "MediaRecorder", "SpeechRecognition",
    "webkitSpeechRecognition", "fetch(",
    "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "localStorage",
    "sessionStorage", "indexedDB",
):
    need(forbidden not in runtime, f"forbidden Read Aloud capability/path present: {forbidden}")

# Visible-content and navigation/privacy boundaries.
for marker in (
    "getComputedStyle", "getBoundingClientRect", "[hidden]", "[aria-hidden=\"true\"]",
    ".hidden", "pagehide", "visibilitychange", "Stopped after navigation",
    "mm-read-source-active", "Open the Book to use Read Aloud.",
    "No readable text is visible in the Book.",
):
    need(marker in runtime, f"visible-content/navigation guard missing: {marker}")

# Required learner controls, accessible state and mobile-nav clearance.
for marker in (
    'data-mm-read="prev"', 'data-mm-read="play"', 'data-mm-read="next"',
    'data-mm-read="stop"', 'data-mm-read="speed"', "0.75,1,1.25,1.5",
    'role="status"', 'aria-live="polite"',
    "Read Aloud is not available in this browser/device.",
    "Book voice did not start. Check device text-to-speech settings, then try again.",
    "voiceschanged", "getVoices", "🔊 Listen", "#app .top-actions,.top-actions",
    "details[open]",
):
    need(marker in runtime, f"Read Aloud control/fallback missing: {marker}")

# Some mobile providers omit onstart after output begins. The watchdog
# must trust active speech and speech-boundary events before cancelling.
for marker in (
    "function deviceIsSpeaking(){",
    "if(deviceIsSpeaking()){markStarted();return;}",
    "utterance.onboundary=markStarted;",
):
    need(marker in runtime, f"active mobile speech watchdog guard missing: {marker}")

# Android Chrome may advertise Web Speech with an empty device-voice list.
# Playback MUST start in the original tap task instead of waiting on a timer.
# A timeout cannot safely replay a lost mobile user activation.
for marker in (
    "const androidSpeech=/Android/i.test(navigator.userAgent||'');",
    "const iosSpeech=/iPhone|iPad|iPod/i.test(navigator.userAgent||'')",
    "else if(iosSpeech){",
    "if(androidSpeech){",
    "beginSpeech();",
    "waitForVoice(retry?700:1200).then(beginSpeech",
    "Android voice has not confirmed playback yet",
):
    need(marker in runtime, f"Android tap-to-speak guard missing: {marker}")
need("await waitForVoice" not in runtime, "Android speech start must not block on voice discovery")

# Only the visible Book may supply speech. Lessons and generic page content
# are not fallback sources, and the Book queue keeps the governed chapter bound.
for marker in (
    "function visibleBookView(){",
    "function syncBookScope(){",
    "const book=document.getElementById('mmBookView');",
    "book.querySelector('[data-mm-book-reader]')",
    "book.querySelector('[data-mm-book-contents]')",
    "if(!root){units=[];index=0;activeRoot=null;bookChapterCache=[];return units;}",
    "units=out.slice(0,20000);",
    "if(playlistMode){setStatus('Book Read Aloud cannot start a lesson playlist.');",
):
    need(marker in runtime, f"Book-only speech boundary missing: {marker}")
need("const candidates=['#lesson" not in runtime and "return document.body;" not in runtime,
     "lesson and generic-page narration fallbacks must not exist")

# Book-only scope: lesson playlists have no installed navigation or public API.
need("createListeningTab();" not in runtime, "lesson Listening navigation must not be installed")
need("startPlaylist,openListening" not in runtime, "lesson playlist/open APIs must not be exported")
need("currentLessonId:" not in runtime, "lesson-specific Read Aloud API must not be exported")
need("data-mm-listening-tab" not in runtime, "lesson Listening tab marker must not be installed")
for marker in ("function resumePausedSpeechQueue()", "function primeAudioOutput()", "function testAppAudio()", "resumePausedSpeechQueue();"):
    need(marker in runtime, f"Book voice/output recovery missing: {marker}")
need("Test phone sound" in runtime and 'data-mm-read="test"' in runtime, "device audio output test control missing")
need("Test Book voice" not in runtime and "This is a test of Book audio." not in runtime,
     "redundant speech-test control must not alter the locked Book player layout")
browser = (ROOT / "qa/read-aloud.spec.js").read_text(encoding="utf-8")
need("Book-only scope keeps lesson text silent" in browser and "startBookFromGesture()" in browser,
     "browser regression must prove that lessons cannot be narrated")
# Book audio is chapter-aware, learner-scoped cursor events are emitted without
# storage inside the voice engine, and presentation modes remain source-governed.
for marker in (
    'data-mm-book-audio-controls', 'data-mm-book-audio-chapter',
    'data-mm-book-audio-follow', 'data-mm-read="voice"',
    'queueBookStart', 'selectBookChapter', 'jumpBookChapter',
    'mm:book-audio-position', 'mm:book-audio-complete',
    'bookSentenceIndex', 'scrollIntoView',
):
    need(marker in runtime, f"Book audio deep-fix contract missing: {marker}")
book = (ROOT / "src/domains/learning/book-runtime.js").read_text(encoding="utf-8")
for marker in (
    'BOOK_AUDIO_PREFIX', 'activeAudioScopeKey', 'getAudioResume:readAudioResume',
    'Complete source text (all 46 modules)', 'Complete text and 27 worked examples',
    'Shorter first-read text', 'Independent human SME review pending',
    'Read all original source sections',
):
    need(marker in book, f"Book reading/listening transparency contract missing: {marker}")

# Read Aloud/Listening must not know or alter assessment keying/storage internals.
for forbidden in (
    "correctAnswer", "answerKey", "correctIndex", "selectedAnswer",
    "assessment-storage", "question_bank",
):
    need(forbidden not in runtime, f"Read Aloud must remain assessment-agnostic: {forbidden}")

# Runtime inclusion must be coherent across browser/PWA and Windows desktop.
need("./read-aloud.js" in service_worker, "Read Aloud missing from service-worker offline core")
need("read-aloud.js" in reading_patch and "loadReadAloud" in reading_patch, "Read Aloud loader missing from learner reading runtime")
extra = package.get("build", {}).get("extraResources", [])
need(any(item.get("from") == "../../read-aloud.js" and item.get("to") == "mouldmaster/read-aloud.js" for item in extra), "Read Aloud missing from Windows desktop resources")
need("'read-aloud.js'" in integrity_generator, "Read Aloud missing from desktop SHA-256 integrity manifest generator")

# Privacy language must avoid claiming every OS/browser voice is offline.
for marker in (
    "<h2>Read Aloud</h2>", "does not request microphone access", "browser or operating system",
    "controlled by that browser, operating system and selected voice", "Book-only text-to-speech",
    "Press Listen to check Book speech", "Before speaking, the player resumes the browser speech queue if it was left paused", "MouldMaster cannot detect whether you hear the tone sample or Book speech",
):
    need(marker in privacy, f"Read Aloud privacy disclosure missing: {marker}")
need("entirely on-device" in privacy, "voice-processing limitation disclosure missing")

print("MouldMaster Book Read Aloud QA passed: Book-only speech-synthesis playback, same-engine Book voice test, Android first-tap/desktop delayed-voice aware, offline/desktop-integrity wired, and privacy disclosed.")

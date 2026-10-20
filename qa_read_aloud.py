#!/usr/bin/env python3
"""Fail-closed QA for MouldMaster Read Aloud and long-session Listening runtime."""
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

need(version.get("read_aloud_version") == "2026.10.20.6", "Read Aloud version marker mismatch")
need("const VERSION='2026.10.20.6'" in runtime, "Read Aloud runtime version mismatch")

# The feature must be output-only: speech synthesis plus an explicitly tapped,
# oscillator-only two-beep media routing test. Microphone capture, recognition,
# recording and application-controlled telemetry/network paths are forbidden.
for marker in ("speechSynthesis", "SpeechSynthesisUtterance", "Intl.Segmenter"):
    need(marker in runtime, f"required speech/readability capability missing: {marker}")
for forbidden in (
    "getUserMedia", "mediaDevices", "MediaRecorder", "SpeechRecognition",
    "webkitSpeechRecognition", "fetch(",
    "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "localStorage",
    "sessionStorage", "indexedDB",
):
    need(forbidden not in runtime, f"forbidden Read Aloud capability/path present: {forbidden}")

# The one Web Audio exception is strictly an output-only diagnostic. It must
# synthesize a tone through the speaker destination, never read an input stream.
for marker in (
    'function testAppAudioOutput(){', 'window.AudioContext||window.webkitAudioContext',
    'context.createOscillator()', 'context.createGain()', 'volume.connect(context.destination)',
    'data-mm-read="audio-output"', 'testAppAudioOutput', 'Did you hear two beeps?',
):
    need(marker in runtime, f"app audio output diagnostic boundary missing: {marker}")
need(runtime.count('new AudioContextType()') == 1, 'Web Audio usage must remain a single oscillator-only output diagnostic')

# Visible-content and navigation/privacy boundaries.
for marker in (
    "getComputedStyle", "getBoundingClientRect", "[hidden]", "[aria-hidden=\"true\"]",
    ".hidden", "pagehide", "visibilitychange", "Stopped after navigation",
    "mm-read-source-active", "No readable text is visible on this screen.",
):
    need(marker in runtime, f"visible-content/navigation guard missing: {marker}")

# Required learner controls, accessible state and mobile-nav clearance.
for marker in (
    'data-mm-read="prev"', 'data-mm-read="play"', 'data-mm-read="next"',
    'data-mm-read="stop"', 'data-mm-read="speed"', "0.75,1,1.25,1.5",
    'role="status"', 'aria-live="polite"',
    "Read Aloud is not available in this browser/device.",
    "Device voice did not start. Check Windows speech voices, then try again.",
    "voiceschanged", "getVoices", "🔊 Listen", "#app .top-actions,.top-actions",
    "details[open]",
):
    need(marker in runtime, f"Read Aloud control/fallback missing: {marker}")

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

# Book is a custom view alongside the course/exam cards. Its visible reader
# must win over generic selectors, and long Book sessions cannot inherit the
# ordinary 1200-segment limit. Neither guarantee is established by button-only
# browser smoke tests; actual spoken text is covered by read-aloud.spec.js.
for marker in (
    "document.getElementById('mmBookView')",
    "book.querySelector('[data-mm-book-reader]')",
    "book.querySelector('[data-mm-book-contents]')",
    "bookReader?20000:1200",
):
    need(marker in runtime, f"Book voice-target/late-chapter regression guard missing: {marker}")

# Dedicated long-session Listening mode must reuse the same speech-synthesis runtime,
# consume authored lesson content only, provide durable playback controls, and avoid
# implying that every browser/OS voice is processed entirely on-device.
for marker in (
    "Long-session audio learning",
    "continuous listening",
    "buildPlaylist",
    "lessonText",
    "window.MM_DATA?.lessons",
    'data-mm-listening="play"',
    'data-mm-listening="prev-lesson"',
    'data-mm-listening="next-lesson"',
    'data-mm-listening="stop"',
    "data-mm-listening-speed",
    "jumpLesson",
    "playlistMode",
    "!playlistMode",
    "continues when this app tab is in the background",
    "browser or operating-system speech service",
    "voice-provider processing depends on your device, browser and selected voice",
):
    need(marker in runtime, f"Listening mode contract missing: {marker}")
need("same local device voice" not in runtime, "Listening privacy copy must not imply all voice processing is local")

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
    "controlled by that browser, operating system and selected voice",
):
    need(marker in privacy, f"Read Aloud privacy disclosure missing: {marker}")
need("entirely on-device" in privacy, "voice-processing limitation disclosure missing")

print("MouldMaster Read Aloud QA passed: output-only speech synthesis and tap-only local audio tone diagnostic, Android first-tap/desktop delayed-voice aware, long-session Listening enabled, offline/desktop-integrity wired, and privacy disclosed.")

#!/usr/bin/env python3
"""Fail-closed QA for MouldMaster Read Aloud accessibility runtime."""
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

need(version.get("read_aloud_version") == "2026.09.01.1", "Read Aloud version marker mismatch")
need("const VERSION='2026.09.01.1'" in runtime, "Read Aloud runtime version mismatch")

# The feature must be output-only speech synthesis. Microphone capture, recognition,
# recording and application-controlled telemetry/network paths are forbidden here.
for marker in ("speechSynthesis", "SpeechSynthesisUtterance", "Intl.Segmenter"):
    need(marker in runtime, f"required speech/readability capability missing: {marker}")
for forbidden in (
    "getUserMedia",
    "mediaDevices",
    "MediaRecorder",
    "SpeechRecognition",
    "webkitSpeechRecognition",
    "AudioContext",
    "webkitAudioContext",
    "fetch(",
    "XMLHttpRequest",
    "sendBeacon",
    "WebSocket",
    "EventSource",
    "localStorage",
    "sessionStorage",
    "indexedDB",
):
    need(forbidden not in runtime, f"forbidden Read Aloud capability/path present: {forbidden}")

# Visible-content and navigation/privacy boundaries.
for marker in (
    "getComputedStyle",
    "getBoundingClientRect",
    "[hidden]",
    "[aria-hidden=\"true\"]",
    ".hidden",
    "pagehide",
    "visibilitychange",
    "Stopped after navigation",
    "mm-read-source-active",
    "No readable text is visible on this screen.",
):
    need(marker in runtime, f"visible-content/navigation guard missing: {marker}")

# Required learner controls and accessible state.
for marker in (
    'data-mm-read="prev"',
    'data-mm-read="play"',
    'data-mm-read="next"',
    'data-mm-read="stop"',
    'data-mm-read="speed"',
    "0.75,1,1.25,1.5",
    'role="status"',
    'aria-live="polite"',
    "Read Aloud is not available in this browser/device.",
):
    need(marker in runtime, f"Read Aloud control/fallback missing: {marker}")

# Read Aloud must not know or alter assessment keying/storage internals.
for forbidden in (
    "correctAnswer",
    "answerKey",
    "correctIndex",
    "selectedAnswer",
    "assessment-storage",
    "question_bank",
):
    need(forbidden not in runtime, f"Read Aloud must remain assessment-agnostic: {forbidden}")

# Runtime inclusion must be coherent across browser/PWA and Windows desktop.
need("./read-aloud.js" in service_worker, "Read Aloud missing from service-worker offline core")
need("read-aloud.js" in reading_patch and "loadReadAloud" in reading_patch, "Read Aloud loader missing from learner reading runtime")
extra = package.get("build", {}).get("extraResources", [])
need(
    any(item.get("from") == "../../read-aloud.js" and item.get("to") == "mouldmaster/read-aloud.js" for item in extra),
    "Read Aloud missing from Windows desktop resources",
)
need("'read-aloud.js'" in integrity_generator, "Read Aloud missing from desktop SHA-256 integrity manifest generator")

# Privacy language must avoid claiming every OS/browser voice is offline.
for marker in (
    "<h2>Read Aloud</h2>",
    "does not request microphone access",
    "browser or operating system",
    "controlled by that browser, operating system and selected voice",
):
    need(marker in privacy, f"Read Aloud privacy disclosure missing: {marker}")
need("entirely on-device" in privacy, "voice-processing limitation disclosure missing")

print("MouldMaster Read Aloud QA passed: speech-synthesis-only, visible-content-scoped, offline/desktop-integrity wired, and privacy disclosed.")

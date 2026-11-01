#!/usr/bin/env python3
"""Static contract checks for the dedicated Android Book-audio app shell."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
def need(condition, message):
    if not condition:
        raise AssertionError(message)

manifest = (ROOT / "android/app/src/main/AndroidManifest.xml").read_text(encoding="utf-8")
activity = (ROOT / "android/app/src/main/java/org/mouldmaster/academy/MainActivity.java").read_text(encoding="utf-8")
bridge = (ROOT / "android/app/src/main/java/org/mouldmaster/academy/NativeTtsBridge.java").read_text(encoding="utf-8")
service = (ROOT / "android/app/src/main/java/org/mouldmaster/academy/AudioPlaybackService.java").read_text(encoding="utf-8")
runtime = (ROOT / "android/app/src/main/assets/read-aloud.js").read_text(encoding="utf-8")
gradle = (ROOT / "android/app/build.gradle").read_text(encoding="utf-8")
workflow = (ROOT / ".github/workflows/android-app.yml").read_text(encoding="utf-8")

for marker in (
    "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
    "android.permission.WAKE_LOCK",
    'android:foregroundServiceType="mediaPlayback"',
):
    need(marker in manifest, f"Android background-audio manifest contract missing: {marker}")
for marker in (
    "addJavascriptInterface",
    "MouldMasterNativeTts",
    "ServiceWorkerController",
    "nativeReadAloud",
    "read-aloud.js",
):
    need(marker in activity, f"WebView native-runtime interception missing: {marker}")
for marker in ("@JavascriptInterface", "isAvailable", "speak", "stop"):
    need(marker in bridge, f"native TTS bridge method missing: {marker}")
for marker in (
    "TextToSpeech",
    "startForeground",
    "AudioFocusRequest",
    "MediaSession",
    "PARTIAL_WAKE_LOCK",
    "MouldMaster:BookAudio",
    "UtteranceProgressListener",
):
    need(marker in service, f"foreground native audio service contract missing: {marker}")
for marker in ("MouldMasterNativeTts", "window.MMNativeTtsEvent", "Reading with phone audio"):
    need(marker in runtime, f"bundled native-aware Read Aloud runtime missing: {marker}")
need("compileSdk 35" in gradle and "targetSdk 35" in gradle, "Android SDK target must be explicit")
need("gradle -p android assembleDebug" in workflow, "Android build workflow missing")

print("Dedicated Android Book audio QA passed: WebView bridge, bundled native-aware reader, foreground TTS service, media session and wake-lock contracts present.")

#!/usr/bin/env python3
"""Static contract checks for the dedicated Android Book-audio app shell."""
from pathlib import Path
import json

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
for marker in ("@JavascriptInterface", "isAvailable", "speak", "speakQueue", "stop"):
    need(marker in bridge, f"native TTS bridge method missing: {marker}")
for marker in (
    "TextToSpeech",
    "startForeground",
    "AudioFocusRequest",
    "PARTIAL_WAKE_LOCK",
    "MouldMaster:BookAudio",
    "UtteranceProgressListener",
    "ACTION_SPEAK_QUEUE",
    "speechQueue",
    "IDLE_SHUTDOWN_DELAY_MS",
    "setOnlyAlertOnce",
    "enableVibration(false)",
    "Notification.CATEGORY_SERVICE",
    "TTS_INIT_TIMEOUT_MS",
    "initializeTextToSpeech",
    "failQueuedSpeech",
    "Locale.ENGLISH",
):
    need(marker in service, f"foreground native audio service contract missing: {marker}")
for marker in ("MouldMasterNativeTts", "window.MMNativeTtsEvent", "nativeQueueSupported", "buildNativeQueue", "speakQueue", "if(nativeSupported)return false", "nativeTts.speak(", "Test phone voice", "Reading with phone audio"):
    need(marker in runtime, f"bundled native-aware Read Aloud runtime missing: {marker}")
need("compileSdk 36" in gradle and "targetSdk 36" in gradle, "Android SDK target must meet current Play requirements")
version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
need('versionCode 20261108' in gradle and 'versionName "2026.11.08.1"' in gradle, "Android shell version must match the current app release")
need('MouldMasterAndroid/" + BuildConfig.VERSION_NAME' in activity, "Android user agent must follow the package version")
need('"https://connorth3-lgtm.github.io/Injection-moulding-app-/preview/"' in gradle, "Android app must open the current hosted technical-preview candidate")
need(version.get("android_release") == "2026.11.08.1", "Android release metadata must match the package version")
need("gradle -p android assembleDebug" in workflow, "Android build workflow missing")

need("android.permission.POST_NOTIFICATIONS" not in manifest, "Android app must not request notification permission for background playback")
need("requestPermissions(" not in activity, "Android app must not prompt for notification permission")
need("MediaSession" not in service, "Native narration must not create a second media-session notification")
need("No usable English voice is installed" in service, "TTS voice failures must be reported to the reader")
need("ttsInitError != null" in service, "TTS initialization failure must be handled after the request queue arrives")

print("Dedicated Android Book audio QA passed: WebView bridge, native voice setup and failure reporting, quiet foreground TTS service, and wake-lock contracts present.")

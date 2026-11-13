# MouldMaster Academy Android app

This is the first dedicated app shell for MouldMaster. It keeps the governed learner
experience in the hosted technical-preview path, while moving Book narration to Android's
native TextToSpeech service and a foreground media-playback service.

## What changes

- Book Read Aloud calls Android native TextToSpeech instead of browser speechSynthesis.
- A foreground service holds sustained audio focus and a partial wake lock while narration
  runs, so playback does not depend on the WebView staying awake.
- The service posts one low-priority, silent notification while narration runs. The app does
  not request notification permission; Android 13+ can keep the service notice out of the
  notification drawer while still showing the active service in system controls.
- The Android WebView replaces the hosted read-aloud.js request with the bundled native-aware
  runtime, while the public browser/PWA bytes remain unchanged.
- The Android Book panel's voice test speaks through the same native service as Read Aloud,
  so it checks the installed TTS engine and voice rather than only checking browser tones.
- Learner progress stays in the WebView profile. The native bridge does not upload Book text.
- Browser/PWA and Windows desktop builds keep their existing paths.

## Build and install

From a machine with Android Studio or Gradle and Android SDK 36:

    gradle -p android assembleDebug
    adb install -r android/app/build/outputs/apk/debug/app-debug.apk

The debug APK is for device testing. It is not the Play upload.

## Private Google Play internal test

The app uses package name `org.mouldmaster.academy`, version name `2026.11.13.1`,
and version code `20261113`. See [PLAY_INTERNAL_TESTING.md](PLAY_INTERNAL_TESTING.md)
for the private internal-testing workflow. It builds a signed Android App Bundle
only when the owner-provided upload-key secrets are configured; it does not publish
to Google Play automatically.

The generated Play bundle uses the upload key. Keep the keystore outside the repository
and back it up securely. The debug APK currently distributed by CI is signed with its
debug key, so a Play-installed build will not update that APK in place. Export learner
progress from the app before switching, then import it after installing the Play test.

Open the app once online. It loads the current governed preview and retains the WebView's
normal origin/service-worker cache for subsequent offline starts where supported. On Android
8–12, Android shows the single silent foreground-service notification during playback. On
Android 13+, the app does not request notification permission, so the service notice is
normally kept out of the notification drawer while remaining visible in Android's Task Manager.

If Listen reports a speech engine or voice problem, open Android Settings > Accessibility >
Text-to-speech output, select an installed engine, and download an English voice. Return to
the app and tap Listen again; the app now reports setup failures instead of waiting silently.

## Validation boundary

The native Android project is a technical preview integration. It still requires a real
physical-phone test for lock-screen narration, audio focus, Bluetooth/headset controls,
offline restart, battery impact and WebView update behavior. It is not NZQA/provider
approved and does not create production or machine-control authority.

The Android WebView opens the hosted candidate at `/preview/`. The native shell version can be updated independently; after installing, open once online so the WebView loads the current candidate and refreshes its service-worker cache.

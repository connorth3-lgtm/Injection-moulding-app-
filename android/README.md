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
- Learner progress stays in the WebView profile. The native bridge does not upload Book text.
- Browser/PWA and Windows desktop builds keep their existing paths.

## Build and install

From a machine with Android Studio or Gradle and Android SDK 35:

    gradle -p android assembleDebug
    adb install -r android/app/build/outputs/apk/debug/app-debug.apk

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

# MouldMaster Academy Android app

This is the first dedicated app shell for MouldMaster. It keeps the governed learner
experience in the hosted technical-preview path, while moving Book narration to Android's
native TextToSpeech service and a foreground media-playback service.

## What changes

- Book Read Aloud calls Android native TextToSpeech instead of browser speechSynthesis.
- A foreground media service holds audio focus, a media-session notification and a partial
  wake lock while a sentence is speaking, so narration can continue when the display locks.
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
13+, allow the Book narration notification permission.

## Validation boundary

The native Android project is a technical preview integration. It still requires a real
physical-phone test for lock-screen narration, audio focus, Bluetooth/headset controls,
offline restart, battery impact and WebView update behavior. It is not NZQA/provider
approved and does not create production or machine-control authority.

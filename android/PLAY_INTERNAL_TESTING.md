# Private Google Play internal test

This path is for one invited tester (you) through Google Play's Internal testing track.
It does not publish the app publicly or send any release to Play automatically.

## App identity

- Package: `org.mouldmaster.academy`
- Version: `2026.11.13.1` (`versionCode 20261113`)
- Target SDK: 36
- Book content: hosted technical preview
- Product status: technical preview; not NZQA/provider approved

Google Play fixes an app's package name after its first upload. Keep the package
identity above if this is to become the app's long-term Play listing.

## 1. Create a private upload key

Use a JDK on a trusted device. Store the keystore outside the repository and make
a secure offline backup. Do not send the keystore or passwords in chat, commit them,
or put them in a public file.

In PowerShell:

```powershell
keytool -genkeypair -v -storetype JKS -keystore mouldmaster-play-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mouldmaster
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\mouldmaster-play-upload.jks"))
```

Add these four values under the GitHub repository's **Settings → Secrets and
variables → Actions → New repository secret**:

- `MM_PLAY_UPLOAD_KEYSTORE_BASE64`: the one-line Base64 output
- `MM_PLAY_UPLOAD_STORE_PASSWORD`: the keystore password
- `MM_PLAY_UPLOAD_KEY_ALIAS`: `mouldmaster`
- `MM_PLAY_UPLOAD_KEY_PASSWORD`: the key password

The workflow decodes the key only in its temporary runner and does not print it.
The signed bundle is retained as a short-lived workflow artifact; the workflow does
not publish or upload it to Google Play.

## 2. Build the signed app bundle

After the Android API 36 change has merged to `main`:

1. Open **Actions → Android Play internal-test bundle**.
2. Choose **Run workflow** on `main`.
3. Download the `mouldmaster-play-internal-bundle` artifact from the completed run.
   It contains `app-release.aab` and expires after seven days.

The bundle build fails closed if any upload-key secret is missing. It uses the
owner's upload key; Google Play App Signing should be enabled when creating the app.

## 3. Add only your account to Internal testing

In Play Console, create the app with package `org.mouldmaster.academy`, upload the
AAB under **Testing → Internal testing**, add the Google account used on your phone
as the tester, then roll out the internal test and open its opt-in link on that phone.
The app will not appear in public Play Store search.

Internal testing is the private first step. The separate 12-tester/14-day requirement
applies to production access for newer personal developer accounts, not to this
internal-only test.

## Switching from the current debug APK

The current CI APK is signed with a CI debug key. A Play install is signed through
Play App Signing, so Android cannot install it as an in-place update over that APK.
If you have learner progress to keep, export a learner backup from the working app
before removing it. Install the Play test, then import that backup. Do not uninstall
the working app until you have the backup file and have checked that it was created.

## Scope and remaining manual steps

The Play Console app setup, identity checks, adding the tester, uploading the AAB,
and rolling out the internal track remain manual owner actions. The Play bundle only
loads the hosted Book technical preview; it does not make the Chrome version use
native Android speech and does not turn the Book into an approved qualification.

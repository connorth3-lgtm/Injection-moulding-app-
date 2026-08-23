MOULDMASTER WINDOWS UPDATE FEED

CURRENT DESIGN
- latest.json is the signed-by-hash content manifest used by the installed Windows launcher.
- MouldMaster_Academy_App.html is the small verified Windows content loader.
- MouldMaster_Core_App.html is the preserved audited core learning application.
- reading-patch.css, reading-patch.js, training-upgrade.js and training-qa-fix.js provide the same guided-training layer used by Android.
- MouldMasterAcademy.exe remains the native Windows launcher/updater.

PUBLISH ORDER FOR A CONTENT RELEASE
1. Publish/verify the preserved core and all referenced training assets.
2. Publish MouldMaster_Academy_App.html.
3. Calculate SHA-256 from the exact committed loader bytes.
4. Increment latest.json "version" and set its "sha256" to that verified value.
5. Never publish the manifest before its referenced content exists.

OFFLINE BEHAVIOUR
- The Windows launcher still verifies the downloaded update before accepting it.
- The Windows content loader fetches the preserved core plus guided-training assets on the first successful online launch of a content version.
- The assembled guided-training page is cached locally for later offline reuse.
- If a new content version has never completed one online launch, the loader asks the user to reconnect rather than silently presenting incomplete training enhancements.

CURRENT CONTENT RELEASE
2026.08.23.1

AUDITED QUESTION BANK
2026.08.21.1

The guided-training update does not change the audited technical answer keys or the >=80% plus zero-wrong safety-critical regional certification rule.

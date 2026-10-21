# Book Read Aloud screen-off behavior — 2026.10.22.1

## Change

The reader no longer pauses or cancels speech when the page becomes hidden. Delayed voice startup and sentence chaining remain eligible to continue after the learner starts Book playback. When the browser reports that it paused the speech queue, the reader tries to resume it when the page returns to the foreground and exposes a Resume control if it remains paused.

## Verification status

Local static Read Aloud QA, JavaScript syntax checks, web-release identity QA, release-branch policy unit tests and whitespace checks passed on the staged source. The local Playwright browser suite could not launch because this workspace has no installed Chromium binary; exact-head GitHub browser QA is required before merge.

Screen-off playback is best effort with the browser-provided speech service. Physical Android playback with the display locked has not yet been verified for this candidate. All independent external review streams remain HOLD.

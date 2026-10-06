# MouldMaster physical PWA validation — 2026.10.07.10

This packet governs hands-on physical-device validation of web release `2026.10.07.10`. It does **not** authorize production and does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

The previous physical-device evidence exceeded its governed 30-day maximum age and is not reused. Both iOS/iPadOS and Android are therefore **pending** for this release.

The exact retained candidate identity must come from the governed **Pre-merge Public Candidate** workflow. Browser emulation, Playwright, desktop WebKit and service-worker automation do not count as physical-device evidence.

Only after both platform rows genuinely pass may the physical-device contract be promoted through protected review. Until then, `pwaPhysicalDevices.status` remains **hold** and production remains fail-closed.

# MouldMaster physical PWA validation — 2026.10.07.10

This packet governs hands-on physical-device validation of web release `2026.10.07.10`. It does **not** authorize production.

## Exact candidate

- source: `f1a1a85fd98d593f5a01f3e0812b69f24f515838`
- public-runtime fingerprint: `sha256:8cef2ed43e7127868f90427956ba9370ecd74f8b39e7fb8fc3b6cfe7c4bfc3f9`
- candidate run: `37542863980` (**Pre-merge Public Candidate**)
- retained artifact: `physical-pwa-candidate-f1a1a85fd98d593f5a01f3e0812b69f24f515838`
- artifact id: `11449367318`
- artifact digest: `sha256:75d57b3ffc2409f5bf355a95eec7038f1ad12cfd00486e7c5a4d102386c195c7`
- retention expiry: `2026-11-05T22:48:28Z`

The previous device evidence exceeded its governed 30-day maximum age and is not reused. Both iOS/iPadOS and Android are **pending** for this runtime. Browser emulation, Playwright, desktop WebKit and service-worker automation do not count as physical-device evidence.

Only after both platform rows genuinely pass may `data/pwa-physical-device-validation-v1.json` be promoted through protected review. Until then, `pwaPhysicalDevices.status` remains **hold**, production stays fail-closed, and this candidate is suitable only for the governed non-production preview path.

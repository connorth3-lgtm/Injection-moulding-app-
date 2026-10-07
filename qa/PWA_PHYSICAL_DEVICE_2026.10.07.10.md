# MouldMaster physical PWA validation — 2026.10.07.10

This packet governs hands-on physical-device validation of web release `2026.10.07.10`. It does **not** authorize production.

## Exact candidate

- source: `2b0ebb5ebefbc567b168c72e5c706a3b7a5265d8`
- public-runtime fingerprint: `sha256:4de2af13aae6c22a972c42fc450642090a45964404ca712b621702a5790cedfb`
- candidate run: `37576165131` (**Pre-merge Public Candidate**)
- retained artifact: `physical-pwa-candidate-2b0ebb5ebefbc567b168c72e5c706a3b7a5265d8`
- artifact id: `11463071985`
- artifact digest: `sha256:cfe22c21277e540276ffb0a7b0ea3109aefb298532713411f8faf43157c22a71`
- retention expiry: `2026-11-06T05:24:54Z`

The previous device evidence exceeded its governed 30-day maximum age and is not reused. Both iOS/iPadOS and Android are **pending** for this runtime. Browser emulation, Playwright, desktop WebKit and service-worker automation do not count as physical-device evidence.

Only after both platform rows genuinely pass may `data/pwa-physical-device-validation-v1.json` be promoted through protected review. Until then, `pwaPhysicalDevices.status` remains **hold**, production stays fail-closed, and this candidate is suitable only for the governed non-production preview path.

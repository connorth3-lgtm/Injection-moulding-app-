# On-device PWA metadata helper

When GitHub Pages is serving the release-hold site, open `device-validation.html` on each physical iOS/iPadOS and Android device.

The helper runs entirely in the browser. It does not load the learner runtime, register a service worker, send network requests, store captured values, include the raw user-agent string, or collect learner/customer/process data.

It attempts to detect the platform, device model family/model when the browser exposes it, OS version, browser version, and whether the page is running in standalone display mode. Browser-provided values are editable because iOS/iPadOS may intentionally hide the exact hardware model or some version detail.

Use only values that are visible or independently verifiable on the physical device. The generated JSON is a convenience record and does not by itself mark `data/pwa-physical-device-validation-v1.json` as validated or bypass any governed check.

# Dynamic HTML sink register

This register classifies active HTML-writing surfaces so security work is based on input trust rather than a raw grep count. Frozen generated core assets are governed separately by byte-parity/CSP transforms and are not permission to add new sinks.

| Surface | Input boundary | Required treatment |
| --- | --- | --- |
| Assessment and lesson renderers | governed local question/content objects | encode interpolated learner/external values; prefer DOM/textContent for new code; retain QA for inert event/style attributes |
| Shell/navigation renderers | application-owned labels/routes | static templates are permitted; no untrusted HTML passthrough |
| Learning analytics / backup notices | learner-derived state | learner strings must enter as text/escaped values, never executable markup |
| Connected/process-data UI | imported/device/site data | treat all imported labels and values as untrusted; DOM/textContent or explicit escaping required |
| Book/reference/evidence UI | governed repository JSON | repository content is trusted as data, not as script; externally sourced/free-text fields require escaping |
| Frozen/generated core runtime | immutable recovery-derived source | do not edit to reduce sink counts; active assembly remains subject to CSP transforms and parity gates |

## Prohibited patterns for new active runtime code

- HTML insertion of raw learner, imported file, URL/query, device/site, or network-origin strings.
- Event-handler attributes or style attributes generated through HTML strings.
- `eval`, `new Function`, or equivalent string-to-code execution.
- Treating a repository JSON field as safe HTML merely because the JSON file itself is governed.

Sink retirement should be incremental and regression-tested; do not bulk-rewrite frozen or baseline-sensitive renderers merely to reduce a metric.

# Historical source-freshness audit — 2026-08-26

This folder preserves the exact `source-freshness-reports.zip` supplied for review. It is historical evidence from the first live source-freshness run associated with commit `3a10bd65671ffd0b0a4cb8ef4587fafc4430a4c7` and workflow run `32916120936`.

Do not treat this archive as the current source-freshness status.

## Integrity

- ZIP size: 4,639 bytes
- ZIP SHA-256: `f183ff2676f8f330f4e78bcefce2e1168a11297c1ff5576da6585b9e2490c373`
- ZIP members: `source-freshness-report.json`, `research-source-freshness-report.json`
- `source-freshness-report.json` SHA-256: `b1003ba94de70c968a9c3a0f73bb5f60cd15952d1e34699e0245a60b38b53859`
- `research-source-freshness-report.json` SHA-256: `7291551ed9ef4dc9b1fde0e2a295e8cf4309c22f02bf30159d6bc56837d71637`

## Recorded results

Authoritative-source report (`checked_at` 2026-08-26T00:42:06Z):
- 18 `ok`
- 6 `unreachable`
- 4 `changed-marker`

Research-source report (`checked_at` 2026-08-26T00:42:29Z):
- 15 `ok`
- 51 `unreachable`
- 4 `gone` / HTTP 404

The four recorded 404s were:
- `10.1007/s00170-025-15244-w`
- `10.1007/s00170-025-16649-3`
- malformed legacy DOI extraction ending at `10.1016/0141-3910(90`
- `10.3390/app15169259`

The repository subsequently repaired the DOI parser, corrected invalid citations, and adjusted live-source handling for access restrictions/PDFs. The next live workflow run, `32916955099` on commit `cc961c7b843bab322f14cc9f3e2964ca6d535fce`, completed successfully.

This archive is retained for audit trail and regression history only.
# Third-Party Notices

MouldMaster Academy is open source under Apache License 2.0 for repository-owned source, documentation and original assets unless stated otherwise.

The project also **references** third-party material. Referenced material is not relicensed by MouldMaster.

## Standards and official guidance

Links to ISO, ASTM, HSE, OSHA, WorkSafe NZ, legislation and other official sources are citations/references only. Their content remains subject to the publisher's own copyright, licence, access and trademark terms.

In particular, the project must not copy or redistribute paid/proprietary standards text merely because the standard is cited in training content. Titles, standard identifiers and short factual descriptions may be referenced as permitted by applicable law, but full protected text must come from a properly licensed copy.

## Research literature

DOI, PubMed, PMC and publisher links point to external research. MouldMaster does not claim ownership of those papers. Open-access status must be checked at the individual work level before redistributing article text, figures or tables.

## Manufacturer technical literature

Manufacturer guides and white papers remain the property of their publishers. They are used as technical references only and must not be treated as universally applicable resin/process specifications.

## Open desktop software dependencies

The preferred open Windows desktop replacement under `desktop/electron/` uses:

- **Electron** — MIT-licensed project; bundles Chromium and Node.js and therefore also includes their respective open-source components/licences. Exact version is pinned in `desktop/electron/package.json` and the full dependency graph/integrity metadata is locked in `desktop/electron/package-lock.json`.
- **electron-builder** — MIT-licensed packaging project. Exact version and transitive dependency graph are locked in the same npm lockfile.
- Build tooling downloaded by those packages can include additional open-source components. Release builds must retain the dependency lock and must generate/retain the applicable third-party licence files produced by the packaging toolchain where available.

The npm lockfile is the machine-readable source-of-truth for exact package versions and registry integrity hashes. It is not a substitute for individual upstream licence texts; redistribution must comply with those licences.

The current web/PWA source does not intentionally bundle a third-party CDN framework. New runtime packages must be documented here before release.

## Windows launcher transition

`MouldMasterAcademy.exe` remains in the repository as the **legacy recovery launcher**. Its corresponding preferred source/build recipe has not been located, so that binary is not represented as fully open source.

The preferred replacement is now the public `desktop/electron/` implementation, which has source, security checks, build instructions, exact direct dependency versions, an npm dependency lock and GitHub Actions build automation. The legacy binary should be removed from normal distribution only after the open replacement has passed Windows hardware testing and the public release/update path has been migrated safely.

## Trademarks

Names and trademarks of standards bodies, regulators, manufacturers, publishers and software vendors belong to their respective owners. Reference to them does not imply endorsement of MouldMaster Academy.

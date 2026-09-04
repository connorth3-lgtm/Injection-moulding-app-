# Real Windows validation and legacy-retirement evidence

Status: **manual evidence required**  
Target release family: open desktop `2026.08.26.7`  
Purpose: produce defensible evidence before deleting the frozen legacy recovery launcher.

GitHub-hosted Windows CI proves the package builds and passes automated QA. It does **not** prove that a normal user machine preserves local learner state, launches offline after first use, or successfully imports a real legacy learner backup. These checks must be performed on a normal Windows 10/11 environment with an actual legacy backup.

## Required inputs

- the published `MouldMaster-Academy-2026.8.26.7-x64.exe` from the tagged GitHub Release;
- the same release's `SHA256SUMS.txt`;
- one real progress-backup export from the legacy runtime whose expected learner progress/notes/history are known;
- a normal Windows 10 or Windows 11 test machine or VM representative of the supported user environment.

Do not use a production learner's personal data unless the organisation has approved that use. Keep the backup and resulting evidence under the appropriate local privacy/security controls.

## Step 1 — verify release bytes

From PowerShell in the repository checkout:

```powershell
./desktop/electron/scripts/verify-real-windows-release.ps1 `
  -ExePath 'C:\path\MouldMaster-Academy-2026.8.26.7-x64.exe' `
  -Sha256SumsPath 'C:\path\SHA256SUMS.txt' `
  -LegacyBackupPath 'C:\path\legacy-progress-backup.json' `
  -EvidenceOut 'C:\path\mouldmaster-windows-validation-evidence.json'
```

The script must report a matching executable SHA-256 before continuing. It also records the Windows version and a checksum of the legacy backup without copying its content into the repository.

## Step 2 — launch and persistence

1. Launch the verified open desktop executable.
2. Confirm the displayed desktop release is `2026.08.26.7`.
3. Create or use a test learner profile.
4. Open a lesson and save a distinctive non-sensitive note.
5. Complete one non-critical practice action.
6. Close MouldMaster fully.
7. Reopen it and confirm the learner, note and practice state persisted.
8. Restart Windows, reopen MouldMaster and confirm the same state still exists.

Record pass/fail and any unexpected prompts/errors in the local evidence record.

## Step 3 — offline launch

1. Complete at least one successful online/normal launch first.
2. Disconnect the test machine from the network.
3. Launch the open desktop package again.
4. Confirm Home, a lesson, Mould Master and Process Data open from bundled assets.
5. Confirm the app does not require an external network request to render its core learning UI.
6. Reconnect the network only after the check is complete.

Do not treat external reference links being unavailable while offline as an application failure.

## Step 4 — real legacy backup migration

1. In the legacy runtime, export the real learner progress backup.
2. Record the expected learner profile, representative completed lessons, notes and history **outside GitHub**.
3. Import that backup into the open desktop runtime using MouldMaster's normal progress import.
4. Confirm the expected learner profile/progress/notes/history are present.
5. Close and reopen the open desktop runtime and confirm imported state persists.
6. Confirm imported certificate/pass state is **not** trusted as current completion authority and that certificates must be re-earned under current gates.
7. Confirm the import resets device-local assessment and Learning Insights analytics so evidence from old device profiles is not attributed to the imported learners.

If any expected data are missing, stop retirement of the legacy recovery launcher and open a repository issue containing only non-sensitive reproduction details.

## Step 5 — accessibility/navigation smoke check

On the same real Windows environment:

- Tab and Shift+Tab through Home/navigation controls;
- confirm visible focus is usable;
- open Home, Learn, Practice and More without a pointer;
- test 100% and 200% application/system zoom where applicable;
- confirm lesson actions do not become unreachable;
- confirm external HTTPS references open in the system browser;
- confirm no unexpected renderer permission prompt appears.

This is a smoke check, not a substitute for a formal accessibility audit.

## Retirement decision

The frozen legacy launcher may be removed from the recovery lane only after all of these are true:

- [ ] release SHA-256 independently matches;
- [ ] normal Windows 10/11 launch passes;
- [ ] local learner state persists across close/reopen and Windows restart;
- [ ] offline launch passes after first successful launch;
- [ ] a real legacy backup imports with expected profile/progress/notes/history;
- [ ] imported certificate/pass state is not trusted;
- [ ] imported analytics are reset rather than attributed to new/imported profiles;
- [ ] keyboard/navigation smoke checks pass;
- [ ] evidence is retained outside the public repository under appropriate controls.

After these pass, remove the legacy executable/feed references in a separate PR, rerun full Release QA + Mobile Browser QA + Open Desktop Build, and publish the next desktop release.

## Evidence boundary

The public issue may record the Windows version, MouldMaster release, pass/fail status, executable hash and non-sensitive defect description. Do **not** publish learner names, backup content, customer identifiers, proprietary process data or private filesystem/user information.

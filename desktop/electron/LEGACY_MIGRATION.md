# Legacy Windows migration to Open Desktop

The open-source Electron desktop package is the normal Windows release path from `2026.08.24.2` onward. The old `MouldMasterAcademy.exe` runtime uses a separate local browser/storage context, so learner data is **not** assumed to migrate automatically.

## Before changing Windows runtimes

1. Open the existing/legacy MouldMaster installation while its learner data is still available.
2. Use MouldMaster's progress-backup export and save the backup file somewhere outside the application folder.
3. Keep the legacy installation until the backup has been imported and checked in the open desktop build.
4. Download the open desktop package only from the repository's tagged GitHub Release or the Microsoft Store after Store certification is actually granted.
5. Compare the downloaded file's SHA-256 with the release `SHA256SUMS.txt` before using an unsigned GitHub build for testing.

## Import into the open desktop build

1. Start the open desktop package and confirm the displayed desktop version matches the release you downloaded.
2. Use the existing MouldMaster progress-backup import with the file exported from the legacy runtime.
3. Confirm the intended learner profile, lesson progress, notes and assessment history are present before retiring the old installation.
4. Run a small smoke test: open a lesson, save a note, complete a non-critical practice action, close the app, reopen it, and confirm the local state persisted.

## Certificate boundary

MouldMaster deliberately does not trust imported certificate state as proof of completion. Backup import sanitizes certificate and pass-status fields, so certificates must be re-earned under the current assessment/certificate gates. This is a security/integrity control, not a migration defect.

## What must be checked before deleting the legacy recovery launcher

The repository can automate Windows builds and QA, but the final retirement decision needs a real Windows 10/11 migration check using an existing learner backup:

- [ ] published open desktop package launches on a normal Windows 10/11 machine
- [ ] exported learner backup imports successfully
- [ ] expected progress/notes/history are present after import
- [ ] local state persists across restart
- [ ] offline launch works after one successful launch
- [ ] release SHA-256 matches the downloaded executable
- [ ] no workflow or documentation still advertises the legacy EXE as the normal Windows download

Until those checks are recorded, the old executable may remain frozen as a recovery-only compatibility component. It must not be described as open source, Microsoft-certified, or the preferred Windows distribution.

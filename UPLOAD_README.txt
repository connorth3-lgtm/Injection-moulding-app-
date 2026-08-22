MOULDMASTER WINDOWS UPDATE FEED FILES

Upload these three files to the ROOT of:
connorth3-lgtm/Injection-moulding-app-

- latest.json
- MouldMaster_Academy_App.html
- MouldMasterAcademy.exe

The installed Windows app checks latest.json. It verifies SHA-256 before accepting either a learning-content update or a Windows launcher update.

For a future CONTENT-only release:
1. publish the new MouldMaster_Academy_App.html
2. increment "version"
3. update "sha256"

For a future WINDOWS LAUNCHER release:
1. publish the new MouldMasterAcademy.exe
2. increment "launcher_version"
3. update "launcher_sha256"

Do not publish a manifest until the files and hashes it references are already available.

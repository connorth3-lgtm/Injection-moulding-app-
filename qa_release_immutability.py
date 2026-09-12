from pathlib import Path

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

wf=(ROOT/'.github'/'workflows'/'publish-open-desktop.yml').read_text(encoding='utf-8')
need('--clobber' not in wf,'desktop release workflow must never replace published assets')
for marker in [
    'detect-desktop-release-change:',
    'Detect desktop release identity change',
    'BEFORE_SHA: ${{ github.event.before }}',
    'needs: detect-desktop-release-change',
    "if: needs.detect-desktop-release-change.outputs.changed == 'true'",
    'web-only version update will not rebuild or republish desktop.',
    'Publish one-shot release without asset replacement',
    'gh release create $env:MM_RELEASE_TAG --draft',
    'gh release upload $env:MM_RELEASE_TAG @paths',
    'gh release edit $env:MM_RELEASE_TAG --draft=false',
    'Existing release is byte-identical to the staged build. No upload or replacement performed.',
    'Existing release SHA256SUMS differs from this source build',
    'Bump desktop_release; never clobber a published release.',
    'Published release hash mismatch',
    'Repository-level GitHub immutable releases should be enabled before the next release',
]: need(marker in wf,f'desktop release immutability/version-gate safeguard missing: {marker}')
need("get('desktop_release', '')" in wf,'desktop publication gate must compare desktop_release rather than any version.json change')
need(wf.find('detect-desktop-release-change:') < wf.find('publish-windows:'),'desktop identity detection must run before the Windows publication job')
need(wf.find('gh release create $env:MM_RELEASE_TAG --draft') < wf.find('gh release upload $env:MM_RELEASE_TAG @paths') < wf.find('gh release edit $env:MM_RELEASE_TAG --draft=false'),'immutable release flow must be draft -> asset upload -> publish')

guard_path=ROOT/'.github'/'workflows'/'desktop-release-immutability-guard.yml'
need(guard_path.exists(),'platform immutable desktop release guard workflow missing')
guard=guard_path.read_text(encoding='utf-8')
for marker in [
    'name: Desktop Release Platform Immutability Guard',
    'workflow_run:',
    'workflows: ["Publish Open Desktop Release"]',
    'types: [completed]',
    'branches: [main]',
    'permissions: {}',
    "if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}",
    'contents: write',
    'ref: ${{ github.event.workflow_run.head_sha || github.sha }}',
    'fetch-depth: 2',
    "TRIGGER_EVENT: ${{ github.event.workflow_run.event || '' }}",
    'TRIGGER_SHA: ${{ github.event.workflow_run.head_sha || github.sha }}',
    'TRIGGER_STARTED_AT: ${{ github.event.workflow_run.run_started_at || \'\' }}',
    'TRIGGER_UPDATED_AT: ${{ github.event.workflow_run.updated_at || \'\' }}',
    'Desktop release identity unchanged at $current; no platform immutability check is required for this web-only publisher run.',
    'X-GitHub-Api-Version: 2026-03-10',
    'get("immutable") is True',
    'target_commitish',
    'started <= created <= updated',
    'created_by_this_run="true"',
    'gh release delete "$tag" --repo "$REPOSITORY" --yes --cleanup-tag',
    'The newly created mutable release/tag was removed.',
    'Existing releases are never auto-deleted.',
]: need(marker in guard,f'platform immutable release guard safeguard missing: {marker}')
need("TRIGGER_EVENT\" == \"push\"" in guard,'guard must distinguish normal push publisher runs from manual publication verification')
need(guard.find('current == "$previous"') < guard.find('releases/tags/${tag}'),'web-only desktop-identity skip must occur before release lookup')
need(guard.find('immutable\") is True') < guard.find('created_by_this_run="false"'),'platform immutable state must be checked before mutable-release cleanup provenance is considered')
need(guard.find('if [[ "$created_by_this_run" == "true" ]]') < guard.find('gh release delete "$tag" --repo "$REPOSITORY" --yes --cleanup-tag'),'mutable release deletion must be restricted to a release proven to come from the triggering publisher run')
need(guard.count('gh release delete ') == 1,'platform immutable guard must have exactly one release-deletion path')
need('release:' not in guard.split('permissions: {}',1)[0],'guard must use workflow_run rather than relying on release events emitted by a GITHUB_TOKEN publisher')

print('MouldMaster desktop release immutability QA passed (desktop_release-gated one-shot publisher; byte verification; workflow-run platform immutable check; provenance-bounded cleanup for newly created mutable releases only)')

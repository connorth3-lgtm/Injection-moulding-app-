from pathlib import Path

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

wf=(ROOT/'.github'/'workflows'/'publish-open-desktop.yml').read_text(encoding='utf-8')
need('--clobber' not in wf,'desktop release workflow must never replace published assets')
for marker in [
    'Publish one-shot release without asset replacement',
    'gh release create $env:MM_RELEASE_TAG --draft',
    'gh release upload $env:MM_RELEASE_TAG @paths',
    'gh release edit $env:MM_RELEASE_TAG --draft=false',
    'Existing release is byte-identical to the staged build. No upload or replacement performed.',
    'Existing release SHA256SUMS differs from this source build',
    'Bump desktop_release; never clobber a published release.',
    'Published release hash mismatch',
    'Repository-level GitHub immutable releases should be enabled',
]: need(marker in wf,f'desktop release immutability safeguard missing: {marker}')
need(wf.find('gh release create $env:MM_RELEASE_TAG --draft') < wf.find('gh release upload $env:MM_RELEASE_TAG @paths') < wf.find('gh release edit $env:MM_RELEASE_TAG --draft=false'),'immutable release flow must be draft -> asset upload -> publish')
need('Get-AuthenticodeSignature' in wf and 'TimeStamperCertificate' in wf,'immutable public Windows release must also retain verified signing/timestamp provenance')
need('production-source-evidence.json' in wf,'immutable public Windows release must retain governed source provenance')
print('MouldMaster desktop release immutability QA passed (no clobber; existing release hash verification; signed/provenanced draft-first one-shot publication)')

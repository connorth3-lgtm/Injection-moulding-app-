#!/usr/bin/env bash
set -euo pipefail

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

set +e
git merge --no-commit --no-ff origin/audit/process-reset-domless-hardening
merge_code=$?
set -e
if [[ "$merge_code" -ne 1 ]]; then
  echo "Expected the known release-identity conflicts; merge exit was $merge_code" >&2
  exit 1
fi

mapfile -t actual_conflicts < <(git diff --name-only --diff-filter=U | sort)
expected_conflicts=(
  README.md
  data/release-external-validation-v1.json
  index.html
  pwa-shell.js
  qa_release.py
  qa_release_docs.py
  service-worker.js
  support.html
  version.json
)
printf '%s\n' "${expected_conflicts[@]}" | sort > /tmp/expected-conflicts.txt
printf '%s\n' "${actual_conflicts[@]}" > /tmp/actual-conflicts.txt
if ! diff -u /tmp/expected-conflicts.txt /tmp/actual-conflicts.txt; then
  echo 'Integration conflict surface changed; refusing automatic resolution.' >&2
  exit 1
fi

# Security/recovery stack owns the frozen/current core integrity contract and the
# latest release identity in these files. The governed release helper will then
# advance that identity once both stacks are present.
git checkout --ours -- \
  README.md \
  data/release-external-validation-v1.json \
  index.html \
  pwa-shell.js \
  qa_release.py \
  service-worker.js \
  version.json

# Process-data stack owns the added retention/privacy documentation assertions.
git checkout --theirs -- qa_release_docs.py support.html

python - <<'PY'
from pathlib import Path
old_process='2026.09.12.6'
security_base='2026.09.12.16'
for name in ['qa_release_docs.py','support.html']:
    p=Path(name); text=p.read_text(encoding='utf-8')
    if old_process not in text:
        raise SystemExit(f'{name}: expected process-stack release marker missing')
    p.write_text(text.replace(old_process,security_base),encoding='utf-8')

p=Path('support.html'); text=p.read_text(encoding='utf-8')
anchor="Use the app's progress export before changing browser profiles, clearing site data or moving devices. "
addition="If the app reports that browser storage is unavailable, current changes are session-only; export a backup before reloading or closing the app if you need to preserve that session. "
if text.count(anchor)!=1:
    raise SystemExit(f'support integration anchor count was {text.count(anchor)}, expected 1')
if addition not in text:
    text=text.replace(anchor,anchor+addition,1)
p.write_text(text,encoding='utf-8')
PY

git add README.md data/release-external-validation-v1.json index.html pwa-shell.js qa_release.py qa_release_docs.py service-worker.js support.html version.json
if git diff --name-only --diff-filter=U | grep -q .; then
  echo 'Unresolved merge conflicts remain.' >&2
  git diff --name-only --diff-filter=U >&2
  exit 1
fi

# Both divergent runtime stacks are now present. Give the integrated candidate a
# new release identity rather than reusing either branch's independent identity.
python tools/bump_web_release.py --release 2026.09.12.17

git diff --check

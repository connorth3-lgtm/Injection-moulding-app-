#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]

def replace_once(path, old, new):
    p=ROOT/path
    text=p.read_text(encoding='utf-8')
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{path}: expected one occurrence, found {count}: {old[:80]!r}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# Source semantic roles: behavior must target stable roles, never learner-visible copy.
replace_once('learning-experience.js', "const VERSION='2026.08.26.1';", "const VERSION='2026.09.10.3';")
replace_once('learning-experience.js', '<section class="mm-today-focus" aria-label="Today\'s learning focus">', '<section class="mm-today-focus" data-mm-role="today-focus" aria-label="Today\'s learning focus">')
replace_once('learning-experience.js', '<div class="mm-home-utility" aria-label="Home shortcuts"><button class="ghost" type="button" data-mm-onclick="switchView(\'scenarios\')">◎ Daily practice</button><button class="ghost" type="button" data-mm-onclick="switchView(\'profile\')">☆ Saved lessons</button></div>', '<div class="mm-home-utility" aria-label="Home shortcuts"><button class="ghost" type="button" data-mm-role="daily-practice" data-mm-onclick="switchView(\'scenarios\')">◎ Daily practice</button><button class="ghost" type="button" data-mm-role="saved-lessons" data-mm-onclick="switchView(\'profile\')">☆ Saved lessons</button></div>')
replace_once('learning-experience.js', '<button class="primary" type="button" data-mm-onclick="switchView(\'lesson\')">Continue lesson →</button>', '<button class="primary" type="button" data-mm-role="continue-lesson" data-mm-onclick="switchView(\'lesson\')">Continue lesson →</button>')
replace_once('learning-experience.js', '<section class="mm-home-task-hub" aria-label="MouldMaster quick actions">', '<section class="mm-home-task-hub" data-mm-role="task-hub" aria-label="MouldMaster quick actions">')
replace_once('learning-experience.js', '<button class="mm-home-action mm-home-action-primary" type="button" data-mm-onclick="mmOpenMouldMaster()">', '<button class="mm-home-action mm-home-action-primary" type="button" data-mm-role="diagnose-defect" data-mm-onclick="mmOpenMouldMaster()">')
replace_once('learning-experience.js', '<button class="mm-home-action" type="button" data-mm-onclick="mmOpenDataDiagnosis()">', '<button class="mm-home-action" type="button" data-mm-role="process-data" data-mm-onclick="mmOpenDataDiagnosis()">')
replace_once('learning-experience.js', '<button class="mm-home-action" type="button" data-mm-onclick="switchView(\'scenarios\')">', '<button class="mm-home-action" type="button" data-mm-role="practice-scenario" data-mm-onclick="switchView(\'scenarios\')">')
replace_once('learning-experience.js', '<button class="mm-home-action" type="button" data-mm-onclick="switchView(\'path\')">', '<button class="mm-home-action" type="button" data-mm-role="explore-learning" data-mm-onclick="switchView(\'path\')">')

replace_once('app-shell-finalize.js', "const VERSION='2026.09.10.1';", "const VERSION='2026.09.10.3';")
replace_once('app-shell-finalize.js', "const learningShortcut=actions.find(button=>/Explore your learning/i.test(button.textContent||''));", "const learningShortcut=root.querySelector('[data-mm-role=\"explore-learning\"]');")
replace_once('app-shell-finalize.js', "window.MM_APP_SHELL_FINALIZED='2026.08.26.4';", "window.MM_APP_SHELL_FINALIZED=VERSION;")

# QA asserts semantic ownership and removes stale version contracts.
replace_once('qa_learning_experience.py', '"const VERSION=\'2026.08.26.1\'",', '"const VERSION=\'2026.09.10.3\'",')
needle="    'mm-home-task-hub',\n"
roles="    'mm-home-task-hub',\n    'data-mm-role=\"today-focus\"',\n    'data-mm-role=\"task-hub\"',\n    'data-mm-role=\"diagnose-defect\"',\n    'data-mm-role=\"process-data\"',\n    'data-mm-role=\"practice-scenario\"',\n    'data-mm-role=\"explore-learning\"',\n"
replace_once('qa_learning_experience.py', needle, roles)
replace_once('qa_app_shell_registry.py', "need(\"MM_APP_SHELL_FINALIZED='2026.08.26.4'\" in finalizer,'finalizer marker is stale')", "need('window.MM_APP_SHELL_FINALIZED=VERSION' in finalizer,'finalizer marker must derive from the finalizer version')\nneed(\"root.querySelector('[data-mm-role=\\\"explore-learning\\\"]')\" in finalizer,'Home simplification must target the semantic learning role')\nneed('actions.find(button=>/Explore your learning/i.test' not in finalizer,'Home behavior must not depend on learner-visible learning-copy text')")
replace_once('qa_app_shell_registry.py', '"window.MM_APP_SHELL_FINALIZED===\'2026.08.26.4\'",', '"window.MM_APP_SHELL_FINALIZED===\'2026.09.10.3\'",')
replace_once('qa/mobile-viewport.spec.js', "window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'", "window.MM_APP_SHELL_FINALIZED==='2026.09.10.3'")
replace_once('qa_release.py', 'WEB_RELEASE = "2026.09.10.2"', 'WEB_RELEASE = "2026.09.10.3"')

version_path=ROOT/'version.json'
version=json.loads(version_path.read_text(encoding='utf-8'))
if version.get('web_release')!='2026.09.10.2':
    raise SystemExit(f"version.json: expected web_release 2026.09.10.2, got {version.get('web_release')!r}")
version['web_release']='2026.09.10.3'
version_path.write_text(json.dumps(version,indent=2)+"\n",encoding='utf-8')
print('Applied semantic UI roles, finalizer version hardening, and web release 2026.09.10.3')

from pathlib import Path


def require(condition, message):
    if not condition:
        raise AssertionError(message)


index = Path("index.html").read_text(encoding="utf-8")
shell = Path("pwa-shell.js").read_text(encoding="utf-8")
sbom = Path("desktop/electron/scripts/generate-sbom.cjs").read_text(encoding="utf-8")
assessment_qa = Path("qa_assessment_quality.py").read_text(encoding="utf-8")

require("viewport-fit=cover" in index, "mobile viewport must preserve safe-area support")
require("HEAD_ASSETS" in index and "BODY_SCRIPTS" in index, "bootstrap assets must be injected individually")
require("for(const [needle,markup] of HEAD_ASSETS)" in index, "head assets must be checked one by one")
require("for(const [src,tag] of BODY_SCRIPTS)" in index, "runtime scripts must be checked one by one")
require('throw new Error("Core training content is incomplete")' in index, "malformed core content must fail closed")
require("new MutationObserver(scheduleSync)" in shell, "shell DOM sync must be coalesced")
require("el.textContent!==value" in shell, "shell DOM sync must avoid no-op text mutations")
require("syncUpdateCard" in shell and "[data-mm-update-card]" in shell, "runtime version card synchronization missing")
require("dockReferenceLauncher" in shell and "getElementById('mm-src-open')" in shell, "reference launcher docking control missing")
require("document.querySelector('.sidebar-foot')" in shell, "reference launcher must prefer the non-overlay sidebar dock")
require("open.style.position='static'" in shell and "open.style.zIndex='auto'" in shell, "reference launcher must not remain a fixed high-z overlay")
require("configureReferenceDrawer" in shell, "non-blocking reference drawer control missing")
require("modal.setAttribute('aria-modal','false')" in shell, "reference drawer must not claim modal ownership of the whole app")
require("pointer-events:none!important" in shell, "reference drawer backdrop must allow app interaction outside the panel")
require(".mmsrc.mm-reference-drawer .mmsrc-panel{width:min(430px" in shell and "pointer-events:auto!important" in shell, "reference panel itself must remain interactive")
require("max-height:52dvh" in shell, "mobile reference drawer must leave working app space visible")
require("dockReferenceLauncher();configureReferenceDrawer();addNZLegacyNote()" in shell, "reference docking and drawer controls must run during shell synchronization")
require("MM_REFERENCE_DRAWER_MODE='non-blocking'" in shell, "reference drawer runtime mode marker missing")
require("desktopRelease" in shell, "desktop runtime version detection missing")
require("location.hostname==='127.0.0.1'" in shell and "Electron" in shell, "desktop display context must be constrained to the Electron loopback runtime")
require("displayContext().mode==='Desktop package'||!('serviceWorker' in navigator)" in shell, "desktop wrapper must not register the PWA service worker")
require("npm_execpath" in sbom and "result.error" in sbom, "desktop SBOM generation must use the npm CLI entry point and report spawn failures")
require("NamedTemporaryFile" in assessment_qa and "['node','-e',node]" not in assessment_qa, "assessment runtime QA must not exceed OS command-line limits")

print("MouldMaster runtime hardening QA passed")

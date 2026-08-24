from pathlib import Path


def require(condition, message):
    if not condition:
        raise AssertionError(message)


index = Path("index.html").read_text(encoding="utf-8")
shell = Path("pwa-shell.js").read_text(encoding="utf-8")

require("viewport-fit=cover" in index, "mobile viewport must preserve safe-area support")
require("HEAD_ASSETS" in index and "BODY_SCRIPTS" in index, "bootstrap assets must be injected individually")
require("new MutationObserver(scheduleSync)" in shell, "shell DOM sync must be coalesced")
require("el.textContent!==value" in shell, "shell DOM sync must avoid no-op text mutations")
require("[data-mm-update-card]" in shell, "runtime version card synchronization missing")
require("desktopRelease" in shell, "desktop runtime version detection missing")
require("runtimeContext().desktop||!('serviceWorker' in navigator)" in shell, "desktop wrapper must not register the PWA service worker")

print("MouldMaster runtime hardening QA passed")

#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def text(path): return (ROOT/path).read_text(encoding="utf-8")
def need(ok,msg):
    if not ok: raise AssertionError(msg)

book=text("src/domains/learning/book-runtime.js")
finalizer=text("src/domains/shell/app-shell-finalize.js")
registry=text("src/domains/shell/app-shell-registry.js")
training=text("src/domains/learning/training-qa-fix.js")
storage=text("docs/STORAGE_OWNERSHIP_MATRIX.md")
ui_shell=text("ui-shell.css")

for marker in [
    "BOOK_RESUME_PREFIX='mm_book_resume_v1::'",
    "MM_LEARNER_SCOPE",
    "resumeStorageKey()",
    "registerStoragePrefix?.(BOOK_RESUME_PREFIX)",
    "BOOK_RESUME_SCHEMA=1",
    "bookRelease:VERSION",
    "anchorId",
    "anchorIndex",
    "anchorText",
    "anchorOffset",
    "flushReadingPosition({notify:true})",
    "window.addEventListener('pagehide'",
    "visibilityState==='hidden'",
    "clearResume()",
    "h2[data-mm-book-anchor],h3[data-mm-book-anchor],h4[data-mm-book-anchor]",
    "el.dataset.mmBookAnchor===anchorId",
    "index>=0&&index<heads.length?heads[index]:null",
    "module:material-families:atlas",
    "bookViewportTop()",
    "bindBookScrollRoot()",
    "bindMaterialPagination(ui.reader);bindBookScrollRoot();",
    "ui.reader.hidden=false;bindBack();bindMaterialPagination(ui.reader);bindBookScrollRoot();rememberReadingPosition('reader-chapter'",
    "ui.reader.hidden=false;bindBack();bindBookScrollRoot();rememberReadingPosition('chapter'",
    "scrollBookBy(delta)",
    "mm:book-resume-restored",
    "scrollBookTo(snapshot.scrollY)",
]:
    need(marker in book,f"Book resume hardening missing: {marker}")

need("localStorage.getItem(BOOK_RESUME_KEY)" not in book,"Book resume must not use a device-global live storage key")
need("LEGACY_BOOK_RESUME_KEY='mouldmasterBookResume:v1'" in book,"experimental legacy Book resume cleanup marker missing")
need("if(!exists){clearResume();showContents();return false}" in book,"stale Book resume must fail safely to contents")
need("restoreReadingPosition({...activeReadingPosition})" not in book,"Material Atlas hydration must not replay a stale reader snapshot after asynchronous evidence loading")
need("const preserve=open&&activeReadingPosition?{scrollY:bookScrollTop(),anchor:readerAnchor()}:null" in book,"Material Atlas hydration must snapshot the live reading position immediately before DOM replacement")
need("if(preserve)scrollBookTo(preserve.scrollY)" in book,"Material Atlas hydration must preserve the live scroll offset synchronously across DOM replacement")

for marker in [
    "function bookDashboardState()",
    "api.getResume?.()||null",
    "data-mm-home-book",
    "data-mm-home-book-action",
    "function openBookFromShell",
    "window.addEventListener('mm:book-resume-change',queueDashboardCompose)",
    "window.addEventListener('mm:domains-ready',queueDashboardCompose)",
]:
    need(marker in registry,f"Home Book lifecycle hardening missing from canonical registry: {marker}")
need("renderHomeBookCard" not in finalizer,"Home Book must have one canonical UI owner; finalizer renderer must remain retired")
need("mm-book-instant-scroll" in book,"Book open/leave lifecycle must toggle the instant-scroll class")
need("html.mm-book-instant-scroll" in ui_shell and "scroll-behavior:auto!important" in ui_shell,"Book instant-scroll class must override legacy smooth scrolling in WebKit and other browsers")

for marker in [
    "BOOK_RESUME_PREFIX='mm_book_resume_v1::'",
    "scope.storageKey(BOOK_RESUME_PREFIX,scope.tokenFor(id))",
    "Book reading position",
    "including the saved Book reading position",
    "mm:book-resume-change",
    "MMBook?.clearResume",
]:
    need(marker in training,f"learner reset Book ownership missing: {marker}")

for marker in [
    "Book Keep Reading position",
    "Book reading position",
    "reset only the active learner",
]:
    need(marker in storage,f"storage ownership matrix missing Book resume contract: {marker}")

print("Book Keep Reading QA passed: learner-scoped persistence, reliable flush/restore, stale-record containment, Home lifecycle safety and learner reset ownership.")

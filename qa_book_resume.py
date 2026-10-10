#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def text(path): return (ROOT/path).read_text(encoding="utf-8")
def need(ok,msg):
    if not ok: raise AssertionError(msg)

book=text("src/domains/learning/book-runtime.js")
finalizer=text("src/domains/shell/app-shell-finalize.js")
registry=text("src/domains/shell/app-shell-registry.js")
reading_patch=text("reading-patch.js")
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
    "window.addEventListener('click'",
    "window.addEventListener('pagehide'",
    "visibilityState==='hidden'",
    "clearResume()",
    "h2[data-mm-book-anchor],h3[data-mm-book-anchor],h4[data-mm-book-anchor]",
    "el.dataset.mmBookAnchor===anchorId",
    "index>=0&&index<heads.length?heads[index]:null",
    "module:material-families:atlas",
    "bookViewportTop()",
    "for(let node=start;node&&node!==document.body;node=node.parentElement)",
    "bindBookScrollRoot()",
    "bindMaterialPagination(ui.reader);bindBookScrollRoot();",
    "ui.reader.hidden=false;bindBack();ui.reader.querySelectorAll('[data-mm-book-page-turn]').forEach(button=>button.addEventListener('click',()=>showReaderChapter(button.dataset.mmBookPageTurn)));bindMaterialPagination(ui.reader);bindBookScrollRoot();rememberReadingPosition('reader-chapter'",
    "ui.reader.hidden=false;bindBack();bindBookScrollRoot();rememberReadingPosition('chapter'",
    "scrollBookBy(delta)",
    "const atEnd=scrollHeight>0&&scrollTop+clientHeight>=scrollHeight-3",
    "const bottomClamped=rows.filter(x=>x.rect.top>activationTop&&x.rect.top<=viewportBottom-24&&x.rect.bottom>=top)",
    "if(bottomClamped.length)picked=bottomClamped[0]",
    "mm:book-resume-restored",
    "scrollBookTo(snapshot.scrollY)",
]:
    need(marker in book,f"Book resume hardening missing: {marker}")

# Core routing hides the Book scroll root before emitting onViewChange.
# The Book must save the live position at the pre-route boundary, including
# programmatic window.switchView, not only clicks or pagehide.
need("function prepareRouteExit(id)" in book and "prepareRouteExit,openResume" in book,
     "Book must expose an explicit pre-route bookmark flush")
need("window.MMBook?.prepareRouteExit?.(id)" in registry,
     "canonical shell must flush Book before captured.switchView hides the reader")
need("const scrollY=bookScrollTop(),anchor=readerAnchor()" in book,
     "Book must sample the live scroll position before anchor geometry can move the viewport")
need("R.before('switchView',id=>" in reading_patch and "window.MMBook?.prepareRouteExit?.(id)" in reading_patch,
     "early stable-view-entry hook must flush scoped Book bookmark before scroll reset")
need(reading_patch.index("window.MMBook?.prepareRouteExit?.(id)") <
     reading_patch.index("settleViewTop();",reading_patch.index("R.before('switchView'")),
     "stable view-entry reset must never run ahead of Book resume save")
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

need("start?.parentElement" not in book.split("function bookScrollRoot(){",1)[1].split("function isDocumentScrollRoot",1)[0],"Book scroll-root discovery must consider the reader element itself before its ancestors")

need("document.addEventListener('click',event=>{const target=event.target?.closest?.('nav button,[data-view],[data-page]')" not in book,"Book navigation flush must run at window capture before downstream document handlers can hide the reader")

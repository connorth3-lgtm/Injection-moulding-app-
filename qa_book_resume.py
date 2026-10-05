#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def text(path): return (ROOT/path).read_text(encoding="utf-8")
def need(ok,msg):
    if not ok: raise AssertionError(msg)

book=text("src/domains/learning/book-runtime.js")
shell=text("src/domains/shell/app-shell-finalize.js")
training=text("src/domains/learning/training-qa-fix.js")
storage=text("docs/STORAGE_OWNERSHIP_MATRIX.md")

for marker in [
    "BOOK_RESUME_PREFIX='mm_book_resume_v1::'",
    "MM_LEARNER_SCOPE",
    "resumeStorageKey()",
    "registerStoragePrefix?.(BOOK_RESUME_PREFIX)",
    "BOOK_RESUME_SCHEMA=1",
    "bookRelease:VERSION",
    "anchorText",
    "anchorOffset",
    "flushReadingPosition({notify:true})",
    "window.addEventListener('pagehide'",
    "visibilityState==='hidden'",
    "clearResume()",
    "top:-(Number(snapshot.anchorOffset)||0)",
]:
    need(marker in book,f"Book resume hardening missing: {marker}")

need("localStorage.getItem(BOOK_RESUME_KEY)" not in book,"Book resume must not use a device-global live storage key")
need("LEGACY_BOOK_RESUME_KEY='mouldmasterBookResume:v1'" in book,"experimental legacy Book resume cleanup marker missing")
need("if(!exists){clearResume();showContents();return false}" in book,"stale Book resume must fail safely to contents")

for marker in [
    "const saved=window.MMBook?.getResume?.()||null",
    "const book=window.MMBook;",
    "window.MMBook?.open?.()",
    "window.addEventListener('mm:domains-ready'",
]:
    need(marker in shell,f"Home Book lifecycle hardening missing: {marker}")
need("const book=window.MMBook;\n  const saved=book?.getResume?.()||null" not in shell,"Home Book card must not capture an unloaded runtime during render")

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

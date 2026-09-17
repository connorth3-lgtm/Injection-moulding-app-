from __future__ import annotations

from pathlib import Path
import argparse
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data"
RUNTIME = ROOT / "src" / "domains" / "learning" / "book-data"


def mirrored_pairs() -> list[tuple[Path, Path]]:
    if not RUNTIME.exists():
        raise AssertionError("Book runtime-data directory is missing")
    pairs: list[tuple[Path, Path]] = []
    for target in sorted(RUNTIME.glob("book-*.json")):
        source = SOURCE / target.name
        if not source.exists():
            raise AssertionError(
                f"Runtime Book payload has no authoritative data/ source: {target.relative_to(ROOT)}"
            )
        pairs.append((source, target))
    if not pairs:
        raise AssertionError("No mirrored Book runtime JSON payloads were found")
    return pairs


def check_pair(source: Path, target: Path) -> None:
    if source.read_bytes() != target.read_bytes():
        raise AssertionError(
            "Book runtime copy drifted from its authoritative source: "
            f"{source.relative_to(ROOT)} != {target.relative_to(ROOT)}. "
            "Edit data/ only, then run `python tools/sync_book_runtime_data.py --write`."
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Keep src/domains/learning/book-data generated from authoritative data/book-*.json files."
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="copy authoritative data/ payloads into the runtime mirror")
    mode.add_argument("--check", action="store_true", help="fail if any runtime mirror differs from data/ (default)")
    args = parser.parse_args()

    pairs = mirrored_pairs()
    if args.write:
        for source, target in pairs:
            shutil.copyfile(source, target)
        print(f"Synchronized {len(pairs)} Book runtime payloads from authoritative data/ sources")
        return

    for source, target in pairs:
        check_pair(source, target)
    print(f"Book runtime data mirror QA passed ({len(pairs)} byte-identical generated payloads)")


if __name__ == "__main__":
    main()

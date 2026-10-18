#!/usr/bin/env python3
"""Build a listenable, non-publishing MP3 edition of all 20 governed Book chapters.

The spoken main edition covers the full authored sections of all 46 modules,
27 synthetic worked cases, visual-diagram descriptions and chapter study prompts.
It is not a substitute for interactive source/claim ledgers or real-device audio QA.
"""
from __future__ import annotations

import csv
import hashlib
import html
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DEST = Path(sys.argv[1]) if len(sys.argv) == 2 else ROOT / "qa-artifacts" / "book-audiobook"
DEST.mkdir(parents=True, exist_ok=True)
BOOK_ID = "mouldmaster-book"


def load(name: str) -> dict:
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def blob_sha1(path: Path) -> str:
    content = path.read_bytes()
    return hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()


def speakable(text: object) -> str:
    value = html.unescape(str(text or ""))
    value = re.sub(r"<[^>]*>", " ", value)
    value = value.replace("°C", " degrees Celsius").replace("°F", " degrees Fahrenheit")
    value = value.replace("×", " times ").replace("→", " to ")
    value = value.replace("≤", " less than or equal to ")
    value = value.replace("≥", " greater than or equal to ")
    value = value.replace("≠", " not equal to ").replace("µ", " micro")
    return re.sub(r"\s+", " ", value).strip()


def append_line(lines: list[str], value: object) -> None:
    s = speakable(value)
    if s:
        lines.append(s)


def list_items(lines: list[str], label: str, values: object) -> None:
    if isinstance(values, list) and values:
        append_line(lines, label + ".")
        for i, item in enumerate(values, 1):
            append_line(lines, f"{i}. {item}")


def audio_encode(source: Path, target: Path) -> tuple[float, int]:
    if os.environ.get("MM_AUDIO_ENGINE") == "piper":
        # Neural Piper TTS is markedly clearer than the legacy eSpeak voice.
        # Run it entirely on this GitHub runner from a downloaded high-quality
        # open voice model. No learner data and no Book text are sent to a
        # hosted speech synthesis API.
        model = os.environ.get("MM_PIPER_VOICE", "en_GB-cori-high")
        model_dir = os.environ.get("MM_PIPER_DATA", "/tmp/mouldmaster-piper-voices")
        wav = target.with_suffix(".wav")
        try:
            subprocess.run(
                ["python3", "-m", "piper", "--model", model,
                 "--data-dir", model_dir, "--input-file", str(source),
                 "--sentence-silence", "0.20", "--length-scale", "1.05",
                 "-f", str(wav)],
                check=True, capture_output=True, timeout=900,
            )
            subprocess.run(
                ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
                 "-y", "-i", str(wav), "-ar", "24000", "-ac", "1",
                 "-c:a", "libmp3lame", "-b:a", "64k", str(target)],
                check=True, capture_output=True, timeout=180,
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Neural speech failed: {e.stderr[-1200:] if e.stderr else e}") from e
        finally:
            wav.unlink(missing_ok=True)
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(target)],
            check=True, capture_output=True, text=True,
        )
        duration = float(probe.stdout.strip())
        if duration < 40 or target.stat().st_size < 16000:
            raise RuntimeError(f"Invalid neural chapter recording {target}: {duration:.1f}s")
        return duration, target.stat().st_size

    # Stream PCM into the MP3 encoder: never need to keep a multi-hour WAV file.
    speaker = subprocess.Popen(
        ["espeak", "-v", "en-gb", "-s", "145", "-p", "48", "-g", "8",
         "--stdout", "-f", str(source)],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    assert speaker.stdout is not None
    encode = subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
         "-i", "pipe:0", "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame",
         "-b:a", "64k", str(target)],
        stdin=speaker.stdout, capture_output=True, timeout=900,
    )
    speaker.stdout.close()
    voice_status = speaker.wait(timeout=120)
    voice_stderr = speaker.stderr.read() if speaker.stderr else b""
    if voice_status or encode.returncode:
        raise RuntimeError(
            f"Audio encoder failed for {source.name}; "
            f"espeak={voice_status}: {voice_stderr[:500]!r}; "
            f"ffmpeg={encode.returncode}: {encode.stderr[:500]!r}"
        )
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
         str(target)],
        capture_output=True, text=True, check=True,
    )
    duration = float(probe.stdout.strip())
    if duration < 40 or target.stat().st_size < 16000:
        raise RuntimeError(f"Invalid or truncated audio {target}: {duration:.1f}s")
    return duration, target.stat().st_size


def main() -> None:
    auth = load("book-publication-authorization-v1.json")
    if auth.get("schema") != 1 or auth.get("bookId") != BOOK_ID or auth.get("status") != "authorized":
        raise RuntimeError("Governed Book authorization unavailable")
    if blob_sha1(DATA / "book-publication-authorization-v1.json") != "59ecce5760e475e272eb28a11166946bd8dab492":
        raise RuntimeError("Book authorization bytes do not match the pinned runtime identity")
    pins = auth["runtimeIntegrity"]["gitBlobSha1ByFile"]
    names = [
        "book-manifest-v1.json",
        "book-reader-architecture-v2.json",
        "book-authored-foundations-v1.json",
        "book-evidence-registry-v1.json",
        "book-chapters-materials-machine-v1.json",
        "book-authored-remaining-v1.json",
        "book-worked-engineering-cases-v1.json",
        "book-engineering-diagrams-v1.json",
    ]
    for name in names:
        expected = pins.get(name)
        if not expected or blob_sha1(DATA / name) != expected:
            raise RuntimeError(f"Book source integrity check failed: {name}")

    manifest = load(names[0])
    architecture = load(names[1])
    cases = load(names[6]).get("cases", [])
    diagrams = load(names[7]).get("diagrams", [])
    if not isinstance(cases, list) or len(cases) != 27:
        raise RuntimeError("The audiobook must include 27 governed worked cases")
    if not isinstance(diagrams, list) or len(diagrams) != 25:
        raise RuntimeError("The audiobook must describe all 25 diagrams")

    modules = {
        chapter["id"]: chapter.copy()
        for part in manifest.get("parts", [])
        for chapter in part.get("chapters", [])
    }
    if len(modules) != 46:
        raise RuntimeError("The audiobook must use 46 unique governed module IDs")

    authored = set()
    for name in names[2:6]:
        batch = load(name)
        rows = batch.get("chapters", [])
        if not isinstance(rows, list):
            raise RuntimeError(f"Authored batch {name} is not a list")
        for chapter in rows:
            key = chapter.get("id")
            if key in authored or key not in modules:
                raise RuntimeError(f"Duplicate/unknown governed module {key!r}")
            authored.add(key)
            modules[key].update(chapter)
    if len(authored) != 46 or set(auth.get("authorizedChapterIds", [])) != authored:
        raise RuntimeError("Authored modules and authorized publication IDs disagree")

    readers = architecture.get("readerChapters", [])
    if len(readers) != 20:
        raise RuntimeError("The audiobook must contain exactly 20 ordered reader chapters")
    all_ids = [key for reader in readers for key in reader.get("moduleIds", [])]
    if len(all_ids) != 46 or set(all_ids) != authored:
        raise RuntimeError("The 20 reader chapters must cover all 46 modules exactly once")

    source_sha = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip()
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))["web_release"]
    titles = []
    total_duration = 0.0
    # Parallel audiobook generation: five independent four-chapter shards.
    # Each shard validates the full governed source, and outputs only the
    # named chapters. The final package assembles and audits every shard.
    shard = int(os.environ.get("MM_AUDIO_SHARD", "0"))
    if shard and not 1 <= shard <= 5:
        raise RuntimeError("MM_AUDIO_SHARD must be 1..5")

    for index, reader in enumerate(readers, 1):
        if shard and (index - 1) // 4 + 1 != shard:
            continue
        lines: list[str] = []
        module_ids = reader["moduleIds"]
        append_line(lines, f"Chapter {index}. {reader['title']}.")
        append_line(lines, reader["goal"])
        append_line(lines, "Source evidence reviewed. Independent human subject matter expert review is pending. Educational reference only. Current machine, material, mould and site requirements control actual production.")
        append_line(lines, reader.get("readingThread"))
        case_count = 0
        diagram_count = 0

        for module_id in module_ids:
            module = modules[module_id]
            append_line(lines, f"Module. {module['title']}.")
            append_line(lines, "Applicability. " + module.get("applicability", ""))
            sections = module.get("sections", [])
            if not sections:
                raise RuntimeError(f"Empty governed module {module_id}")
            for section in sections:
                append_line(lines, section.get("title"))
                append_line(lines, section.get("text"))

            for diagram in diagrams:
                if diagram.get("chapterId") == module_id:
                    diagram_count += 1
                    append_line(lines, "Diagram description.")
                    append_line(lines, diagram.get("title"))
                    append_line(lines, diagram.get("alt"))
                    append_line(lines, diagram.get("caption"))

            for case in cases:
                if case.get("chapterId") != module_id:
                    continue
                case_count += 1
                append_line(lines, "Worked example using synthetic teaching data.")
                append_line(lines, case["title"])
                append_line(lines, case["setup"])
                table = case.get("table")
                if isinstance(table, dict):
                    cols = table.get("columns") or []
                    for row in table.get("rows") or []:
                        if isinstance(row, list):
                            append_line(lines, ". ".join(
                                f"{cols[i]}: {cell}" if i < len(cols) else str(cell)
                                for i, cell in enumerate(row)
                            ))
                list_items(lines, "Observations", case.get("observations"))
                list_items(lines, "Assumptions", case.get("assumptions"))
                list_items(lines, "Units", case.get("units"))
                list_items(lines, "Calculation and reasoning", case.get("calculationSteps"))
                append_line(lines, "Interpretation.")
                append_line(lines, case.get("interpretation"))
                list_items(lines, "Limits and boundaries", case.get("boundaries"))

        append_line(lines, "Chapter learning check.")
        list_items(lines, "Learning objectives", reader.get("learningObjectives"))
        list_items(lines, "Questions to consider", reader.get("checkQuestions"))
        append_line(lines, "Apply it.")
        append_line(lines, reader.get("applyPrompt"))
        append_line(lines, f"End of Chapter {index}.")
        if len(lines) < len(module_ids) * 3:
            raise RuntimeError(f"Unexpectedly sparse audio chapter {index}")

        slug = re.sub(r"[^a-z0-9]+", "_", reader["title"].lower()).strip("_")[:70]
        stem = f"{index:02d}_{slug}"
        txt = DEST / f"{stem}.txt"
        mp3 = DEST / f"{stem}.mp3"
        txt.write_text("\n\n".join(lines) + "\n", encoding="utf-8")
        duration, size = audio_encode(txt, mp3)
        total_duration += duration
        titles.append({
            "number": index, "readerId": reader["id"], "title": reader["title"],
            "modules": module_ids, "syntheticWorkedCases": case_count,
            "diagramDescriptions": diagram_count,
            "words": len(txt.read_text(encoding="utf-8").split()),
            "minutes": round(duration / 60, 1),
            "file": mp3.name, "sizeBytes": size,
            "sha256": hashlib.sha256(mp3.read_bytes()).hexdigest(),
        })
        print(f"[{index:02d}/20] {reader['title']} "
              f"({duration / 60:.1f} min, {size / (1024*1024):.1f} MiB)", flush=True)
        # The one-chapter audition requires a human clarity check first.
        # The full audiobook run keeps all 20-chapter coverage assertions.
        if os.environ.get("MM_AUDIO_SAMPLE_ONLY") == "1":
            break

    if not shard and os.environ.get("MM_AUDIO_SAMPLE_ONLY") != "1" and (
        sum(x["syntheticWorkedCases"] for x in titles) != 27 or sum(
            x["diagramDescriptions"] for x in titles
        ) != 25
    ):
        raise RuntimeError("Audiobook coverage changed: worked cases or diagrams are missing")

    with (DEST / "CHAPTER_INDEX.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["chapter", "title", "minutes", "modules", "synthetic_cases", "mp3_file"])
        for item in titles:
            writer.writerow([item["number"], item["title"], item["minutes"],
                             len(item["modules"]), item["syntheticWorkedCases"], item["file"]])
    result = {
        "edition": "MouldMaster Book – complete authored text listening edition",
        "sourceSha": source_sha, "governedBookVersion": version,
        "readerChapters": len(titles),
        "governedModules": sum(len(x["modules"]) for x in titles),
        "workedCases": sum(x["syntheticWorkedCases"] for x in titles),
        "diagramDescriptions": sum(x["diagramDescriptions"] for x in titles),
        "minutes": round(total_duration / 60, 1),
        "chapters": titles,
        "independentHumanSmeReview": "HOLD",
        "physicalDeviceAudioVerified": False,
    }
    (DEST / "AUDIOBOOK_MANIFEST.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    readme = f"""MouldMaster Book – 20-chapter offline MP3 listening edition

Open any of the numbered MP3 files on your Android phone.
They play through a normal media player, not MouldMaster's broken Device Voice.
All 20 chapters cover the full authored sections of 46 Book modules, 27
synthetic worked examples and spoken descriptions of 25 diagrams.
Text transcripts are included for accessibility and checking.

These tracks are adapted for listening, and are NOT byte-for-byte dumps of
every expandable app UI control, image or evidence/claim-source ledger.
Use MouldMaster's visual Book for original references and figures.

Book repository source: {source_sha}
Web version at source: {version}
Recorded voice: eSpeak British English, 145 words/minute, mono MP3 at 64 kb/s.
Audio duration: {total_duration / 3600:.2f} hours.

Educational reference only: independent human subject-matter expert review
remains HOLD. Actual production machine, mould, material, site and safety
instructions take precedence. This file is a temporary non-publishing
listening aid, not a published MouldMaster app release.

Audio bytes were verified by an encoder success, ffprobe duration, SHA-256
per MP3, strict 20/46/27/25 completeness checks and pinned Git blob IDs.
Audibility through a specific Android device/headset has NOT been tested here.
"""
    (DEST / "READ_ME_FIRST.txt").write_text(readme, encoding="utf-8")
    print(json.dumps({"chapters": len(titles), "totalHours": round(total_duration / 3600, 2),
                      "output": str(DEST)}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Fail-closed HTML script extraction for trusted repository documents."""
from __future__ import annotations

from dataclasses import dataclass
from html.parser import HTMLParser


@dataclass(frozen=True)
class ScriptBlock:
    attrs: tuple[tuple[str, str | None], ...]
    body: str

    @property
    def has_src(self) -> bool:
        return any(name.lower() == "src" for name, _value in self.attrs)


class _ScriptParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.blocks: list[ScriptBlock] = []
        self._attrs: tuple[tuple[str, str | None], ...] | None = None
        self._parts: list[str] = []

    @property
    def in_script(self) -> bool:
        return self._attrs is not None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "script":
            return
        if self.in_script:
            raise ValueError("nested script element is not valid for runtime extraction")
        self._attrs = tuple(attrs)
        self._parts = []

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "script":
            self.blocks.append(ScriptBlock(tuple(attrs), ""))

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "script" or not self.in_script:
            return
        assert self._attrs is not None
        self.blocks.append(ScriptBlock(self._attrs, "".join(self._parts)))
        self._attrs = None
        self._parts = []

    def handle_data(self, data: str) -> None:
        if self.in_script:
            self._parts.append(data)

    def handle_entityref(self, name: str) -> None:
        if self.in_script:
            self._parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if self.in_script:
            self._parts.append(f"&#{name};")


def script_blocks(html: str) -> list[ScriptBlock]:
    parser = _ScriptParser()
    parser.feed(html)
    parser.close()
    if parser.in_script:
        raise ValueError("unterminated or malformed script element")
    return parser.blocks


def inline_script_bodies(html: str) -> list[str]:
    return [block.body for block in script_blocks(html) if not block.has_src]

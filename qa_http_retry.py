#!/usr/bin/env python3
from __future__ import annotations

import io
import sys
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "tools"))
import http_retry  # noqa: E402


class Response:
    def __init__(self, payload: bytes = b"ok"):
        self.payload = payload
    def __enter__(self):
        return self
    def __exit__(self, *_args):
        return False
    def read(self):
        return self.payload


def run_sequence(sequence):
    calls = {"count": 0}
    original_open = http_retry.urllib.request.urlopen
    original_sleep = http_retry.time.sleep
    original_uniform = http_retry.random.uniform
    def fake_open(*_args, **_kwargs):
        item = sequence[calls["count"]]
        calls["count"] += 1
        if isinstance(item, BaseException):
            raise item
        return item
    try:
        http_retry.urllib.request.urlopen = fake_open
        http_retry.time.sleep = lambda _seconds: None
        http_retry.random.uniform = lambda _a, _b: 0.0
        result = http_retry.urlopen_with_retry("https://example.invalid", timeout=1, attempts=4, base_delay=0)
        return result, calls["count"]
    finally:
        http_retry.urllib.request.urlopen = original_open
        http_retry.time.sleep = original_sleep
        http_retry.random.uniform = original_uniform


retryable = urllib.error.HTTPError("https://example.invalid", 502, "Bad Gateway", {}, io.BytesIO())
response, calls = run_sequence([retryable, Response(b"recovered")])
assert calls == 2
assert response.read() == b"recovered"

transport = urllib.error.URLError("connection reset")
response, calls = run_sequence([transport, Response(b"transport-recovered")])
assert calls == 2
assert response.read() == b"transport-recovered"

calls = {"count": 0}
original_open = http_retry.urllib.request.urlopen
try:
    def fail_404(*_args, **_kwargs):
        calls["count"] += 1
        raise urllib.error.HTTPError("https://example.invalid", 404, "Not Found", {}, io.BytesIO())
    http_retry.urllib.request.urlopen = fail_404
    try:
        http_retry.urlopen_with_retry("https://example.invalid", timeout=1, attempts=4, base_delay=0)
        raise AssertionError("404 must not be retried or converted to success")
    except urllib.error.HTTPError as exc:
        assert exc.code == 404
    assert calls["count"] == 1
finally:
    http_retry.urllib.request.urlopen = original_open

assert http_retry.RETRYABLE_HTTP == {429, 500, 502, 503, 504}
print("HTTP retry QA passed: transient transport failures retry; semantic/non-retryable HTTP failures remain fail-closed")

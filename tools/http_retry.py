#!/usr/bin/env python3
"""Bounded retry helper for public evidence/source downloads.

Retries transport-only failures. Callers remain responsible for cryptographic,
schema, semantic, source-identity and provenance validation of returned bytes.
"""
from __future__ import annotations

import email.utils
import random
import socket
import sys
import time
import urllib.error
import urllib.request
from typing import Any

RETRYABLE_HTTP = {429, 500, 502, 503, 504}


def _delay_seconds(exc: BaseException, attempt: int, base_delay: float, max_delay: float) -> float:
    retry_after = None
    if isinstance(exc, urllib.error.HTTPError):
        raw = exc.headers.get("Retry-After") if exc.headers else None
        if raw:
            try:
                retry_after = float(raw)
            except ValueError:
                try:
                    dt = email.utils.parsedate_to_datetime(raw)
                    retry_after = max(0.0, dt.timestamp() - time.time())
                except Exception:
                    retry_after = None
    if retry_after is not None:
        return min(max_delay, retry_after)
    # Small jitter avoids synchronized retries across parallel benchmark jobs.
    return min(max_delay, base_delay * (2 ** attempt)) + random.uniform(0.0, min(0.25, base_delay))


def urlopen_with_retry(
    request: Any,
    *,
    timeout: float,
    attempts: int = 4,
    base_delay: float = 1.0,
    max_delay: float = 8.0,
    context: Any = None,
):
    if attempts < 1:
        raise ValueError("attempts must be >= 1")
    last: BaseException | None = None
    for attempt in range(attempts):
        try:
            kwargs = {"timeout": timeout}
            if context is not None:
                kwargs["context"] = context
            return urllib.request.urlopen(request, **kwargs)
        except urllib.error.HTTPError as exc:
            last = exc
            if exc.code not in RETRYABLE_HTTP or attempt + 1 >= attempts:
                raise
        except (urllib.error.URLError, TimeoutError, socket.timeout, ConnectionError) as exc:
            last = exc
            if attempt + 1 >= attempts:
                raise
        delay = _delay_seconds(last, attempt, base_delay, max_delay)
        print(
            f"Transient download failure ({type(last).__name__}: {last}); "
            f"retry {attempt + 2}/{attempts} in {delay:.2f}s",
            file=sys.stderr,
        )
        time.sleep(delay)
    assert last is not None
    raise last

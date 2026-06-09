#!/usr/bin/env python3
"""Watch raw/ for new source files and ingest them automatically.

Runs as a SEPARATE process (never inside the API event loop) — PDF extraction +
section splitting takes seconds and would starve uvicorn. Debounced so a
copy-in-progress isn't ingested mid-write.

Run:  .venv-win\\Scripts\\python tools\\watcher.py
"""
from __future__ import annotations

import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

import config
import ingest

WATCH_EXT = {".pdf", ".md", ".markdown", ".txt"}
DEBOUNCE_S = 3.0


class _Handler(FileSystemEventHandler):
    def __init__(self):
        self._pending: dict[str, float] = {}

    def on_created(self, event):
        self._queue(event)

    def on_modified(self, event):
        self._queue(event)

    def _queue(self, event):
        if event.is_directory:
            return
        p = Path(event.src_path)
        if p.suffix.lower() in WATCH_EXT and p.name != "manifest.json":
            self._pending[p.name] = time.time()

    def tick(self):
        now = time.time()
        for name in [n for n, t in self._pending.items() if now - t >= DEBOUNCE_S]:
            del self._pending[name]
            try:
                res = ingest.ingest_path(name)
                print(f"[watcher] ingested {name}: queued {res.get('queued')} sections")
            except Exception as e:  # noqa: BLE001
                print(f"[watcher] error ingesting {name}: {e}")


def main():
    config.RAW_DIR.mkdir(parents=True, exist_ok=True)
    handler = _Handler()
    obs = Observer()
    obs.schedule(handler, str(config.RAW_DIR), recursive=False)
    obs.start()
    print(f"[watcher] watching {config.RAW_DIR} for new sources... (Ctrl-C to stop)")
    try:
        while True:
            time.sleep(1)
            handler.tick()
    except KeyboardInterrupt:
        obs.stop()
    obs.join()


if __name__ == "__main__":
    main()

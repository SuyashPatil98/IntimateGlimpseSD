#!/usr/bin/env python3
"""Whole-repo git backup/sync for the Vault & Sync panel.

The vault lives *inside* the project repo, so "syncing the vault" means committing
and pushing the whole repo to its GitHub remote (the "option 1" backup model).

All commands run in REPO_ROOT with the terminal prompt disabled, so a missing
credential fails fast instead of hanging the API thread. Push credentials come from
the OS git credential manager — the user must have pushed once interactively (or
configured a credential helper) so they are cached.
"""
from __future__ import annotations

import datetime as dt
import os
import subprocess
import sys
import threading

import config

# Disable interactive auth prompts: a push without cached creds fails fast.
_GIT_ENV = {**os.environ, "GIT_TERMINAL_PROMPT": "0"}
# Serialise mutating syncs (manual "Sync now" vs. the debounced auto-sync).
_sync_lock = threading.Lock()
# Debounce timer for auto-sync-on-promote.
_timer: threading.Timer | None = None
_timer_lock = threading.Lock()


def _git(*args: str, timeout: int = 120) -> tuple[int, str, str]:
    """Run a git command in the repo root. Returns (returncode, stdout, stderr)."""
    try:
        p = subprocess.run(
            ["git", *args], cwd=config.REPO_ROOT, env=_GIT_ENV,
            capture_output=True, text=True, timeout=timeout,
        )
        return p.returncode, p.stdout.strip(), p.stderr.strip()
    except FileNotFoundError:
        return 127, "", "git is not installed / not on PATH"
    except subprocess.TimeoutExpired:
        return 124, "", f"git {args[0] if args else ''} timed out after {timeout}s"


def current_branch() -> str:
    code, out, _ = _git("rev-parse", "--abbrev-ref", "HEAD")
    return out if code == 0 and out else "main"


def remote_url() -> str:
    code, out, _ = _git("remote", "get-url", "origin")
    return out if code == 0 else ""


def status() -> dict:
    """Snapshot of the repo's sync state for the Vault & Sync panel."""
    remote = remote_url()
    branch = current_branch()

    code, out, _ = _git("status", "--porcelain")
    dirty = len([ln for ln in out.splitlines() if ln.strip()]) if code == 0 else 0

    last = None
    code, out, _ = _git("log", "-1", "--pretty=%h%x1f%s%x1f%cI%x1f%cr")
    if code == 0 and out:
        h, subj, iso, rel = (out.split("\x1f") + ["", "", "", ""])[:4]
        last = {"hash": h, "subject": subj, "iso": iso, "relative": rel}

    # ahead / behind vs. upstream — only meaningful once a tracking branch exists.
    ahead = behind = None
    code, out, _ = _git("rev-list", "--count", "--left-right", "@{upstream}...HEAD")
    if code == 0 and out:
        parts = out.replace("\t", " ").split()
        if len(parts) == 2:
            behind, ahead = int(parts[0]), int(parts[1])

    return {
        "vault_path": str(config.VAULT_ROOT),
        "repo_path": str(config.REPO_ROOT),
        "remote_url": remote,
        "has_remote": bool(remote),
        "branch": branch,
        "last_commit": last,
        "ahead": ahead,
        "behind": behind,
        "dirty": dirty,
    }


def sync(message: str | None = None) -> dict:
    """git add -A → commit (if changes) → push. Returns a UI-friendly result dict."""
    if not remote_url():
        return {"ok": False, "error": "No git remote configured. "
                "Add one with:  git remote add origin <url>"}

    branch = current_branch()
    result = {"ok": True, "committed": False, "pushed": False, "branch": branch,
              "commit": None, "files": 0, "error": ""}

    with _sync_lock:
        _git("add", "-A")
        code, staged, _ = _git("diff", "--cached", "--name-only")
        files = [ln for ln in staged.splitlines() if ln.strip()]
        result["files"] = len(files)

        if files:
            msg = message or f"Vault sync — {dt.datetime.now():%Y-%m-%d %H:%M}"
            code, out, err = _git("commit", "-m", msg)
            if code != 0:
                return {**result, "ok": False, "error": err or out or "commit failed"}
            result["committed"] = True
            _, result["commit"], _ = _git("rev-parse", "--short", "HEAD")

        # Push covers the new commit plus any earlier unpushed commits.
        code, out, err = _git("push", "origin", branch, timeout=180)
        if code != 0:
            return {**result, "ok": False, "error": err or out or "push failed"}
        result["pushed"] = True

    return result


def snapshot() -> dict:
    """Commit any pending changes, then create and push a timestamped restore tag."""
    if not remote_url():
        return {"ok": False, "error": "No git remote configured."}

    s = sync(message=f"Snapshot — {dt.datetime.now():%Y-%m-%d %H:%M}")
    if not s["ok"]:
        return s

    tag = "snapshot-" + dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    code, out, err = _git("tag", "-a", tag, "-m", f"Snapshot backup {tag}")
    if code != 0:
        return {"ok": False, "error": err or out or "tag failed"}
    code, out, err = _git("push", "origin", tag, timeout=120)
    if code != 0:
        return {"ok": False, "tag": tag, "error": err or out or "tag push failed"}
    return {"ok": True, "tag": tag}


def open_folder(path: str | None = None) -> dict:
    """Open the vault folder in the OS file manager (backend runs locally)."""
    target = str(path or config.VAULT_ROOT)
    try:
        if sys.platform.startswith("win"):
            os.startfile(target)  # type: ignore[attr-defined]  # noqa: S606
        elif sys.platform == "darwin":
            subprocess.Popen(["open", target])
        else:
            subprocess.Popen(["xdg-open", target])
        return {"ok": True, "path": target}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": str(e), "path": target}


def _run_autosync() -> None:
    try:
        sync(message=f"Auto-sync on promote — {dt.datetime.now():%Y-%m-%d %H:%M}")
    except Exception:  # noqa: BLE001
        pass


def debounced_sync(delay: float = 5.0) -> None:
    """Schedule a sync `delay` seconds out; repeated calls reset the timer so a
    burst of promotions collapses into a single commit + push."""
    global _timer
    with _timer_lock:
        if _timer is not None:
            _timer.cancel()
        _timer = threading.Timer(delay, _run_autosync)
        _timer.daemon = True
        _timer.start()


if __name__ == "__main__":
    import json
    print(json.dumps(status(), indent=2))

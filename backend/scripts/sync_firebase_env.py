#!/usr/bin/env python3
"""Write Firebase Admin env vars into a target .env from a service account JSON."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def upsert_env(env_path: Path, values: dict[str, str]) -> None:
    text = env_path.read_text(encoding="utf-8") if env_path.exists() else ""
    lines = text.splitlines()
    keys_seen = set()
    out: list[str] = []

    for line in lines:
        matched = False
        for key, value in values.items():
            if re.match(rf"^\s*{re.escape(key)}\s*=", line):
                out.append(f"{key}={value}")
                keys_seen.add(key)
                matched = True
                break
        if not matched:
            out.append(line)

    if keys_seen != set(values):
        if out and out[-1].strip():
            out.append("")
        for key, value in values.items():
            if key not in keys_seen:
                out.append(f"{key}={value}")

    env_path.write_text("\n".join(out) + "\n", encoding="utf-8")


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: sync_firebase_env.py <service-account.json> <backend.env>")
        return 1

    sa_path = Path(sys.argv[1])
    env_path = Path(sys.argv[2])
    data = json.loads(sa_path.read_text(encoding="utf-8"))

    values = {
        "FIREBASE_PROJECT_ID": data["project_id"],
        "FIREBASE_CLIENT_EMAIL": data["client_email"],
        "FIREBASE_PRIVATE_KEY": json.dumps(data["private_key"]),
    }
    upsert_env(env_path, values)
    print(f"Updated Firebase Admin env in {env_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Scan content/ and write manifest.json at repo root."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
SITE_JSON = ROOT / "site.json"
MANIFEST_JSON = ROOT / "manifest.json"


def humanize_id(doc_id: str) -> str:
    text = re.sub(r"^\d+[_-]*", "", doc_id)
    text = text.replace("_", " ").replace("-", " ")
    return text.strip().title() or doc_id


def load_meta(path: Path) -> dict:
    meta_path = path.with_name(f"{path.stem}.meta.json")
    if not meta_path.is_file():
        return {}
    return json.loads(meta_path.read_text(encoding="utf-8"))


def collect_documents() -> list[dict]:
    documents: list[dict] = []

    for folder, doc_type in (("pdf", "pdf"), ("md", "md")):
        base = CONTENT / folder
        if not base.is_dir():
            continue
        for path in sorted(base.iterdir()):
            if not path.is_file():
                continue
            if path.name.endswith(".meta.json"):
                continue
            if doc_type == "pdf" and path.suffix.lower() != ".pdf":
                continue
            if doc_type == "md" and path.suffix.lower() != ".md":
                continue

            doc_id = path.stem
            meta = load_meta(path)
            rel_path = path.relative_to(ROOT).as_posix()
            documents.append(
                {
                    "id": doc_id,
                    "title": meta.get("title") or humanize_id(doc_id),
                    "blurb": meta.get("blurb", ""),
                    "type": doc_type,
                    "path": rel_path,
                    "featured": bool(meta.get("featured", False)),
                    "tags": meta.get("tags", []),
                }
            )

    documents.sort(key=lambda item: item["id"])
    return documents


def main() -> None:
    site = {}
    if SITE_JSON.is_file():
        site = json.loads(SITE_JSON.read_text(encoding="utf-8"))

    manifest = {
        "site": site,
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "documents": collect_documents(),
    }
    MANIFEST_JSON.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"✓ wrote {MANIFEST_JSON} ({len(manifest['documents'])} documents)")


if __name__ == "__main__":
    main()

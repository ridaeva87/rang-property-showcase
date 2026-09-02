#!/usr/bin/env python3
"""Prepare confirmed RANG photos for S3. Dry-run is the default and writes nothing."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


def identities(path: Path) -> dict[tuple[str, str], str]:
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(
        r'identity\(\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"', re.S
    )
    return {(sheet, title): premise_id for sheet, title, premise_id in pattern.findall(text)}


def slug(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "photo"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--mapping", type=Path, required=True)
    parser.add_argument("--analysis", type=Path, required=True)
    parser.add_argument(
        "--identities",
        type=Path,
        default=Path("src/server/import/excel-premise-identities.ts"),
    )
    parser.add_argument("--output", type=Path)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()

    mapping = json.loads(args.mapping.read_text(encoding="utf-8"))
    analysis = json.loads(args.analysis.read_text(encoding="utf-8"))
    premise_ids = identities(args.identities)
    files = {item["path"]: item for item in analysis["files"]}
    by_folder: dict[str, list[dict]] = {}
    for item in analysis["files"]:
        by_folder.setdefault(item["folder"], []).append(item)

    duplicate_skips = {
        duplicate
        for group in analysis["exact_duplicate_groups"]
        for duplicate in group[1:]
    }
    unresolved_folders = {item["folder"] for item in mapping["unmatched_photo_folders"]}
    plan: list[dict] = []
    errors: list[str] = []

    for row in mapping["with_photos"]:
        premise_id = premise_ids.get((row["source_sheet"], row["original_name"]))
        if not premise_id:
            errors.append(f"missing premise identity: {row['source_sheet']} / {row['original_name']}")
            continue
        for order, item in enumerate(by_folder.get(row["photo_folder"], [])):
            if item["path"] in duplicate_skips:
                continue
            plan.append({"source": item["path"], "link": "premise", "targetId": premise_id, "sortOrder": order, "title": row["original_name"], "altText": f"{row['original_name']} — фото {order + 1}"})

    for row in mapping["object_photos"]:
        for order, item in enumerate(by_folder.get(row["folder"], [])):
            if item["path"] in duplicate_skips:
                continue
            plan.append({"source": item["path"], "link": "object", "targetId": row["object_id"], "sortOrder": order, "title": row["photo_type"], "altText": f"{row['photo_type']} — фото {order + 1}"})

    assigned = {item["source"] for item in plan}
    expected_skips = duplicate_skips | {
        item["path"] for folder in unresolved_folders for item in by_folder.get(folder, [])
    }
    unexpected = set(files) - assigned - expected_skips
    if unexpected:
        errors.append(f"unclassified source photos: {len(unexpected)}")

    for item in plan:
        source = args.source / item["source"]
        if not source.is_file():
            errors.append(f"missing source: {item['source']}")
            continue
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if digest != files[item["source"]]["sha256"]:
            errors.append(f"checksum mismatch: {item['source']}")
        item["checksumSha256"] = digest
        item["storageKey"] = f"{item['link']}s/{item['targetId']}/{digest[:20]}.webp"

    if args.execute:
        if not args.output:
            parser.error("--output is required with --execute")
        from PIL import Image, ImageOps

        for item in plan:
            source = args.source / item["source"]
            target = args.output / item["storageKey"]
            target.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(source) as image:
                image = ImageOps.exif_transpose(image).convert("RGB")
                image.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
                image.save(target, "WEBP", quality=86, method=6, exif=b"")
                item["width"], item["height"] = image.size
            item["byteSize"] = target.stat().st_size
            item["id"] = f"media-{item['checksumSha256'][:24]}"
            item["mimeType"] = "image/webp"
            item["publicUrl"] = f"https://s3.twcstorage.ru/rang-media/{item['storageKey']}"

        (args.output / "media-manifest.json").write_text(
            json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    result = {
        "photosReady": len(plan),
        "premiseLinks": sum(item["link"] == "premise" for item in plan),
        "objectLinks": sum(item["link"] == "object" for item in plan),
        "skippedDuplicates": len(duplicate_skips),
        "unresolved": sum(len(by_folder.get(folder, [])) for folder in unresolved_folders),
        "errors": errors,
        "premisesWithPhotos": len(mapping["with_photos"]),
        "premisesWithoutPhotos": len(mapping["without_photos"]),
    }
    print(json.dumps(result, ensure_ascii=False))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

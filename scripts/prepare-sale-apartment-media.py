#!/usr/bin/env python3
"""Prepare the confirmed Tolbuhina sale photos without changing source files."""

import argparse
import hashlib
import json
import re
from pathlib import Path

from PIL import Image, ImageOps


PREMISE_ID = "sale-apartment-tolbuhina-15-2"
PREFIX = f"sales/{PREMISE_ID}"
PUBLIC_BASE = "https://s3.twcstorage.ru/rang-media"


def natural_number(path: Path) -> int:
    match = re.search(r"(?:фото|фотот)\s+(\d+)", path.stem, re.IGNORECASE)
    return int(match.group(1)) if match else 10_000


def save_webp(image: Image.Image, path: Path, width: int | None = None) -> None:
    prepared = ImageOps.exif_transpose(image).convert("RGB")
    if width and prepared.width > width:
        height = round(prepared.height * width / prepared.width)
        prepared = prepared.resize((width, height), Image.Resampling.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    prepared.save(path, "WEBP", quality=86, method=6, exif=b"")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    files = sorted(args.source.glob("*.jpg"), key=natural_number)
    seen: set[str] = set()
    media: list[dict[str, object]] = []
    uploads: list[dict[str, str]] = []
    duplicates: list[str] = []

    for source in files:
        source_checksum = hashlib.sha256(source.read_bytes()).hexdigest()
        if source_checksum in seen:
            duplicates.append(source.name)
            continue
        seen.add(source_checksum)
        order = natural_number(source)
        role = "floor-plan" if order == 13 else "photo"
        stem = source_checksum[:20]
        key = f"{PREFIX}/{stem}.webp"
        target = args.output / key
        with Image.open(source) as image:
            save_webp(image, target)
            with Image.open(target) as prepared:
                width, height = prepared.size
            variants: list[dict[str, object]] = []
            for target_width in (640, 1280):
                if width <= target_width:
                    continue
                variant_key = f"{PREFIX}/{stem}-w{target_width}.webp"
                save_webp(image, args.output / variant_key, target_width)
                variants.append({"url": f"{PUBLIC_BASE}/{variant_key}", "width": target_width})
                uploads.append({"storageKey": variant_key})
        variants.append({"url": f"{PUBLIC_BASE}/{key}", "width": width})
        prepared_bytes = target.read_bytes()
        title = "Планировка квартиры" if role == "floor-plan" else f"Квартира на Толбухина — фото {order}"
        media.append(
            {
                "id": f"media-sale-t15-{stem}",
                "storageKey": key,
                "publicUrl": f"{PUBLIC_BASE}/{key}",
                "title": title,
                "altText": title,
                "mimeType": "image/webp",
                "byteSize": len(prepared_bytes),
                "width": width,
                "height": height,
                "checksumSha256": hashlib.sha256(prepared_bytes).hexdigest(),
                "metadata": {
                    "source": "rang-sale-tolbuhina-15-2",
                    "sourceFile": source.name,
                    "sourceChecksumSha256": source_checksum,
                    "exifRemoved": True,
                    "role": role,
                    "variants": variants,
                },
                "link": "premise",
                "targetId": PREMISE_ID,
                "sortOrder": len(media),
            }
        )
        uploads.append({"storageKey": key})

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "media-manifest.json").write_text(json.dumps(media, ensure_ascii=False, indent=2))
    (args.output / "upload-manifest.json").write_text(json.dumps(uploads, ensure_ascii=False, indent=2))
    print(json.dumps({"found": len(files), "prepared": len(media), "duplicates": duplicates, "uploads": len(uploads)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

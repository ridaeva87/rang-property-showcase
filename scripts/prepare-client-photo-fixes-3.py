#!/usr/bin/env python3
"""Prepare the 2026-09-11 customer media patch without changing source files."""

import argparse
import hashlib
import json
from pathlib import Path
from typing import Optional

from PIL import Image, ImageOps


PUBLIC_BASE = "https://s3.twcstorage.ru/rang-media"
PREFIX = "client-fixes/2026-09-11"
PREMISES = [f"premise-tol19-office-2-room-{number}" for number in range(1017, 1027)]


def save_webp(image: Image.Image, target: Path, role: str, width: Optional[int] = None) -> None:
    prepared = ImageOps.exif_transpose(image).convert("RGB")
    if role == "photo" and width and prepared.width > width:
        height = round(prepared.height * width / prepared.width)
        prepared = prepared.resize((width, height), Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True, exist_ok=True)
    if role == "floor-plan":
        prepared.save(target, "WEBP", lossless=True, method=6, exif=b"")
    else:
        prepared.save(target, "WEBP", quality=87, method=6, exif=b"")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    items = [(args.source / "Толбухина 19 офис 2 добавить схему.jpg", "floor-plan")]
    items.extend(
        (args.source / "Толбухина 19 офис 2" / f"добавить фото входной группы-фото{number}.jpg", "photo")
        for number in range(1, 5)
    )
    missing = [str(path) for path, _ in items if not path.is_file()]
    if missing:
        raise SystemExit(f"Missing required files: {missing}")

    media: list[dict[str, object]] = []
    uploads: list[dict[str, str]] = []
    for source, role in items:
        source_checksum = hashlib.sha256(source.read_bytes()).hexdigest()
        stem = source_checksum[:20]
        key = f"{PREFIX}/{stem}.webp"
        target = args.output / key
        with Image.open(source) as image:
            save_webp(image, target, role)
            with Image.open(target) as prepared:
                width, height = prepared.size
            variants: list[dict[str, object]] = []
            if role == "photo":
                for target_width in (640, 1280):
                    if width <= target_width:
                        continue
                    variant_key = f"{PREFIX}/{stem}-w{target_width}.webp"
                    save_webp(image, args.output / variant_key, role, target_width)
                    variants.append({"url": f"{PUBLIC_BASE}/{variant_key}", "width": target_width})
                    uploads.append({"storageKey": variant_key})
        variants.append({"url": f"{PUBLIC_BASE}/{key}", "width": width})
        body = target.read_bytes()
        title = source.stem
        media.append({
            "id": f"media-client-fix-3-{stem}",
            "storageKey": key,
            "publicUrl": f"{PUBLIC_BASE}/{key}",
            "title": title,
            "altText": title,
            "mimeType": "image/webp",
            "byteSize": len(body),
            "width": width,
            "height": height,
            "checksumSha256": hashlib.sha256(body).hexdigest(),
            "metadata": {
                "source": "client-fixes-2026-09-11",
                "sourceFile": source.name,
                "sourceChecksumSha256": source_checksum,
                "exifRemoved": True,
                "role": role,
                "variants": variants,
            },
            "links": [{"premiseId": premise_id} for premise_id in PREMISES],
        })
        uploads.append({"storageKey": key})

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "media-manifest.json").write_text(json.dumps(media, ensure_ascii=False, indent=2), encoding="utf-8")
    (args.output / "upload-manifest.json").write_text(json.dumps(uploads, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"assets": len(media), "links": len(media) * len(PREMISES), "uploads": len(uploads)}))


if __name__ == "__main__":
    main()

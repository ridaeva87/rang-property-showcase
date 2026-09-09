#!/usr/bin/env python3
"""Prepare the 2026-09-09 customer media patch without modifying source files."""

import argparse
import hashlib
import json
import unicodedata
from pathlib import Path
from typing import Optional

from PIL import Image, ImageOps


PUBLIC_BASE = "https://s3.twcstorage.ru/rang-media"
PREFIX = "client-fixes/2026-09-09"


def links(*premise_ids: str) -> list[dict[str, str]]:
    return [{"premiseId": premise_id} for premise_id in premise_ids]


OFFICE_3 = links(
    "premise-tol15k2-office-3-room-1008",
    "premise-tol15k2-office-3-room-1009",
    "premise-tol15k2-office-3-room-1010",
    "premise-tol15k2-office-3-room-1011",
)
OFFICE_5 = links(
    "premise-tol15k2-office-5-room-1019",
    "premise-tol15k2-office-5-room-1020",
    "premise-tol15k2-office-5-room-1021",
    "premise-tol15k2-office-5-room-1022",
    "premise-tol15k2-office-5-room-1023",
)
TOL19_OFFICE_1_2 = links(
    "premise-tol19-office-1-2-room-1000",
    "premise-tol19-office-1-2-room-1001",
    "premise-tol19-office-1-2-room-1002",
    "premise-tol19-office-1-2-room-1006",
    "premise-tol19-office-1-2-room-1013",
    "premise-tol19-office-1-2-room-1014",
)

ITEMS = [
    ("Добавить фото и схему Толбухина 15:2 офис 1-фото 1.jpg", "photo", links("premise-tol15k2-office-1")),
    ("Добавить фото и схему Толбухина 15:2 офис 1-фото 2.jpg", "photo", links("premise-tol15k2-office-1")),
    ("Добавить фото и схему Толбухина 15:2 офис 1-фото 3.jpg", "floor-plan", links("premise-tol15k2-office-1")),
    ("Добавить схему Толбухина 15:2 офис 2.jpg", "floor-plan", links("premise-tol15k2-office-2")),
    *[(f"Толбухина 15:2 офис 3 представлено четыре помещения-фото {number}.jpg", "floor-plan" if number == 5 else "photo", OFFICE_3) for number in range(1, 6)],
    ("Добавить схему Толбухина 15:2 офис 4.jpg", "floor-plan", links("premise-tol15k2-office-4")),
    *[(f"Толбухина 15:2 офис 5 представлено пять помещений-фото {number}.jpg", "floor-plan" if number == 5 else "photo", OFFICE_5) for number in range(1, 6)],
    ("Толбухина 15:2 офис 5-пом.1019.jpg", "photo", links("premise-tol15k2-office-5-room-1019")),
    ("Толбухина 15:2 офис 5-пом.1020.jpg", "photo", links("premise-tol15k2-office-5-room-1020")),
    ("Толбухина 15:2 офис 5-пом.1022.jpg", "photo", links("premise-tol15k2-office-5-room-1022")),
    ("Толбухина 15:2 офис 5-пом.1023.jpg", "photo", links("premise-tol15k2-office-5-room-1023")),
    ("Схема к этому помещению.jpg", "floor-plan", links("premise-tol19-office-1-1")),
    *[(f"Толбухина 19 офис 1:2 представлено шесть помещений-фото {number}.jpg", "floor-plan" if number == 4 else "photo", TOL19_OFFICE_1_2) for number in range(1, 5)],
]


def normalized(value: str) -> str:
    return unicodedata.normalize("NFC", value)


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
    available = {
        normalized(path.name): path
        for path in args.source.rglob("*.jpg")
        if "__MACOSX" not in path.parts and not path.name.startswith("._")
    }
    missing = [name for name, _, _ in ITEMS if normalized(name) not in available]
    if missing:
        raise SystemExit(f"Missing required source files: {missing}")

    media: list[dict[str, object]] = []
    uploads: list[dict[str, str]] = []
    seen_checksums: dict[str, str] = {}
    for source_name, role, target_links in ITEMS:
        source = available[normalized(source_name)]
        source_checksum = hashlib.sha256(source.read_bytes()).hexdigest()
        if source_checksum in seen_checksums:
            raise SystemExit(f"Unexpected duplicate: {source_name} == {seen_checksums[source_checksum]}")
        seen_checksums[source_checksum] = source_name
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
            "id": f"media-client-fix-2-{stem}",
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
                "source": "client-fixes-2026-09-09",
                "sourceFile": source.name,
                "sourceChecksumSha256": source_checksum,
                "exifRemoved": True,
                "role": role,
                "variants": variants,
            },
            "links": target_links,
        })
        uploads.append({"storageKey": key})

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "media-manifest.json").write_text(json.dumps(media, ensure_ascii=False, indent=2), encoding="utf-8")
    (args.output / "upload-manifest.json").write_text(json.dumps(uploads, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"assets": len(media), "links": sum(len(item[2]) for item in ITEMS), "uploads": len(uploads)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

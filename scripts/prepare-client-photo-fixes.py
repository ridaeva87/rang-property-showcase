#!/usr/bin/env python3
"""Prepare the 2026-09-08 customer media patch without modifying source files."""

import argparse
import hashlib
import json
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps


PUBLIC_BASE = "https://s3.twcstorage.ru/rang-media"
PREFIX = "client-fixes/2026-09-08"


def links(*premise_ids: str) -> list[dict[str, str]]:
    return [{"premiseId": premise_id} for premise_id in premise_ids]


ITEMS = [
    ("Схема помещения ЛИТЕР А Офис №1.jpg", "floor-plan", links("premise-ak153a-a-office-1")),
    ("Схема помещения ЛИТЕР А Офис №2:3.jpg", "floor-plan", links("premise-ak153a-a-office-2-3")),
    ("Схема помещения ЛИТЕР А Офис №5.jpg", "floor-plan", links("premise-ak153a-a-office-5")),
    ("Схема помещения ЛИТЕР А Офис №6.jpg", "floor-plan", links("premise-ak153a-a-office-6")),
    ("Схема помещения ЛИТЕР А1 Склад №1:2.jpg", "floor-plan", links("premise-ak153a-a1-warehouse-1-2")),
    ("Схема помещения ЛИТЕР А1 Склад №3.jpg", "floor-plan", links("premise-ak153a-a1-warehouse-3")),
    ("Добавить схему помещения ЛИТЕР А1 Склад №4.jpg", "floor-plan", links("premise-ak153a-a1-warehouse-4")),
    ("Добавить схему помещения ЛИТЕР А1 Склад №5:6.jpg", "floor-plan", links("premise-ak153a-a1-warehouse-5-6")),
    ("Добавить схему помещения ЛИТЕР А1 Склад №7.jpg", "floor-plan", links("premise-ak153a-a1-warehouse-7")),
    ("Изменить схему помещения ЛИТЕР А1 Склад №8.jpg", "floor-plan", links("property-001")),
    ("Изменить схему ЛИТЕР Г5 Склад №3.jpg", "floor-plan", links("premise-ak153a-g5-warehouse-3")),
    ("Добавить схему помещения ЛИТЕР Е офис 1.jpg", "floor-plan", links("premise-ak153a-e-office-1")),
    ("Добавить схему помещения ЛИТЕР Е офис 2.jpg", "floor-plan", links("premise-ak153a-e-office-2")),
    ("Добавить схему помещения ЛИТЕР Е офис 3.jpg", "floor-plan", links("premise-ak153a-e-office-3")),
    ("Добавить схему помещения ЛИТЕР Е офис 4.jpg", "floor-plan", links("premise-ak153a-e-office-4")),
    ("Добавить схему помещения ЛИТЕР Е офис 5.jpg", "floor-plan", links("premise-ak153a-e-office-5")),
    ("Добавить схему помещения ЛИТЕР Е офис 6.jpg", "floor-plan", links("premise-ak153a-e-office-6")),
    ("Фото для ЛИТЕР Авсп. Склад №4:5-фото 1.jpg", "photo", links("premise-ak153a-avsp-warehouse-4-5")),
    ("Фото для ЛИТЕР Авсп. Склад №4:5-фото 2.jpg", "photo", links("premise-ak153a-avsp-warehouse-4-5")),
    ("Фото для ЛИТЕР Авсп. Склад №4:5-фото 3.jpg", "photo", links("premise-ak153a-avsp-warehouse-4-5")),
    ("Фото для ЛИТЕР Г5 Склад №2-фото 1.jpg", "photo", links("premise-ak153a-g5-warehouse-2")),
    ("Фото для ЛИТЕР Г5 Склад №2-фото 2.jpg", "floor-plan", links("premise-ak153a-g5-warehouse-2")),
    ("Фото для ЛИТЕР Г5 Склад №2-фото 3.jpg", "photo", links("premise-ak153a-g5-warehouse-2")),
    ("Фото для ЛИТЕР Г5 Склад №2-фото 4.jpg", "photo", links("premise-ak153a-g5-warehouse-2")),
    ("Фото для ЛИТЕР Г5 Склад №2-фото 5.jpg", "photo", links("premise-ak153a-g5-warehouse-2")),
    (
        "Это фото к офис 1 и офис 6.jpg",
        "photo",
        links("premise-ak153a-e-office-1", "premise-ak153a-e-office-6"),
    ),
    (
        "Это фото к офис 2, офис 3, офис 4, офис 5.jpg",
        "photo",
        links(
            "premise-ak153a-e-office-2",
            "premise-ak153a-e-office-3",
            "premise-ak153a-e-office-4",
            "premise-ak153a-e-office-5",
        ),
    ),
]


def normalized(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def save_webp(image: Image.Image, target: Path, role: str, width: int | None = None) -> None:
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
        media.append(
            {
                "id": f"media-client-fix-{stem}",
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
                    "source": "client-fixes-2026-09-08",
                    "sourceFile": source.name,
                    "sourceChecksumSha256": source_checksum,
                    "exifRemoved": True,
                    "role": role,
                    "variants": variants,
                },
                "links": target_links,
            }
        )
        uploads.append({"storageKey": key})

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "media-manifest.json").write_text(
        json.dumps(media, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (args.output / "upload-manifest.json").write_text(
        json.dumps(uploads, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({"assets": len(media), "links": sum(len(item[2]) for item in ITEMS), "uploads": len(uploads)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

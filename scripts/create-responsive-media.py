#!/usr/bin/env python3
import argparse, json
from pathlib import Path
from PIL import Image

ap=argparse.ArgumentParser(); ap.add_argument('--source',type=Path,required=True); ap.add_argument('--output',type=Path,required=True); args=ap.parse_args()
items=json.loads((args.source/'media-manifest.json').read_text()); uploads=[]; metadata=[]
for item in items:
    source=args.source/item['storageKey']; variants=[]
    with Image.open(source) as image:
        width=image.width
        for target_width in (640,1280):
            if width <= target_width: continue
            target_key=item['storageKey'].removesuffix('.webp')+f'-w{target_width}.webp'; target=args.output/target_key; target.parent.mkdir(parents=True,exist_ok=True)
            resized=image.copy(); resized.thumbnail((target_width,10000),Image.Resampling.LANCZOS); resized.save(target,'WEBP',quality=84,method=6,exif=b'')
            variants.append({'url':f"https://s3.twcstorage.ru/rang-media/{target_key}",'width':resized.width}); uploads.append({'storageKey':target_key})
    variants.append({'url':item['publicUrl'],'width':width}); metadata.append({'id':item['id'],'variants':variants})
(args.output/'media-manifest.json').write_text(json.dumps(uploads,ensure_ascii=False,indent=2)); (args.output/'responsive-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)); print(json.dumps({'uploads':len(uploads),'assets':len(metadata)}))

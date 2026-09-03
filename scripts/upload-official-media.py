#!/usr/bin/env python3
"""Upload a prepared media manifest to the configured S3-compatible bucket."""
import argparse, datetime, hashlib, hmac, json, os, urllib.request
from pathlib import Path

def sign(key, message): return hmac.new(key, message.encode(), hashlib.sha256).digest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--directory", type=Path, required=True)
    args = ap.parse_args()
    manifest = json.loads((args.directory / "media-manifest.json").read_text())
    endpoint = os.environ["S3_ENDPOINT"].rstrip("/")
    bucket, access, secret = os.environ["S3_BUCKET"], os.environ["S3_ACCESS_KEY_ID"], os.environ["S3_SECRET_ACCESS_KEY"]
    host, region = endpoint.split("://", 1)[1], "ru-1"
    uploaded = 0
    for item in manifest:
        body = (args.directory / item["storageKey"]).read_bytes()
        now = datetime.datetime.now(datetime.timezone.utc)
        stamp, day = now.strftime("%Y%m%dT%H%M%SZ"), now.strftime("%Y%m%d")
        payload = hashlib.sha256(body).hexdigest()
        uri = f"/{bucket}/{item['storageKey']}"
        cache = "public, max-age=31536000, immutable"
        headers = f"cache-control:{cache}\ncontent-type:image/webp\nhost:{host}\nx-amz-content-sha256:{payload}\nx-amz-date:{stamp}\n"
        signed = "cache-control;content-type;host;x-amz-content-sha256;x-amz-date"
        canonical = "\n".join(["PUT", uri, "", headers, signed, payload])
        scope = f"{day}/{region}/s3/aws4_request"
        to_sign = "\n".join(["AWS4-HMAC-SHA256", stamp, scope, hashlib.sha256(canonical.encode()).hexdigest()])
        key = sign(sign(sign(sign(("AWS4" + secret).encode(), day), region), "s3"), "aws4_request")
        signature = hmac.new(key, to_sign.encode(), hashlib.sha256).hexdigest()
        auth = f"AWS4-HMAC-SHA256 Credential={access}/{scope}, SignedHeaders={signed}, Signature={signature}"
        req = urllib.request.Request(endpoint + uri, data=body, method="PUT", headers={"Cache-Control":cache, "Content-Type":"image/webp", "x-amz-content-sha256":payload, "x-amz-date":stamp, "Authorization":auth})
        with urllib.request.urlopen(req, timeout=60) as response:
            if response.status not in (200, 201): raise RuntimeError(f"upload failed: {item['storageKey']} HTTP {response.status}")
        uploaded += 1
    print(json.dumps({"uploaded": uploaded}))

if __name__ == "__main__": main()

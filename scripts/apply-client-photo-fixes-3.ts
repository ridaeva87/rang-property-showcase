import { readFile } from "node:fs/promises";
import { Client } from "pg";

type MediaItem = {
  id: string; storageKey: string; publicUrl: string; title: string; altText: string;
  mimeType: string; byteSize: number; width: number; height: number; checksumSha256: string;
  metadata: Record<string, unknown> & { sourceFile: string; role: "photo" | "floor-plan" };
  links: Array<{ premiseId: string }>;
};

const manifestPath = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!manifestPath || !process.env.DATABASE_URL) throw new Error("manifest and DATABASE_URL are required");

const tol19 = Array.from({ length: 10 }, (_, index) => `premise-tol19-office-2-room-${1017 + index}`);
const removals: Record<string, string[]> = {
  "premise-tol19-office-2-room-1021": ["media-61c3e626b6b1633d7cbd67c8", "media-6e548285fe21206e946e746d"],
  "premise-tol19-office-2-room-1024": ["media-9e754cf141f4c60a77831bca"],
  "premise-tol19-office-2-room-1025": ["media-cc6949da55cf64634400fb55"],
  "premise-tol15k2-office-5-room-1019": ["media-client-fix-2-14ba05691885bf52aa6c"],
  "premise-tol15k2-office-5-room-1020": ["media-client-fix-2-c2f7bcbe6c2ae5fa440f"],
  "premise-tol15k2-office-5-room-1022": ["media-client-fix-2-aec0503cef308d7c15b0"],
};
const mainMedia: Record<string, string> = {
  "premise-tol19-office-2-room-1019": "media-7bfa6333b1260bf84793fee6",
  "premise-tol19-office-2-room-1021": "media-662f2d306a6d090e7e6fdf82",
  "premise-tol19-office-2-room-1023": "media-cd9b82eebbfaaab550730477",
  "premise-tol19-office-2-room-1024": "media-87f4637c7f1da9f6d90111ab",
  "premise-tol19-office-2-room-1025": "media-480f1c7b455263eee91500af",
  "premise-tol15k2-office-5-room-1019": "media-9df8c259d819e17357dd2239",
  "premise-tol15k2-office-5-room-1020": "media-d7fa34d4a9237f0085b058b4",
  "premise-tol15k2-office-5-room-1022": "media-fee3a42c7c8d64e212715ca7",
  "premise-tol15k2-office-5-room-1023": "media-client-fix-2-ead15158a8c251407f31",
};
const affected = [...new Set([...tol19, ...Object.keys(removals), ...Object.keys(mainMedia)])];

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as MediaItem[];
if (manifest.length !== 5 || manifest.some((item) => item.links.length !== 10)) throw new Error("Unexpected manifest");
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("begin");
  const premises = await db.query("select id from premises where id=any($1::text[])", [affected]);
  if (premises.rowCount !== affected.length) throw new Error("Missing expected premises");
  const catalog = await db.query<{ total: string }>("select count(*)::text total from premises");
  if (catalog.rows[0]?.total !== "64") throw new Error("Unexpected catalog baseline");

  for (const [premiseId, mediaIds] of Object.entries(removals)) {
    const result = await db.query("delete from premise_media where premise_id=$1 and media_id=any($2::text[])", [premiseId, mediaIds]);
    if (result.rowCount !== mediaIds.length && result.rowCount !== 0) throw new Error(`Unexpected removal count for ${premiseId}`);
  }

  for (const item of manifest) {
    const duplicate = await db.query<{ id: string }>("select id from media_assets where checksum_sha256=$1 limit 1", [item.checksumSha256]);
    const mediaId = duplicate.rows[0]?.id ?? item.id;
    if (!duplicate.rowCount) {
      await db.query(
        `insert into media_assets
         (id,kind,storage_key,public_url,title,alt_text,mime_type,byte_size,width,height,checksum_sha256,metadata)
         values ($1,'image',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
         on conflict (storage_key) do update set public_url=excluded.public_url,title=excluded.title,
         alt_text=excluded.alt_text,mime_type=excluded.mime_type,byte_size=excluded.byte_size,
         width=excluded.width,height=excluded.height,checksum_sha256=excluded.checksum_sha256,
         metadata=excluded.metadata,updated_at=now()`,
        [mediaId,item.storageKey,item.publicUrl,item.title,item.altText,item.mimeType,item.byteSize,item.width,item.height,item.checksumSha256,JSON.stringify(item.metadata)],
      );
    }
    for (const link of item.links) {
      await db.query(`insert into premise_media(premise_id,media_id,sort_order) values($1,$2,10000)
        on conflict(premise_id,media_id) do nothing`, [link.premiseId, mediaId]);
    }
  }

  for (const premiseId of affected) {
    const rows = await db.query<{ media_id: string; role: string; source: string }>(
      `select pm.media_id,coalesce(m.metadata->>'role','photo') role,coalesce(m.metadata->>'source','') source
       from premise_media pm join media_assets m on m.id=pm.media_id
       where pm.premise_id=$1 order by pm.sort_order,pm.media_id`, [premiseId]);
    const selectedMain = mainMedia[premiseId];
    if (selectedMain && !rows.rows.some((row) => row.media_id === selectedMain)) throw new Error(`Main media missing for ${premiseId}`);
    const ordered = [...rows.rows].sort((a, b) => {
      if (a.media_id === selectedMain) return -1;
      if (b.media_id === selectedMain) return 1;
      const aNew = a.source === "client-fixes-2026-09-11";
      const bNew = b.source === "client-fixes-2026-09-11";
      if (aNew !== bNew) return aNew ? 1 : -1;
      if (a.role !== b.role) return a.role === "floor-plan" ? 1 : -1;
      return 0;
    });
    for (const [sortOrder, row] of ordered.entries()) {
      await db.query("update premise_media set sort_order=$3 where premise_id=$1 and media_id=$2", [premiseId, row.media_id, sortOrder]);
    }
  }
  await db.query(dryRun ? "rollback" : "commit");
  console.log(JSON.stringify({ assets: manifest.length, addedLinks: 50, removedLinks: 7, mainPhotosChanged: 5, dryRun }));
} catch (error) {
  await db.query("rollback");
  throw error;
} finally {
  await db.end();
}

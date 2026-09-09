import { readFile } from "node:fs/promises";
import { Client } from "pg";

type MediaItem = {
  id: string;
  storageKey: string;
  publicUrl: string;
  title: string;
  altText: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  checksumSha256: string;
  metadata: Record<string, unknown> & { sourceFile: string; role: "photo" | "floor-plan" };
  links: Array<{ premiseId: string }>;
};

const manifestPath = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!manifestPath || !process.env.DATABASE_URL) throw new Error("manifest and DATABASE_URL are required");

const expectedPremises = [
  "property-001",
  "premise-tol15k2-office-1",
  "premise-tol15k2-office-2",
  "premise-tol15k2-office-3-room-1008",
  "premise-tol15k2-office-3-room-1009",
  "premise-tol15k2-office-3-room-1010",
  "premise-tol15k2-office-3-room-1011",
  "premise-tol15k2-office-4",
  "premise-tol15k2-office-5-room-1019",
  "premise-tol15k2-office-5-room-1020",
  "premise-tol15k2-office-5-room-1021",
  "premise-tol15k2-office-5-room-1022",
  "premise-tol15k2-office-5-room-1023",
  "premise-tol19-office-1-1",
  "premise-tol19-office-1-2-room-1000",
  "premise-tol19-office-1-2-room-1001",
  "premise-tol19-office-1-2-room-1002",
  "premise-tol19-office-1-2-room-1006",
  "premise-tol19-office-1-2-room-1013",
  "premise-tol19-office-1-2-room-1014",
];

const removedLinks: Record<string, string[]> = {
  "premise-tol19-office-1-1": [
    "media-e095b99eb8e7735776f87d88",
    "media-b677e63071678f253be72677",
  ],
};
const existingMainMedia: Record<string, string> = {
  "property-001": "media-a4fdd0d4eccba9068ef97f24",
  "premise-tol15k2-office-2": "media-b7c9ba0e360c96315b2920ba",
  "premise-tol15k2-office-4": "media-7538097f733d7f068bc8de65",
};
const newMainSource: Record<string, string> = {
  "premise-tol15k2-office-1": "Добавить фото и схему Толбухина 15:2 офис 1-фото 2.jpg",
};

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as MediaItem[];
if (manifest.length !== 24) throw new Error(`Expected 24 media assets, got ${manifest.length}`);
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("begin");
  const premiseCheck = await db.query<{ id: string }>("select id from premises where id=any($1::text[])", [expectedPremises]);
  if (premiseCheck.rowCount !== expectedPremises.length) throw new Error("Missing expected premises");
  const catalog = await db.query<{ total: string; sale: string }>("select count(*)::text total,count(*) filter(where id='sale-apartment-tolbuhina-15-2')::text sale from premises");
  if (catalog.rows[0]?.total !== "64" || catalog.rows[0]?.sale !== "1") throw new Error("Unexpected catalog baseline");

  const objectUpdates: Array<[string, string, string[]]> = [
    ["adelya-kutuya-153a", "Аделя Кутуя 153А", ["АК 153А", "Аделя Кутуя 153А"]],
    ["tolbuhina-15-2", "Толбухина 15/2", ["Толбухина 15-2", "Толбухина 15/2"]],
  ];
  for (const [id, name, allowed] of objectUpdates) {
    const result = await db.query("update property_objects set name=$2,updated_at=now() where id=$1 and name=any($3::text[])", [id, name, allowed]);
    if (result.rowCount !== 1) throw new Error(`Unexpected object name for ${id}`);
  }
  for (const [premiseId, mediaIds] of Object.entries(removedLinks)) {
    await db.query("delete from premise_media where premise_id=$1 and media_id=any($2::text[])", [premiseId, mediaIds]);
  }

  const insertedBySource = new Map<string, string>();
  for (const item of manifest) {
    const inserted = await db.query<{ id: string }>(
      `insert into media_assets
       (id,kind,storage_key,public_url,title,alt_text,mime_type,byte_size,width,height,checksum_sha256,metadata)
       values ($1,'image',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       on conflict (storage_key) do update set public_url=excluded.public_url,title=excluded.title,
       alt_text=excluded.alt_text,mime_type=excluded.mime_type,byte_size=excluded.byte_size,
       width=excluded.width,height=excluded.height,checksum_sha256=excluded.checksum_sha256,
       metadata=excluded.metadata,updated_at=now() returning id`,
      [item.id,item.storageKey,item.publicUrl,item.title,item.altText,item.mimeType,item.byteSize,item.width,item.height,item.checksumSha256,JSON.stringify(item.metadata)],
    );
    const mediaId = inserted.rows[0]!.id;
    insertedBySource.set(item.metadata.sourceFile, mediaId);
    for (const link of item.links) {
      await db.query(`insert into premise_media(premise_id,media_id,sort_order) values($1,$2,10000)
        on conflict(premise_id,media_id) do nothing`, [link.premiseId, mediaId]);
    }
  }

  const affected = new Set([...expectedPremises]);
  for (const premiseId of affected) {
    const rows = await db.query<{ media_id: string; role: string }>(
      `select pm.media_id,coalesce(m.metadata->>'role','photo') role from premise_media pm
       join media_assets m on m.id=pm.media_id where pm.premise_id=$1 order by pm.sort_order,pm.media_id`, [premiseId]);
    const source = newMainSource[premiseId];
    const mainMedia = existingMainMedia[premiseId] ?? (source ? insertedBySource.get(source) : undefined);
    if (mainMedia && !rows.rows.some((row) => row.media_id === mainMedia)) throw new Error(`Main media missing for ${premiseId}`);
    const ordered = [...rows.rows].sort((a,b) => {
      if (a.media_id === mainMedia) return -1;
      if (b.media_id === mainMedia) return 1;
      if (a.role === b.role) return 0;
      return a.role === "floor-plan" ? 1 : -1;
    });
    for (const [sortOrder,row] of ordered.entries()) {
      await db.query("update premise_media set sort_order=$3 where premise_id=$1 and media_id=$2", [premiseId,row.media_id,sortOrder]);
    }
  }
  await db.query(dryRun ? "rollback" : "commit");
  console.log(JSON.stringify({mediaAssets:manifest.length,addedLinks:manifest.reduce((sum,item)=>sum+item.links.length,0),removedLinks:2,mainPhotosChanged:4,objectNamesChanged:2,dryRun}));
} catch (error) {
  await db.query("rollback");
  throw error;
} finally {
  await db.end();
}

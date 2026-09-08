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

const dryRun = process.argv.includes("--dry-run");
const manifestPath = process.argv.slice(2).find((argument) => argument !== "--dry-run");
if (!manifestPath || !process.env.DATABASE_URL) {
  throw new Error("media manifest path and DATABASE_URL are required");
}

const expectedPremises = [
  "premise-ak153a-a-office-1",
  "premise-ak153a-a-office-2-3",
  "premise-ak153a-a-office-5",
  "premise-ak153a-a-office-6",
  "premise-ak153a-a-office-7",
  "premise-ak153a-a1-warehouse-1-2",
  "premise-ak153a-a1-warehouse-3",
  "premise-ak153a-a1-warehouse-4",
  "premise-ak153a-a1-warehouse-5-6",
  "premise-ak153a-a1-warehouse-7",
  "property-001",
  "premise-ak153a-avsp-office-1",
  "premise-ak153a-avsp-warehouse-2-3-office-2",
  "premise-ak153a-avsp-warehouse-4-5",
  "premise-ak153a-g5-warehouse-1",
  "premise-ak153a-g5-warehouse-2",
  "premise-ak153a-g5-warehouse-3",
  "premise-ak153a-e-office-1",
  "premise-ak153a-e-office-2",
  "premise-ak153a-e-office-3",
  "premise-ak153a-e-office-4",
  "premise-ak153a-e-office-5",
  "premise-ak153a-e-office-6",
  "premise-ak153a-e-warehouse-1-2",
];

const removedLinks: Record<string, string[]> = {
  "premise-ak153a-a1-warehouse-1-2": [
    "media-739ef8b0b43d11e2bb4a1fe3",
    "media-cbbf051e3c8f542ed945ecbf",
  ],
  "premise-ak153a-a1-warehouse-3": ["media-f1e918752335607ee9286690"],
  "property-001": ["media-4950f0e156a08485208d6be9"],
  "premise-ak153a-avsp-office-1": [
    "media-00d186268d1d32e2eb9ea96e",
    "media-c29089ee73b3d12977901706",
  ],
  "premise-ak153a-g5-warehouse-1": [
    "media-3e33e3f32e62428085a973a9",
    "media-f92ea0acd02642b58fc91ce4",
    "media-2f3ef138c1d79dc01eeb5904",
    "media-18fe96807606561cae1a0d35",
    "media-a4c0cde5f7f44e6fba1b00b6",
  ],
  "premise-ak153a-g5-warehouse-3": [
    "media-5504dc65a2f9af2930c9d20b",
    "media-6331bf7be4b32652dcf19296",
  ],
  "premise-ak153a-e-warehouse-1-2": ["media-49e37b793aa3a5e2863dc0fd"],
};

const existingMainMedia: Record<string, string> = {
  "premise-ak153a-a-office-2-3": "media-3500a0f2b64420daba8844ee",
  "premise-ak153a-a1-warehouse-1-2": "media-60528ddd139f954137254a36",
  "premise-ak153a-avsp-office-1": "media-66763be06c0edb9b81d16c67",
  "premise-ak153a-e-warehouse-1-2": "media-2cc2c7d2081e418f65be229d",
};

const newMainSource: Record<string, string> = {
  "premise-ak153a-g5-warehouse-2": "Фото для ЛИТЕР Г5 Склад №2-фото 3.jpg",
};

const floorUpdates: Array<[string, string]> = [
  ["premise-ak153a-a-office-7", "2+3"],
  ["premise-ak153a-a1-warehouse-7", "1"],
  ["premise-ak153a-avsp-warehouse-4-5", "1"],
];

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as MediaItem[];
if (manifest.length !== 27) throw new Error(`Expected 27 media assets, got ${manifest.length}`);

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("begin");
  const premiseCheck = await db.query<{ id: string }>(
    "select id from premises where id = any($1::text[]) order by id",
    [expectedPremises],
  );
  if (premiseCheck.rowCount !== expectedPremises.length) {
    const found = new Set(premiseCheck.rows.map((row) => row.id));
    throw new Error(
      `Missing premises: ${expectedPremises.filter((id) => !found.has(id)).join(", ")}`,
    );
  }
  const catalogCheck = await db.query<{ total: string; sale: string }>(
    "select count(*)::text total, count(*) filter (where id='sale-apartment-tolbuhina-15-2')::text sale from premises",
  );
  if (catalogCheck.rows[0]?.total !== "64" || catalogCheck.rows[0]?.sale !== "1") {
    throw new Error(`Unexpected catalog baseline: ${JSON.stringify(catalogCheck.rows[0])}`);
  }

  const existingPatch = await db.query<{ count: string }>(
    "select count(*)::text count from media_assets where metadata->>'source'='client-fixes-2026-09-08'",
  );
  if (existingPatch.rows[0]?.count === "0") {
    for (const [premiseId, mediaIds] of Object.entries(removedLinks)) {
      const expected = await db.query<{ count: string }>(
        "select count(*)::text count from premise_media where premise_id=$1 and media_id=any($2::text[])",
        [premiseId, mediaIds],
      );
      if (expected.rows[0]?.count !== String(mediaIds.length)) {
        throw new Error(`Unexpected media baseline for ${premiseId}`);
      }
    }
  } else if (existingPatch.rows[0]?.count !== String(manifest.length)) {
    throw new Error(
      `Partial client media patch detected: ${existingPatch.rows[0]?.count}/${manifest.length}`,
    );
  }

  for (const [premiseId, value] of floorUpdates) {
    const result = await db.query(
      "update premise_characteristics set value_text=$2,value_number=null,updated_at=now() where premise_id=$1 and key='floor'",
      [premiseId, value],
    );
    if (result.rowCount !== 1) throw new Error(`Expected one floor row for ${premiseId}`);
  }

  for (const [premiseId, mediaIds] of Object.entries(removedLinks)) {
    await db.query("delete from premise_media where premise_id=$1 and media_id=any($2::text[])", [
      premiseId,
      mediaIds,
    ]);
  }

  const insertedBySource = new Map<string, string>();
  for (const item of manifest) {
    const inserted = await db.query<{ id: string }>(
      `insert into media_assets
        (id,kind,storage_key,public_url,title,alt_text,mime_type,byte_size,width,height,checksum_sha256,metadata)
       values ($1,'image',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       on conflict (storage_key) do update set
        public_url=excluded.public_url,title=excluded.title,alt_text=excluded.alt_text,
        mime_type=excluded.mime_type,byte_size=excluded.byte_size,width=excluded.width,
        height=excluded.height,checksum_sha256=excluded.checksum_sha256,
        metadata=excluded.metadata,updated_at=now()
       returning id`,
      [
        item.id,
        item.storageKey,
        item.publicUrl,
        item.title,
        item.altText,
        item.mimeType,
        item.byteSize,
        item.width,
        item.height,
        item.checksumSha256,
        JSON.stringify(item.metadata),
      ],
    );
    const mediaId = inserted.rows[0]!.id;
    insertedBySource.set(item.metadata.sourceFile, mediaId);
    for (const link of item.links) {
      await db.query(
        `insert into premise_media (premise_id,media_id,sort_order)
         values ($1,$2,10000)
         on conflict (premise_id,media_id) do update set sort_order=excluded.sort_order`,
        [link.premiseId, mediaId],
      );
    }
  }

  const affected = new Set<string>([
    ...manifest.flatMap((item) => item.links.map((link) => link.premiseId)),
    ...Object.keys(removedLinks),
    ...Object.keys(existingMainMedia),
  ]);
  for (const premiseId of affected) {
    const rows = await db.query<{ media_id: string; role: string }>(
      `select pm.media_id,coalesce(m.metadata->>'role','photo') role
       from premise_media pm join media_assets m on m.id=pm.media_id
       where pm.premise_id=$1
       order by pm.sort_order,pm.media_id`,
      [premiseId],
    );
    const requestedSource = newMainSource[premiseId];
    const mainMedia =
      existingMainMedia[premiseId] ??
      (requestedSource ? insertedBySource.get(requestedSource) : undefined);
    if (mainMedia && !rows.rows.some((row) => row.media_id === mainMedia)) {
      throw new Error(`Requested main media is not linked to ${premiseId}: ${mainMedia}`);
    }
    const ordered = [...rows.rows].sort((left, right) => {
      if (left.media_id === mainMedia) return -1;
      if (right.media_id === mainMedia) return 1;
      if (left.role === right.role) return 0;
      return left.role === "floor-plan" ? 1 : -1;
    });
    for (const [sortOrder, row] of ordered.entries()) {
      await db.query("update premise_media set sort_order=$3 where premise_id=$1 and media_id=$2", [
        premiseId,
        row.media_id,
        sortOrder,
      ]);
    }
  }

  await db.query(dryRun ? "rollback" : "commit");
  console.log(
    JSON.stringify({
      mediaAssets: manifest.length,
      mediaLinks: manifest.reduce((sum, item) => sum + item.links.length, 0),
      removedLinks: Object.values(removedLinks).flat().length,
      mainPhotosChanged: Object.keys(existingMainMedia).length + Object.keys(newMainSource).length,
      floorUpdates: floorUpdates.length,
      dryRun,
    }),
  );
} catch (error) {
  await db.query("rollback");
  throw error;
} finally {
  await db.end();
}

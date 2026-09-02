import { readFile } from "node:fs/promises";
import { Client } from "pg";

type Item = { id:string; storageKey:string; publicUrl:string; title:string; altText:string; mimeType:string; byteSize:number; width:number; height:number; checksumSha256:string; link:"premise"|"object"; targetId:string; sortOrder:number };
const path = process.argv[2];
if (!path || !process.env.DATABASE_URL) throw new Error("manifest path and DATABASE_URL are required");
const items = JSON.parse(await readFile(path, "utf8")) as Item[];
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("begin");
  for (const item of items) {
    await db.query(`insert into media_assets (id,kind,storage_key,public_url,title,alt_text,mime_type,byte_size,width,height,checksum_sha256,metadata) values ($1,'image',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb) on conflict (storage_key) do update set public_url=excluded.public_url,title=excluded.title,alt_text=excluded.alt_text,mime_type=excluded.mime_type,byte_size=excluded.byte_size,width=excluded.width,height=excluded.height,checksum_sha256=excluded.checksum_sha256,updated_at=now()`, [item.id,item.storageKey,item.publicUrl,item.title,item.altText,item.mimeType,item.byteSize,item.width,item.height,item.checksumSha256,JSON.stringify({source:"official-rang-photo-archive",exifRemoved:true})]);
    const table = item.link === "premise" ? "premise_media" : "object_media";
    const target = item.link === "premise" ? "premise_id" : "object_id";
    await db.query(`insert into ${table} (${target},media_id,sort_order) values ($1,$2,$3) on conflict (${target},media_id) do update set sort_order=excluded.sort_order`, [item.targetId,item.id,item.sortOrder]);
  }
  await db.query("commit");
  console.log(JSON.stringify({mediaAssets:items.length,premiseLinks:items.filter(x=>x.link==="premise").length,objectLinks:items.filter(x=>x.link==="object").length}));
} catch (error) { await db.query("rollback"); throw error; } finally { await db.end(); }

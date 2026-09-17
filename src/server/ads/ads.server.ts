import { createHash, createHmac, randomUUID } from "node:crypto";
import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { requirePermission } from "@/server/portal/portal.server";

const activeWindow = () => and(
  eq(s.adPlacements.publicationStatus, "published"),
  or(isNull(s.adPlacements.startsAt), lte(s.adPlacements.startsAt, new Date())),
  or(isNull(s.adPlacements.endsAt), gte(s.adPlacements.endsAt, new Date())),
);

async function hydrate(rows: any[]) {
  const db = getDatabase();
  const media = await db.select({ id: s.mediaAssets.id, url: s.mediaAssets.publicUrl, alt: s.mediaAssets.altText }).from(s.mediaAssets);
  const byId = new Map(media.map((m) => [m.id, m]));
  return rows.map((row) => ({
    ...row,
    logo: row.logoMediaId ? byId.get(row.logoMediaId) : null,
    banner: row.bannerMediaId ? byId.get(row.bannerMediaId) : null,
    gallery: (row.galleryMediaIds || []).map((id: string) => byId.get(id)).filter(Boolean),
  }));
}

const selection = {
  id: s.adPlacements.id, slug: s.adPlacements.slug, title: s.adPlacements.title,
  description: s.adPlacements.description, services: s.adPlacements.services,
  contacts: s.adPlacements.contacts, socialLinks: s.adPlacements.socialLinks,
  website: s.adPlacements.linkUrl, videoUrl: s.adPlacements.videoUrl,
  logoMediaId: s.adPlacements.logoMediaId, bannerMediaId: s.adPlacements.bannerMediaId,
  galleryMediaIds: s.adPlacements.galleryMediaIds, tenantUserId: s.adPlacements.tenantUserId,
  status: s.adPlacements.publicationStatus, startsAt: s.adPlacements.startsAt, endsAt: s.adPlacements.endsAt,
  specialOfferEnabled: s.adPlacements.specialOfferEnabled, specialOfferTitle: s.adPlacements.specialOfferTitle,
  specialOfferType: s.adPlacements.specialOfferType, specialOfferValue: s.adPlacements.specialOfferValue,
  specialOfferStartsAt: s.adPlacements.specialOfferStartsAt, specialOfferEndsAt: s.adPlacements.specialOfferEndsAt,
  partnerStatus: s.adPlacements.partnerStatus, placementTerms: s.adPlacements.placementTerms,
};

export async function listPublicBusinesses() {
  const rows = await getDatabase().select(selection).from(s.adPlacements).where(activeWindow()).orderBy(s.adPlacements.title);
  return hydrate(rows);
}

export async function getPublicBusiness(slug: string) {
  const rows = await getDatabase().select(selection).from(s.adPlacements).where(and(activeWindow(), eq(s.adPlacements.slug, slug))).limit(1);
  if (!rows[0]) return null;
  await getDatabase().insert(s.adEvents).values({ id: randomUUID(), placementId: rows[0].id, tenantUserId: rows[0].tenantUserId, eventType: "view", cta: "business_page" });
  return (await hydrate(rows))[0];
}

export async function trackAdEvent(input: { placementId: string; cta: string; targetUrl?: string|undefined }) {
  const placement = (await getDatabase().select({ id:s.adPlacements.id, tenantId:s.adPlacements.tenantUserId }).from(s.adPlacements).where(and(activeWindow(), eq(s.adPlacements.id,input.placementId))).limit(1))[0];
  if (!placement) throw new Error("Рекламная карточка недоступна");
  await getDatabase().insert(s.adEvents).values({ id:randomUUID(), placementId:placement.id, tenantUserId:placement.tenantId, eventType:"cta_click", cta:input.cta, targetUrl:input.targetUrl||null });
  return { ok:true };
}

export async function submitAdLead(input:{placementId:string;name:string;phone?:string|undefined;email?:string|undefined;message?:string|undefined}) {
  const placement=(await getDatabase().select({id:s.adPlacements.id,tenantId:s.adPlacements.tenantUserId,offer:s.adPlacements.specialOfferTitle}).from(s.adPlacements).where(and(activeWindow(),eq(s.adPlacements.id,input.placementId))).limit(1))[0];
  if(!placement)throw new Error("Рекламная карточка недоступна");
  await getDatabase().transaction(async(tx)=>{
    await tx.insert(s.adLeads).values({id:randomUUID(),placementId:placement.id,source:"rangpro.ru/businesses",contactName:input.name,contactPhone:input.phone||null,contactEmail:input.email||null,promoApplied:placement.offer||null});
    await tx.insert(s.adEvents).values({id:randomUUID(),placementId:placement.id,tenantUserId:placement.tenantId,eventType:"internal_lead",cta:"contact_form",isConfirmedConversion:true,metadata:{message:input.message||""}});
  });return{ok:true};
}

export async function adStatisticsAdmin() {
  await requirePermission("statistics.view");
  return getDatabase().select({id:s.adPlacements.id,title:s.adPlacements.title,tenant:s.users.displayName,offer:s.adPlacements.specialOfferTitle,views:sql<number>`count(*) filter(where ${s.adEvents.eventType}='view')::int`,clicks:sql<number>`count(*) filter(where ${s.adEvents.eventType}='cta_click')::int`,leads:sql<number>`count(*) filter(where ${s.adEvents.eventType}='internal_lead')::int`}).from(s.adPlacements).leftJoin(s.users,eq(s.adPlacements.tenantUserId,s.users.id)).leftJoin(s.adEvents,eq(s.adEvents.placementId,s.adPlacements.id)).groupBy(s.adPlacements.id,s.users.displayName).orderBy(desc(sql`count(${s.adEvents.id})`));
}

function hmac(key:Buffer|string,value:string){return createHmac("sha256",key).update(value).digest()}
export async function uploadAdMediaAdmin(input:{placementId:string;role:"logo"|"banner"|"gallery";file:File}){
  await requirePermission("ads.manage");if(input.file.size<1||input.file.size>20*1024*1024)throw new Error("Изображение должно быть до 20 МБ");if(!input.file.type.startsWith("image/"))throw new Error("Можно загрузить только изображение");
  const db=getDatabase(),placement=(await db.select({id:s.adPlacements.id,gallery:s.adPlacements.galleryMediaIds}).from(s.adPlacements).where(eq(s.adPlacements.id,input.placementId)).limit(1))[0];if(!placement)throw new Error("Карточка не найдена");
  const env={endpoint:process.env["S3_ENDPOINT"]!,bucket:process.env["S3_BUCKET"]!,access:process.env["S3_ACCESS_KEY_ID"]!,secret:process.env["S3_SECRET_ACCESS_KEY"]!};if(Object.values(env).some(x=>!x))throw new Error("S3 не настроен");const bytes=Buffer.from(await input.file.arrayBuffer()),checksum=createHash("sha256").update(bytes).digest("hex");let mediaId=(await db.select({id:s.mediaAssets.id}).from(s.mediaAssets).where(eq(s.mediaAssets.checksumSha256,checksum)).limit(1))[0]?.id;
  if(!mediaId){mediaId=randomUUID();const ext=(input.file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"").toLowerCase(),key=`ads/${input.placementId}/${checksum.slice(0,24)}.${ext}`,endpoint=new URL(env.endpoint),now=new Date(),stamp=now.toISOString().replace(/[:-]|\.\d{3}/g,"").slice(0,15)+"Z",day=stamp.slice(0,8),region="ru-1",payload=checksum,uri=`/${env.bucket}/${key}`,type=input.file.type,headers=`content-type:${type}\nhost:${endpoint.host}\nx-amz-content-sha256:${payload}\nx-amz-date:${stamp}\n`,signed="content-type;host;x-amz-content-sha256;x-amz-date",canonical=["PUT",uri,"",headers,signed,payload].join("\n"),scope=`${day}/${region}/s3/aws4_request`,toSign=["AWS4-HMAC-SHA256",stamp,scope,createHash("sha256").update(canonical).digest("hex")].join("\n"),signing=hmac(hmac(hmac(hmac(`AWS4${env.secret}`,day),region),"s3"),"aws4_request"),signature=createHmac("sha256",signing).update(toSign).digest("hex"),response=await fetch(`${env.endpoint.replace(/\/$/,"")}${uri}`,{method:"PUT",body:bytes,headers:{"content-type":type,"x-amz-content-sha256":payload,"x-amz-date":stamp,authorization:`AWS4-HMAC-SHA256 Credential=${env.access}/${scope}, SignedHeaders=${signed}, Signature=${signature}`}});if(!response.ok)throw new Error(`S3 HTTP ${response.status}`);await db.insert(s.mediaAssets).values({id:mediaId,kind:"image",storageKey:key,publicUrl:`${env.endpoint.replace(/\/$/,"")}/${env.bucket}/${key}`,title:input.file.name,mimeType:type,byteSize:bytes.length,checksumSha256:checksum,metadata:{role:input.role,source:"tenant-ad"}})}
  if(input.role==="logo")await db.update(s.adPlacements).set({logoMediaId:mediaId,updatedAt:new Date()}).where(eq(s.adPlacements.id,input.placementId));else if(input.role==="banner")await db.update(s.adPlacements).set({bannerMediaId:mediaId,updatedAt:new Date()}).where(eq(s.adPlacements.id,input.placementId));else await db.update(s.adPlacements).set({galleryMediaIds:Array.from(new Set([...(placement.gallery||[]),mediaId])),updatedAt:new Date()}).where(eq(s.adPlacements.id,input.placementId));return{mediaId};
}

import { createHash, createHmac, randomUUID } from "node:crypto";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { createOpaqueToken, hashToken } from "@/server/portal/security";
import { requirePermission } from "@/server/portal/portal.server";
import { adminOperationDeletePermission, adminOperationReadPermission, assertLegacyAdminOperationSection } from "@/lib/admin-operation-sections";
import { preferredCommunicationHref } from "@/lib/communication-navigation";

export const ADMIN_SECTIONS = [
  ["/admin/premises", "Помещения", "premises.manage"], ["/admin/tenants", "Арендаторы", "tenants.manage"],
  ["/admin/leads", "Потенциальные клиенты", "leads.manage"], ["/admin/requests", "Заявки", "requests.view"],
  ["/admin/documents", "Документы", "documents.manage"], ["/admin/services", "Дополнительные услуги", "services.manage"],
  ["/admin/faq", "FAQ", "services.manage"],
  ["/admin/seo", "SEO страниц", "services.manage"],
  ["/admin/ads", "Реклама арендаторов", "ads.manage"], ["/admin/support", "Поддержка", "support.manage"],
  ["/admin/employees", "Сотрудники", "employees.manage"], ["/admin/statistics", "Статистика", "statistics.view"],
  ["/admin/audit-log", "Журнал изменений", "statistics.view"],
  ["/admin/utilities", "Счётчики и расходы", "utilities.manage"],
  ["/admin/waitlist", "Лист ожидания", "waitlist.manage"],
  ["/admin/delivery-log", "Журнал отправок", "delivery_logs.view"],
] as const;

export async function adminNavigation() {
  const user = await requirePermission("admin.access");
  const sections = ADMIN_SECTIONS.filter(([, , permission]) => user.roles.includes("admin") || user.permissions.includes(permission));
  const communicationHref = preferredCommunicationHref(user);
  const requestIndex = sections.findIndex(([href]) => href === "/admin/requests");
  return { user, sections: communicationHref
    ? [...sections.slice(0, requestIndex + 1), [communicationHref, "Уведомления", "communications.manage"] as const, ...sections.slice(requestIndex + 1)]
    : sections };
}

export async function employeesAdmin() {
  await requirePermission("employees.manage");
  const db = getDatabase();
  const users = await db.select({ id:s.users.id,name:s.users.displayName,email:s.users.email,active:s.users.isActive,jobTitle:s.employees.jobTitle })
    .from(s.users).innerJoin(s.employees,eq(s.employees.userId,s.users.id)).orderBy(s.users.displayName);
  const links = await db.select({ userId:s.userRoles.userId,role:s.roles.code }).from(s.userRoles).innerJoin(s.roles,eq(s.userRoles.roleId,s.roles.id));
  const roles = await db.select({ id:s.roles.id,code:s.roles.code,name:s.roles.name }).from(s.roles).where(sql`${s.roles.code}<>'tenant'`).orderBy(s.roles.name);
  return { employees: users.map(u=>({...u,roles:links.filter(x=>x.userId===u.id).map(x=>x.role)})),roles };
}

export async function saveEmployeeAdmin(input:{id?:string|undefined;name:string;email:string;jobTitle?:string|undefined;active:boolean;roleCodes:string[]}) {
  const actor=await requirePermission("employees.manage"); const db=getDatabase(); const id=input.id||randomUUID(); const email=input.email.trim().toLowerCase();
  const allowed=await db.select({id:s.roles.id,code:s.roles.code}).from(s.roles).where(inArray(s.roles.code,input.roleCodes));
  if(!allowed.length||allowed.some(r=>r.code==="tenant")) throw new Error("Выберите роль сотрудника");
  const emailOwner=(await db.select({id:s.users.id}).from(s.users).where(eq(s.users.email,email)).limit(1))[0];
  if(emailOwner&&emailOwner.id!==id) throw new Error("Этот email уже используется другим аккаунтом");
  let token:string|undefined;
  await db.transaction(async tx=>{
    if(input.id) await tx.update(s.users).set({displayName:input.name,email,isActive:input.active,updatedAt:new Date()}).where(and(eq(s.users.id,id),eq(s.users.kind,"employee")));
    else { await tx.insert(s.users).values({id,kind:"employee",displayName:input.name,email,isActive:input.active}); token=createOpaqueToken(); await tx.insert(s.userAccessTokens).values({id:randomUUID(),userId:id,purpose:"activation",tokenHash:hashToken(token),expiresAt:new Date(Date.now()+72*3600000)}); }
    await tx.insert(s.employees).values({id:`employee-${id}`,userId:id,jobTitle:input.jobTitle||null}).onConflictDoUpdate({target:s.employees.userId,set:{jobTitle:input.jobTitle||null,updatedAt:new Date()}});
    await tx.delete(s.userRoles).where(eq(s.userRoles.userId,id)); await tx.insert(s.userRoles).values(allowed.map(r=>({userId:id,roleId:r.id})));
    if(!input.active) await tx.update(s.userSessions).set({revokedAt:new Date()}).where(and(eq(s.userSessions.userId,id),sql`${s.userSessions.revokedAt} is null`));
    await tx.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:input.id?"employee.updated":"employee.created",entityType:"user",entityId:id,after:{roles:input.roleCodes,active:input.active}});
  });
  let emailSent:boolean|undefined;
  if(token){const {sendAccessEmail}=await import("@/server/portal/email.server");try{emailSent=await sendAccessEmail({email,name:input.name,token,purpose:"activation"});}catch{emailSent=false;}}
  return {id,emailSent};
}

export async function premisesAdmin() {
  await requirePermission("premises.manage"); const db=getDatabase();
  const [premiseRows,offers,objects,buildings,characteristics,purposes,types,statuses]=await Promise.all([
    db.select({id:s.premises.id,title:s.premises.title,slug:s.premises.slug,description:s.premises.description,address:s.propertyObjects.address,objectId:s.premises.objectId,buildingId:s.premises.buildingId,typeId:s.premises.typeId,statusId:s.premises.statusId,area:s.premises.areaSqm,usableArea:s.premises.usableAreaSqm,release:s.premises.expectedReleaseOn,publication:s.premises.publicationStatus}).from(s.premises).innerJoin(s.propertyObjects,eq(s.premises.objectId,s.propertyObjects.id)).orderBy(s.premises.title),
    db.select({premiseId:s.propertyOffers.premiseId,type:s.propertyOffers.type,publication:s.propertyOffers.publicationStatus,rent:s.propertyOffers.rentPricePerSqm,sale:s.propertyOffers.salePrice}).from(s.propertyOffers),
    db.select({id:s.propertyObjects.id,slug:s.propertyObjects.slug,name:s.propertyObjects.name,address:s.propertyObjects.address,description:s.propertyObjects.description,parking:s.propertyObjects.parking,accessMode:s.propertyObjects.accessMode,territoryFeatures:s.propertyObjects.territoryFeatures,publication:s.propertyObjects.publicationStatus}).from(s.propertyObjects).orderBy(s.propertyObjects.name),
    db.select({id:s.propertyBuildings.id,objectId:s.propertyBuildings.objectId,name:s.propertyBuildings.name,code:s.propertyBuildings.code}).from(s.propertyBuildings).orderBy(s.propertyBuildings.name),
    db.select({premiseId:s.premiseCharacteristics.premiseId,key:s.premiseCharacteristics.key,label:s.premiseCharacteristics.label,valueText:s.premiseCharacteristics.valueText,valueNumber:s.premiseCharacteristics.valueNumber,unit:s.premiseCharacteristics.unit,groupName:s.premiseCharacteristics.groupName,sortOrder:s.premiseCharacteristics.sortOrder}).from(s.premiseCharacteristics).orderBy(s.premiseCharacteristics.sortOrder),
    db.select({premiseId:s.premisePurposes.premiseId,purpose:s.premisePurposes.purpose}).from(s.premisePurposes).orderBy(s.premisePurposes.purpose),
    db.select({id:s.premiseTypes.id,name:s.premiseTypes.name}).from(s.premiseTypes),
    db.select({id:s.premiseStatuses.id,name:s.premiseStatuses.name}).from(s.premiseStatuses),
  ]);
  const premises=premiseRows.map(premise=>{
    const premiseOffers=offers.filter(offer=>offer.premiseId===premise.id);
    const selected=premiseOffers.find(offer=>offer.publication===premise.publication)||premiseOffers.find(offer=>offer.publication==="published")||premiseOffers[0];
    return {...premise,offerType:selected?.type||"rent",price:selected?.type==="sale"?selected.sale:selected?.rent};
  });
  return {premises,objects,buildings,characteristics,purposes,types,statuses};
}

export function normalizePremisePurposes(values:string[]){return [...new Set(values.map(value=>value.trim()).filter(Boolean))];}
export function premiseOfferPublication(input:{selectedType:"rent"|"sale";publication:"draft"|"published"|"archived"}){return{selected:{type:input.selectedType,publication:input.publication},other:{type:input.selectedType==="rent"?"sale" as const:"rent" as const,publication:"archived" as const}};}

export async function savePropertyObjectAdmin(input:{id?:string|undefined;name:string;slug:string;address:string;description?:string|undefined;parking?:string|undefined;accessMode?:string|undefined;territoryFeatures:string[];publication:"draft"|"published"|"archived"}){
  const actor=await requirePermission("premises.manage");const db=getDatabase();const id=input.id||randomUUID();const values={name:input.name.trim(),slug:input.slug.trim(),address:input.address.trim(),description:input.description?.trim()||null,parking:input.parking?.trim()||null,accessMode:input.accessMode?.trim()||null,territoryFeatures:normalizePremisePurposes(input.territoryFeatures),publicationStatus:input.publication,updatedAt:new Date()};
  const before=input.id?(await db.select().from(s.propertyObjects).where(eq(s.propertyObjects.id,id)).limit(1))[0]:null;
  if(input.id){if(!before)throw new Error("Объект не найден");await db.update(s.propertyObjects).set(values).where(eq(s.propertyObjects.id,id));}
  else await db.insert(s.propertyObjects).values({id,...values,sourceSystem:"manual",externalId:`admin:${id}`});
  await db.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:input.id?"property_object.updated":"property_object.created",entityType:"property_object",entityId:id,before,after:input});
  return{id};
}

export async function savePremiseAdmin(input:{id?:string|undefined;title:string;slug:string;description?:string|undefined;objectId:string;buildingId?:string|undefined;typeId:string;statusId?:string|undefined;area?:string|undefined;usableArea?:string|undefined;release?:string|undefined;publication:"draft"|"published"|"archived";offerType:"rent"|"sale";price?:string|undefined;purposes:string[];characteristics:Array<{key:string;value:string}>}) {
  const actor=await requirePermission("premises.manage"); const db=getDatabase(); const id=input.id||randomUUID();
  const [object,type,status,building]=await Promise.all([
    db.select({id:s.propertyObjects.id}).from(s.propertyObjects).where(eq(s.propertyObjects.id,input.objectId)).limit(1),
    db.select({id:s.premiseTypes.id}).from(s.premiseTypes).where(eq(s.premiseTypes.id,input.typeId)).limit(1),
    input.statusId?db.select({id:s.premiseStatuses.id}).from(s.premiseStatuses).where(eq(s.premiseStatuses.id,input.statusId)).limit(1):Promise.resolve([]),
    input.buildingId?db.select({id:s.propertyBuildings.id,objectId:s.propertyBuildings.objectId}).from(s.propertyBuildings).where(eq(s.propertyBuildings.id,input.buildingId)).limit(1):Promise.resolve([]),
  ]);
  if(!object[0]||!type[0]||(input.statusId&&!status[0])||(input.buildingId&&(!building[0]||building[0].objectId!==input.objectId)))throw new Error("Некорректные данные объекта или помещения");
  const existingCharacteristics=input.id?await db.select({key:s.premiseCharacteristics.key,valueText:s.premiseCharacteristics.valueText,valueNumber:s.premiseCharacteristics.valueNumber}).from(s.premiseCharacteristics).where(eq(s.premiseCharacteristics.premiseId,id)):[];
  if(input.characteristics.some(item=>!existingCharacteristics.some(existing=>existing.key===item.key)))throw new Error("Характеристика помещения не найдена");
  const offerState=premiseOfferPublication({selectedType:input.offerType,publication:input.publication});
  await db.transaction(async tx=>{
    const before=input.id?(await tx.select().from(s.premises).where(eq(s.premises.id,id)).limit(1))[0]:null;
    if(input.id) await tx.update(s.premises).set({title:input.title,slug:input.slug,description:input.description?.trim()||null,objectId:input.objectId,buildingId:input.buildingId||null,typeId:input.typeId,statusId:input.statusId||null,areaSqm:input.area||null,usableAreaSqm:input.usableArea||null,expectedReleaseOn:input.release||null,publicationStatus:input.publication,updatedAt:new Date()}).where(eq(s.premises.id,id));
    else await tx.insert(s.premises).values({id,title:input.title,slug:input.slug,description:input.description?.trim()||null,objectId:input.objectId,buildingId:input.buildingId||null,typeId:input.typeId,statusId:input.statusId||null,areaSqm:input.area||null,usableAreaSqm:input.usableArea||null,expectedReleaseOn:input.release||null,publicationStatus:input.publication,sourceSystem:"manual",externalId:`admin:${id}`});
    await tx.update(s.propertyOffers).set({publicationStatus:offerState.other.publication,updatedAt:new Date()}).where(and(eq(s.propertyOffers.premiseId,id),ne(s.propertyOffers.type,input.offerType)));
    await tx.insert(s.propertyOffers).values({id:`offer-${id}-${input.offerType}`,premiseId:id,type:input.offerType,publicationStatus:input.publication,rentPricePerSqm:input.offerType==="rent"?(input.price||null):null,salePrice:input.offerType==="sale"?(input.price||null):null}).onConflictDoUpdate({target:[s.propertyOffers.premiseId,s.propertyOffers.type],set:{publicationStatus:input.publication,rentPricePerSqm:input.offerType==="rent"?(input.price||null):null,salePrice:input.offerType==="sale"?(input.price||null):null,updatedAt:new Date()}});
    await tx.delete(s.premisePurposes).where(eq(s.premisePurposes.premiseId,id));
    const purposes=normalizePremisePurposes(input.purposes);if(purposes.length)await tx.insert(s.premisePurposes).values(purposes.map(purpose=>({premiseId:id,purpose})));
    for(const characteristic of input.characteristics){const existing=existingCharacteristics.find(item=>item.key===characteristic.key)!;if(existing.valueNumber!==null&&existing.valueText===null){const value=characteristic.value.trim().replace(",",".");if(value&&!Number.isFinite(Number(value)))throw new Error(`Характеристика «${characteristic.key}» должна быть числом`);await tx.update(s.premiseCharacteristics).set({valueNumber:value||null,updatedAt:new Date()}).where(and(eq(s.premiseCharacteristics.premiseId,id),eq(s.premiseCharacteristics.key,characteristic.key)));}else await tx.update(s.premiseCharacteristics).set({valueText:characteristic.value.trim()||null,updatedAt:new Date()}).where(and(eq(s.premiseCharacteristics.premiseId,id),eq(s.premiseCharacteristics.key,characteristic.key)));}
    await tx.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:input.id?"premise.updated":"premise.created",entityType:"premise",entityId:id,before,after:input});
  }); return {id};
}

export async function premiseMediaAdmin(premiseId:string){await requirePermission("premises.manage");return getDatabase().select({id:s.mediaAssets.id,url:s.mediaAssets.publicUrl,title:s.mediaAssets.title,kind:s.mediaAssets.kind,order:s.premiseMedia.sortOrder}).from(s.premiseMedia).innerJoin(s.mediaAssets,eq(s.premiseMedia.mediaId,s.mediaAssets.id)).where(eq(s.premiseMedia.premiseId,premiseId)).orderBy(s.premiseMedia.sortOrder);}
export async function updatePremiseMediaAdmin(input:{premiseId:string;mediaId:string;action:"main"|"up"|"down"|"remove"}){const actor=await requirePermission("premises.manage");const db=getDatabase();const rows=await premiseMediaAdmin(input.premiseId);const index=rows.findIndex(x=>x.id===input.mediaId);if(index<0)throw new Error("Медиа не найдено");if(input.action==="remove")await db.delete(s.premiseMedia).where(and(eq(s.premiseMedia.premiseId,input.premiseId),eq(s.premiseMedia.mediaId,input.mediaId)));else{const target=input.action==="main"?0:input.action==="up"?Math.max(0,index-1):Math.min(rows.length-1,index+1);const reordered=[...rows];const [item]=reordered.splice(index,1);reordered.splice(target,0,item!);await db.transaction(async tx=>{for(const [order,row] of reordered.entries())await tx.update(s.premiseMedia).set({sortOrder:order}).where(and(eq(s.premiseMedia.premiseId,input.premiseId),eq(s.premiseMedia.mediaId,row.id)));});}await db.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:`premise_media.${input.action}`,entityType:"premise",entityId:input.premiseId,after:{mediaId:input.mediaId}});}

function hmac(key:Buffer|string,value:string){return createHmac("sha256",key).update(value).digest();}
export const PREMISE_MEDIA_MIME_TYPES={photo:new Set(["image/jpeg","image/png","image/webp","image/avif"]),video:new Set(["video/mp4","video/webm","video/quicktime"])} as const;
export function isPremiseMediaMimeAllowed(role:"photo"|"video",mimeType:string){return PREMISE_MEDIA_MIME_TYPES[role].has(mimeType as never);}
export function hasPremiseMediaSignature(role:"photo"|"video",bytes:Uint8Array){const ascii=Buffer.from(bytes.subarray(0,16)).toString("ascii");if(role==="video")return(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)||ascii.slice(4,8)==="ftyp";return(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)||(bytes[0]===0x89&&ascii.slice(1,4)==="PNG")||(ascii.slice(0,4)==="RIFF"&&ascii.slice(8,12)==="WEBP")||(ascii.slice(4,8)==="ftyp"&&["avif","avis"].includes(ascii.slice(8,12)));}
export async function uploadPremiseMediaAdmin(input:{premiseId:string;file:File;role:"photo"|"video"}){await requirePermission("premises.manage");if(input.file.size<1||input.file.size>100*1024*1024)throw new Error("Файл должен быть до 100 МБ");if(!isPremiseMediaMimeAllowed(input.role,input.file.type))throw new Error(input.role==="video"?"Допустимы видео MP4, WebM и MOV":"Допустимы изображения JPEG, PNG, WebP и AVIF");const premise=(await getDatabase().select({id:s.premises.id}).from(s.premises).where(eq(s.premises.id,input.premiseId)).limit(1))[0];if(!premise)throw new Error("Помещение не найдено");const env={endpoint:process.env["S3_ENDPOINT"]!,bucket:process.env["S3_BUCKET"]!,access:process.env["S3_ACCESS_KEY_ID"]!,secret:process.env["S3_SECRET_ACCESS_KEY"]!};if(Object.values(env).some(x=>!x))throw new Error("S3 не настроен");const bytes=Buffer.from(await input.file.arrayBuffer());if(!hasPremiseMediaSignature(input.role,bytes))throw new Error("Содержимое файла не соответствует выбранному типу");const checksum=createHash("sha256").update(bytes).digest("hex");const duplicate=(await getDatabase().select({id:s.mediaAssets.id,kind:s.mediaAssets.kind}).from(s.mediaAssets).where(eq(s.mediaAssets.checksumSha256,checksum)).limit(1))[0];const expectedKind=input.role==="video"?"video":"image";if(duplicate&&duplicate.kind!==expectedKind)throw new Error("Этот файл уже сохранён как другой тип медиа");let mediaId=duplicate?.id;if(!mediaId){mediaId=randomUUID();const ext=(input.file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"").toLowerCase();const key=`admin/${input.premiseId}/${checksum.slice(0,24)}.${ext}`;const endpoint=new URL(env.endpoint);const now=new Date(),stamp=now.toISOString().replace(/[:-]|\.\d{3}/g,"").slice(0,15)+"Z",day=stamp.slice(0,8),region="ru-1",payload=checksum,uri=`/${env.bucket}/${key}`,type=input.file.type,headers=`content-type:${type}\nhost:${endpoint.host}\nx-amz-content-sha256:${payload}\nx-amz-date:${stamp}\n`,signed="content-type;host;x-amz-content-sha256;x-amz-date",canonical=["PUT",uri,"",headers,signed,payload].join("\n"),scope=`${day}/${region}/s3/aws4_request`,toSign=["AWS4-HMAC-SHA256",stamp,scope,createHash("sha256").update(canonical).digest("hex")].join("\n"),signing=hmac(hmac(hmac(hmac(`AWS4${env.secret}`,day),region),"s3"),"aws4_request"),signature=createHmac("sha256",signing).update(toSign).digest("hex");const response=await fetch(`${env.endpoint.replace(/\/$/,"")}${uri}`,{method:"PUT",body:bytes,headers:{"content-type":type,"x-amz-content-sha256":payload,"x-amz-date":stamp,authorization:`AWS4-HMAC-SHA256 Credential=${env.access}/${scope}, SignedHeaders=${signed}, Signature=${signature}`}});if(!response.ok)throw new Error(`S3 HTTP ${response.status}`);await getDatabase().insert(s.mediaAssets).values({id:mediaId,kind:expectedKind,storageKey:key,publicUrl:`${env.endpoint.replace(/\/$/,"")}/${env.bucket}/${key}`,title:input.file.name,mimeType:type,byteSize:bytes.length,checksumSha256:checksum,metadata:{role:input.role,source:"admin"}});}const max=(await getDatabase().select({value:sql<number>`coalesce(max(${s.premiseMedia.sortOrder}),-1)`}).from(s.premiseMedia).where(eq(s.premiseMedia.premiseId,input.premiseId)))[0]?.value??-1;await getDatabase().insert(s.premiseMedia).values({premiseId:input.premiseId,mediaId,sortOrder:Number(max)+1}).onConflictDoNothing();return {mediaId};}

export async function adminOperations(section:string){
  const user=await requirePermission(adminOperationReadPermission(section)),db=getDatabase();
  const base={premises:await db.select({id:s.premises.id,name:s.premises.title,address:s.propertyObjects.address,objectId:s.propertyObjects.id}).from(s.premises).innerJoin(s.propertyObjects,eq(s.premises.objectId,s.propertyObjects.id)).orderBy(s.propertyObjects.address,s.premises.title),employees:await db.select({id:s.employees.id,name:s.users.displayName}).from(s.employees).innerJoin(s.users,eq(s.employees.userId,s.users.id)).where(eq(s.users.isActive,true)),tenants:await db.select({id:s.users.id,name:s.users.displayName,email:s.users.email}).from(s.users).where(and(eq(s.users.kind,"tenant"),eq(s.users.isActive,true))),groups:await db.select({id:s.tenantGroups.id,name:s.tenantGroups.name}).from(s.tenantGroups)};
  if(section==="leads"){
    const employee=(await db.select({id:s.employees.id}).from(s.employees).where(eq(s.employees.userId,user.id)).limit(1))[0];
    let items=await db.select({id:s.propertyInterests.id,title:s.propertyInterests.contactName,phone:s.propertyInterests.contactPhone,email:s.propertyInterests.contactEmail,source:s.propertyInterests.source,status:s.propertyInterests.status,premiseId:s.propertyInterests.premiseId,assigneeId:s.propertyInterests.assigneeEmployeeId,viewingAt:s.propertyInterests.viewingAt,detail:s.propertyInterests.note,createdAt:s.propertyInterests.createdAt,premise:s.premises.title,address:s.propertyObjects.address,assignee:s.users.displayName}).from(s.propertyInterests).leftJoin(s.premises,eq(s.propertyInterests.premiseId,s.premises.id)).leftJoin(s.propertyObjects,eq(s.premises.objectId,s.propertyObjects.id)).leftJoin(s.employees,eq(s.propertyInterests.assigneeEmployeeId,s.employees.id)).leftJoin(s.users,eq(s.employees.userId,s.users.id)).orderBy(sql`${s.propertyInterests.createdAt} desc`);
    if(user.roles.includes("rental_manager")&&!user.roles.includes("admin"))items=items.filter(x=>!x.assigneeId||x.assigneeId===employee?.id);
    let adItems=await db.select({id:s.adLeads.id,title:s.adLeads.contactName,phone:s.adLeads.contactPhone,email:s.adLeads.contactEmail,source:s.adLeads.source,status:s.adLeads.status,assigneeId:s.adLeads.assigneeEmployeeId,detail:s.adLeads.message,createdAt:s.adLeads.createdAt,assignee:s.users.displayName,business:s.adPlacements.title,tenantId:s.adPlacements.tenantUserId,cta:s.adLeads.cta,inquiryType:s.adLeads.inquiryType,offer:s.adLeads.promoApplied}).from(s.adLeads).innerJoin(s.adPlacements,eq(s.adLeads.placementId,s.adPlacements.id)).leftJoin(s.employees,eq(s.adLeads.assigneeEmployeeId,s.employees.id)).leftJoin(s.users,eq(s.employees.userId,s.users.id)).orderBy(sql`${s.adLeads.createdAt} desc`);
    if(user.roles.includes("rental_manager")&&!user.roles.includes("admin"))adItems=adItems.filter(x=>!x.assigneeId||x.assigneeId===employee?.id);
    const ids=[...items.map(x=>x.id),...adItems.map(x=>x.id)],history=ids.length?await db.select({entityId:s.auditLogs.entityId,action:s.auditLogs.action,createdAt:s.auditLogs.occurredAt,actor:s.users.displayName}).from(s.auditLogs).leftJoin(s.users,eq(s.auditLogs.actorUserId,s.users.id)).where(and(eq(s.auditLogs.entityType,"leads"),inArray(s.auditLogs.entityId,ids))).orderBy(sql`${s.auditLogs.occurredAt} desc`):[];
    const manual=items.map(x=>({...x,kind:"manual" as const,history:history.filter(h=>h.entityId===x.id)}));
    const advertising=adItems.map(x=>({...x,tenant:base.tenants.find(t=>t.id===x.tenantId)?.name||null,kind:"advertising" as const,premise:"Без помещения",premiseId:null,history:history.filter(h=>h.entityId===x.id)}));
    return {...base,items:[...manual,...advertising].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())};
  }
  if(section==="announcements"||section==="mailings")return {...base,items:await db.select({id:s.announcements.id,title:s.announcements.title,subject:s.announcements.subject,detail:s.announcements.body,status:s.announcements.status,groupId:s.announcements.audienceGroupId,publishedAt:s.announcements.publishedAt,sentAt:s.announcements.sentAt,createdAt:s.announcements.createdAt}).from(s.announcements).where(eq(s.announcements.kind,section==="mailings"?"mailing":"announcement")).orderBy(sql`${s.announcements.createdAt} desc`)};
  if(section==="services")return {...base,items:await db.select({id:s.additionalServices.id,title:s.additionalServices.title,detail:s.additionalServices.description,createdAt:s.additionalServices.createdAt}).from(s.additionalServices).orderBy(sql`${s.additionalServices.createdAt} desc`)};
  if(section==="ads")return {...base,items:await db.select({id:s.adPlacements.id,title:s.adPlacements.title,detail:s.adPlacements.description,tenantId:s.adPlacements.tenantUserId,link:s.adPlacements.linkUrl,slug:s.adPlacements.slug,services:s.adPlacements.services,contacts:s.adPlacements.contacts,socialLinks:s.adPlacements.socialLinks,videoUrl:s.adPlacements.videoUrl,startsAt:s.adPlacements.startsAt,endsAt:s.adPlacements.endsAt,status:s.adPlacements.publicationStatus,logoMediaId:s.adPlacements.logoMediaId,bannerMediaId:s.adPlacements.bannerMediaId,galleryMediaIds:s.adPlacements.galleryMediaIds,offerEnabled:s.adPlacements.specialOfferEnabled,offerTitle:s.adPlacements.specialOfferTitle,offerType:s.adPlacements.specialOfferType,offerValue:s.adPlacements.specialOfferValue,offerStart:s.adPlacements.specialOfferStartsAt,offerEnd:s.adPlacements.specialOfferEndsAt,partnerStatus:s.adPlacements.partnerStatus,placementTerms:s.adPlacements.placementTerms,createdAt:s.adPlacements.createdAt}).from(s.adPlacements).orderBy(sql`${s.adPlacements.createdAt} desc`)};
  if(section==="support")return {...base,items:(await (await import("@/server/portal/portal.server")).listRequestsAdmin()).requests.filter(x=>["technical","access","other"].includes(x.directionCode))};
  const counts=(await db.execute(sql`select count(*)::int premises,count(*) filter(where publication_status='published')::int published from premises`)).rows[0] as any;
  const requestCounts=(await db.execute(sql`select count(*)::int total,count(*) filter(where rs.code='accepted')::int accepted,count(*) filter(where rs.code='in_progress')::int progress,count(*) filter(where rs.code='completed')::int completed from requests r join request_statuses rs on rs.id=r.status_id`)).rows[0] as any;
  const tenants=(await db.execute(sql`select count(*)::int count from users where kind='tenant'`)).rows[0] as any,leads=(await db.execute(sql`select count(*)::int count from property_interests`)).rows[0] as any;
  const adStats=section==="statistics"?await (await import("@/server/ads/ads.server")).adStatisticsAdmin():[];
  return {...base,items:[],adStats,stats:{premises:Number(counts.premises),published:Number(counts.published),tenants:Number(tenants.count),leads:Number(leads.count),requests:Number(requestCounts.total),accepted:Number(requestCounts.accepted),progress:Number(requestCounts.progress),completed:Number(requestCounts.completed)}};
}

export async function createAdminOperation(input:{section:string;id?:string|undefined;title:string;detail:string;tenantId?:string|undefined;phone?:string|undefined;email?:string|undefined;source?:string|undefined;status?:string|undefined;premiseId?:string|undefined;assigneeId?:string|undefined;date?:string|undefined;subject?:string|undefined;groupId?:string|undefined;link?:string|undefined;endDate?:string|undefined;send?:boolean|undefined;slug?:string|undefined;services?:string|undefined;contacts?:string|undefined;socialLinks?:string|undefined;placementTerms?:string|undefined;contactPhone?:string|undefined;contactEmail?:string|undefined;contactAddress?:string|undefined;vkUrl?:string|undefined;telegramUrl?:string|undefined;otherSocialUrl?:string|undefined;videoUrl?:string|undefined;offerEnabled?:boolean|undefined;offerTitle?:string|undefined;offerType?:string|undefined;offerValue?:string|undefined;offerStart?:string|undefined;offerEnd?:string|undefined;partnerStatus?:string|undefined;placementTermsDescription?:string|undefined;freePeriodDays?:string|undefined}){
 assertLegacyAdminOperationSection(input.section);
 const permission:{[k:string]:string}={leads:"leads.manage",services:"services.manage",ads:"ads.manage"};const actor=await requirePermission(permission[input.section]||"admin.access"),db=getDatabase(),id=input.id||randomUUID(),editing=!!input.id;
 if(input.section==="leads"){
  const employee=(await db.select({id:s.employees.id}).from(s.employees).where(eq(s.employees.userId,actor.id)).limit(1))[0];if(actor.roles.includes("rental_manager")&&!actor.roles.includes("admin")&&input.assigneeId&&input.assigneeId!==employee?.id)throw new Error("Недостаточно прав");
  const adLead=editing?(await db.select({id:s.adLeads.id}).from(s.adLeads).where(eq(s.adLeads.id,id)).limit(1))[0]:undefined;
  if(adLead)await db.update(s.adLeads).set({contactName:input.title,contactPhone:input.phone||null,contactEmail:input.email||null,status:input.status||"new",assigneeEmployeeId:input.assigneeId||null,message:input.detail,updatedAt:new Date()}).where(eq(s.adLeads.id,id));
  else {const premiseId=input.premiseId;if(!premiseId)throw new Error("Выберите помещение");const values={contactName:input.title,contactPhone:input.phone||null,contactEmail:input.email||null,source:input.source||null,status:input.status||"new",premiseId,assigneeEmployeeId:input.assigneeId||null,viewingAt:input.date?new Date(input.date):null,note:input.detail,updatedAt:new Date()};if(editing)await db.update(s.propertyInterests).set(values).where(eq(s.propertyInterests.id,id));else await db.insert(s.propertyInterests).values({id,kind:"application",...values});}
 } else if(input.section==="services"){if(editing)await db.update(s.additionalServices).set({title:input.title,description:input.detail.trim()||null,updatedAt:new Date()}).where(eq(s.additionalServices.id,id));else await db.insert(s.additionalServices).values({id,title:input.title,description:input.detail.trim()||null});
 } else if(input.section==="ads"){
  if(!input.tenantId)throw new Error("Выберите арендатора");const tenant=(await db.select({id:s.users.id,name:s.users.displayName}).from(s.users).where(and(eq(s.users.id,input.tenantId),eq(s.users.kind,"tenant"),eq(s.users.isActive,true))).limit(1))[0];if(!tenant)throw new Error("Выбранный арендатор недоступен");let organizationId:string|undefined;await db.transaction(async tx=>{await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`tenant-ad-org:${tenant.id}`}))`);organizationId=(await tx.select({id:s.organizationUsers.organizationId}).from(s.organizationUsers).where(eq(s.organizationUsers.userId,tenant.id)).orderBy(sql`${s.organizationUsers.isPrimary} desc`).limit(1))[0]?.id;if(!organizationId){organizationId=randomUUID();await tx.insert(s.organizations).values({id:organizationId,name:tenant.name,sourceSystem:"manual",externalId:`tenant:${tenant.id}`});await tx.insert(s.organizationUsers).values({organizationId,userId:tenant.id,isPrimary:true})}});if(!organizationId)throw new Error("Не удалось определить организацию арендатора");
  const slug=(input.slug||input.title).trim().toLocaleLowerCase("ru-RU").replace(/[^a-zа-яё0-9]+/giu,"-").replace(/^-|-$/g,"");
  const socialLinks=[input.vkUrl&&{label:"VK",url:input.vkUrl},input.telegramUrl&&{label:"Telegram",url:input.telegramUrl},input.otherSocialUrl&&{label:"Социальная сеть",url:input.otherSocialUrl}].filter(Boolean) as Array<{label:string;url:string}>;const freeDays=input.freePeriodDays?Number(input.freePeriodDays):undefined;if(freeDays!==undefined&&(!Number.isInteger(freeDays)||freeDays<0))throw new Error("Бесплатный период должен быть целым числом дней");
  const contacts=Object.fromEntries(Object.entries({phone:input.contactPhone,email:input.contactEmail,address:input.contactAddress}).filter(([,value])=>value)) as {phone?:string;email?:string;address?:string};const placementTerms=Object.fromEntries(Object.entries({description:input.placementTermsDescription,freePeriodDays:freeDays}).filter(([,value])=>value!==undefined&&value!==""));
  const values={title:input.title,slug,description:input.detail,offerText:input.offerTitle||null,services:input.services||null,contacts,socialLinks,videoUrl:input.videoUrl||null,tenantUserId:input.tenantId,linkUrl:input.link||null,startsAt:input.date?new Date(input.date):null,endsAt:input.endDate?new Date(input.endDate):null,publicationStatus:(input.status as "draft"|"published"|"archived")||"draft",specialOfferEnabled:!!input.offerEnabled,specialOfferTitle:input.offerTitle||null,specialOfferType:input.offerType||null,specialOfferValue:input.offerValue||null,specialOfferStartsAt:input.offerStart?new Date(input.offerStart):null,specialOfferEndsAt:input.offerEnd?new Date(input.offerEnd):null,partnerStatus:input.partnerStatus||null,placementTerms,updatedAt:new Date()};if(editing)await db.update(s.adPlacements).set(values).where(eq(s.adPlacements.id,id));else await db.insert(s.adPlacements).values({id,organizationId,...values});
 }
 await db.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:`${input.section}.${editing?"updated":"created"}`,entityType:input.section,entityId:id,after:input});return{id};
}

export async function deleteAdminOperation(input:{section:string;id:string}){const actor=await requirePermission(adminOperationDeletePermission(input.section));const db=getDatabase();if(input.section==="leads"){const adLead=(await db.select({id:s.adLeads.id}).from(s.adLeads).where(eq(s.adLeads.id,input.id)).limit(1))[0];if(adLead)await db.delete(s.adLeads).where(eq(s.adLeads.id,input.id));else await db.delete(s.propertyInterests).where(eq(s.propertyInterests.id,input.id));}else if(input.section==="services")await db.delete(s.additionalServices).where(eq(s.additionalServices.id,input.id));else if(input.section==="ads")await db.delete(s.adPlacements).where(eq(s.adPlacements.id,input.id));else await db.delete(s.announcements).where(eq(s.announcements.id,input.id));await db.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:`${input.section}.deleted`,entityType:input.section,entityId:input.id});}

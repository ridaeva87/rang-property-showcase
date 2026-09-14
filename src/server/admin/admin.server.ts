import { createHash, createHmac, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { createOpaqueToken, hashToken } from "@/server/portal/security";
import { requirePermission } from "@/server/portal/portal.server";

export const ADMIN_SECTIONS = [
  ["/admin/premises", "Помещения", "premises.manage"], ["/admin/tenants", "Арендаторы", "tenants.manage"],
  ["/admin/leads", "Потенциальные клиенты", "leads.manage"], ["/admin/requests", "Заявки", "requests.view"],
  ["/admin/mailings", "Рассылки", "mailings.manage"], ["/admin/announcements", "Объявления", "announcements.manage"],
  ["/admin/documents", "Документы", "documents.manage"], ["/admin/services", "Дополнительные услуги", "services.manage"],
  ["/admin/ads", "Реклама арендаторов", "ads.manage"], ["/admin/support", "Поддержка", "support.manage"],
  ["/admin/employees", "Сотрудники", "employees.manage"], ["/admin/statistics", "Статистика", "statistics.view"],
  ["/admin/utilities", "Счётчики и расходы", "utilities.manage"],
] as const;

export async function adminNavigation() {
  const user = await requirePermission("admin.access");
  return { user, sections: ADMIN_SECTIONS.filter(([, , permission]) => user.roles.includes("admin") || user.permissions.includes(permission)) };
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

export async function saveEmployeeAdmin(input:{id?:string;name:string;email:string;jobTitle?:string;active:boolean;roleCodes:string[]}) {
  const actor=await requirePermission("employees.manage"); const db=getDatabase(); const id=input.id||randomUUID();
  const allowed=await db.select({id:s.roles.id,code:s.roles.code}).from(s.roles).where(inArray(s.roles.code,input.roleCodes));
  if(!allowed.length||allowed.some(r=>r.code==="tenant")) throw new Error("Выберите роль сотрудника");
  let token:string|undefined;
  await db.transaction(async tx=>{
    if(input.id) await tx.update(s.users).set({displayName:input.name,email:input.email.trim().toLowerCase(),isActive:input.active,updatedAt:new Date()}).where(and(eq(s.users.id,id),eq(s.users.kind,"employee")));
    else { await tx.insert(s.users).values({id,kind:"employee",displayName:input.name,email:input.email.trim().toLowerCase(),isActive:input.active}); token=createOpaqueToken(); await tx.insert(s.userAccessTokens).values({id:randomUUID(),userId:id,purpose:"activation",tokenHash:hashToken(token),expiresAt:new Date(Date.now()+72*3600000)}); }
    await tx.insert(s.employees).values({id:`employee-${id}`,userId:id,jobTitle:input.jobTitle||null}).onConflictDoUpdate({target:s.employees.userId,set:{jobTitle:input.jobTitle||null,updatedAt:new Date()}});
    await tx.delete(s.userRoles).where(eq(s.userRoles.userId,id)); await tx.insert(s.userRoles).values(allowed.map(r=>({userId:id,roleId:r.id})));
    if(!input.active) await tx.update(s.userSessions).set({revokedAt:new Date()}).where(and(eq(s.userSessions.userId,id),sql`${s.userSessions.revokedAt} is null`));
    await tx.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:input.id?"employee.updated":"employee.created",entityType:"user",entityId:id,after:{roles:input.roleCodes,active:input.active}});
  });
  if(token){const {sendAccessEmail}=await import("@/server/portal/email.server");await sendAccessEmail({email:input.email,name:input.name,token,purpose:"activation"});}
  return {id};
}

export async function premisesAdmin() {
  await requirePermission("premises.manage"); const db=getDatabase();
  const premises=await db.select({id:s.premises.id,title:s.premises.title,slug:s.premises.slug,address:s.propertyObjects.address,objectId:s.premises.objectId,typeId:s.premises.typeId,statusId:s.premises.statusId,area:s.premises.areaSqm,release:s.premises.expectedReleaseOn,publication:s.premises.publicationStatus,rent:s.propertyOffers.rentPricePerSqm,sale:s.propertyOffers.salePrice})
    .from(s.premises).innerJoin(s.propertyObjects,eq(s.premises.objectId,s.propertyObjects.id)).leftJoin(s.propertyOffers,eq(s.propertyOffers.premiseId,s.premises.id)).orderBy(s.premises.title);
  return {premises,objects:await db.select({id:s.propertyObjects.id,name:s.propertyObjects.name}).from(s.propertyObjects),types:await db.select({id:s.premiseTypes.id,name:s.premiseTypes.name}).from(s.premiseTypes),statuses:await db.select({id:s.premiseStatuses.id,name:s.premiseStatuses.name}).from(s.premiseStatuses)};
}

export async function savePremiseAdmin(input:{id?:string;title:string;slug:string;objectId:string;typeId:string;statusId?:string;area?:string;release?:string;publication:"draft"|"published"|"archived";offerType:"rent"|"sale";price?:string}) {
  const actor=await requirePermission("premises.manage"); const db=getDatabase(); const id=input.id||randomUUID();
  await db.transaction(async tx=>{
    const before=input.id?(await tx.select().from(s.premises).where(eq(s.premises.id,id)).limit(1))[0]:null;
    if(input.id) await tx.update(s.premises).set({title:input.title,slug:input.slug,objectId:input.objectId,typeId:input.typeId,statusId:input.statusId||null,areaSqm:input.area||null,expectedReleaseOn:input.release||null,publicationStatus:input.publication,updatedAt:new Date()}).where(eq(s.premises.id,id));
    else await tx.insert(s.premises).values({id,title:input.title,slug:input.slug,objectId:input.objectId,typeId:input.typeId,statusId:input.statusId||null,areaSqm:input.area||null,expectedReleaseOn:input.release||null,publicationStatus:input.publication,sourceSystem:"manual",externalId:`admin:${id}`});
    await tx.insert(s.propertyOffers).values({id:`offer-${id}-${input.offerType}`,premiseId:id,type:input.offerType,publicationStatus:input.publication,rentPricePerSqm:input.offerType==="rent"?(input.price||null):null,salePrice:input.offerType==="sale"?(input.price||null):null}).onConflictDoUpdate({target:[s.propertyOffers.premiseId,s.propertyOffers.type],set:{publicationStatus:input.publication,rentPricePerSqm:input.offerType==="rent"?(input.price||null):null,salePrice:input.offerType==="sale"?(input.price||null):null,updatedAt:new Date()}});
    await tx.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:input.id?"premise.updated":"premise.created",entityType:"premise",entityId:id,before,after:input});
  }); return {id};
}

export async function premiseMediaAdmin(premiseId:string){await requirePermission("premises.manage");return getDatabase().select({id:s.mediaAssets.id,url:s.mediaAssets.publicUrl,title:s.mediaAssets.title,kind:s.mediaAssets.kind,order:s.premiseMedia.sortOrder}).from(s.premiseMedia).innerJoin(s.mediaAssets,eq(s.premiseMedia.mediaId,s.mediaAssets.id)).where(eq(s.premiseMedia.premiseId,premiseId)).orderBy(s.premiseMedia.sortOrder);}
export async function updatePremiseMediaAdmin(input:{premiseId:string;mediaId:string;action:"main"|"up"|"down"|"remove"}){const actor=await requirePermission("premises.manage");const db=getDatabase();const rows=await premiseMediaAdmin(input.premiseId);const index=rows.findIndex(x=>x.id===input.mediaId);if(index<0)throw new Error("Медиа не найдено");if(input.action==="remove")await db.delete(s.premiseMedia).where(and(eq(s.premiseMedia.premiseId,input.premiseId),eq(s.premiseMedia.mediaId,input.mediaId)));else{const target=input.action==="main"?0:input.action==="up"?Math.max(0,index-1):Math.min(rows.length-1,index+1);const reordered=[...rows];const [item]=reordered.splice(index,1);reordered.splice(target,0,item!);await db.transaction(async tx=>{for(const [order,row] of reordered.entries())await tx.update(s.premiseMedia).set({sortOrder:order}).where(and(eq(s.premiseMedia.premiseId,input.premiseId),eq(s.premiseMedia.mediaId,row.id)));});}await db.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:`premise_media.${input.action}`,entityType:"premise",entityId:input.premiseId,after:{mediaId:input.mediaId}});}

function hmac(key:Buffer|string,value:string){return createHmac("sha256",key).update(value).digest();}
export async function uploadPremiseMediaAdmin(input:{premiseId:string;file:File;role:"photo"|"video"}){await requirePermission("premises.manage");if(input.file.size<1||input.file.size>100*1024*1024)throw new Error("Файл должен быть до 100 МБ");const env={endpoint:process.env.S3_ENDPOINT!,bucket:process.env.S3_BUCKET!,access:process.env.S3_ACCESS_KEY_ID!,secret:process.env.S3_SECRET_ACCESS_KEY!};if(Object.values(env).some(x=>!x))throw new Error("S3 не настроен");const bytes=Buffer.from(await input.file.arrayBuffer());const checksum=createHash("sha256").update(bytes).digest("hex");const duplicate=(await getDatabase().select({id:s.mediaAssets.id}).from(s.mediaAssets).where(eq(s.mediaAssets.checksumSha256,checksum)).limit(1))[0];let mediaId=duplicate?.id;if(!mediaId){mediaId=randomUUID();const ext=(input.file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"").toLowerCase();const key=`admin/${input.premiseId}/${checksum.slice(0,24)}.${ext}`;const endpoint=new URL(env.endpoint);const now=new Date(),stamp=now.toISOString().replace(/[:-]|\.\d{3}/g,"").slice(0,15)+"Z",day=stamp.slice(0,8),region="ru-1",payload=checksum,uri=`/${env.bucket}/${key}`,type=input.file.type||"application/octet-stream",headers=`content-type:${type}\nhost:${endpoint.host}\nx-amz-content-sha256:${payload}\nx-amz-date:${stamp}\n`,signed="content-type;host;x-amz-content-sha256;x-amz-date",canonical=["PUT",uri,"",headers,signed,payload].join("\n"),scope=`${day}/${region}/s3/aws4_request`,toSign=["AWS4-HMAC-SHA256",stamp,scope,createHash("sha256").update(canonical).digest("hex")].join("\n"),signing=hmac(hmac(hmac(hmac(`AWS4${env.secret}`,day),region),"s3"),"aws4_request"),signature=createHmac("sha256",signing).update(toSign).digest("hex");const response=await fetch(`${env.endpoint.replace(/\/$/,"")}${uri}`,{method:"PUT",body:bytes,headers:{"content-type":type,"x-amz-content-sha256":payload,"x-amz-date":stamp,authorization:`AWS4-HMAC-SHA256 Credential=${env.access}/${scope}, SignedHeaders=${signed}, Signature=${signature}`}});if(!response.ok)throw new Error(`S3 HTTP ${response.status}`);await getDatabase().insert(s.mediaAssets).values({id:mediaId,kind:input.role==="video"?"video":"image",storageKey:key,publicUrl:`${env.endpoint.replace(/\/$/,"")}/${env.bucket}/${key}`,title:input.file.name,mimeType:type,byteSize:bytes.length,checksumSha256:checksum,metadata:{role:input.role,source:"admin"}});}const max=(await getDatabase().select({value:sql<number>`coalesce(max(${s.premiseMedia.sortOrder}),-1)`}).from(s.premiseMedia).where(eq(s.premiseMedia.premiseId,input.premiseId)))[0]?.value??-1;await getDatabase().insert(s.premiseMedia).values({premiseId:input.premiseId,mediaId,sortOrder:Number(max)+1}).onConflictDoNothing();return {mediaId};}

export async function adminOperations(section:string){
  const permission:{[k:string]:string}={leads:"leads.manage",mailings:"mailings.manage",announcements:"announcements.manage",services:"services.manage",ads:"ads.manage",support:"support.manage",statistics:"statistics.view"};
  const user=await requirePermission(permission[section]||"admin.access"),db=getDatabase();
  const base={premises:await db.select({id:s.premises.id,name:s.premises.title}).from(s.premises).orderBy(s.premises.title),employees:await db.select({id:s.employees.id,name:s.users.displayName}).from(s.employees).innerJoin(s.users,eq(s.employees.userId,s.users.id)).where(eq(s.users.isActive,true)),tenants:await db.select({id:s.users.id,name:s.users.displayName,email:s.users.email}).from(s.users).where(and(eq(s.users.kind,"tenant"),eq(s.users.isActive,true))),groups:await db.select({id:s.tenantGroups.id,name:s.tenantGroups.name}).from(s.tenantGroups)};
  if(section==="leads"){
    const employee=(await db.select({id:s.employees.id}).from(s.employees).where(eq(s.employees.userId,user.id)).limit(1))[0];
    let items=await db.select({id:s.propertyInterests.id,title:s.propertyInterests.contactName,phone:s.propertyInterests.contactPhone,email:s.propertyInterests.contactEmail,source:s.propertyInterests.source,status:s.propertyInterests.status,premiseId:s.propertyInterests.premiseId,assigneeId:s.propertyInterests.assigneeEmployeeId,viewingAt:s.propertyInterests.viewingAt,detail:s.propertyInterests.note,createdAt:s.propertyInterests.createdAt,premise:s.premises.title,assignee:s.users.displayName}).from(s.propertyInterests).innerJoin(s.premises,eq(s.propertyInterests.premiseId,s.premises.id)).leftJoin(s.employees,eq(s.propertyInterests.assigneeEmployeeId,s.employees.id)).leftJoin(s.users,eq(s.employees.userId,s.users.id)).orderBy(sql`${s.propertyInterests.createdAt} desc`);
    if(user.roles.includes("rental_manager")&&!user.roles.includes("admin"))items=items.filter(x=>!x.assigneeId||x.assigneeId===employee?.id);
    const ids=items.map(x=>x.id),history=ids.length?await db.select({entityId:s.auditLogs.entityId,action:s.auditLogs.action,createdAt:s.auditLogs.occurredAt,actor:s.users.displayName}).from(s.auditLogs).leftJoin(s.users,eq(s.auditLogs.actorUserId,s.users.id)).where(and(eq(s.auditLogs.entityType,"leads"),inArray(s.auditLogs.entityId,ids))).orderBy(sql`${s.auditLogs.occurredAt} desc`):[];
    return {...base,items:items.map(x=>({...x,history:history.filter(h=>h.entityId===x.id)}))};
  }
  if(section==="announcements"||section==="mailings")return {...base,items:await db.select({id:s.announcements.id,title:s.announcements.title,subject:s.announcements.subject,detail:s.announcements.body,status:s.announcements.status,groupId:s.announcements.audienceGroupId,publishedAt:s.announcements.publishedAt,sentAt:s.announcements.sentAt,createdAt:s.announcements.createdAt}).from(s.announcements).where(eq(s.announcements.kind,section==="mailings"?"mailing":"announcement")).orderBy(sql`${s.announcements.createdAt} desc`)};
  if(section==="services")return {...base,items:await db.select({id:s.additionalServices.id,title:s.additionalServices.title,detail:s.additionalServices.description,createdAt:s.additionalServices.createdAt}).from(s.additionalServices).orderBy(sql`${s.additionalServices.createdAt} desc`)};
  if(section==="ads")return {...base,items:await db.select({id:s.adPlacements.id,title:s.adPlacements.title,detail:s.adPlacements.offerText,tenantId:s.adPlacements.tenantUserId,link:s.adPlacements.linkUrl,startsAt:s.adPlacements.startsAt,endsAt:s.adPlacements.endsAt,status:s.adPlacements.publicationStatus,mediaUrl:s.mediaAssets.publicUrl,createdAt:s.adPlacements.createdAt}).from(s.adPlacements).leftJoin(s.mediaAssets,eq(s.adPlacements.mediaId,s.mediaAssets.id)).orderBy(sql`${s.adPlacements.createdAt} desc`)};
  if(section==="support")return {...base,items:(await (await import("@/server/portal/portal.server")).listRequestsAdmin()).requests.filter(x=>["technical","access","other"].includes(x.directionCode))};
  const counts=(await db.execute(sql`select count(*)::int premises,count(*) filter(where publication_status='published')::int published from premises`)).rows[0] as any;
  const requestCounts=(await db.execute(sql`select count(*)::int total,count(*) filter(where rs.code='accepted')::int accepted,count(*) filter(where rs.code='in_progress')::int progress,count(*) filter(where rs.code='completed')::int completed from requests r join request_statuses rs on rs.id=r.status_id`)).rows[0] as any;
  const tenants=(await db.execute(sql`select count(*)::int count from users where kind='tenant'`)).rows[0] as any,leads=(await db.execute(sql`select count(*)::int count from property_interests`)).rows[0] as any;
  return {...base,items:[],stats:{premises:Number(counts.premises),published:Number(counts.published),tenants:Number(tenants.count),leads:Number(leads.count),requests:Number(requestCounts.total),accepted:Number(requestCounts.accepted),progress:Number(requestCounts.progress),completed:Number(requestCounts.completed)}};
}

export async function createAdminOperation(input:{section:string;id?:string;title:string;detail:string;tenantId?:string;phone?:string;email?:string;source?:string;status?:string;premiseId?:string;assigneeId?:string;date?:string;subject?:string;groupId?:string;link?:string;endDate?:string;send?:boolean}){
 const permission:{[k:string]:string}={leads:"leads.manage",mailings:"mailings.manage",announcements:"announcements.manage",services:"services.manage",ads:"ads.manage"};const actor=await requirePermission(permission[input.section]||"admin.access"),db=getDatabase(),id=input.id||randomUUID(),editing=!!input.id;
 if(input.section==="leads"){
  const premiseId=input.premiseId||(await db.select({id:s.premises.id}).from(s.premises).limit(1))[0]?.id;if(!premiseId)throw new Error("Выберите помещение");
  const employee=(await db.select({id:s.employees.id}).from(s.employees).where(eq(s.employees.userId,actor.id)).limit(1))[0];if(actor.roles.includes("rental_manager")&&!actor.roles.includes("admin")&&input.assigneeId&&input.assigneeId!==employee?.id)throw new Error("Недостаточно прав");
  const values={contactName:input.title,contactPhone:input.phone||null,contactEmail:input.email||null,source:input.source||null,status:input.status||"new",premiseId,assigneeEmployeeId:input.assigneeId||null,viewingAt:input.date?new Date(input.date):null,note:input.detail,updatedAt:new Date()};if(editing)await db.update(s.propertyInterests).set(values).where(eq(s.propertyInterests.id,id));else await db.insert(s.propertyInterests).values({id,kind:"application",...values});
 } else if(input.section==="services"){if(editing)await db.update(s.additionalServices).set({title:input.title,description:input.detail,updatedAt:new Date()}).where(eq(s.additionalServices.id,id));else await db.insert(s.additionalServices).values({id,title:input.title,description:input.detail});
 } else if(input.section==="ads"){
  const org=(await db.select({id:s.organizations.id}).from(s.organizations).limit(1))[0];if(!org)throw new Error("Нет организации");const values={title:input.title,offerText:input.detail,tenantUserId:input.tenantId||null,linkUrl:input.link||null,startsAt:input.date?new Date(input.date):null,endsAt:input.endDate?new Date(input.endDate):null,publicationStatus:(input.status as "draft"|"published"|"archived")||"draft",updatedAt:new Date()};if(editing)await db.update(s.adPlacements).set(values).where(eq(s.adPlacements.id,id));else await db.insert(s.adPlacements).values({id,organizationId:org.id,...values});
 } else {
  const kind=input.section==="mailings"?"mailing":"announcement",status=input.send||input.status==="published"?"sent":input.status||"draft",values={title:input.title,subject:input.subject||input.title,body:input.detail,kind,status,audienceGroupId:input.groupId||null,publishedAt:input.section==="announcements"&&status==="sent"?new Date():null,sentAt:input.section==="mailings"&&status==="sent"?new Date():null,updatedAt:new Date()};if(editing)await db.update(s.announcements).set(values).where(and(eq(s.announcements.id,id),eq(s.announcements.kind,kind)));else await db.insert(s.announcements).values({id,...values});
  if(status==="sent") {const recipients=input.groupId?await db.select({id:s.users.id,email:s.users.email,name:s.users.displayName}).from(s.tenantGroupMembers).innerJoin(s.users,eq(s.tenantGroupMembers.userId,s.users.id)).where(and(eq(s.tenantGroupMembers.groupId,input.groupId),eq(s.users.isActive,true))):await db.select({id:s.users.id,email:s.users.email,name:s.users.displayName}).from(s.users).where(and(eq(s.users.kind,"tenant"),eq(s.users.isActive,true)));if(recipients.length)await db.insert(s.notifications).values(recipients.map(u=>({id:randomUUID(),userId:u.id,announcementId:id,title:input.subject||input.title,body:input.detail,channel:"in_app" as const,deliveredAt:new Date()}))).onConflictDoNothing();if(input.section==="mailings"){const {sendProjectEmail}=await import("@/server/portal/email.server");for(const recipient of recipients)if(recipient.email)await sendProjectEmail({to:recipient.email,subject:input.subject||input.title,text:input.detail});}}
 }
 await db.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:`${input.section}.${editing?"updated":"created"}`,entityType:input.section,entityId:id,after:input});return{id};
}

export async function deleteAdminOperation(input:{section:string;id:string}){const permission:{[k:string]:string}={leads:"leads.manage",mailings:"mailings.manage",announcements:"announcements.manage",services:"services.manage",ads:"ads.manage"};const actor=await requirePermission(permission[input.section]||"admin.access");const db=getDatabase();if(input.section==="leads")await db.delete(s.propertyInterests).where(eq(s.propertyInterests.id,input.id));else if(input.section==="services")await db.delete(s.additionalServices).where(eq(s.additionalServices.id,input.id));else if(input.section==="ads")await db.delete(s.adPlacements).where(eq(s.adPlacements.id,input.id));else await db.delete(s.announcements).where(eq(s.announcements.id,input.id));await db.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:`${input.section}.deleted`,entityType:input.section,entityId:input.id});}

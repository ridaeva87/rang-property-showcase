import { randomUUID } from "node:crypto";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { currentUser, requirePermission } from "@/server/portal/portal.server";

export const PUBLIC_ANALYTICS_EVENTS={premise_view:"Просмотр карточки помещения",premise_cta:"Клик по CTA помещения",favorite_add:"Добавление помещения в избранное",favorite_remove:"Удаление помещения из избранного",service_view:"Просмотр дополнительных услуг",service_cta:"Обращение по дополнительной услуге"} as const;
export type PublicAnalyticsEvent=keyof typeof PUBLIC_ANALYTICS_EVENTS;
export function statsPeriod(input:{period?:string|undefined;from?:string|undefined;to?:string|undefined},now=new Date()){
  const end=input.to?new Date(`${input.to}T23:59:59.999`):now,start=new Date(end);
  if(input.from)return{from:new Date(`${input.from}T00:00:00.000`),to:end,label:"Произвольный период"};
  const days=input.period==="today"?1:input.period==="7d"?7:30;start.setDate(start.getDate()-(days-1));start.setHours(0,0,0,0);return{from:start,to:end,label:days===1?"Сегодня":`${days} дней`};
}
export async function recordPublicAnalytics(input:{eventType:PublicAnalyticsEvent;premiseId?:string|undefined;serviceId?:string|undefined;objectId?:string|undefined;context?:Record<string,string|number|boolean|null>|undefined}){
  const user=await currentUser();await getDatabase().insert(s.analyticsEvents).values({id:randomUUID(),name:PUBLIC_ANALYTICS_EVENTS[input.eventType],source:"rangpro.ru",eventType:input.eventType,userId:user?.id||null,premiseId:input.premiseId||null,serviceId:input.serviceId||null,objectId:input.objectId||null,context:input.context||{}});return{ok:true};
}
export async function recordPortalLogin(userId:string){await getDatabase().insert(s.analyticsEvents).values({id:randomUUID(),name:"Вход в личный кабинет",source:"account.login",eventType:"portal_login",userId,context:{}})}
const rows=async(query:ReturnType<typeof sql>)=>(await getDatabase().execute(query)).rows as any[];
export async function statisticsAdmin(input:{period?:string|undefined;from?:string|undefined;to?:string|undefined}){
  await requirePermission("statistics.view");const{from,to,label}=statsPeriod(input),db=getDatabase();
  const eventWhere=and(gte(s.analyticsEvents.createdAt,from),lte(s.analyticsEvents.createdAt,to));
  const [counts]=await rows(sql`select count(*)::int premises, count(*) filter(where publication_status='published')::int published from premises`);
  const [tenantCount]=await rows(sql`select count(*)::int value from users where kind='tenant'`);
  const [requestCount]=await rows(sql`select count(*)::int value from requests where created_at between ${from} and ${to}`);
  const requestByCategory=await rows(sql`select c.name label,count(*)::int value from requests r join request_categories c on c.id=r.category_id where r.created_at between ${from} and ${to} group by c.id,c.name order by value desc`);
  const requestByObject=await rows(sql`select coalesce(o.name,'Без помещения') label,count(*)::int value from requests r left join premises p on p.id=r.premise_id left join property_objects o on o.id=p.object_id where r.created_at between ${from} and ${to} group by o.id,o.name order by value desc`);
  const requestByPremise=await rows(sql`select coalesce(p.title,'Без помещения') label,count(*)::int value from requests r left join premises p on p.id=r.premise_id where r.created_at between ${from} and ${to} group by p.id,p.title order by value desc limit 15`);
  const requestDynamics=await rows(sql`select to_char(date_trunc('day',created_at),'YYYY-MM-DD') label,count(*)::int value from requests where created_at between ${from} and ${to} group by date_trunc('day',created_at) order by date_trunc('day',created_at)`);
  const requestSources=await rows(sql`select case when r.service_id is not null then 'Дополнительная услуга' when u.kind='tenant' then 'Личный кабинет' when u.kind='employee' then 'Администрация' else 'Система / импорт' end label,count(*)::int value from requests r left join users u on u.id=r.created_by_user_id where r.created_at between ${from} and ${to} group by 1 order by value desc`);
  const premiseEvents=await db.select({type:s.analyticsEvents.eventType,premiseId:s.analyticsEvents.premiseId,count:sql<number>`count(*)::int`}).from(s.analyticsEvents).where(eventWhere).groupBy(s.analyticsEvents.eventType,s.analyticsEvents.premiseId);
  const premiseNames=await db.select({id:s.premises.id,title:s.premises.title,address:s.propertyObjects.address}).from(s.premises).innerJoin(s.propertyObjects,eq(s.premises.objectId,s.propertyObjects.id));
  const popular=premiseNames.map(p=>({id:p.id,label:`${p.title} · ${p.address}`,views:premiseEvents.find(x=>x.premiseId===p.id&&x.type==="premise_view")?.count||0,favorites:premiseEvents.find(x=>x.premiseId===p.id&&x.type==="favorite_add")?.count||0,cta:premiseEvents.find(x=>x.premiseId===p.id&&x.type==="premise_cta")?.count||0})).filter(x=>x.views||x.favorites||x.cta).sort((a,b)=>b.views-a.views).slice(0,15);
  const interests=await rows(sql`select p.title label,count(*)::int value from property_interests i join premises p on p.id=i.premise_id where i.created_at between ${from} and ${to} group by p.id,p.title order by value desc limit 15`);
  const serviceUsage=await rows(sql`select s.title label,coalesce(c.name,'Без категории') category,count(*)::int value from requests r join additional_services s on s.id=r.service_id left join service_categories c on c.id=s.category_id where r.created_at between ${from} and ${to} group by s.id,s.title,c.name order by value desc`);
  const serviceCategories=await rows(sql`select coalesce(c.name,'Без категории') label,count(*)::int value from requests r join additional_services s on s.id=r.service_id left join service_categories c on c.id=s.category_id where r.created_at between ${from} and ${to} group by c.id,c.name order by value desc`);
  const adStats=await rows(sql`select a.id,a.title,u.display_name tenant,a.special_offer_title offer,count(e.id) filter(where e.event_type='view')::int views,count(e.id) filter(where e.event_type='cta_click')::int clicks,count(e.id) filter(where e.event_type='internal_lead')::int leads from ad_placements a left join users u on u.id=a.tenant_user_id left join ad_events e on e.placement_id=a.id and e.created_at between ${from} and ${to} group by a.id,u.display_name order by views desc`);
  const eventTotals=Object.fromEntries((await db.select({type:s.analyticsEvents.eventType,count:sql<number>`count(*)::int`}).from(s.analyticsEvents).where(eventWhere).groupBy(s.analyticsEvents.eventType)).map(x=>[x.type,Number(x.count)]));
  return{period:{from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10),label},stats:{premises:Number(counts.premises),published:Number(counts.published),tenants:Number(tenantCount.value),requests:Number(requestCount.value),views:eventTotals["premise_view"]||0,favorites:eventTotals["favorite_add"]||0,cta:eventTotals["premise_cta"]||0,portalLogins:eventTotals["portal_login"]||0},requestByCategory,requestByObject,requestByPremise,requestDynamics,requestSources,popular,interests,serviceUsage,serviceCategories,adStats};
}

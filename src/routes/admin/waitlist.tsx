import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { deleteWaitlistAdmin, loadAdminNavigation, loadWaitlist, prepareWaitlistNotificationAdmin, saveWaitlistAdmin } from "@/lib/admin.functions";
import { getCurrentAccount } from "@/lib/portal.functions";
import { AdminShell } from "@/components/portal/AdminShell";
import { GroupedPremiseOptions } from "@/components/portal/GroupedPremiseOptions";

const sourceLabels: Record<string,string> = { favorite:"Избранное", interest:"Выраженный интерес", request:"Заявка", waitlist:"Лист ожидания", similar:"Похожие параметры" };
const statusLabels: Record<string,string> = { active:"Активно", closed:"Закрыто" };

export const Route=createFileRoute("/admin/waitlist")({
  beforeLoad:async()=>{const u=await getCurrentAccount();if(!u||u.kind!=="employee"||!u.permissions.includes("waitlist.manage"))throw redirect({to:"/account/login"})},
  loader:async()=>({nav:await loadAdminNavigation(),data:await loadWaitlist()}),
  component:Page,
});

function Page(){
  const {nav,data}=Route.useLoaderData();
  const [editing,setEditing]=useState<(typeof data.items)[number]|null>(null);
  const [message,setMessage]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMessage("");const f=new FormData(e.currentTarget),v=(n:string)=>String(f.get(n)||"")||undefined;
    try{await saveWaitlistAdmin({data:{id:editing?.id,userId:v("userId"),name:v("name"),email:v("email"),phone:v("phone"),source:String(f.get("source")) as "favorite"|"interest"|"request"|"waitlist"|"similar",premiseId:v("premiseId"),typeId:v("typeId"),objectId:v("objectId"),areaMin:v("areaMin"),areaMax:v("areaMax"),priceMin:v("priceMin"),priceMax:v("priceMax"),status:String(f.get("status")),note:v("note")}});location.reload()}
    catch(error){setMessage(error instanceof Error?error.message:"Не удалось сохранить запись")}
  }
  return <AdminShell title="Лист ожидания" sections={nav.sections}>
    <form key={editing?.id||"new"} onSubmit={submit} className="grid gap-3 border bg-background p-5 md:grid-cols-2">
      <h2 className="font-semibold md:col-span-2">{editing?"Редактировать запись":"Новая запись"}</h2>
      <select name="userId" defaultValue={editing?.userId||""} className="border p-3"><option value="">Арендатор (необязательно)</option>{data.tenants.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <input name="name" defaultValue={editing?.contactName||""} placeholder="Контактное лицо" className="border p-3"/>
      <input name="email" type="email" defaultValue={editing?.contactEmail||""} placeholder="Email" className="border p-3"/>
      <input name="phone" defaultValue={editing?.contactPhone||""} placeholder="Телефон" className="border p-3"/>
      <select name="source" defaultValue={editing?.source||"waitlist"} required className="border p-3">{Object.entries(sourceLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <select name="status" defaultValue={editing?.status||"active"} required className="border p-3"><option value="active">Активно</option><option value="closed">Закрыто</option></select>
      <select name="premiseId" defaultValue={editing?.premiseId||""} className="border p-3"><option value="">Конкретное помещение</option><GroupedPremiseOptions premises={data.premises}/></select>
      <select name="typeId" defaultValue={editing?.premiseTypeId||""} className="border p-3"><option value="">Тип помещения</option>{data.types.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select name="objectId" defaultValue={editing?.objectId||""} className="border p-3"><option value="">Объект / адрес</option>{data.objects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><span/>
      <input name="areaMin" type="number" min="0" defaultValue={editing?.areaMin||""} placeholder="Площадь от" className="border p-3"/>
      <input name="areaMax" type="number" min="0" defaultValue={editing?.areaMax||""} placeholder="Площадь до" className="border p-3"/>
      <input name="priceMin" type="number" min="0" defaultValue={editing?.priceMin||""} placeholder="Цена от" className="border p-3"/>
      <input name="priceMax" type="number" min="0" defaultValue={editing?.priceMax||""} placeholder="Цена до" className="border p-3"/>
      <textarea name="note" defaultValue={editing?.note||""} placeholder="Комментарий" className="border p-3 md:col-span-2"/>
      <div className="flex gap-2 md:col-span-2"><button className="bg-primary px-4 py-3 text-primary-foreground">{editing?"Сохранить":"Добавить"}</button>{editing&&<button type="button" onClick={()=>setEditing(null)} className="border px-4 py-3">Отмена</button>}</div>
    </form>
    {message&&<p role="alert" className="mt-3 border border-destructive p-3 text-destructive">{message}</p>}
    <div className="mt-5 space-y-2">{data.items.map(x=><article key={x.id} className="border bg-background p-4">
      <b>{x.contactName||x.contactEmail||data.tenants.find(t=>t.id===x.userId)?.name||"Контакт"}</b>
      <p className="text-sm">Источник: {sourceLabels[x.source]||"Не указан"} · Статус: {statusLabels[x.status]||"Не указан"}</p>
      <p className="text-sm text-muted-foreground">Подходящие помещения: {x.matches.length?x.matches.map((m:any)=>`${m.title} (${m.reasons.join(", ")})`).join("; "):"нет"}</p>
      <div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>{setEditing(x);scrollTo({top:0,behavior:"smooth"})}} className="border px-3 py-2 text-sm">Редактировать</button>
        <button onClick={async()=>{if(confirm("Удалить запись из листа ожидания?")){await deleteWaitlistAdmin({data:{id:x.id}});location.reload()}}} className="border border-destructive px-3 py-2 text-sm text-destructive">Удалить</button>
        {x.status==="active"&&x.userId&&x.matches.length>0&&<button onClick={async()=>{try{const result=await prepareWaitlistNotificationAdmin({data:{id:x.id}});location.href=`/admin/notifications?draft=${encodeURIComponent(result.notificationId)}`}catch(error){setMessage(error instanceof Error?error.message:"Не удалось подготовить уведомление")}}} className="border px-3 py-2 text-sm">Подготовить уведомление</button>}
      </div>
    </article>)}</div>
  </AdminShell>
}

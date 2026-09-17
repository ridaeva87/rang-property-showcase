import { useState, type FormEvent } from "react";
import { createAdminOperation, deleteAdminOperation } from "@/lib/admin.functions";
import { AdminShell } from "./AdminShell";
import { GroupedPremiseOptions } from "./GroupedPremiseOptions";

type Ref={id:string;name:string|null};
type Item={id:string;title:string|null;detail:string|null;phone?:string|null;email?:string|null;source?:string|null;premiseId?:string|null;assigneeId?:string|null;status?:string|null;premise?:string|null;assignee?:string|null;history?:Array<{createdAt:string;actor:string|null;action:string}>;kind?:"manual"|"advertising";business?:string|null;tenant?:string|null;cta?:string|null;inquiryType?:string|null;offer?:string|null;createdAt?:string|null};
type Data={items:Item[];premises:Array<Ref&{address:string;objectId:string}>;employees:Ref[]};
const statusLabel=(value?:string|null)=>({new:"Новый",contacted:"Связались",viewing:"Просмотр",won:"Успешно",lost:"Закрыт"}[value||""]||value||"Новый");

export function LeadsAdminPage({nav,data}:{nav:readonly(readonly[string,string,string])[];data:Data}){
  const[editing,setEditing]=useState<Item|null>(null);const[error,setError]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");const f=new FormData(e.currentTarget),v=(name:string)=>String(f.get(name)||"").trim()||undefined;try{await createAdminOperation({data:{section:"leads",id:editing?.id,title:String(f.get("title")||"").trim(),detail:String(f.get("detail")||"").trim(),phone:v("phone"),email:v("email"),source:v("source"),status:v("status"),premiseId:v("premiseId"),assigneeId:v("assigneeId"),date:v("date")}});location.reload()}catch(e){setError(e instanceof Error?e.message:"Не удалось сохранить лид")}}
  return <AdminShell title="Потенциальные клиенты" sections={nav}>
    <form key={editing?.id||"new"} onSubmit={submit} className="mb-6 grid gap-3 border bg-background p-5 md:grid-cols-2">
      <input name="title" required defaultValue={editing?.title||""} placeholder="Имя / организация" className="border p-3"/>
      <input name="phone" defaultValue={editing?.phone||""} placeholder="Телефон" className="border p-3"/>
      <input name="email" type="email" defaultValue={editing?.email||""} placeholder="Email" className="border p-3"/>
      <input name="source" readOnly={editing?.kind==="advertising"} defaultValue={editing?.source||""} placeholder="Источник обращения" className="border p-3"/>
      <select name="premiseId" defaultValue={editing?.premiseId||""} required={editing?.kind!=="advertising"} disabled={editing?.kind==="advertising"} className="border p-3"><option value="">{editing?.kind==="advertising"?"Без помещения":"Интересующее помещение"}</option><GroupedPremiseOptions premises={data.premises}/></select>
      <select name="assigneeId" defaultValue={editing?.assigneeId||""} className="border p-3"><option value="">Ответственный менеджер</option>{data.employees.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select name="status" defaultValue={editing?.status||"new"} className="border p-3"><option value="new">Новый</option><option value="contacted">Связались</option><option value="viewing">Просмотр</option><option value="won">Успешно</option><option value="lost">Закрыт</option></select>
      {editing?.kind!=="advertising"&&<input name="date" type="datetime-local" className="border p-3"/>}
      <textarea name="detail" required defaultValue={editing?.detail||""} placeholder="Комментарий / сообщение" className="min-h-24 border p-3 md:col-span-2"/>
      {error&&<p role="alert" className="border border-destructive p-3 text-destructive md:col-span-2">{error}</p>}
      <div className="flex gap-2 md:col-span-2"><button className="bg-primary p-3 text-primary-foreground">{editing?"Сохранить":"Добавить"}</button>{editing&&<button type="button" onClick={()=>setEditing(null)} className="border p-3">Отмена</button>}</div>
    </form>
    <div className="space-y-3">{data.items.map(x=><article key={x.id} className="border bg-background p-4"><div className="flex justify-between gap-3"><div><b>{x.title}</b><p className="text-sm">{x.phone||"Без телефона"} · {x.email||"Без email"} · {x.premise||"Без помещения"} · {x.assignee||"Не назначен"} · {statusLabel(x.status)}</p>{x.kind==="advertising"&&<div className="mt-2 grid gap-1 text-sm"><p><b>Источник:</b> {x.source||"Реклама арендатора / RANG"}</p><p><b>Рекламная карточка:</b> {x.business}</p><p><b>Бизнес / арендатор:</b> {x.business} · {x.tenant||"Не указан"}</p><p><b>CTA:</b> {x.cta==="contact_form"?"Обратиться через RANG":x.cta}</p><p><b>Тип обращения:</b> {x.inquiryType==="internal_form"?"Внутренняя форма RANG":x.inquiryType}</p><p><b>Дата:</b> {x.createdAt?new Date(x.createdAt).toLocaleString("ru-RU"):"—"}</p><p><b>Специальное предложение:</b> {x.offer||"Не применялось"}</p></div>}<p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{x.detail}</p>{x.history?.length?<details className="mt-2 text-xs"><summary>История взаимодействия</summary>{x.history.map((h,i)=><p key={i}>{new Date(h.createdAt).toLocaleString("ru-RU")} · {h.actor||"Система"} · {h.action}</p>)}</details>:null}</div><div className="flex gap-2"><button onClick={()=>{setEditing(x);scrollTo({top:0,behavior:"smooth"})}} className="text-sm text-primary">Изменить</button><button onClick={async()=>{if(confirm("Удалить запись?")){await deleteAdminOperation({data:{section:"leads",id:x.id}});location.reload()}}} className="text-sm text-destructive">Удалить</button></div></div></article>)}</div>
  </AdminShell>;
}

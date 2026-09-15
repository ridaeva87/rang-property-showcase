import { useState, type FormEvent } from "react";
import { AdminShell } from "./AdminShell";
import { previewCommunicationAudience, saveCommunicationAdmin } from "@/lib/admin.functions";

type Kind = "notification" | "announcement" | "mailing";
type Ref = { id: string; name: string | null };
type CommunicationItem={id:string;title:string;body:string;category:string|null;status:string;channels:string[]};
type Data = { items: CommunicationItem[]; tenants: Ref[]; groups: Ref[]; objects: Ref[]; types: Ref[] };
const categories = ["Плановые работы","Электроснабжение","Водоснабжение","Технические работы","Режим работы","Безопасность","Движение по территории","Общие объявления"];

export function CommunicationsAdminPage({ kind, data, nav }: { kind: Kind; data: Data; nav: readonly (readonly [string,string,string])[] }) {
  const [scope,setScope]=useState<"all"|"tenant"|"group"|"object"|"type">("all"),[scopeId,setScopeId]=useState(""),[count,setCount]=useState<number|null>(null),[message,setMessage]=useState("");
  const refs=scope==="tenant"?data.tenants:scope==="group"?data.groups:scope==="object"?data.objects:scope==="type"?data.types:[];
  const label=kind==="mailing"?"Рассылки":kind==="announcement"?"Объявления":"Уведомления",audience={scope,id:scope==="all"?undefined:scopeId};
  async function preview(){if(scope!=="all"&&!scopeId){setMessage("Выберите сегмент");return;}const r=await previewCommunicationAudience({data:{kind,audience}});setCount(r.count);setMessage("");}
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget),send=f.get("action")==="send";if(send&&count===null){setMessage("Сначала проверьте получателей");return;}const r=await saveCommunicationAdmin({data:{kind,title:String(f.get("title")),subject:String(f.get("subject")||"")||undefined,body:String(f.get("body")),category:String(f.get("category")||"")||undefined,audience,channels:f.getAll("channels") as any,status:String(f.get("status")||"draft"),startsAt:String(f.get("startsAt")||"")||undefined,endsAt:String(f.get("endsAt")||"")||undefined,send}});setMessage(send?`Отправлено получателям: ${r.recipients}`:"Черновик сохранён");if(send)setTimeout(()=>location.reload(),500)}
  return <AdminShell title={label} sections={nav}><form onSubmit={submit} className="grid gap-3 border bg-background p-5 md:grid-cols-2">
    <input name="title" required placeholder="Название" className="border p-3"/><input name="subject" required={kind==="mailing"} placeholder="Тема сообщения" className="border p-3"/>
    {kind==="announcement"&&<select name="category" required className="border p-3"><option value="">Категория</option>{categories.map(x=><option key={x}>{x}</option>)}</select>}
    <select value={scope} onChange={e=>{setScope(e.target.value as any);setScopeId("");setCount(null)}} className="border p-3"><option value="all">Все арендаторы</option><option value="object">Объект / адрес</option><option value="type">Тип помещения</option><option value="group">Группа арендаторов</option><option value="tenant">Конкретный арендатор</option></select>
    {scope!=="all"&&<select value={scopeId} onChange={e=>{setScopeId(e.target.value);setCount(null)}} required className="border p-3"><option value="">Выберите сегмент</option>{refs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>}
    <div className="flex flex-wrap gap-3 border p-3 md:col-span-2"><b>Каналы:</b>{([['in_app','Личный кабинет'],['email','Email'],['telegram','Telegram (не подключён)'],['sms','SMS (не подключён)']] as const).map(([v,n])=><label key={v}><input type="checkbox" name="channels" value={v} defaultChecked={v==="in_app"}/> {n}</label>)}</div>
    <textarea name="body" required placeholder="Текст" className="min-h-32 border p-3 md:col-span-2"/>{kind==="announcement"&&<><input name="startsAt" type="datetime-local" className="border p-3"/><input name="endsAt" type="datetime-local" className="border p-3"/></>}
    <select name="status" className="border p-3"><option value="draft">Черновик</option>{kind==="announcement"&&<option value="scheduled">Запланировано</option>}</select><button type="button" onClick={preview} className="border p-3">Проверить получателей</button>
    <p className="border p-3 md:col-span-2">Сегмент: {scope==="all"?"Все арендаторы":refs.find(x=>x.id===scopeId)?.name||"не выбран"} · Получателей: {count??"не подсчитано"}</p>
    <button name="action" value="draft" className="border p-3">Сохранить черновик</button><button name="action" value="send" className="bg-primary p-3 text-primary-foreground">{kind==="announcement"?"Опубликовать":"Отправить"}</button>
  </form>{message&&<p role="alert" className="mt-3 border p-3">{message}</p>}<div className="mt-6 space-y-2">{data.items.map(x=><article key={x.id} className="border bg-background p-4"><b>{x.title}</b><p className="text-sm">{x.category&&`${x.category} · `}{x.status} · {(x.channels||[]).join(", ")}</p><p className="text-sm text-muted-foreground">{x.body}</p></article>)}</div></AdminShell>;
}

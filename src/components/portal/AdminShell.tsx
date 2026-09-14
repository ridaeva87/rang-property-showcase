import type { ReactNode } from "react";
import { PortalShell } from "./PortalShell";

export function AdminShell({title,sections,children}:{title:string;sections:readonly (readonly [string,string,string])[];children:ReactNode}){
  return <PortalShell title={title} homeHref="/admin"><nav className="mb-6 flex gap-2 overflow-x-auto pb-2"><a href="/admin" className="whitespace-nowrap border bg-background px-3 py-2 text-sm font-medium hover:border-primary">Главная админки</a>{sections.map(([href,label])=><a key={href} href={href} className="whitespace-nowrap border bg-background px-3 py-2 text-sm hover:border-primary">{label}</a>)}</nav>{children}</PortalShell>;
}

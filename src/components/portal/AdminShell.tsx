import { useEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { PortalShell } from "./PortalShell";
import { isAdminNavigationActive, readAdminNavigationScroll, saveAdminNavigationScroll } from "@/lib/admin-navigation";

export function AdminShell({title,sections,children}:{title:string;sections:readonly (readonly [string,string,string])[];children:ReactNode}){
  const navRef=useRef<HTMLElement>(null);
  const[pathname,setPathname]=useState("");
  useEffect(()=>{
    setPathname(window.location.pathname);
    const nav=navRef.current;
    if(!nav)return;
    try{
      const saved=readAdminNavigationScroll(window.sessionStorage);
      if(saved!==null)nav.scrollLeft=saved;
      else requestAnimationFrame(()=>{const active=nav.querySelector<HTMLElement>('[aria-current="page"]');if(active)nav.scrollLeft=Math.max(0,active.offsetLeft-12)});
    }catch{
      // sessionStorage can be unavailable in restricted browser modes; navigation still works.
    }
  },[]);
  const rememberScroll=(event:UIEvent<HTMLElement>)=>{try{saveAdminNavigationScroll(window.sessionStorage,event.currentTarget.scrollLeft)}catch{/* storage is optional */}};
  const linkClass=(active:boolean,home=false)=>`whitespace-nowrap border px-3 py-2 text-sm ${home?"font-medium ":""}${active?"border-primary bg-primary text-primary-foreground":"bg-background hover:border-primary"}`;
  const homeActive=isAdminNavigationActive(pathname,"/admin");
  return <PortalShell title={title} homeHref="/admin"><nav ref={navRef} onScroll={rememberScroll} aria-label="Разделы административной системы" className="mb-6 flex gap-2 overflow-x-auto pb-2"><a href="/admin" aria-current={homeActive?"page":undefined} className={linkClass(homeActive,true)}>Главная админки</a>{sections.map(([href,label])=>{const active=isAdminNavigationActive(pathname,href);return <a key={href} href={href} aria-current={active?"page":undefined} className={linkClass(active)}>{label}</a>})}</nav>{children}</PortalShell>;
}

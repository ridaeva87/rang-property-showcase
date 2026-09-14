import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const loadAdminNavigation=createServerFn({method:"GET"}).handler(async()=>(await import("@/server/admin/admin.server")).adminNavigation());
export const loadEmployeesAdmin=createServerFn({method:"GET"}).handler(async()=>(await import("@/server/admin/admin.server")).employeesAdmin());
export const saveEmployee=createServerFn({method:"POST"}).validator(z.object({id:z.string().optional(),name:z.string().min(2),email:z.string().email(),jobTitle:z.string().optional(),active:z.boolean(),roleCodes:z.array(z.string()).min(1)})).handler(async({data})=>(await import("@/server/admin/admin.server")).saveEmployeeAdmin(data));
export const loadPremisesAdmin=createServerFn({method:"GET"}).handler(async()=>(await import("@/server/admin/admin.server")).premisesAdmin());
export const savePremise=createServerFn({method:"POST"}).validator(z.object({id:z.string().optional(),title:z.string().min(2),slug:z.string().min(2),objectId:z.string(),typeId:z.string(),statusId:z.string().optional(),area:z.string().optional(),release:z.string().optional(),publication:z.enum(["draft","published","archived"]),offerType:z.enum(["rent","sale"]),price:z.string().optional()})).handler(async({data})=>(await import("@/server/admin/admin.server")).savePremiseAdmin(data));
export const loadPremiseMedia=createServerFn({method:"GET"}).validator(z.object({premiseId:z.string()})).handler(async({data})=>(await import("@/server/admin/admin.server")).premiseMediaAdmin(data.premiseId));
export const updatePremiseMedia=createServerFn({method:"POST"}).validator(z.object({premiseId:z.string(),mediaId:z.string(),action:z.enum(["main","up","down","remove"])})).handler(async({data})=>{await (await import("@/server/admin/admin.server")).updatePremiseMediaAdmin(data);return{ok:true}});
export const loadAdminOperations=createServerFn({method:"GET"}).validator(z.object({section:z.string()})).handler(async({data})=>(await import("@/server/admin/admin.server")).adminOperations(data.section));
export const createAdminOperation=createServerFn({method:"POST"}).validator(z.object({section:z.string(),title:z.string().min(2),detail:z.string().min(1),tenantId:z.string().optional()})).handler(async({data})=>(await import("@/server/admin/admin.server")).createAdminOperation(data));
export const deleteAdminOperation=createServerFn({method:"POST"}).validator(z.object({section:z.string(),id:z.string()})).handler(async({data})=>{await (await import("@/server/admin/admin.server")).deleteAdminOperation(data);return{ok:true}});

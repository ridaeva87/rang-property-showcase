import { describe, expect, it } from "vitest";
import { decideWaitlistNotification, waitlistMatch } from "./communications.server";

const premise={id:"p1",typeId:"office",objectId:"ak",area:"50",price:"1200"};
describe("transparent waitlist matching",()=>{
  it("matches a concrete premise",()=>expect(waitlistMatch({premiseId:"p1"},premise)).toEqual(["Конкретное помещение"]));
  it("explains every matching criterion",()=>expect(waitlistMatch({premiseTypeId:"office",objectId:"ak",areaMin:"40",areaMax:"60",priceMax:"1300"},premise)).toEqual(["Тип помещения","Объект/адрес","Площадь","Цена"]));
  it("rejects any failed criterion",()=>expect(waitlistMatch({premiseTypeId:"warehouse",objectId:"ak"},premise)).toEqual([]));
});

describe("waitlist notification deduplication",()=>{
  it("returns the sent notification for an unchanged match set",()=>expect(decideWaitlistNotification([{id:"sent",status:"sent",body:"same"}],"same")).toEqual({action:"already_sent",id:"sent"}));
  it("creates a new draft when the match set changed",()=>expect(decideWaitlistNotification([{id:"sent",status:"sent",body:"old"}],"new")).toEqual({action:"create"}));
  it("reuses an existing draft",()=>expect(decideWaitlistNotification([{id:"draft",status:"draft",body:"old"}],"new")).toEqual({action:"reuse_draft",id:"draft"}));
});

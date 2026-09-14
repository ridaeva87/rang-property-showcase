import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { requirePermission, requireUser } from "./portal.server";

const MAX_READING = 1_000_000_000_000;
export function validateReading(value: number, previous: number | null, monotonic: boolean) {
  if (!Number.isFinite(value) || value < 0 || value > MAX_READING)
    throw new Error("Некорректное показание");
  if (monotonic && previous !== null && value < previous)
    throw new Error("Новое показание не может быть меньше предыдущего");
  return value;
}
export function displayReading(value: string | number) {
  return String(Number(value)).replace(".", ",");
}
export function attachMeterReadings<T extends { id: string }, R extends { meterId: string }>(
  meters: T[],
  readings: R[],
) {
  return meters.map((m) => ({
    ...m,
    readings: readings.filter((r) => r.meterId === m.id),
    previous: readings.find((r) => r.meterId === m.id) || null,
  }));
}

async function tenantPremiseIds(userId: string) {
  return (
    await getDatabase()
      .select({ id: s.tenantPremises.premiseId })
      .from(s.tenantPremises)
      .where(eq(s.tenantPremises.userId, userId))
  ).map((x) => x.id);
}

export async function tenantUtilities() {
  const user = await requireUser("tenant"),
    db = getDatabase(),
    premiseIds = await tenantPremiseIds(user.id);
  if (!premiseIds.length)
    return {
      meters: [],
      expenses: [],
      summary: { total: 0, change: null, percent: null, saving: null },
    };
  const meters = await db
    .select({
      id: s.meters.id,
      name: s.meters.name,
      serial: s.meters.serialNumber,
      monotonic: s.meters.isMonotonic,
      type: s.meterTypes.name,
      unit: s.meterTypes.unit,
      premise: s.premises.title,
      premiseId: s.premises.id,
    })
    .from(s.meters)
    .innerJoin(s.meterTypes, eq(s.meters.typeId, s.meterTypes.id))
    .innerJoin(s.premises, eq(s.meters.premiseId, s.premises.id))
    .where(and(eq(s.meters.isActive, true), inArray(s.meters.premiseId, premiseIds)))
    .orderBy(s.premises.title, s.meters.name);
  const ids = meters.map((x) => x.id),
    readings = ids.length
      ? await db
          .select({
            id: s.meterReadings.id,
            meterId: s.meterReadings.meterId,
            value: s.meterReadings.value,
            at: s.meterReadings.readingAt,
          })
          .from(s.meterReadings)
          .where(inArray(s.meterReadings.meterId, ids))
          .orderBy(sql`${s.meterReadings.readingAt} desc`)
      : [];
  const expenses = await db
    .select({
      id: s.expenses.id,
      amount: s.expenses.amount,
      consumption: s.expenses.consumption,
      category: s.expenseCategories.name,
      period: s.accountingPeriods.label,
      startsOn: s.accountingPeriods.startsOn,
      premise: s.premises.title,
    })
    .from(s.expenses)
    .innerJoin(s.expenseCategories, eq(s.expenses.categoryId, s.expenseCategories.id))
    .innerJoin(s.accountingPeriods, eq(s.expenses.periodId, s.accountingPeriods.id))
    .innerJoin(s.premises, eq(s.expenses.premiseId, s.premises.id))
    .where(and(eq(s.expenses.tenantUserId, user.id), inArray(s.expenses.premiseId, premiseIds)))
    .orderBy(sql`${s.accountingPeriods.startsOn} desc`);
  const totals = new Map<string, number>();
  for (const e of expenses) totals.set(e.period, (totals.get(e.period) || 0) + Number(e.amount));
  const periods = [...totals.entries()],
    total = periods[0]?.[1] || 0,
    previous = periods[1]?.[1] ?? null,
    change = previous === null ? null : total - previous;
  return {
    meters: attachMeterReadings(meters, readings),
    expenses,
    summary: {
      total,
      change,
      percent: previous && change !== null ? (change / previous) * 100 : null,
      saving: null,
    },
  };
}

export async function submitTenantReading(meterId: string, value: number) {
  const user = await requireUser("tenant"),
    db = getDatabase(),
    premiseIds = await tenantPremiseIds(user.id);
  const meter = (
    await db
      .select({ id: s.meters.id, monotonic: s.meters.isMonotonic })
      .from(s.meters)
      .where(
        and(
          eq(s.meters.id, meterId),
          eq(s.meters.isActive, true),
          inArray(s.meters.premiseId, premiseIds),
        ),
      )
      .limit(1)
  )[0];
  if (!meter) throw new Error("Счётчик недоступен");
  const previous = (
    await db
      .select({ value: s.meterReadings.value })
      .from(s.meterReadings)
      .where(eq(s.meterReadings.meterId, meterId))
      .orderBy(sql`${s.meterReadings.readingAt} desc`)
      .limit(1)
  )[0];
  validateReading(value, previous ? Number(previous.value) : null, meter.monotonic);
  const id = randomUUID(),
    now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .insert(s.meterReadings)
      .values({
        id,
        meterId,
        value: String(value),
        readingAt: now,
        submittedByUserId: user.id,
        source: "tenant",
      });
    await tx
      .insert(s.auditLogs)
      .values({
        id: randomUUID(),
        actorUserId: user.id,
        action: "meter_reading.submitted",
        entityType: "meter",
        entityId: meterId,
        after: { readingId: id, value },
      });
  });
  return { id };
}

export async function utilitiesAdmin() {
  await requirePermission("utilities.manage");
  const db = getDatabase();
  return {
    meters: await db
      .select({
        id: s.meters.id,
        name: s.meters.name,
        serial: s.meters.serialNumber,
        active: s.meters.isActive,
        monotonic: s.meters.isMonotonic,
        premiseId: s.meters.premiseId,
        typeId: s.meters.typeId,
        premise: s.premises.title,
        type: s.meterTypes.name,
        unit: s.meterTypes.unit,
      })
      .from(s.meters)
      .innerJoin(s.premises, eq(s.meters.premiseId, s.premises.id))
      .innerJoin(s.meterTypes, eq(s.meters.typeId, s.meterTypes.id))
      .orderBy(s.premises.title),
    types: await db.select().from(s.meterTypes).orderBy(s.meterTypes.name),
    premises: await db
      .select({ id: s.premises.id, name: s.premises.title, address: s.propertyObjects.address, objectId: s.propertyObjects.id })
      .from(s.premises)
      .innerJoin(s.propertyObjects, eq(s.premises.objectId, s.propertyObjects.id))
      .orderBy(s.propertyObjects.address, s.premises.title),
    tenants: await db
      .select({ id: s.users.id, name: s.users.displayName })
      .from(s.users)
      .where(eq(s.users.kind, "tenant")),
    categories: await db.select().from(s.expenseCategories).orderBy(s.expenseCategories.name),
    expenses: await db
      .select({
        id: s.expenses.id,
        tenantId: s.expenses.tenantUserId,
        premiseId: s.expenses.premiseId,
        categoryId: s.expenses.categoryId,
        period: s.accountingPeriods.label,
        amount: s.expenses.amount,
        consumption: s.expenses.consumption,
        note: s.expenses.note,
        tenant: s.users.displayName,
        premise: s.premises.title,
        category: s.expenseCategories.name,
      })
      .from(s.expenses)
      .innerJoin(s.accountingPeriods, eq(s.expenses.periodId, s.accountingPeriods.id))
      .leftJoin(s.users, eq(s.expenses.tenantUserId, s.users.id))
      .leftJoin(s.premises, eq(s.expenses.premiseId, s.premises.id))
      .innerJoin(s.expenseCategories, eq(s.expenses.categoryId, s.expenseCategories.id))
      .orderBy(sql`${s.accountingPeriods.startsOn} desc`),
  };
}

export async function saveMeter(input: {
  id?: string;
  name: string;
  serial?: string;
  premiseId: string;
  typeId: string;
  active: boolean;
  monotonic: boolean;
}) {
  const actor = await requirePermission("utilities.manage"),
    db = getDatabase(),
    id = input.id || randomUUID(),
    values = {
      name: input.name,
      serialNumber: input.serial || null,
      premiseId: input.premiseId,
      typeId: input.typeId,
      isActive: input.active,
      isMonotonic: input.monotonic,
      updatedAt: new Date(),
    };
  await db.transaction(async (tx) => {
    if (input.id) await tx.update(s.meters).set(values).where(eq(s.meters.id, id));
    else await tx.insert(s.meters).values({ id, ...values });
    await tx
      .insert(s.auditLogs)
      .values({
        id: randomUUID(),
        actorUserId: actor.id,
        action: input.id ? "meter.updated" : "meter.created",
        entityType: "meter",
        entityId: id,
        after: input,
      });
  });
  return { id };
}

export async function saveExpense(input: {
  id?: string;
  tenantId: string;
  premiseId: string;
  categoryId: string;
  period: string;
  amount: number;
  consumption?: number;
  note?: string;
}) {
  const actor = await requirePermission("utilities.manage"),
    db = getDatabase();
  if (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 1e12)
    throw new Error("Некорректная сумма");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.period)) throw new Error("Некорректный период");
  const linked = (
    await db
      .select({ id: s.tenantPremises.userId })
      .from(s.tenantPremises)
      .where(
        and(
          eq(s.tenantPremises.userId, input.tenantId),
          eq(s.tenantPremises.premiseId, input.premiseId),
        ),
      )
      .limit(1)
  )[0];
  if (!linked) throw new Error("Выбранное помещение не связано с арендатором");
  const org = (
    await db
      .select({ id: s.organizationUsers.organizationId })
      .from(s.organizationUsers)
      .where(eq(s.organizationUsers.userId, input.tenantId))
      .limit(1)
  )[0];
  const [year, month] = input.period.split("-").map(Number),
    start = `${year}-${String(month).padStart(2, "0")}-01`,
    end = new Date(Date.UTC(year!, month!, 0)).toISOString().slice(0, 10),
    periodId = `period-${input.period}`;
  await db
    .insert(s.accountingPeriods)
    .values({
      id: periodId,
      startsOn: start,
      endsOn: end,
      label: new Intl.DateTimeFormat("ru-RU", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${start}T00:00:00Z`)),
    })
    .onConflictDoNothing();
  const id = input.id || randomUUID(),
    values = {
      organizationId: org?.id || null,
      tenantUserId: input.tenantId,
      premiseId: input.premiseId,
      categoryId: input.categoryId,
      periodId,
      amount: String(input.amount),
      consumption: input.consumption === undefined ? null : String(input.consumption),
      note: input.note || null,
      updatedAt: new Date(),
    };
  await db.transaction(async (tx) => {
    if (input.id) await tx.update(s.expenses).set(values).where(eq(s.expenses.id, id));
    else await tx.insert(s.expenses).values({ id, ...values });
    await tx
      .insert(s.auditLogs)
      .values({
        id: randomUUID(),
        actorUserId: actor.id,
        action: input.id ? "expense.updated" : "expense.created",
        entityType: "expense",
        entityId: id,
        after: input,
      });
  });
  return { id };
}

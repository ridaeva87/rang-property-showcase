import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { getCurrentAccount } from "@/lib/portal.functions";
import {
  loadAdminNavigation,
  loadUtilitiesAdmin,
  saveExpenseAdmin,
  saveMeterAdmin,
} from "@/lib/admin.functions";
import { AdminShell } from "@/components/portal/AdminShell";
import { GroupedPremiseOptions } from "@/components/portal/GroupedPremiseOptions";
export const Route = createFileRoute("/admin/utilities")({
  beforeLoad: async () => {
    const u = await getCurrentAccount();
    if (!u || u.kind !== "employee" || !u.permissions.includes("utilities.manage"))
      throw redirect({ to: "/account/login" });
  },
  loader: async () => ({ nav: await loadAdminNavigation(), data: await loadUtilitiesAdmin() }),
  component: Page,
});
function Page() {
  const { nav, data } = Route.useLoaderData(),
    [meter, setMeter] = useState<(typeof data.meters)[number] | null>(null),
    [expense, setExpense] = useState<(typeof data.expenses)[number] | null>(null),
    [message, setMessage] = useState("");
  async function meterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const f = new FormData(e.currentTarget);
    try {
      await saveMeterAdmin({
        data: {
          id: meter?.id,
          name: String(f.get("name")),
          serial: String(f.get("serial") || "") || undefined,
          premiseId: String(f.get("premise")),
          typeId: String(f.get("type")),
          active: f.get("active") === "on",
          monotonic: f.get("monotonic") === "on",
        },
      });
      location.reload();
    } catch (x) {
      setMessage(x instanceof Error ? x.message : "Не удалось сохранить счётчик");
    }
  }
  async function expenseSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const f = new FormData(e.currentTarget),
      consumption = String(f.get("consumption") || "");
    try {
      await saveExpenseAdmin({
        data: {
          id: expense?.id,
          tenantId: String(f.get("tenant")),
          premiseId: String(f.get("premise")),
          categoryId: String(f.get("category")),
          period: String(f.get("period")),
          amount: Number(f.get("amount")),
          consumption: consumption ? Number(consumption) : undefined,
          note: String(f.get("note") || "") || undefined,
        },
      });
      location.reload();
    } catch (x) {
      setMessage(x instanceof Error ? x.message : "Не удалось сохранить расход");
    }
  }
  return (
    <AdminShell title="Счётчики и расходы" sections={nav.sections}>
      {message && (
        <p role="alert" className="mb-4 border border-destructive p-3 text-sm text-destructive">
          {message}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <form
            key={meter?.id || "new-meter"}
            onSubmit={meterSubmit}
            className="grid gap-3 border bg-background p-5 sm:grid-cols-2"
          >
            <div className="flex items-center justify-between sm:col-span-2">
              <h2 className="font-semibold">{meter ? "Редактировать счётчик" : "Новый счётчик"}</h2>
              {meter && (
                <button
                  type="button"
                  onClick={() => setMeter(null)}
                  className="border px-3 py-2 text-sm"
                >
                  Создать новый
                </button>
              )}
            </div>
            <input
              name="name"
              required
              defaultValue={meter?.name || ""}
              placeholder="Название"
              className="border p-3"
            />
            <input
              name="serial"
              defaultValue={meter?.serial || ""}
              placeholder="Номер / идентификатор"
              className="border p-3"
            />
            <select name="type" required defaultValue={meter?.typeId || ""} className="border p-3">
              <option value="">Тип и единица</option>
              {data.types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.unit}
                </option>
              ))}
            </select>
            <select
              name="premise"
              required
              defaultValue={meter?.premiseId || ""}
              className="border p-3"
            >
              <option value="">Помещение</option>
              <GroupedPremiseOptions premises={data.premises} />
            </select>
            <label>
              <input name="active" type="checkbox" defaultChecked={meter?.active ?? true} /> Активен
            </label>
            <label>
              <input name="monotonic" type="checkbox" defaultChecked={meter?.monotonic ?? true} />{" "}
              Не допускает уменьшения
            </label>
            <button className="bg-primary p-3 text-primary-foreground sm:col-span-2">
              Сохранить
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {data.meters.map((m) => (
              <button
                key={m.id}
                onClick={() => setMeter(m)}
                className="block w-full border bg-background p-3 text-left"
              >
                <b>{m.name || m.type}</b>
                <p className="text-sm">
                  {m.premise} · {m.serial || "Без номера"} · {m.active ? "Активен" : "Отключён"}
                </p>
              </button>
            ))}
          </div>
        </section>
        <section>
          <form
            key={expense?.id || "new-expense"}
            onSubmit={expenseSubmit}
            className="grid gap-3 border bg-background p-5 sm:grid-cols-2"
          >
            <div className="flex items-center justify-between sm:col-span-2">
              <h2 className="font-semibold">{expense ? "Редактировать расход" : "Новый расход"}</h2>
              {expense && (
                <button
                  type="button"
                  onClick={() => setExpense(null)}
                  className="border px-3 py-2 text-sm"
                >
                  Создать новый
                </button>
              )}
            </div>
            <select
              name="tenant"
              required
              defaultValue={expense?.tenantId || ""}
              className="border p-3"
            >
              <option value="">Арендатор</option>
              {data.tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              name="premise"
              required
              defaultValue={expense?.premiseId || ""}
              className="border p-3"
            >
              <option value="">Помещение арендатора</option>
              <GroupedPremiseOptions premises={data.premises} />
            </select>
            <select
              name="category"
              required
              defaultValue={expense?.categoryId || ""}
              className="border p-3"
            >
              <option value="">Тип расхода</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input name="period" type="month" required className="border p-3" />
            <input
              name="amount"
              type="number"
              min="0"
              max="1000000000000"
              step="0.01"
              required
              defaultValue={expense?.amount || ""}
              placeholder="Сумма, ₽"
              className="border p-3"
            />
            <input
              name="consumption"
              type="number"
              min="0"
              max="1000000000000"
              step="0.0001"
              defaultValue={expense?.consumption || ""}
              placeholder="Объём (необязательно)"
              className="border p-3"
            />
            <textarea
              name="note"
              defaultValue={expense?.note || ""}
              placeholder="Комментарий"
              className="border p-3 sm:col-span-2"
            />
            <button className="bg-primary p-3 text-primary-foreground sm:col-span-2">
              Сохранить расход
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {data.expenses.map((x) => (
              <button
                key={x.id}
                onClick={() => setExpense(x)}
                className="block w-full border bg-background p-3 text-left"
              >
                <b>
                  {x.tenant} · {x.premise}
                </b>
                <p className="text-sm">
                  {x.period} · {x.category} · {x.amount} ₽
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

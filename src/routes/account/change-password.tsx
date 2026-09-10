import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { changeAccountPassword, getCurrentAccount } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal/PortalShell";
import { PasswordInput } from "@/components/portal/PasswordInput";
export const Route = createFileRoute("/account/change-password")({
  beforeLoad: async () => {
    if (!(await getCurrentAccount())) throw redirect({ to: "/account/login" });
  },
  component: Page,
});
function Page() {
  const [msg, setMsg] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (String(f.get("next")) !== String(f.get("confirm"))) return setMsg("Пароли не совпадают");
    try {
      await changeAccountPassword({
        data: { currentPassword: String(f.get("current")), newPassword: String(f.get("next")) },
      });
      location.href = "/account/login";
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Ошибка");
    }
  }
  return (
    <PortalShell title="Смена пароля">
      <form onSubmit={submit} className="mx-auto max-w-lg border bg-background p-6">
        <PasswordInput
          name="current"
          required
          className="w-full border px-3 py-3"
          placeholder="Текущий пароль"
        />
        <PasswordInput
          name="next"
          required
          minLength={12}
          className="mt-3 w-full border px-3 py-3"
          placeholder="Новый пароль"
        />
        <PasswordInput name="confirm" required minLength={12} className="mt-3 w-full border px-3 py-3" placeholder="Повторите новый пароль" />
        {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}
        <button className="mt-5 w-full bg-primary px-4 py-3 font-semibold text-primary-foreground">
          Сменить пароль
        </button>
      </form>
    </PortalShell>
  );
}

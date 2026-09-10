import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { activateAccount } from "@/lib/portal.functions";
import { PasswordInput } from "@/components/portal/PasswordInput";

export const Route = createFileRoute("/account/activate")({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ActivatePage,
});
function ActivatePage() {
  const { token } = Route.useSearch();
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) return setMessage("Пароли не совпадают");
    try {
      await activateAccount({ data: { token: token || "", password } });
      window.location.href = "/account/login";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ссылка недействительна");
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <form onSubmit={submit} className="w-full max-w-md border bg-background p-8">
        <h1 className="text-2xl font-semibold">Задать пароль</h1>
        <p className="mt-2 text-sm text-muted-foreground">Не менее 12 символов, буквы и цифры.</p>
        <PasswordInput
          name="password"
          required
          minLength={12}
          className="mt-6 w-full border px-3 py-3"
          placeholder="Новый пароль"
        />
        <PasswordInput
          name="confirm"
          required
          minLength={12}
          className="mt-3 w-full border px-3 py-3"
          placeholder="Повторите пароль"
        />
        {message && <p className="mt-3 text-sm text-destructive">{message}</p>}
        <button className="mt-5 w-full bg-primary px-4 py-3 font-semibold text-primary-foreground">
          Сохранить пароль
        </button>
      </form>
    </main>
  );
}

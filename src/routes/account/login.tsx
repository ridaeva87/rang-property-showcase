import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { loginAccount } from "@/lib/portal.functions";

export const Route = createFileRoute("/account/login")({ component: LoginPage });

function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await loginAccount({
        data: { email: String(form.get("email")), password: String(form.get("password")) },
      });
      window.location.href = result.kind === "employee" ? "/admin/tenants" : "/account";
    } catch {
      setError("Неверный логин или пароль");
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md border border-border bg-background p-6 shadow-sm sm:p-8"
      >
        <a href="/" className="font-display text-2xl font-extrabold text-primary">
          РАНГ
        </a>
        <h1 className="mt-8 text-2xl font-semibold">Личный кабинет</h1>
        <p className="mt-2 text-sm text-muted-foreground">Вход для действующих арендаторов</p>
        <label className="mt-6 block text-sm font-medium">
          Электронная почта
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-2 w-full border border-input bg-background px-3 py-3"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Пароль
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full border border-input bg-background px-3 py-3"
          />
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="mt-6 w-full bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Входим…" : "Войти"}
        </button>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Нет доступа? Обратитесь к сотруднику RANG.
        </p>
      </form>
    </main>
  );
}

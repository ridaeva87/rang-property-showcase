import type { ReactNode } from "react";

export function PortalShell({
  title,
  name,
  children,
}: {
  title: string;
  name?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="font-display text-2xl font-extrabold text-primary">
            РАНГ
          </a>
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {name && <p className="text-sm text-muted-foreground">{name}</p>}
          </div>
          <a href="/account/change-password" className="text-sm font-medium text-primary">
            Сменить пароль
          </a>
        </header>
        {children}
      </div>
    </main>
  );
}

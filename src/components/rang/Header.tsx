import { useEffect, useState } from "react";
import { Menu, X, UserRound } from "lucide-react";
import { NAV } from "@/data/rang";
import { toast } from "sonner";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/92 backdrop-blur-md"
          : "bg-background/70 backdrop-blur-sm"
      }`}
    >
      <div className="container-rang flex h-20 items-center justify-between gap-6">
        <a href="#top" className="flex flex-col leading-none">
          <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
            РАНГ
          </span>
          <span className="mt-1 hidden text-[0.62rem] whitespace-nowrap tracking-[0.12em] text-muted-foreground uppercase sm:block">
            Коммерческая недвижимость с 1993 года
          </span>
        </a>

        <nav className="hidden items-center gap-5 xl:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium whitespace-nowrap text-foreground/80 transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={() => toast("Личный кабинет появится на следующем этапе разработки")}
            className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-medium whitespace-nowrap text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <UserRound className="size-4" />
            Личный кабинет — скоро
          </button>
          <a
            href="#search"
            className="bg-primary px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-accent"
          >
            Подобрать помещение
          </a>
        </div>

        <button
          className="inline-flex size-11 items-center justify-center border border-border text-foreground xl:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-border bg-background xl:hidden">
          <nav className="container-rang flex flex-col py-3">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/70 py-3.5 text-base font-medium text-foreground"
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 py-4">
              <button
                onClick={() => {
                  setOpen(false);
                  toast("Личный кабинет появится на следующем этапе разработки");
                }}
                className="border border-border px-4 py-3 text-sm font-medium"
              >
                Личный кабинет — скоро
              </button>
              <a
                href="#search"
                onClick={() => setOpen(false)}
                className="bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Подобрать помещение
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

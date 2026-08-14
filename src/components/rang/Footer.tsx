import { NAV } from "@/data/rang";
import { toast } from "sonner";

const LEGAL = [
  "Политика конфиденциальности",
  "Согласие на обработку персональных данных",
  "Согласие на получение информационных сообщений",
];

export function Footer() {
  return (
    <footer className="bg-graphite py-16">
      <div className="container-rang">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl font-extrabold text-primary-foreground">РАНГ</p>
            <p className="mt-2 text-sm text-primary-foreground/60">
              Коммерческая недвижимость с 1993 года
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-3 text-sm">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-primary-foreground/75 transition-colors hover:text-accent"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => toast("Личный кабинет появится на следующем этапе разработки")}
              className="text-left text-primary-foreground/75 transition-colors hover:text-accent"
            >
              Личный кабинет — скоро
            </button>
          </nav>
          <ul className="space-y-3 text-sm">
            {LEGAL.map((l) => (
              <li key={l}>
                <button
                  onClick={() => toast("Документ будет добавлен на следующем этапе")}
                  className="text-left text-primary-foreground/60 transition-colors hover:text-accent"
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-12 border-t border-primary-foreground/12 pt-6 text-xs text-primary-foreground/45">
          © {new Date().getFullYear()} «Ранг». Демонстрационная версия сайта: данные и контакты —
          заглушки.
        </div>
      </div>
    </footer>
  );
}

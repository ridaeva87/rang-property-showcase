import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Headset } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "bot" | "user"; text: string; action?: { label: string; toast: string } };

const GREETING: Msg = {
  role: "bot",
  text: "Здравствуйте! Помогу найти помещение или отвечу на вопросы об аренде и услугах. Что вас интересует?",
};

const QUICK = [
  "Найти помещение",
  "Свободные склады",
  "Условия аренды",
  "Дополнительные услуги",
  "Задать вопрос",
];

function reply(input: string): Msg {
  const t = input.toLowerCase();
  if (t.includes("склад") && /\d/.test(t)) {
    return {
      role: "bot",
      text: "Есть несколько вариантов, которые могут вам подойти. Показать свободные помещения?",
      action: {
        label: "Показать",
        toast: "Демо-режим: подборка помещений откроется в рабочей версии",
      },
    };
  }
  if (t.includes("переоборуд") || t.includes("услуг") || t.includes("работ")) {
    return {
      role: "bot",
      text: "Для арендаторов предусмотрена возможность оставить заявку на необходимые работы.",
      action: { label: "О заявках", toast: "Демонстрационный режим: заявки пока не отправляются" },
    };
  }
  if (t.includes("найти") || t.includes("помещен") || t.includes("склад") || t.includes("офис")) {
    return {
      role: "bot",
      text: "Подскажите тип помещения и желаемую площадь — предложу подходящие варианты.",
      action: {
        label: "Показать свободные",
        toast: "Демо-режим: каталог откроется в рабочей версии",
      },
    };
  }
  if (t.includes("услови") || t.includes("аренд") || t.includes("стоим") || t.includes("цен")) {
    return {
      role: "bot",
      text: "Условия зависят от выбранного помещения. Подробную информацию можно получить у сотрудника компании.",
      action: {
        label: "О консультации",
        toast: "Демонстрационный режим: запрос пока не отправляется",
      },
    };
  }
  return {
    role: "bot",
    text: "Записал ваш вопрос. В рабочей версии помощник ответит подробно или передаст вопрос сотруднику компании.",
    action: {
      label: "Передать вопрос сотруднику",
      toast: "Демонстрационный режим: вопрос пока не передаётся",
    },
  };
}

export function AiAssistant({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setValue("");
    setTimeout(() => setMessages((m) => [...m, reply(text)]), 450);
  };

  return (
    <>
      {open && (
        <div className="animate-scale-in fixed right-4 bottom-4 z-60 flex h-[min(78vh,560px)] w-[calc(100vw-2rem)] max-w-96 flex-col border border-border bg-card shadow-lift sm:right-6 sm:bottom-24">
          <div className="flex items-center justify-between gap-3 bg-primary px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-primary-foreground">Помощник Ранг</p>
              <p className="text-[0.7rem] text-primary-foreground/60">Демонстрационный режим</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Закрыть чат"
              className="text-primary-foreground/70 hover:text-primary-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                      : "max-w-[92%] text-sm text-foreground"
                  }
                >
                  {m.text}
                  {m.action && (
                    <button
                      onClick={() => toast(m.action!.toast)}
                      className="mt-3 block w-fit bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground"
                    >
                      {m.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4">
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-accent hover:text-accent"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(value);
              }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Например: нужен склад от 100 до 150 м²"
                className="h-11 w-full border border-input bg-background px-3 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                aria-label="Отправить"
                className="flex size-11 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-colors hover:bg-accent"
              >
                <Send className="size-4" />
              </button>
            </form>
            <button
              onClick={() => toast("Демонстрационный режим: вопрос пока не передаётся сотруднику")}
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary"
            >
              <Headset className="size-3.5" />
              Передать вопрос сотруднику
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 bottom-4 z-50 hidden items-center gap-2 bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-colors hover:bg-accent sm:right-6 sm:inline-flex"
      >
        <MessageSquare className="size-4" />
        Помощник Ранг
      </button>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Помощник Ранг"
          className="fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center bg-primary text-primary-foreground shadow-lift sm:hidden"
        >
          <MessageSquare className="size-5" />
        </button>
      )}
    </>
  );
}

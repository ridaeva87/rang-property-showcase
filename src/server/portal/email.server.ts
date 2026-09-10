const APP_URL = (process.env["APP_URL"] || "https://rangpro.ru").replace(/\/$/, "");

export async function sendAccessEmail(input: { email: string; name: string; token: string; purpose: "activation" | "password_reset" }) {
  const key = process.env["EMAIL_API_KEY"];
  const from = process.env["EMAIL_FROM"];
  if (!key || !from) return false;
  const reset = input.purpose === "password_reset";
  const url = `${APP_URL}${reset ? "/account/reset-password" : "/account/activate"}?token=${encodeURIComponent(input.token)}`;
  const subject = reset ? "Восстановление доступа RANG" : "Активация личного кабинета RANG";
  const action = reset ? "Установить новый пароль" : "Активировать кабинет";
  const response = await fetch(process.env["EMAIL_API_URL"] || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.email], subject,
      text: `${input.name}, ${action.toLowerCase()}: ${url}\nСсылка одноразовая и имеет ограниченный срок действия.`,
      html: `<p>${input.name},</p><p><a href="${url}">${action}</a></p><p>Ссылка одноразовая и имеет ограниченный срок действия.</p>` }),
  });
  return response.ok;
}

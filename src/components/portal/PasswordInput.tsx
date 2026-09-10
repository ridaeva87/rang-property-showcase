import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><input {...props} type={visible ? "text" : "password"} className={`${props.className || ""} pr-11`} /><button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Скрыть пароль" : "Показать пароль"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{visible ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div>;
}

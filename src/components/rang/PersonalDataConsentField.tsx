export function PersonalDataConsentField({ className = "" }: { className?: string }) {
  return (
    <label className={`flex items-start gap-3 text-xs leading-5 text-muted-foreground ${className}`}>
      <input
        type="checkbox"
        name="personalDataConsent"
        required
        className="mt-1 size-4 shrink-0 accent-primary"
      />
      <span>
        Я даю согласие на обработку персональных данных и подтверждаю, что ознакомлен(а) с{" "}
        <a href="/personal-data-consent" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
          согласием на обработку персональных данных
        </a>{" "}
        и{" "}
        <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
          политикой конфиденциальности
        </a>.
      </span>
    </label>
  );
}

export const CONSENT_CONTACT_EMAIL = "zaorang@mail.ru";

// Technical identifier of the consent document currently published at
// /personal-data-consent. It is stored with each public-form consent record.
export const PERSONAL_DATA_CONSENT_VERSION = "personal-data-consent-v1";

export function requirePersonalDataConsent(accepted: boolean | undefined, source: string) {
  if (accepted !== true) throw new Error("Подтвердите согласие на обработку персональных данных");
  return { source, legalTextVersion: PERSONAL_DATA_CONSENT_VERSION };
}

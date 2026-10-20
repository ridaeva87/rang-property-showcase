export type CredentialFailureReason =
  | "account_not_found"
  | "inactive_account"
  | "password_mismatch";

export type LoginFailureReason =
  | CredentialFailureReason
  | "validation_error"
  | "technical_failure";

export type PublicLoginError = "invalid_credentials" | "validation_error" | "technical_error";

export class AuthenticationError extends Error {
  constructor(readonly reason: CredentialFailureReason | string) {
    super("Неверный логин или пароль");
    this.name = "AuthenticationError";
  }
}

export function recordLoginFailure(reason: LoginFailureReason) {
  const message = `[auth.login] отказ reason=${reason}`;
  if (reason === "technical_failure") console.error(message);
  else console.warn(message);
}

export function publicLoginError(error: unknown): PublicLoginError {
  return error instanceof AuthenticationError ? "invalid_credentials" : "technical_error";
}

export function loginErrorMessage(error: PublicLoginError) {
  if (error === "invalid_credentials") return "Неверный логин или пароль";
  if (error === "validation_error") return "Проверьте правильность заполнения email и пароля";
  return "Не удалось выполнить вход. Попробуйте ещё раз позднее";
}

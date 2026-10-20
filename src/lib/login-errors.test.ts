import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  loginErrorMessage,
  publicLoginError,
  recordLoginFailure,
} from "./login-errors";

describe("login error handling", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows invalid credentials only for an authentication rejection", () => {
    expect(publicLoginError(new AuthenticationError("password_mismatch"))).toBe(
      "invalid_credentials",
    );
    expect(loginErrorMessage("invalid_credentials")).toBe("Неверный логин или пароль");
  });

  it("separates validation and technical errors from invalid credentials", () => {
    expect(publicLoginError(new Error("database unavailable"))).toBe("technical_error");
    expect(loginErrorMessage("validation_error")).toContain("Проверьте правильность");
    expect(loginErrorMessage("technical_error")).toContain("Попробуйте ещё раз позднее");
  });

  it.each(["account_not_found", "inactive_account", "password_mismatch", "validation_error"] as const)(
    "logs the safe refusal category %s without account data",
    (reason) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      recordLoginFailure(reason);
      expect(warn).toHaveBeenCalledWith(`[auth.login] отказ reason=${reason}`);
      expect(String(warn.mock.calls[0]?.[0])).not.toMatch(/@|password_hash|token/i);
    },
  );

  it("logs a technical failure without the original exception or submitted values", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    recordLoginFailure("technical_failure");
    expect(error).toHaveBeenCalledWith("[auth.login] отказ reason=technical_failure");
    expect(error.mock.calls[0]).toHaveLength(1);
  });
});

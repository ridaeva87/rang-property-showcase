import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string | null) {
  if (!encoded) return false;
  const [algorithm, salt, value] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !value) return false;
  const expected = Buffer.from(value, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function publicRequestStatus(code: string, isClosed = false) {
  if (isClosed || ["completed", "done", "closed", "resolved"].includes(code)) return "Выполнено";
  if (["in_progress", "assigned", "waiting", "processing"].includes(code)) return "В работе";
  return "Принято";
}

export function validatePassword(password: string) {
  if (password.length < 12 || !/[a-zа-я]/i.test(password) || !/\d/.test(password)) {
    throw new Error("Пароль должен содержать не менее 12 символов, буквы и цифры");
  }
}

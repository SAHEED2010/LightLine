import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const SESSION_COOKIE = "lightline_operator";
export const SESSION_SECONDS = 8 * 60 * 60;

export function equalSecret(value: string, expected: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(value).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`lightline-operator-v1:${payload}`)
    .digest("base64url");
}

export function createSession(secret: string, now = Date.now()): string {
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function validSession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): boolean {
  if (!token || token.length > 200) return false;
  const parts = token.split(".");
  if (
    parts.length !== 3 ||
    !/^\d{10,11}$/.test(parts[0]) ||
    !/^[\w-]{32}$/.test(parts[1]) ||
    !/^[\w-]{43}$/.test(parts[2])
  )
    return false;
  const expiry = Number(parts[0]);
  const current = Math.floor(now / 1000);
  return (
    expiry > current &&
    expiry <= current + SESSION_SECONDS &&
    equalSecret(parts[2], sign(`${parts[0]}.${parts[1]}`, secret))
  );
}

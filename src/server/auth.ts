import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOperatorSecret, getToolSecret } from "./env";
import { AppError } from "./http";
import { equalSecret, SESSION_COOKIE, validSession } from "./session";

export function requireTool(request: Request): void {
  const value = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!value || value.length > 512)
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "A valid tool credential is required.",
    );
  if (!equalSecret(value, getToolSecret()))
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "A valid tool credential is required.",
    );
}

export function requireOperator(request: Request): void {
  const matches = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((value) => value.trim())
    .filter((value) => value.startsWith(`${SESSION_COOKIE}=`));
  const token =
    matches.length === 1
      ? matches[0].slice(SESSION_COOKIE.length + 1)
      : undefined;
  if (!token)
    throw new AppError(401, "UNAUTHORIZED", "Sign in to operator access.");
  if (!validSession(token, getOperatorSecret()))
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Your session has expired. Sign in again.",
    );
}

export function requireSameOrigin(request: Request): void {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "This request must come from the LightLine application.",
    );
  }
}

export async function requireOperatorPage(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/operator/login");
  if (!validSession(token, getOperatorSecret())) redirect("/operator/login");
}

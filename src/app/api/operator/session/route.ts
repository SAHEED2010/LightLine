import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin } from "@/server/auth";
import { getOperatorSecret } from "@/server/env";
import { apiError, AppError, readJson } from "@/server/http";
import {
  createSession,
  equalSecret,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from "@/server/session";

export const runtime = "nodejs";
const input = z.object({ secret: z.string().min(1).max(512) }).strict();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const { secret } = input.parse(await readJson(request));
    const expected = getOperatorSecret();
    if (!equalSecret(secret, expected))
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "The operator access secret is incorrect.",
      );
    const response = NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, createSession(expected), {
      ...cookieOptions,
      maxAge: SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    const response = NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return response;
  } catch (error) {
    return apiError(error);
  }
}

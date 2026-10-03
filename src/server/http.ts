import "server-only";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function apiError(error: unknown): Response {
  if (error instanceof AppError)
    return json(
      { success: false, error: { code: error.code, message: error.message } },
      error.status,
    );
  if (error instanceof ZodError)
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Check the required fields and use supported values.",
        },
      },
      400,
    );
  // Never log request bodies, credentials, or raw database/provider errors.
  console.error("LightLine request failed", {
    kind: error instanceof Error ? error.name : "UnknownError",
  });
  return json(
    {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "The request could not be completed. Please try again.",
      },
    },
    503,
  );
}

export async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    throw new AppError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Send an application/json request.",
    );
  }
  const maxBytes = 16_384;
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(400, "INVALID_JSON", "Send a JSON request body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new AppError(
          413,
          "PAYLOAD_TOO_LARGE",
          "The request body is too large.",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(400, "INVALID_JSON", "Send a valid JSON request body.");
  }
}

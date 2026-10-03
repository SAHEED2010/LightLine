// Temporary protected Preview endpoint for a lost-response idempotency test.
// Remove this route immediately after the test; it must not reach main.
import { createComplaintSchema } from "@/domain/complaints";
import { requireTool } from "@/server/auth";
import { createComplaint } from "@/server/complaints";
import { apiError, AppError, json, readJson } from "@/server/http";

export async function POST(request: Request) {
  try {
    requireTool(request);
    const key = request.headers.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(key))
      throw new AppError(
        400,
        "INVALID_IDEMPOTENCY_KEY",
        "A valid idempotency key is required.",
      );
    const parsed = createComplaintSchema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new AppError(400, "VALIDATION_ERROR", "Complaint input is invalid.");
    const result = await createComplaint(parsed.data, key);
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    return json(
      {
        success: true,
        complaint: {
          ticketId: result.complaint.ticketId,
          status: result.complaint.status,
        },
        replayed: result.replayed,
      },
      result.replayed ? 200 : 201,
    );
  } catch (error) {
    return apiError(error);
  }
}

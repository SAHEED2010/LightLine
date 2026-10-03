import { z } from "zod";
import {
  complaintCategories,
  complaintStatuses,
  createComplaintSchema,
} from "@/domain/complaints";
import { createComplaint, listComplaints } from "@/server/complaints";
import { requireOperator, requireTool } from "@/server/auth";
import { apiError, json, readJson, AppError } from "@/server/http";

const querySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(25).default(25),
    category: z.enum(complaintCategories).optional(),
    status: z.enum(complaintStatuses).optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    requireTool(request);
    const key = request.headers.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(key))
      throw new AppError(
        400,
        "INVALID_IDEMPOTENCY_KEY",
        "Use an Idempotency-Key of 8–128 letters, digits, periods, underscores, colons, or hyphens.",
      );
    const parsed = createComplaintSchema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Complaint input is invalid.",
      );
    const result = await createComplaint(parsed.data, key);
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

export async function GET(request: Request) {
  try {
    requireOperator(request);
    const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = querySchema.safeParse(raw);
    if (!parsed.success)
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Complaint query is invalid.",
      );
    const result = await listComplaints(parsed.data);
    return json({ success: true, ...result });
  } catch (error) {
    return apiError(error);
  }
}

import { z } from "zod";
import { complaintStatuses } from "@/domain/complaints";
import { getComplaint, updateComplaintStatus } from "@/server/complaints";
import { requireOperator, requireSameOrigin } from "@/server/auth";
import { apiError, json, readJson, AppError } from "@/server/http";

type RouteContext = { params: Promise<{ ticketId: string }> };
const ticketIdSchema = z.string().regex(/^LL-\d{4,}$/);

export async function GET(request: Request, context: RouteContext) {
  try {
    requireOperator(request);
    const { ticketId } = await context.params;
    if (!ticketIdSchema.safeParse(ticketId).success)
      throw new AppError(
        400,
        "INVALID_TICKET_ID",
        "Ticket reference is invalid.",
      );
    const complaint = await getComplaint(ticketId);
    if (!complaint)
      throw new AppError(404, "NOT_FOUND", "Complaint was not found.");
    return json({ success: true, complaint });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    requireOperator(request);
    requireSameOrigin(request);
    const { ticketId } = await context.params;
    if (!ticketIdSchema.safeParse(ticketId).success)
      throw new AppError(
        400,
        "INVALID_TICKET_ID",
        "Ticket reference is invalid.",
      );
    const body = z
      .object({ status: z.enum(complaintStatuses) })
      .strict()
      .safeParse(await readJson(request));
    if (!body.success)
      throw new AppError(400, "VALIDATION_ERROR", "Status update is invalid.");
    const complaint = await updateComplaintStatus(ticketId, body.data.status);
    if (!complaint)
      throw new AppError(404, "NOT_FOUND", "Complaint was not found.");
    return json({ success: true, complaint });
  } catch (error) {
    return apiError(error);
  }
}

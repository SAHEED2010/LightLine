import { z } from "zod";

export const complaintCategories = [
  "METER",
  "BILLING",
  "SERVICE_INTERRUPTION",
  "DISCONNECTION",
  "VOLTAGE",
  "DELAY",
  "OTHER",
] as const;
export const complaintStatuses = [
  "OPEN",
  "REVIEWING",
  "RESOLVED",
  "ESCALATED",
] as const;
export const complaintPriorities = ["NORMAL", "HIGH", "LOW"] as const;
export const complaintSources = ["VOICE", "OPERATOR", "DEMO"] as const;

const boundedText = (max: number) => z.string().trim().min(1).max(max);
const optionalBoundedText = (max: number, field: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string" &&
      (value.trim() === "" || value.trim() === `{{${field}}}`)
        ? undefined
        : value,
    boundedText(max).optional(),
  );
export const createComplaintSchema = z
  .object({
    category: z.enum(complaintCategories),
    description: boundedText(4000),
    location: boundedText(500),
    callerPhone: optionalBoundedText(32, "callerPhone"),
    customerAccount: optionalBoundedText(100, "customerAccount"),
    meterNumber: optionalBoundedText(100, "meterNumber"),
    providerCallId: optionalBoundedText(200, "providerCallId"),
    source: z.enum(complaintSources).default("VOICE"),
    priority: z.enum(complaintPriorities).default("NORMAL"),
  })
  .strict();

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type ComplaintCategory = (typeof complaintCategories)[number];
export type ComplaintStatus = (typeof complaintStatuses)[number];
export type ComplaintPriority = (typeof complaintPriorities)[number];
export type ComplaintSource = (typeof complaintSources)[number];

export interface Complaint {
  id: string;
  ticketId: string;
  callerPhone: string | null;
  customerAccount: string | null;
  meterNumber: string | null;
  category: ComplaintCategory;
  description: string;
  location: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  source: ComplaintSource;
  providerCallId: string | null;
  createdAt: string;
  updatedAt: string;
}

import { createHash } from "node:crypto";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { AppError } from "@/server/http";
import {
  type Complaint,
  type ComplaintStatus,
  type CreateComplaintInput,
  complaintStatuses,
} from "@/domain/complaints";
import { getDb } from "@/db";
import { complaints } from "@/db/schema";

function toComplaint(row: typeof complaints.$inferSelect): Complaint {
  return {
    id: row.id,
    ticketId: row.ticketId,
    callerPhone: row.callerPhone,
    customerAccount: row.customerAccount,
    meterNumber: row.meterNumber,
    category: row.category,
    description: row.description,
    location: row.location,
    priority: row.priority,
    status: row.status,
    source: row.source,
    providerCallId: row.providerCallId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function canonicalPayloadHash(input: CreateComplaintInput): string {
  const canonical = JSON.stringify({
    category: input.category,
    description: input.description,
    location: input.location,
    callerPhone: input.callerPhone ?? null,
    customerAccount: input.customerAccount ?? null,
    meterNumber: input.meterNumber ?? null,
    providerCallId: input.providerCallId ?? null,
    source: input.source,
    priority: input.priority,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export async function createComplaint(
  input: CreateComplaintInput,
  idempotencyKey: string,
): Promise<{ complaint: Complaint; replayed: boolean }> {
  const hash = canonicalPayloadHash(input);
  const db = getDb();
  const inserted = await db
    .insert(complaints)
    .values({
      idempotencyKey,
      requestHash: hash,
      callerPhone: input.callerPhone ?? null,
      customerAccount: input.customerAccount ?? null,
      meterNumber: input.meterNumber ?? null,
      category: input.category,
      description: input.description,
      location: input.location,
      priority: input.priority,
      source: input.source,
      providerCallId: input.providerCallId ?? null,
    })
    .onConflictDoNothing({ target: complaints.idempotencyKey })
    .returning();
  if (inserted[0])
    return { complaint: toComplaint(inserted[0]), replayed: false };

  const existing = await db
    .select()
    .from(complaints)
    .where(eq(complaints.idempotencyKey, idempotencyKey))
    .limit(1);
  if (!existing[0])
    throw new AppError(
      503,
      "PERSISTENCE_CONFLICT",
      "Could not confirm complaint creation. Retry with the same idempotency key.",
    );
  if (existing[0].requestHash !== hash)
    throw new AppError(
      409,
      "IDEMPOTENCY_CONFLICT",
      "This idempotency key was already used for a different complaint.",
    );
  return { complaint: toComplaint(existing[0]), replayed: true };
}

export interface ComplaintListOptions {
  page: number;
  pageSize: number;
  category?: Complaint["category"];
  status?: ComplaintStatus;
}
export async function listComplaints(options: ComplaintListOptions) {
  const db = getDb();
  const filters = [];
  if (options.category) filters.push(eq(complaints.category, options.category));
  if (options.status) filters.push(eq(complaints.status, options.status));
  const where = filters.length ? and(...filters) : undefined;
  const [rows, totalRows, statusRows, todayRows] = await Promise.all([
    db
      .select()
      .from(complaints)
      .where(where)
      .orderBy(desc(complaints.createdAt), desc(complaints.ticketNumber))
      .limit(options.pageSize)
      .offset((options.page - 1) * options.pageSize),
    db.select({ total: count() }).from(complaints).where(where),
    db
      .select({ status: complaints.status, total: count() })
      .from(complaints)
      .groupBy(complaints.status),
    db
      .select({ total: count() })
      .from(complaints)
      .where(
        gte(
          complaints.createdAt,
          sql`date_trunc('day', now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos'`,
        ),
      ),
  ]);
  const counts = Object.fromEntries(
    complaintStatuses.map((status) => [status.toLowerCase(), 0]),
  ) as Record<Lowercase<ComplaintStatus>, number>;
  for (const item of statusRows)
    counts[item.status.toLowerCase() as Lowercase<ComplaintStatus>] =
      item.total;
  return {
    complaints: rows.map(toComplaint),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total: totalRows[0]?.total ?? 0,
    },
    overview: {
      open: counts.open,
      reviewing: counts.reviewing,
      resolved: counts.resolved,
      escalated: counts.escalated,
      receivedToday: todayRows[0]?.total ?? 0,
    },
  };
}

export async function getComplaint(
  ticketId: string,
): Promise<Complaint | null> {
  const rows = await getDb()
    .select()
    .from(complaints)
    .where(eq(complaints.ticketId, ticketId))
    .limit(1);
  return rows[0] ? toComplaint(rows[0]) : null;
}

export async function updateComplaintStatus(
  ticketId: string,
  status: ComplaintStatus,
): Promise<Complaint | null> {
  const rows = await getDb()
    .update(complaints)
    .set({ status, updatedAt: new Date() })
    .where(eq(complaints.ticketId, ticketId))
    .returning();
  return rows[0] ? toComplaint(rows[0]) : null;
}

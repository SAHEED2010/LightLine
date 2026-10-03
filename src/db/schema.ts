import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  complaintCategories,
  complaintPriorities,
  complaintSources,
  complaintStatuses,
} from "@/domain/complaints";

export const categoryEnum = pgEnum("complaint_category", complaintCategories);
export const statusEnum = pgEnum("complaint_status", complaintStatuses);
export const priorityEnum = pgEnum("complaint_priority", complaintPriorities);
export const sourceEnum = pgEnum("complaint_source", complaintSources);

export const complaints = pgTable(
  "complaints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketNumber: bigint("ticket_number", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .notNull()
      .unique(),
    ticketId: text("ticket_id")
      .generatedAlwaysAs(
        sql`'LL-' || lpad(ticket_number::text, greatest(4, length(ticket_number::text)), '0')`,
      )
      .notNull()
      .unique(),
    idempotencyKey: varchar("idempotency_key", { length: 128 })
      .notNull()
      .unique(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    callerPhone: varchar("caller_phone", { length: 32 }),
    customerAccount: varchar("customer_account", { length: 100 }),
    meterNumber: varchar("meter_number", { length: 100 }),
    category: categoryEnum("category").notNull(),
    description: text("description").notNull(),
    location: varchar("location", { length: 500 }).notNull(),
    priority: priorityEnum("priority").notNull().default("NORMAL"),
    status: statusEnum("status").notNull().default("OPEN"),
    source: sourceEnum("source").notNull().default("VOICE"),
    providerCallId: varchar("provider_call_id", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("complaints_created_at_idx").on(table.createdAt),
    index("complaints_status_idx").on(table.status),
    check(
      "complaints_description_length",
      sql`char_length(btrim(${table.description})) between 1 and 4000`,
    ),
    check(
      "complaints_location_length",
      sql`char_length(btrim(${table.location})) between 1 and 500`,
    ),
    check(
      "complaints_request_hash_format",
      sql`${table.requestHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "complaints_idempotency_key_format",
      sql`${table.idempotencyKey} ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$'`,
    ),
  ],
);

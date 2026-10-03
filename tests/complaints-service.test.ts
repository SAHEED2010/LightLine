import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";

const dbMock = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/db", () => ({ getDb: dbMock.getDb }));

import {
  createComplaint,
  getComplaint,
  listComplaints,
  updateComplaintStatus,
} from "@/server/complaints";
import { createComplaintSchema } from "@/domain/complaints";

type TestDb = ReturnType<typeof drizzle<typeof schema>>;
let client: PGlite;
let db: TestDb;

const input = (overrides: Record<string, unknown> = {}) =>
  createComplaintSchema.parse({
    category: "BILLING",
    description: "Unexpected charge",
    location: "Ikeja",
    ...overrides,
  });

beforeAll(async () => {
  client = new PGlite();
  await client.waitReady;
  db = drizzle(client, { schema });
  const migrations = (await readdir(join(process.cwd(), "drizzle")))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();
  if (migrations.length === 0)
    throw new Error(
      "Expected generated Drizzle migration before running complaint service tests.",
    );
  for (const migration of migrations)
    await client.exec(
      await readFile(join(process.cwd(), "drizzle", migration), "utf8"),
    );
  dbMock.getDb.mockReturnValue(db);
});

afterAll(async () => {
  await client.close();
});
beforeEach(async () => {
  await client.exec("TRUNCATE TABLE complaints RESTART IDENTITY CASCADE");
});

describe("complaint persistence with PostgreSQL", () => {
  it("inserts a persisted ticket and replays the same payload", async () => {
    const first = await createComplaint(input(), "voice-call-0001");
    const replay = await createComplaint(input(), "voice-call-0001");
    expect(first.replayed).toBe(false);
    expect(first.complaint).toMatchObject({
      ticketId: "LL-0001",
      status: "OPEN",
      source: "VOICE",
      priority: "NORMAL",
    });
    expect(first.complaint.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(first.complaint.createdAt).toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(replay).toEqual({ ...first, replayed: true });
    expect(
      (await listComplaints({ page: 1, pageSize: 25 })).pagination.total,
    ).toBe(1);
  });

  it("persists blank optional tool fields as null and replays an omitted-field payload", async () => {
    const first = await createComplaint(
      input({
        callerPhone: " ",
        customerAccount: "",
        meterNumber: "  \t ",
        providerCallId: " ",
      }),
      "bimpe-call-0008",
    );
    expect(first.complaint).toMatchObject({
      callerPhone: null,
      customerAccount: null,
      meterNumber: null,
      providerCallId: null,
    });
    const replay = await createComplaint(input(), "bimpe-call-0008");
    expect(replay).toEqual({ ...first, replayed: true });
    expect(
      (await getComplaint(first.complaint.ticketId))?.meterNumber,
    ).toBeNull();
  });

  it("rejects idempotency-key reuse with changed data", async () => {
    await createComplaint(input(), "voice-call-0002");
    await expect(
      createComplaint(input({ location: "Lekki" }), "voice-call-0002"),
    ).rejects.toMatchObject({ status: 409, code: "IDEMPOTENCY_CONFLICT" });
    expect(
      (await listComplaints({ page: 1, pageSize: 25 })).pagination.total,
    ).toBe(1);
  });

  it("deduplicates concurrent creates on the same key", async () => {
    const results = await Promise.all([
      createComplaint(input(), "voice-call-0003"),
      createComplaint(input(), "voice-call-0003"),
    ]);
    expect(results.map((result) => result.replayed).sort()).toEqual([
      false,
      true,
    ]);
    expect(results[0].complaint.ticketId).toBe(results[1].complaint.ticketId);
    expect(
      (await listComplaints({ page: 1, pageSize: 25 })).pagination.total,
    ).toBe(1);
  });

  it("generates an untruncated ticket reference beyond 9999", async () => {
    await client.exec(
      "SELECT setval(pg_get_serial_sequence('complaints', 'ticket_number'), 9999, true)",
    );
    const result = await createComplaint(input(), "voice-call-10000");
    expect(result.complaint.ticketId).toBe("LL-10000");
  });

  it("reads, updates, filters, paginates, and reports all-status overview counts", async () => {
    const first = await createComplaint(input(), "voice-call-0004");
    const second = await createComplaint(
      input({ category: "METER", description: "Meter not responding" }),
      "voice-call-0005",
    );
    expect(await getComplaint("LL-9999")).toBeNull();
    const updated = await updateComplaintStatus(
      first.complaint.ticketId,
      "REVIEWING",
    );
    expect(updated?.status).toBe("REVIEWING");
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(first.complaint.updatedAt).getTime(),
    );
    const page = await listComplaints({
      page: 1,
      pageSize: 1,
      category: "METER",
      status: "OPEN",
    });
    expect(page.complaints.map((item) => item.ticketId)).toEqual([
      second.complaint.ticketId,
    ]);
    expect(page.pagination).toEqual({ page: 1, pageSize: 1, total: 1 });
    const all = await listComplaints({ page: 1, pageSize: 25 });
    expect(all.overview).toMatchObject({
      open: 1,
      reviewing: 1,
      resolved: 0,
      escalated: 0,
      receivedToday: 2,
    });
    expect(all.complaints).toHaveLength(2);
  });

  it("enforces database-level bounds and enums", async () => {
    await expect(
      db.insert(schema.complaints).values({
        idempotencyKey: "voice-call-0006",
        requestHash: "x".repeat(64),
        category: "BILLING",
        description: "   ",
        location: "Ikeja",
      }),
    ).rejects.toThrow();
    await expect(
      db.insert(schema.complaints).values({
        idempotencyKey: "voice-call-0007",
        requestHash: "a".repeat(64),
        category: "BILLING",
        description: "Valid description",
        location: "Ikeja",
        priority: "INVALID" as "NORMAL",
      }),
    ).rejects.toThrow();
  });
});

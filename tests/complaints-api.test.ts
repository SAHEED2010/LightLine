import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createComplaint: vi.fn(),
  listComplaints: vi.fn(),
  getComplaint: vi.fn(),
  updateComplaintStatus: vi.fn(),
  requireTool: vi.fn(),
  requireOperator: vi.fn(),
  requireSameOrigin: vi.fn(),
}));
vi.mock("@/server/complaints", () => ({
  createComplaint: mocks.createComplaint,
  listComplaints: mocks.listComplaints,
  getComplaint: mocks.getComplaint,
  updateComplaintStatus: mocks.updateComplaintStatus,
}));
vi.mock("@/server/auth", () => ({
  requireTool: mocks.requireTool,
  requireOperator: mocks.requireOperator,
  requireSameOrigin: mocks.requireSameOrigin,
}));

import { GET, POST } from "@/app/api/complaints/route";
import {
  GET as getByTicket,
  PATCH,
} from "@/app/api/complaints/[ticketId]/route";
import { AppError } from "@/server/http";

describe("complaint API handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  const payload = {
    category: "METER",
    description: "Stopped accepting tokens",
    location: "Yaba",
  };

  it("validates the tool payload before asking the service to persist", async () => {
    const response = await POST(
      new Request("http://local/api/complaints", {
        method: "POST",
        headers: {
          "Idempotency-Key": "call-test-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "METER",
          description: "",
          location: "Yaba",
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.requireTool).toHaveBeenCalledOnce();
    expect(mocks.createComplaint).not.toHaveBeenCalled();
  });

  it("requires idempotency and returns only the confirmed ticket result", async () => {
    mocks.createComplaint.mockResolvedValue({
      complaint: { ticketId: "LL-0001", status: "OPEN" },
      replayed: true,
    });
    const response = await POST(
      new Request("http://local/api/complaints", {
        method: "POST",
        headers: {
          "Idempotency-Key": "call-test-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "METER",
          description: "Stopped accepting tokens",
          location: "Yaba",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      complaint: { ticketId: "LL-0001", status: "OPEN" },
      replayed: true,
    });
    expect(mocks.createComplaint).toHaveBeenCalledOnce();
    expect(mocks.createComplaint.mock.calls[0]?.[1]).toBe("call-test-1");
  });

  it("returns 201 for a newly persisted ticket and never reports success on persistence failure", async () => {
    mocks.createComplaint.mockResolvedValueOnce({
      complaint: { ticketId: "LL-0002", status: "OPEN" },
      replayed: false,
    });
    const created = await POST(
      new Request("http://local/api/complaints", {
        method: "POST",
        headers: {
          "Idempotency-Key": "voice-call-0002",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    );
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      success: true,
      complaint: { ticketId: "LL-0002" },
      replayed: false,
    });

    mocks.createComplaint.mockRejectedValueOnce(
      new Error("database unavailable"),
    );
    const failed = await POST(
      new Request("http://local/api/complaints", {
        method: "POST",
        headers: {
          "Idempotency-Key": "voice-call-0003",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    );
    expect(failed.status).toBe(503);
    const failureBody = await failed.json();
    expect(failureBody).toMatchObject({
      success: false,
      error: { code: "SERVICE_UNAVAILABLE" },
    });
    expect(JSON.stringify(failureBody)).not.toContain("database unavailable");
  });

  it("rejects absent and malformed idempotency keys and denied tool credentials", async () => {
    const request = (key?: string) =>
      new Request("http://local/api/complaints", {
        method: "POST",
        headers: {
          ...(key ? { "Idempotency-Key": key } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    expect((await POST(request())).status).toBe(400);
    expect((await POST(request("short"))).status).toBe(400);
    mocks.requireTool.mockImplementationOnce(() => {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    });
    expect((await POST(request("voice-call-0004"))).status).toBe(401);
    expect(mocks.createComplaint).not.toHaveBeenCalled();
  });

  it("bounds operator pagination and rejects invalid filters", async () => {
    const response = await GET(
      new Request("http://local/api/complaints?pageSize=26"),
    );
    expect(response.status).toBe(400);
    expect(mocks.requireOperator).toHaveBeenCalledOnce();
    expect(mocks.listComplaints).not.toHaveBeenCalled();
  });

  it("returns operator list data after authorization", async () => {
    const data = {
      complaints: [],
      pagination: { page: 2, pageSize: 10, total: 0 },
      overview: {
        open: 0,
        reviewing: 0,
        resolved: 0,
        escalated: 0,
        receivedToday: 0,
      },
    };
    mocks.listComplaints.mockResolvedValue(data);
    const response = await GET(
      new Request("http://local/api/complaints?page=2&pageSize=10&status=OPEN"),
    );
    expect(response.status).toBe(200);
    expect(mocks.listComplaints).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      status: "OPEN",
    });
    expect(await response.json()).toMatchObject({
      success: true,
      pagination: data.pagination,
    });
  });

  it("serves detail, validates status updates and requires same origin", async () => {
    const complaint = { ticketId: "LL-0042", status: "OPEN" };
    mocks.getComplaint.mockResolvedValue(complaint);
    expect(
      (
        await getByTicket(new Request("http://local/api/complaints/LL-0042"), {
          params: Promise.resolve({ ticketId: "LL-0042" }),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await getByTicket(new Request("http://local/api/complaints/nope"), {
          params: Promise.resolve({ ticketId: "nope" }),
        })
      ).status,
    ).toBe(400);

    const ctx = { params: Promise.resolve({ ticketId: "LL-0042" }) };
    const bad = await PATCH(
      new Request("http://local/api/complaints/LL-0042", {
        method: "PATCH",
        headers: { origin: "http://local", "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      }),
      ctx,
    );
    expect(bad.status).toBe(400);
    expect(mocks.updateComplaintStatus).not.toHaveBeenCalled();

    mocks.updateComplaintStatus.mockResolvedValue({
      ...complaint,
      status: "REVIEWING",
    });
    const updated = await PATCH(
      new Request("http://local/api/complaints/LL-0042", {
        method: "PATCH",
        headers: { origin: "http://local", "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVIEWING" }),
      }),
      ctx,
    );
    expect(updated.status).toBe(200);
    expect(mocks.updateComplaintStatus).toHaveBeenCalledWith(
      "LL-0042",
      "REVIEWING",
    );
  });

  it("rejects cross-origin and unauthorized status mutations", async () => {
    const ctx = { params: Promise.resolve({ ticketId: "LL-0042" }) };
    mocks.requireSameOrigin.mockImplementationOnce(() => {
      throw new AppError(403, "FORBIDDEN", "Forbidden");
    });
    const crossOrigin = await PATCH(
      new Request("http://local/api/complaints/LL-0042", {
        method: "PATCH",
        headers: { origin: "http://other", "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      }),
      ctx,
    );
    expect(crossOrigin.status).toBe(403);
    mocks.requireOperator.mockImplementationOnce(() => {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    });
    const denied = await PATCH(
      new Request("http://local/api/complaints/LL-0042", {
        method: "PATCH",
        headers: { origin: "http://local", "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      }),
      ctx,
    );
    expect(denied.status).toBe(401);
    expect(mocks.updateComplaintStatus).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireOperator, requireSameOrigin, requireTool } from "@/server/auth";
import { createSession, SESSION_COOKIE, validSession } from "@/server/session";
import { POST, DELETE } from "@/app/api/operator/session/route";

const operator = "test-only-operator-secret-32-characters-long";
const tool = "test-only-tool-secret-32-characters-long";
beforeEach(() => {
  vi.stubEnv("OPERATOR_ACCESS_SECRET", operator);
  vi.stubEnv("LIGHTLINE_TOOL_API_KEY", tool);
});
afterEach(() => vi.unstubAllEnvs());

describe("operator session boundary", () => {
  it("rejects expired, altered, malformed and rotated-secret sessions", () => {
    const now = 1_790_000_000_000;
    const token = createSession(operator, now);
    expect(validSession(token, operator, now)).toBe(true);
    expect(validSession(token, operator, now + 8 * 60 * 60 * 1000)).toBe(false);
    expect(validSession(token, tool, now)).toBe(false);
    expect(validSession(token.replace(/^./, "9"), operator, now)).toBe(false);
    expect(validSession("malformed", operator, now)).toBe(false);
  });
  it("accepts operator cookies and rejects bearer credentials for operator reads", () => {
    expect(() =>
      requireOperator(
        new Request("http://localhost/api/complaints", {
          headers: { cookie: `${SESSION_COOKIE}=${createSession(operator)}` },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      requireOperator(
        new Request("http://localhost/api/complaints", {
          headers: { authorization: `Bearer ${tool}` },
        }),
      ),
    ).toThrow();
  });
  it("rejects unauthenticated and cross-origin mutations", () => {
    expect(() =>
      requireTool(new Request("http://localhost/api/complaints")),
    ).toThrow();
    expect(() =>
      requireTool(
        new Request("http://localhost/api/complaints", {
          headers: { authorization: "Bearer incorrect" },
        }),
      ),
    ).toThrow();
    expect(() =>
      requireTool(
        new Request("http://localhost/api/complaints", {
          headers: { authorization: `Bearer ${tool}` },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      requireSameOrigin(
        new Request("http://localhost/api/complaints", {
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toThrow();
    expect(() =>
      requireSameOrigin(new Request("http://localhost/api/complaints")),
    ).toThrow();
  });
  it("creates a private cookie without returning a credential in JSON, and clears it on logout", async () => {
    const response = await POST(
      new Request("http://localhost/api/operator/session", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({ secret: operator }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const logout = await DELETE(
      new Request("http://localhost/api/operator/session", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
    );
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
  });
  it("does not issue a session for incorrect credentials", async () => {
    const response = await POST(
      new Request("http://localhost/api/operator/session", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({ secret: "wrong" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

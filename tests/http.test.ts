import { describe, expect, it, vi } from "vitest";
import { apiError, readJson } from "@/server/http";

describe("request and failure boundaries", () => {
  it("rejects malformed JSON, oversized requests, and incorrect media types", async () => {
    await expect(
      readJson(
        new Request("http://local", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readJson(
        new Request("http://local", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "x".repeat(16_385),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      readJson(new Request("http://local", { method: "POST", body: "{}" })),
    ).rejects.toMatchObject({ status: 415 });
  });
  it("never exposes raw database errors, secrets, or success on failure", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = apiError(
      new Error("postgresql://private-password@host/database SQL failure"),
    );
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(JSON.stringify(body)).not.toContain("private-password");
    expect(body).not.toHaveProperty("complaint");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-password");
  });
});

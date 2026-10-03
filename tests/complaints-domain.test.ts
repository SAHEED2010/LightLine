import { describe, expect, it } from "vitest";
import { createComplaintSchema } from "@/domain/complaints";

describe("complaint domain input", () => {
  const valid = {
    category: "METER",
    description: "Meter stopped accepting tokens",
    location: "Yaba",
  };

  it("applies trusted defaults and accepts only the declared shape", () => {
    expect(createComplaintSchema.parse(valid)).toMatchObject({
      source: "VOICE",
      priority: "NORMAL",
    });
    expect(
      createComplaintSchema.safeParse({ ...valid, status: "RESOLVED" }).success,
    ).toBe(false);
    expect(
      createComplaintSchema.safeParse({ ...valid, unexpected: true }).success,
    ).toBe(false);
  });

  it("rejects missing, blank, overlong, and unsupported values", () => {
    expect(
      createComplaintSchema.safeParse({ ...valid, location: " " }).success,
    ).toBe(false);
    expect(
      createComplaintSchema.safeParse({
        ...valid,
        description: "x".repeat(4001),
      }).success,
    ).toBe(false);
    expect(
      createComplaintSchema.safeParse({ ...valid, category: "POWER" }).success,
    ).toBe(false);
    expect(
      createComplaintSchema.safeParse({
        description: valid.description,
        location: valid.location,
      }).success,
    ).toBe(false);
  });
});

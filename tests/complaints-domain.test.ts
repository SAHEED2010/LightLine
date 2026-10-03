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

  it("treats blank optional complaint details as absent without weakening validation", () => {
    const optionalFields = [
      ["callerPhone", 32],
      ["customerAccount", 100],
      ["meterNumber", 100],
      ["providerCallId", 200],
    ] as const;

    for (const [field, maxLength] of optionalFields) {
      expect(createComplaintSchema.parse(valid)[field]).toBeUndefined();
      expect(
        createComplaintSchema.parse({ ...valid, [field]: "  \t " })[field],
      ).toBeUndefined();
      expect(
        createComplaintSchema.parse({ ...valid, [field]: "  AB-123  " })[field],
      ).toBe("AB-123");
      expect(
        createComplaintSchema.safeParse({
          ...valid,
          [field]: "x".repeat(maxLength + 1),
        }).success,
      ).toBe(false);
      expect(
        createComplaintSchema.safeParse({ ...valid, [field]: 42 }).success,
      ).toBe(false);
    }
  });
});

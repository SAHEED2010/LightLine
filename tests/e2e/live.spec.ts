import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("Neon: authenticated call payload persists once, appears in dashboard, and updates", async ({
  page,
  request,
}) => {
  test.skip(
    process.env.LIGHTLINE_E2E_DATABASE !== "1",
    "Opt in against the dedicated development database with LIGHTLINE_E2E_DATABASE=1.",
  );
  const key = `e2e-${randomUUID()}`;
  const payload = {
    category: "METER",
    description: "FICTIONAL VERIFICATION — Meter stopped accepting tokens",
    location: "Yaba, Lagos (test)",
    meterNumber: "DEMO-45001234",
    source: "DEMO",
  };
  const headers = {
    Authorization: "Bearer e2e-only-tool-secret-not-for-deployment",
    "Idempotency-Key": key,
  };
  const responses = await Promise.all(
    Array.from({ length: 8 }, () =>
      request.post("/api/complaints", { headers, data: payload }),
    ),
  );
  expect(responses.filter((r) => r.status() === 201)).toHaveLength(1);
  expect(responses.filter((r) => r.status() === 200)).toHaveLength(7);
  const bodies = await Promise.all(responses.map((r) => r.json()));
  const tickets = new Set(bodies.map((body) => body.complaint.ticketId));
  expect(tickets.size).toBe(1);
  const ticket = bodies[0].complaint.ticketId as string;
  expect(ticket).toMatch(/^LL-\d{4,}$/);
  expect(
    (
      await request.post("/api/complaints", {
        headers,
        data: { ...payload, location: "Different" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/complaints", {
        headers,
        data: { ...payload, category: "INVALID" },
      })
    ).status(),
  ).toBe(400);
  const unique = await Promise.all(
    Array.from({ length: 6 }, () =>
      request.post("/api/complaints", {
        headers: { ...headers, "Idempotency-Key": `e2e-${randomUUID()}` },
        data: payload,
      }),
    ),
  );
  expect(unique.every((r) => r.status() === 201)).toBe(true);
  const uniqueBodies = await Promise.all(unique.map((r) => r.json()));
  expect(new Set(uniqueBodies.map((b) => b.complaint.ticketId)).size).toBe(6);
  await page.goto("/operator/login");
  await page
    .getByLabel("Operator credential", { exact: true })
    .fill("e2e-only-operator-secret-not-for-deployment");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("link", { name: ticket, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: ticket, exact: true }).click();
  await expect(
    page.getByText(payload.meterNumber, { exact: true }),
  ).toBeVisible();
  await page.getByLabel("New status").selectOption("REVIEWING");
  await page.getByRole("button", { name: "Save status" }).click();
  await expect(page.getByRole("status")).toContainText("Status saved");
  const saved = await page.request.get(`/api/complaints/${ticket}`);
  expect((await saved.json()).complaint.status).toBe("REVIEWING");
  expect(
    (
      await page.request.patch(`/api/complaints/${ticket}`, {
        headers: { Origin: "http://localhost:3100" },
        data: { status: "INVALID" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.patch(`/api/complaints/${ticket}`, {
        headers: { Origin: "https://attacker.example" },
        data: { status: "RESOLVED" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await page.request.get("/api/complaints/LL-99999999999999999")).status(),
  ).toBe(404);
});

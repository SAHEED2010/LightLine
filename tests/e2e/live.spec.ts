import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";

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
    description: `FICTIONAL VERIFICATION — Meter stopped accepting tokens (${randomUUID()})`,
    location: "Yaba, Lagos (test)",
    meterNumber: "DEMO-45001234",
    source: "DEMO",
  };
  const headers = {
    Authorization: "Bearer e2e-only-tool-secret-not-for-deployment",
    "Idempotency-Key": key,
  };
  let persistedTicketId: string | undefined;
  // Forward the first request to LightLine, then drop its successful response
  // before the caller receives it to model a real lost-response retry.
  const lostResponseProxy = createServer((incoming, outgoing) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
      const upstream = await fetch("http://localhost:3100/api/complaints", {
        method: "POST",
        headers: {
          Authorization: headers.Authorization,
          "Content-Type": "application/json",
          "Idempotency-Key": headers["Idempotency-Key"],
        },
        body: Buffer.concat(chunks),
      });
      const upstreamBody = await upstream.json();
      if (upstream.status !== 201 || !upstreamBody.complaint?.ticketId)
        throw new Error("The forwarded test request did not persist a ticket.");
      persistedTicketId = upstreamBody.complaint.ticketId;
      outgoing.destroy();
    })().catch(() => outgoing.destroy());
  });
  lostResponseProxy.listen(0, "127.0.0.1");
  await once(lostResponseProxy, "listening");
  const proxyAddress = lostResponseProxy.address();
  if (!proxyAddress || typeof proxyAddress === "string")
    throw new Error("Lost-response proxy did not bind to a TCP port.");
  try {
    await expect(
      fetch(`http://127.0.0.1:${proxyAddress.port}/api/complaints`, {
        method: "POST",
        headers: {
          Authorization: headers.Authorization,
          "Content-Type": "application/json",
          "Idempotency-Key": headers["Idempotency-Key"],
        },
        body: JSON.stringify(payload),
      }),
    ).rejects.toThrow();
  } finally {
    await new Promise<void>((resolve, reject) =>
      lostResponseProxy.close((error) => (error ? reject(error) : resolve())),
    );
  }
  const replay = await request.post("/api/complaints", {
    headers,
    data: payload,
  });
  expect(replay.status()).toBe(200);
  const replayed = await replay.json();
  expect(replayed.replayed).toBe(true);
  expect(replayed.complaint.ticketId).toBe(persistedTicketId);
  const ticket = replayed.complaint.ticketId as string;
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

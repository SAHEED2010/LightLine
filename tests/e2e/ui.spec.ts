import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const complaint = {
  id: "fictional-complaint",
  ticketId: "LL-0193",
  category: "METER",
  description: "FICTIONAL DEMO — Prepaid meter stopped accepting tokens.",
  location: "Yaba, Lagos",
  meterNumber: "DEMO-45001234",
  callerPhone: null,
  customerAccount: null,
  priority: "NORMAL",
  status: "OPEN",
  source: "DEMO",
  providerCallId: null,
  createdAt: "2026-10-03T08:00:00.000Z",
  updatedAt: "2026-10-03T08:00:00.000Z",
};
async function login(page: Page) {
  await page.goto("/operator/login");
  await page
    .getByLabel("Operator credential", { exact: true })
    .fill("e2e-only-operator-secret-not-for-deployment");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function accessibility(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
}

test("landing page is accessible, specific, and fits a small screen", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Get a ticket",
  );
  await accessibility(page);
  await page.screenshot({
    path: "artifacts/landing-desktop.png",
    fullPage: true,
  });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveCSS("outline-style", "solid");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("link", { name: /Operator sign in/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/landing-mobile.png",
    fullPage: true,
  });
});

test("operator authorization protects pages and APIs", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/operator\/login/);
  await accessibility(page);
  expect((await request.get("/api/complaints")).status()).toBe(401);
  expect((await request.get("/api/complaints/LL-0193")).status()).toBe(401);
  expect(
    (
      await request.patch("/api/complaints/LL-0193", {
        data: { status: "RESOLVED" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/complaints", { data: { category: "METER" } })
    ).status(),
  ).toBe(401);
  await page
    .getByLabel("Operator credential", { exact: true })
    .fill("incorrect");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByText("The operator access secret is incorrect."),
  ).toBeVisible();
});

test("operator can review a fixture and save status through the UI", async ({
  page,
}) => {
  let current = { ...complaint };
  await page.route("**/api/complaints**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/complaints") {
      await route.fulfill({
        json: {
          success: true,
          complaints: [current],
          pagination: { page: 1, pageSize: 25, total: 1 },
          overview: {
            open: current.status === "OPEN" ? 1 : 0,
            reviewing: current.status === "REVIEWING" ? 1 : 0,
            resolved: 0,
            escalated: 0,
            receivedToday: 1,
          },
        },
      });
    } else {
      if (route.request().method() === "PATCH")
        current = { ...current, status: route.request().postDataJSON().status };
      await route.fulfill({ json: { success: true, complaint: current } });
    }
  });
  await login(page);
  await expect(
    page.getByRole("link", { name: "LL-0193", exact: true }),
  ).toBeVisible();
  await accessibility(page);
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "LL-0193", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "LL-0193", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("DEMO-45001234", { exact: true })).toBeVisible();
  await page.getByLabel("New status").selectOption("REVIEWING");
  await page.getByRole("button", { name: "Save status" }).click();
  await expect(page.getByRole("status")).toContainText("Status saved");
  await accessibility(page);
  await page.screenshot({
    path: "artifacts/detail-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByLabel("New status")).toBeVisible();
});

test("dashboard loading, empty, and failure states give a next step", async ({
  page,
}) => {
  let fail = false;
  await page.route("**/api/complaints?**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      status: fail ? 503 : 200,
      json: fail
        ? {
            success: false,
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: "Please try again.",
            },
          }
        : {
            success: true,
            complaints: [],
            pagination: { page: 1, pageSize: 25, total: 0 },
            overview: {
              open: 0,
              reviewing: 0,
              resolved: 0,
              escalated: 0,
              receivedToday: 0,
            },
          },
    });
  });
  await login(page);
  await expect(
    page.getByText("Loading complaint register", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No complaints recorded yet", { exact: true }),
  ).toBeVisible();
  fail = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByText("Complaint register unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Try again/ })).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: /Try again/ }).click();
  await expect(
    page.getByText("No complaints recorded yet", { exact: true }),
  ).toBeVisible();
});

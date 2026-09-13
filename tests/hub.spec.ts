import { test, expect } from "@playwright/test";
test("launcher, all tools, copy, validation, reset and navigation", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page
    .getByRole("link", { name: "Renewal Calculator Insurance", exact: true })
    .click();
  await page.getByLabel("Renewing premium", { exact: true }).fill("1100");
  await page.getByLabel("Expiring premium", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Generate & copy" }).click();
  await expect(
    page.getByText("ren.prem.over.threshold", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("ren.prem.over.threshold");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByText("Ready when you are")).toBeVisible();
  await page.getByLabel("Expiring premium", { exact: true }).fill("0");
  await page.getByLabel("Renewing premium", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Generate & copy" }).click();
  await expect(page.getByRole("alert")).toContainText("greater than zero");
  await page
    .getByRole("button", { name: "Rate increase", exact: true })
    .click();
  await page.getByLabel("Emailed who", { exact: true }).fill("Jane");
  await page.getByRole("button", { name: "Generate & copy" }).click();
  await expect(page.getByText("Emailed Jane.", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Email subject", exact: true })
    .click();
  await page.getByLabel("Last name", { exact: true }).fill("Smith");
  await page.getByLabel("First name", { exact: true }).fill("Jane");
  await page.getByLabel("Effective date", { exact: true }).fill("2026-09-13");
  await page.getByRole("button", { name: "Generate & copy" }).click();
  await expect(
    page.getByText("Smith, Jane (ren.prem.over.threshold) eff:09/13/26", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Home", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A little hub.",
  );
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Renewal Calculator",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Rate calculator", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("clipboard denial keeps the generated text usable", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    }),
  );
  await page.goto("/#renewal");
  await page.getByLabel("Renewing premium", { exact: true }).fill("1000");
  await page.getByLabel("Expiring premium", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Generate & copy" }).click();
  await expect(
    page.getByText("Per DL FT$1,000 (was same)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Copy unavailable.", { exact: false }),
  ).toBeVisible();
});

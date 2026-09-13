import { test, expect } from "@playwright/test";

test("single-page threshold flow, copying, reset, and navigation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("All in your browser")).toHaveCount(0);
  await expect(
    page.getByText("A familiar home for your everyday tools."),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Renewal Calculator Insurance", exact: true })
    .click();
  await expect(page.getByText("Made for your day-to-day.")).toHaveCount(0);
  const calculator = page.getByRole("region", {
    name: "Rate calculator",
    exact: true,
  });
  const note = page.getByRole("region", { name: "Rate increase", exact: true });
  const email = page.getByRole("region", {
    name: "Email subject",
    exact: true,
  });
  await expect(note).toHaveCount(0);
  await page.getByLabel("Renewing premium", { exact: true }).fill("1050");
  await page.getByLabel("Expiring premium", { exact: true }).fill("1000");
  await calculator.getByRole("button", { name: "Generate & copy" }).click();
  await expect(note).toHaveCount(0);
  await expect(email).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("approx 5% increase");
  await page.getByLabel("Renewing premium", { exact: true }).fill("1100");
  await calculator.getByRole("button", { name: "Generate & copy" }).click();
  await expect(note).toBeVisible();
  await expect(email).toBeVisible();
  await note.getByLabel("Emailed who", { exact: true }).fill("Jane");
  await note.getByRole("button", { name: "Generate & copy" }).click();
  await expect(
    note.getByText(
      "Per DL FT $1,100.00 (was $1,000.00) approx 10.00% increase. Emailed Jane.",
      { exact: true },
    ),
  ).toBeVisible();
  await email.getByLabel("Last name", { exact: true }).fill("Smith");
  await email.getByLabel("First name", { exact: true }).fill("Jane");
  await email.getByLabel("Effective date", { exact: true }).fill("2026-09-13");
  await email.getByRole("button", { name: "Generate & copy" }).click();
  await expect(
    email.getByText("Smith, Jane (ren.prem.over.threshold) eff:09/13/26", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Renewing premium", { exact: true }).fill("1050");
  await expect(note).toHaveCount(0);
  await expect(email).toHaveCount(0);
  await calculator.getByRole("button", { name: "Generate & copy" }).click();
  await expect(note).toHaveCount(0);
  await calculator.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(
    page.getByLabel("Renewing premium", { exact: true }),
  ).toHaveValue("");
  await page.getByLabel("Renewing premium", { exact: true }).fill("100");
  await page.getByLabel("Expiring premium", { exact: true }).fill("0");
  await calculator.getByRole("button", { name: "Generate & copy" }).click();
  await expect(page.getByRole("alert")).toContainText("greater than zero");
  await page.getByRole("link", { name: "Home", exact: true }).first().click();
  await expect(page.locator("h1")).toContainText("A little hub.");
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Renewal Calculator");
  await page.reload();
  await expect(calculator).toBeVisible();
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

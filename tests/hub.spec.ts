import { test, expect } from "@playwright/test";
test("producer workflow, duplicate update, download, persistence, and removal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#renewal");
  await expect(
    page.getByRole("region", { name: "Client renewal", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Renewing premium", { exact: true }).fill("1100");
  await page.getByLabel("Expiring premium", { exact: true }).fill("1000");
  await page
    .getByRole("button", { name: "Calculate renewal", exact: true })
    .click();
  await page.getByLabel("Last name", { exact: true }).fill("Smith");
  await page.getByLabel("First name", { exact: true }).fill("Jane");
  await page.getByLabel("Policy number", { exact: true }).fill("P100");
  await page.getByLabel("Effective date", { exact: true }).fill("2026-09-13");
  await page.getByLabel("Producer name", { exact: true }).fill("Alex");
  await page
    .getByRole("button", { name: "Add client to producer list", exact: true })
    .click();
  const alex = page.getByRole("region", { name: "Producer Alex", exact: true });
  await expect(alex).toContainText("Smith, Jane");
  await page
    .getByRole("button", { name: "Update client in list", exact: true })
    .click();
  await expect(alex.locator("article")).toHaveCount(1);
  await page.getByLabel("Producer name", { exact: true }).fill("Beth");
  await page.getByLabel("Policy number", { exact: true }).fill("P200");
  await page
    .getByRole("button", { name: "Add client to producer list", exact: true })
    .click();
  const beth = page.getByRole("region", { name: "Producer Beth", exact: true });
  await expect(beth).toContainText("P200");
  await expect(alex).not.toContainText("P200");
  const downloadPromise = page.waitForEvent("download");
  await alex.getByRole("button", { name: "Download PDF", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Alex-renewal-review.pdf");
  expect(await download.failure()).toBeNull();
  await page.getByRole("button", { name: "Next client", exact: true }).click();
  await expect(
    page.getByLabel("Renewing premium", { exact: true }),
  ).toHaveValue("");
  await expect(alex).toBeVisible();
  await page.reload();
  await expect(alex).toBeVisible();
  await expect(beth).toBeVisible();
  await alex
    .getByRole("button", { name: "Remove Smith, Jane", exact: true })
    .click();
  await expect(alex).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(alex).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Home", exact: true }).first().click();
  await page
    .getByRole("link", { name: "Renewal Calculator Insurance", exact: true })
    .click();
  await expect(alex).toBeVisible();
  expect(errors).toEqual([]);
});
test("below threshold keeps simple copying and rejects zero baselines", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#renewal");
  await page.getByLabel("Renewing premium", { exact: true }).fill("1050");
  await page.getByLabel("Expiring premium", { exact: true }).fill("1000");
  await page
    .getByRole("button", { name: "Calculate renewal", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Client renewal", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("approx 5% increase");
  await page.getByLabel("Expiring premium", { exact: true }).fill("0");
  await page
    .getByRole("button", { name: "Calculate renewal", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("greater than zero");
});

import { it, expect } from "vitest";
import pdfMake from "pdfmake/build/pdfmake";
import fonts from "pdfmake/build/vfs_fonts";
import { writeFileSync } from "node:fs";
import {
  producerDocument,
  highlightedPremium,
  sortByIncrease,
  policyFontSize,
} from "./producerPdf";
import { makeRecord } from "./producerRecords";
it("renders long, multi-page producer PDFs with client details", async () => {
  const records = Array.from({ length: 24 }, (_, i) => ({
    ...makeRecord({
      lastName: "García-Smith",
      firstName: "Zoë",
      policyNumber: `POLICY-LONG-IDENTIFIER-123456789-${i + 1}`,
      effDate: "2026-09-13",
      producer: "Alex Lee",
      renewal: "1350",
      expiring: "1000",
    }),
    message:
      "Per DL FT $1,350.00 (was $1,000.00) approx 35.00% increase. " +
      "Coverage and deductible details for review. ".repeat(i === 0 ? 110 : 5),
  }));
  const definition = producerDocument(
    "Alex Lee",
    records,
    new Date("2026-09-13T12:00:00Z"),
  );
  const buffer = await new Promise<Uint8Array>((resolve) =>
    pdfMake
      .createPdf(
        definition,
        undefined,
        undefined,
        fonts as unknown as Record<string, string>,
      )
      .getBuffer(resolve),
  );
  expect(new TextDecoder().decode(buffer.slice(0, 5))).toBe("%PDF-");
  expect(buffer.length).toBeGreaterThan(10000);
  if (process.env.PDF_QA_PATH) writeFileSync(process.env.PDF_QA_PATH, buffer);
}, 20000);

it("sorts by premium percentage increase without changing the saved list", () => {
  const base = makeRecord({
    lastName: "Smith",
    firstName: "Jane",
    policyNumber: "1",
    effDate: "2026-09-13",
    producer: "Alex",
    renewal: "1100",
    expiring: "1000",
  });
  const records = [
    { ...base, policyNumber: "low", renewal: 1100 },
    { ...base, policyNumber: "highest", renewal: 5000, expiring: 2500 },
    { ...base, policyNumber: "middle", renewal: 1500 },
  ];
  expect(sortByIncrease(records).map((r) => r.policyNumber)).toEqual([
    "highest",
    "middle",
    "low",
  ]);
  expect(records[0].policyNumber).toBe("low");
  expect(policyFontSize("123456")).toBe(9);
  expect(policyFontSize("POLICY-LONG-IDENTIFIER-123456789-1")).toBeLessThan(9);
});

it("highlights only the premium percentage while preserving the full message", () => {
  const message =
    "Per DL FT $5,000.00 (was $2,500.00) approx 100.00% increase. Cov.A at $300,000.00 (was $150,000.00) 100.00% increase. Emailed JYY.";
  const parts = highlightedPremium(message);
  expect(Array.isArray(parts)).toBe(true);
  if (typeof parts === "string") throw new Error("Missing highlight");
  expect(parts.map((part) => part.text).join("")).toBe(message);
  expect(
    parts.filter((part) => part.background).map((part) => part.text),
  ).toEqual(["100.00%"]);
  expect(highlightedPremium("Coverage increased 100.00%.")).toBe(
    "Coverage increased 100.00%.",
  );
});

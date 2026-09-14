import { it, expect } from "vitest";
import pdfMake from "pdfmake/build/pdfmake";
import fonts from "pdfmake/build/vfs_fonts";
import { writeFileSync } from "node:fs";
import { producerDocument } from "./producerPdf";
import { makeRecord } from "./producerRecords";
it("renders long, multi-page producer PDFs with client details", async () => {
  const records = Array.from({ length: 24 }, (_, i) => ({
    ...makeRecord({
      lastName: "García-Smith",
      firstName: "Zoë",
      policyNumber: `POLICY-${i + 1}`,
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

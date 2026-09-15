import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { dateLabel, type RenewalRecord } from "./producerRecords";
const policyWidth = 110;
// Conservative Roboto glyph widths keep full identifiers inside their column.
export function policyFontSize(policy: string) {
  const width = Array.from(policy).reduce(
    (total, c) =>
      total +
      (/[0-9]/.test(c)
        ? 0.57
        : /[ilI1.,:;!'|]/.test(c)
          ? 0.34
          : /[MWmw@%]/.test(c)
            ? 1
            : /[a-z]/.test(c)
              ? 0.65
              : /[A-Z]/.test(c)
                ? 0.8
                : /[\s-]/.test(c)
                  ? 0.4
                  : 1.2),
    0,
  );
  return Math.min(9, (policyWidth - 2) / Math.max(width, 1));
}
export function sortByIncrease(records: RenewalRecord[]) {
  const increase = (r: RenewalRecord) =>
    r.expiring > 0 ? (r.renewal - r.expiring) / r.expiring : -Infinity;
  return [...records].sort((a, b) => increase(b) - increase(a));
}
export function producerDocument(
  producer: string,
  records: RenewalRecord[],
  created = new Date(),
): TDocumentDefinitions {
  return {
    info: { title: `Renewal review - ${producer}`, author: "Utility Hub" },
    pageSize: "LETTER",
    pageMargins: [36, 44, 36, 44],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      lineHeight: 1.25,
      color: "#273d35",
    },
    footer: (page, pages) => ({
      text: `Utility Hub  |  ${page} / ${pages}`,
      alignment: "right",
      margin: [36, 12, 36, 0],
      fontSize: 8,
      color: "#68776d",
    }),
    content: [
      {
        text: "RENEWAL REVIEW",
        fontSize: 10,
        bold: true,
        color: "#617e57",
        characterSpacing: 1.5,
      },
      { text: producer, fontSize: 24, bold: true, margin: [0, 8, 0, 6] },
      {
        text: `${records.length} client${records.length === 1 ? "" : "s"}  |  Prepared ${created.toLocaleDateString("en-US")}`,
        color: "#68776d",
        margin: [0, 0, 0, 18],
      },
      {
        table: {
          headerRows: 1,
          widths: [85, policyWidth, 57, "*"],
          body: [
            [
              "Client",
              "Policy number",
              "Effective date",
              "Rate increase message",
            ].map((text) => ({
              text,
              bold: true,
              color: "#ffffff",
              fillColor: "#304e3c",
              margin: [0, 5, 0, 5] as [number, number, number, number],
            })),
            ...sortByIncrease(records).map((r, i) =>
              [
                `${r.lastName}, ${r.firstName}`,
                r.policyNumber,
                dateLabel(r.effDate),
                r.message,
              ].map((text, column) => ({
                text,
                ...(column === 1
                  ? { noWrap: true, fontSize: policyFontSize(text) }
                  : {}),
                fillColor: i % 2 === 0 ? "#f0f3eb" : "#ffffff",
                margin: [0, 5, 0, 5] as [number, number, number, number],
              })),
            ),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#dce3d6",
          paddingLeft: () => 7,
          paddingRight: () => 7,
        },
      },
    ],
  };
}
export async function downloadProducer(
  producer: string,
  records: RenewalRecord[],
) {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);

  const filename = (
    producer.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "Producer"
  ).replace(/\s+/g, "-");
  const doc = pdfMake.createPdf(
    producerDocument(producer, records),
    undefined,
    undefined,
    fonts as unknown as Record<string, string>,
  );
  const blob = await new Promise<Blob>((resolve) => doc.getBlob(resolve));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-renewal-review.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

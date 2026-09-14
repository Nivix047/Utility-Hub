import type { Values } from "./logic";
import { expect, it } from "vitest";
import {
  groupRecords,
  makeRecord,
  producerMessage,
  parseRecords,
  saveRecord,
} from "./producerRecords";
const input = {
  lastName: " Smith ",
  firstName: "Jane",
  policyNumber: "P100",
  effDate: "2026-09-13",
  producer: " Alex  Lee ",
  renewal: "1100",
  expiring: "1000",
};
it("builds client records with the producer email note", () => {
  const r = makeRecord(input);
  expect(r.producer).toBe("Alex Lee");
  expect(r.lastName).toBe("Smith");
  expect(r.message).toContain("10.00% increase");
  expect(r.message).toContain("Emailed Alex Lee.");
});
it("rejects incomplete clients, invalid dates and below-threshold renewals", () => {
  for (const patch of [
    { producer: "" },
    { firstName: " " },
    { effDate: "2026-02-30" },
    { renewal: "1050" },
    { covExpiring: "0" },
  ] as Values[])
    expect(() => makeRecord({ ...input, ...patch })).toThrow();
});
it("groups producer names ignoring case and whitespace, and updates duplicate policies", () => {
  const a = makeRecord(input),
    b = makeRecord({
      ...input,
      producer: "alex lee",
      policyNumber: "p100",
      renewal: "1200",
    });
  const updated = saveRecord([a], b);
  expect(updated).toHaveLength(1);
  expect(updated[0].renewal).toBe(1200);
  expect(updated[0].id).toBe(a.id);
  const c = makeRecord({
      ...input,
      policyNumber: "P200",
      producer: "ALEX LEE",
    }),
    d = makeRecord({ ...input, producer: "Beth" });
  expect(groupRecords([...updated, c, d]).map((g) => g.records.length)).toEqual(
    [2, 1],
  );
  expect(saveRecord(updated, { ...b, effDate: "2027-09-13" })).toHaveLength(2);
});
it("round trips browser-tab storage and rejects malformed data", () => {
  const records = [makeRecord(input)];
  expect(parseRecords(JSON.stringify(records))).toEqual(records);
  expect(parseRecords(null)).toEqual([]);
  expect(() => parseRecords("{}")).toThrow();
  expect(() => parseRecords("[{}]")).toThrow();
});

it("keeps policy and company effective dates independent", () => {
 const values = {...input, renewal: "1000", expiring: "200", covRenewal:"300000", covExpiring:"200000", deductible:"5000", yearBuilt:"1985", squareFeet:"2000", company:"Cal Auto", effDate:"2026-10-01", rateEffDate:"2026-09-13"};
 const record = makeRecord(values);
 expect(record.effDate).toBe("2026-10-01");
 expect(record.message).toBe("Per DL FT $1,000.00 (was $200.00) approx 400.00% increase. Cov.A at $300,000.00 (was $200,000.00) 50.00% increase. $5,000.00 deductible. Home built in 1985. 2,000 square ft. Cal Auto rate increase eff:09/13/26. Emailed Alex Lee.");
 expect(producerMessage({...values, rateEffDate:""})).not.toContain("eff:");
});

it("includes optional findings between the company date and producer in saved messages", () => {
 const values = {...input, company:"Cal Auto", rateEffDate:"2026-07-01", comments:"  Reviewed roof condition  "};
 expect(makeRecord(values).message).toContain("Cal Auto rate increase eff:07/01/26. Reviewed roof condition. Emailed Alex Lee.");
 expect(producerMessage({...values,comments:"Reviewed."})).toContain("Reviewed. Emailed Alex Lee.");
 expect(producerMessage({...values,comments:"  "})).toBe(producerMessage({...values,comments:""}));
});

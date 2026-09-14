import type { Values } from "./logic";
import { expect, it } from "vitest";
import {
  groupRecords,
  makeRecord,
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
it("builds client records without claiming an email was sent", () => {
  const r = makeRecord(input);
  expect(r.producer).toBe("Alex Lee");
  expect(r.lastName).toBe("Smith");
  expect(r.message).toContain("10.00% increase");
  expect(r.message).not.toContain("Emailed");
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

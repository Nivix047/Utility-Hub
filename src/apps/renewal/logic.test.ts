import { describe, it, expect } from "vitest";
import { calculate, dateLabel, rateNote, subject } from "./logic";
describe("original premium rules", () => {
  it("handles equality, tiny changes, decreases and rounding", () => {
    expect(calculate(1000, 1000).message).toBe("Per DL FT$1,000 (was same)");
    expect(calculate(1005, 1000).message).toContain("<1% increase");
    expect(calculate(995, 1000).message).toContain("<1% decrease");
    expect(calculate(500, 1000).message).toContain("approx 50% decrease");
    expect(calculate(1095, 1000).message).toContain("approx 9.5% increase");
  });
  it("requires both thresholds, including exact boundaries", () => {
    expect(calculate(550, 500).message).toContain("Within our $100 threshold");
    expect(calculate(1100, 1000).over).toBe(true);
    expect(calculate(1099, 1000).over).toBe(false);
    expect(calculate(2100, 2000).over).toBe(false);
    expect(calculate(1100, 1000).message).toBe("ren.prem.over.threshold");
  });
  it("rejects invalid baselines and allows a zero renewal", () => {
    for (const pair of [
      [100, 0],
      [-1, 100],
      [Infinity, 100],
      [100, NaN],
    ])
      expect(() => calculate(pair[0], pair[1])).toThrow();
    expect(calculate(0, 100).fraction).toBe(-1);
  });
});
it("formats calendar dates without timezone shifts", () =>
  expect(dateLabel("2026-09-13")).toBe("09/13/26"));
it("creates the original subject including optional fields", () => {
  expect(
    subject({
      lastName: " Smith ",
      firstName: " Jane ",
      policyNumber: "ABC",
      effDate: "2026-09-13",
    }),
  ).toBe("Smith, Jane - ABC (ren.prem.over.threshold) eff:09/13/26");
  expect(subject({})).toBe("(ren.prem.over.threshold)");
});
it("migrates every detailed note field and prioritizes coverage direction", () => {
  expect(
    rateNote({
      renewal: "1100",
      expiring: "1000",
      covRenewal: "190000",
      covExpiring: "200000",
      deductible: "1000",
      yearBuilt: "1990",
      squareFeet: "2000",
      company: "MIC",
      effDate: "2026-09-13",
      emailedWho: "Jane",
    }),
  ).toBe(
    "Per DL FT $1,100.00 (was $1,000.00) approx 10.00% increase. Cov.A at $190,000.00 (was $200,000.00) -5.00% decrease. $1,000.00 deductible. Home built in 1990. 2,000 square ft. MIC rate decrease eff:09/13/26. Emailed Jane.",
  );
  expect(rateNote({ emailedWho: "Jane" })).toBe("Emailed Jane.");
  expect(() => rateNote({})).toThrow();
  expect(() => rateNote({ renewal: "100", expiring: "0" })).toThrow();
});

import { diarySubject } from './logic';
it('creates a diary subject with trimmed policy and term and calendar date', () => {
  expect(diarySubject({policyType:' Home ',term:' 12 months ',effDate:'2026-09-13'})).toBe('Home 12 months (ren.prem.over.threshold) eff: 09/13/26');
  expect(() => diarySubject({policyType:'Home',term:' ',effDate:'2026-09-13'})).toThrow();
});

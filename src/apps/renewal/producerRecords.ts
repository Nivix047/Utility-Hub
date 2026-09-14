import { calculate, dateLabel, rateNote, type Values } from "./logic";
export type RenewalRecord = {
  id: string;
  lastName: string;
  firstName: string;
  policyNumber: string;
  effDate: string;
  producer: string;
  renewal: number;
  expiring: number;
  message: string;
};
export const producerKey = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
export function producerMessage(values: Values) {
  return rateNote({ ...values, effDate: values.rateEffDate || "", emailedWho: (values.producer || "").trim().replace(/\s+/g, " ") });
}
export function makeRecord(values: Values): RenewalRecord {
  const clean = (key: string) => (values[key] || "").trim();
  for (const key of [
    "lastName",
    "firstName",
    "policyNumber",
    "effDate",
    "producer",
  ]) {
    if (!clean(key))
      throw new Error("Enter all client details and the producer name.");
  }
  const iso = clean("effDate");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
    !Number.isFinite(Date.parse(iso)) ||
    new Date(iso).toISOString().slice(0, 10) !== iso
  )
    throw new Error("Enter a valid effective date.");
  const renewal = Number(values.renewal),
    expiring = Number(values.expiring);
  if (!calculate(renewal, expiring).over)
    throw new Error("Only renewals over both thresholds can be added.");
  return {
    id: crypto.randomUUID(),
    lastName: clean("lastName"),
    firstName: clean("firstName"),
    policyNumber: clean("policyNumber"),
    effDate: iso,
    producer: clean("producer").replace(/\s+/g, " "),
    renewal,
    expiring,
    message: producerMessage(values),
  };
}
export const recordKey = (r: RenewalRecord) =>
  JSON.stringify([
    producerKey(r.producer),
    r.policyNumber.trim().toUpperCase(),
    r.effDate,
  ]);
export function saveRecord(records: RenewalRecord[], record: RenewalRecord) {
  const existing = records.find((r) => recordKey(r) === recordKey(record));
  return existing
    ? records.map((r) => (r.id === existing.id ? { ...record, id: r.id } : r))
    : [...records, record];
}
export function groupRecords(records: RenewalRecord[]) {
  const groups = new Map<
    string,
    { producer: string; records: RenewalRecord[] }
  >();
  for (const r of records) {
    const key = producerKey(r.producer);
    if (!groups.has(key))
      groups.set(key, { producer: r.producer, records: [] });
    groups.get(key)!.records.push(r);
  }
  return [...groups.values()].sort((a, b) =>
    a.producer.localeCompare(b.producer),
  );
}
export function parseRecords(raw: string | null): RenewalRecord[] {
  if (!raw) return [];
  const list: unknown = JSON.parse(raw);
  if (
    !Array.isArray(list) ||
    !list.every(
      (r) =>
        r &&
        [
          "id",
          "lastName",
          "firstName",
          "policyNumber",
          "effDate",
          "producer",
          "message",
        ].every((k) => typeof r[k] === "string") &&
        Number.isFinite(r.renewal) &&
        Number.isFinite(r.expiring),
    )
  )
    throw new Error("Saved list could not be read.");
  return list;
}
export { dateLabel };

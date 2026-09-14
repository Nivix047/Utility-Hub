export const dateLabel = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${m}/${d}/${y.slice(-2)}` : "";
};
const num = (n: number) => n.toLocaleString("en-US");
const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export function calculate(renewal: number, expiring: number) {
  if (
    !Number.isFinite(renewal) ||
    !Number.isFinite(expiring) ||
    renewal < 0 ||
    expiring <= 0
  )
    throw new Error(
      "Enter a renewing premium of zero or more and an expiring premium greater than zero.",
    );
  const change = Math.round((renewal - expiring) * 100) / 100,
    fraction = change / expiring;
  const percent = (fraction * 100).toFixed(
    fraction >= 0.095 && fraction < 0.1 ? 1 : 0,
  );
  const base = `Per DL FT$${num(renewal)} (was $${num(expiring)})`;
  const direction = change > 0 ? "increase" : "decrease";
  const over = fraction >= 0.1 && change >= 100;
  const message =
    change === 0
      ? `Per DL FT$${num(renewal)} (was same)`
      : Math.abs(fraction) < 0.01
        ? `${base} <1% ${direction}`
        : fraction < 0.1
          ? `${base} approx ${Math.abs(Number(percent))}% ${direction}`
          : change < 100
            ? `${base} approx ${percent}% increase. Within our $100 threshold`
            : "ren.prem.over.threshold";
  return { change, fraction, over, message };
}
export type Values = Record<string, string>;
export function subject(v: Values) {
  const name = [v.lastName?.trim(), v.firstName?.trim()]
    .filter(Boolean)
    .join(", ");
  return `${name}${v.policyNumber?.trim() ? ` - ${v.policyNumber.trim()}` : ""} (ren.prem.over.threshold)${v.effDate ? ` eff:${dateLabel(v.effDate)}` : ""}`.trim();
}
export function rateNote(v: Values) {
  const n = (k: string) => (v[k]?.trim() ? Number(v[k]) : NaN);
  const ren = n("renewal"),
    exp = n("expiring"),
    cr = n("covRenewal"),
    ce = n("covExpiring");
  const pct = (a: number, b: number) => (a - b) / b;
  const word = (a: number, b: number) => (a >= b ? "increase" : "decrease");
  const percent = (n: number) => `${(n * 100).toFixed(2)}%`;
  const parts: string[] = [];
  for (const key of [
    "renewal",
    "expiring",
    "covRenewal",
    "covExpiring",
    "deductible",
    "yearBuilt",
    "squareFeet",
  ])
    if (v[key] && (!Number.isFinite(n(key)) || n(key) < 0))
      throw new Error("Numeric values must be zero or greater.");
  if (exp === 0 || ce === 0)
    throw new Error(
      "Expiring premium and coverage must be greater than zero when provided.",
    );
  if (Number.isFinite(ren) && Number.isFinite(exp))
    parts.push(
      `Per DL FT ${money(ren)} (was ${money(exp)}) approx ${percent(pct(ren, exp))} ${word(ren, exp)}.`,
    );
  if (Number.isFinite(cr) && Number.isFinite(ce))
    parts.push(
      `Cov.A at ${money(cr)} (was ${money(ce)}) ${percent(pct(cr, ce))} ${word(cr, ce)}.`,
    );
  if (Number.isFinite(n("deductible")))
    parts.push(`${money(n("deductible"))} deductible.`);
  if (Number.isFinite(n("yearBuilt")))
    parts.push(`Home built in ${Math.trunc(n("yearBuilt"))}.`);
  if (Number.isFinite(n("squareFeet")))
    parts.push(`${num(n("squareFeet"))} square ft.`);
  if (v.company?.trim() || v.effDate) {
    const rate =
      Number.isFinite(cr) && Number.isFinite(ce) ? pct(cr, ce) : pct(ren, exp);
    parts.push(
      `${v.company?.trim() ? v.company.trim() + " " : ""}${Number.isFinite(rate) ? (rate >= 0 ? "rate increase" : "rate decrease") : "Rate change"}${v.effDate ? ` eff:${dateLabel(v.effDate)}` : ""}.`,
    );
  }
  if (v.emailedWho?.trim()) parts.push(`Emailed ${v.emailedWho.trim()}.`);
  if (!parts.length)
    throw new Error(
      "Enter renewing and expiring premiums, or other policy information.",
    );
  return parts.join(" ");
}

export function diarySubject(v: Values) {
  const policy = v.policyType?.trim();
  const term = v.term?.trim();
  const date = dateLabel(v.effDate || "");
  if (!policy || !term || !date)
    throw new Error("Enter the policy type, term, and effective date.");
  return `${policy} ${term} (ren.prem.over.threshold) eff: ${date}`;
}

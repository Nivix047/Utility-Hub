import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Copy, RotateCcw, Check } from "lucide-react";
import { calculate, rateNote, subject, diarySubject, type Values } from "./logic";
import styles from "./renewal.module.css";
type Mode = "premium" | "note" | "diary" | "subject";
type Field = [string, string, string?];
const premium: Field[] = [
  ["renewal", "Renewing premium", "number"],
  ["expiring", "Expiring premium", "number"],
];
const fields: Record<Mode, Field[]> = {
  premium,
  note: [
    ...premium,
    ["covRenewal", "Coverage A · renewing", "number"],
    ["covExpiring", "Coverage A · expiring", "number"],
    ["deductible", "Deductible", "number"],
    ["yearBuilt", "Year built", "number"],
    ["squareFeet", "Square feet", "number"],
    ["company", "Rate company"],
    ["effDate", "Effective date", "date"],
    ["emailedWho", "Emailed who"],
  ],
  diary: [["policyType", "Type of policy"], ["term", "Term"], ["effDate", "Effective date", "date"]],
  subject: [
    ["lastName", "Last name"],
    ["firstName", "First name"],
    ["policyNumber", "Policy number"],
    ["effDate", "Effective date", "date"],
  ],
};
const titles = {
  premium: "A clearer view of your renewal.",
  note: "All the details, one clear note.",
  diary: "A diary subject, ready to copy.",
  subject: "A subject line, ready to send.",
};
export default function Renewal() {
  const [premiums, setPremiums] = useState<Values | null>(null);
  const [diaryDate, setDiaryDate] = useState<{value: string}>({value: ""});
  return (
    <div className={styles.app}>
      <Tool mode="premium" onCalculated={(values) => { setPremiums(values); if (!values) setDiaryDate({value: ""}); }} />
      {premiums && (
        <div className={styles.followups}>
          <p className={styles.description}>
            This renewal is over threshold. Complete the rate increase note and
            diary and email subjects below.
          </p>
          <Tool mode="note" premiums={premiums} />
          <Tool mode="diary" onDateChange={(value) => setDiaryDate({value})} />
          <Tool mode="subject" incomingDate={diaryDate} />
        </div>
      )}
    </div>
  );
}
function Tool({
  mode,
  premiums,
  onCalculated,
  onDateChange,
  incomingDate,
}: {
  mode: Mode;
  onDateChange?: (value: string) => void;
  incomingDate?: {value: string};
  premiums?: Values;
  onCalculated?: (values: Values | null) => void;
}) {
  const [drafts, setDrafts] = useState<Record<Mode, Values>>({
    premium: {},
    note: {},
    diary: {},
    subject: {},
  });
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copy, setCopy] = useState("");
  const [stats, setStats] = useState<ReturnType<typeof calculate> | null>(null);
  useEffect(() => {
    if (!incomingDate) return;
    setDrafts(previous => ({...previous, subject: {...previous.subject, effDate: incomingDate.value}}));
    setResult("");
    setError("");
    setCopy("");
  }, [incomingDate]);
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopy("Copied to clipboard");
    } catch {
      setCopy("Copy unavailable. Select the text below to copy manually.");
    }
  }
  function clearResult() {
    onCalculated?.(null);
    setResult("");
    setStats(null);
    setError("");
    setCopy("");
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    clearResult();
    try {
      let text = "";
      const v = { ...drafts[mode], ...premiums };
      if (mode === "premium") {
        if (!v.renewal?.trim() || !v.expiring?.trim())
          throw new Error("Enter both premiums.");
        const r = calculate(Number(v.renewal), Number(v.expiring));
        setStats(r);
        onCalculated?.(r.over ? v : null);
        text = r.message;
      } else text = mode === "note" ? rateNote(v) : mode === "diary" ? diarySubject(v) : subject(v);
      setResult(text);
      void copyText(text);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section
      className={styles.tool}
      aria-label={
        mode === "premium"
          ? "Rate calculator"
          : mode === "note"
            ? "Rate increase"
            : mode === "diary" ? "Diary subject" : "Email subject"
      }
    >
      <div className={styles.layout}>
        <section>
          <p className={styles.eyebrow}>
            {mode === "premium"
              ? "RATE CALCULATOR"
              : mode === "note"
                ? "RATE INCREASE"
                : mode === "diary" ? "DIARY SUBJECT" : "EMAIL SUBJECT"}
          </p>
          <h2>{titles[mode]}</h2>
          <p className={styles.description}>
            {mode === "premium"
              ? "Compare premiums, check the threshold, and copy a ready-to-use note."
              : mode === "note"
                ? "Your compared premiums are included automatically. Add any other policy details below."
                : mode === "diary" ? "Enter the policy type, term, and effective date to create your diary subject." : "Create the original renewal threshold subject line. All fields are optional."}
          </p>
          <form onSubmit={submit}>
            <div className={styles.fields}>
              {fields[mode]
                .filter(
                  ([key]) =>
                    !(premiums && (key === "renewal" || key === "expiring")),
                )
                .map(([key, label, type]) => (
                  <label key={key}>
                    {label}
                    <input
                      type={type || "text"}
                      required={mode === "diary"}
                      step={key === "yearBuilt" ? "1" : "any"}
                      min={type === "number" ? 0 : undefined}
                      placeholder={
                        type === "number"
                          ? "0.00"
                          : type === "date"
                            ? undefined
                            : label
                      }
                      value={drafts[mode][key] || ""}
                      onChange={(e) => {
                        if (key === "effDate") onDateChange?.(e.target.value);
                        setDrafts({
                          ...drafts,
                          [mode]: { ...drafts[mode], [key]: e.target.value },
                        });
                        clearResult();
                      }}
                    />
                  </label>
                ))}
            </div>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <button className={styles.primary}>
                Generate & copy <ArrowUpRight size={17} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onDateChange?.("");
                  setDrafts({ ...drafts, [mode]: {} });
                  clearResult();
                }}
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>
          </form>
        </section>
        <aside className={styles.result} aria-live="polite">
          <span className={styles.eyebrow}>YOUR RESULT</span>
          {stats && (
            <div className={styles.stats}>
              <div>
                <small>Premium change</small>
                <strong>
                  $
                  {stats.change.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div>
                <small>Percentage change</small>
                <strong>{(stats.fraction * 100).toFixed(2)}%</strong>
              </div>
              <span className={stats.over ? styles.over : styles.within}>
                {stats.over ? "Over threshold" : "Within threshold"}
              </span>
            </div>
          )}
          {result ? (
            <>
              <p className={styles.note}>{result}</p>
              <button onClick={() => void copyText(result)}>
                <Copy size={16} /> Copy again
              </button>
              <p className={styles.copy}>{copy}</p>
            </>
          ) : (
            <div className={styles.empty}>
              <div>
                <Check size={25} />
              </div>
              <h3>Ready when you are</h3>
              <p>Your generated note will appear here, ready to copy.</p>
            </div>
          )}
          {mode === "premium" && (
            <p className={styles.rule}>
              Threshold: an increase of at least 10% and $100.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

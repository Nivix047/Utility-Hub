import { useState, type FormEvent } from "react";
import { ArrowUpRight, Copy, RotateCcw, Check } from "lucide-react";
import { calculate, rateNote, subject, type Values } from "./logic";
import styles from "./renewal.module.css";
type Mode = "premium" | "note" | "subject";
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
  subject: "A subject line, ready to send.",
};
export default function Renewal() {
  const [mode, setMode] = useState<Mode>("premium");
  const [drafts, setDrafts] = useState<Record<Mode, Values>>({
    premium: {},
    note: {},
    subject: {},
  });
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copy, setCopy] = useState("");
  const [stats, setStats] = useState<ReturnType<typeof calculate> | null>(null);
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopy("Copied to clipboard");
    } catch {
      setCopy("Copy unavailable. Select the text below to copy manually.");
    }
  }
  function clearResult() {
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
      const v = drafts[mode];
      if (mode === "premium") {
        if (!v.renewal?.trim() || !v.expiring?.trim())
          throw new Error("Enter both premiums.");
        const r = calculate(Number(v.renewal), Number(v.expiring));
        setStats(r);
        text = r.message;
      } else text = mode === "note" ? rateNote(v) : subject(v);
      setResult(text);
      void copyText(text);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className={styles.app}>
      <div className={styles.tabs} aria-label="Calculator tools">
        {(["premium", "note", "subject"] as Mode[]).map((m, i) => (
          <button
            key={m}
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              clearResult();
            }}
          >
            {["Rate calculator", "Rate increase", "Email subject"][i]}
          </button>
        ))}
      </div>
      <div className={styles.layout}>
        <section>
          <p className={styles.eyebrow}>RENEWAL CALCULATOR</p>
          <h2>{titles[mode]}</h2>
          <p className={styles.description}>
            {mode === "premium"
              ? "Compare premiums, check the threshold, and copy a ready-to-use note."
              : mode === "note"
                ? "Build a complete renewal note from the policy details you have. All fields are optional."
                : "Create the original renewal threshold subject line. All fields are optional."}
          </p>
          <form onSubmit={submit}>
            <div className={styles.fields}>
              {fields[mode].map(([key, label, type]) => (
                <label key={key}>
                  {label}
                  <input
                    type={type || "text"}
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
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Copy, RotateCcw, Check } from "lucide-react";
import { calculate, type Values } from "./logic";
import { ClientRenewal, ProducerLists } from "./ProducerWorkflow";
import { parseRecords, type RenewalRecord } from "./producerRecords";
import styles from "./renewal.module.css";
import {storageKey, loadRecords, persistRecords} from "./renewalStorage";
function initialList() {
  try {
    return {
      records: loadRecords(localStorage, sessionStorage),
      warning: "",
    };
  } catch {
    return {
      records: [] as RenewalRecord[],
      warning:
        "Saved lists are unavailable. New entries will stay in memory; download PDFs before leaving this page.",
    };
  }
}
export default function Renewal() {
  const [initial, setInitial] = useState(initialList);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearVersion, setClearVersion] = useState(0);
  const [clearStatus, setClearStatus] = useState("");
  const [records, setRecords] = useState<RenewalRecord[]>(initial.records);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const [premiums, setPremiums] = useState<Values>({});
  const [stats, setStats] = useState<ReturnType<typeof calculate> | null>(null);
  const [error, setError] = useState("");
  const [copy, setCopy] = useState("");
  useEffect(() => {
    if (initial.warning) return;
    try {
      persistRecords(records, localStorage, sessionStorage);
      setStorageWarning("");
    } catch {
      setStorageWarning(
        "The list could not be saved in local storage. Download your PDFs before refreshing or leaving.",
      );
    }
  }, [records, initial.warning]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || (event.key !== storageKey && event.key !== null)) return;
      try {
        const updated = parseRecords(event.newValue);
        setRecords(updated);
        if (!updated.length) {
          nextClient();
          setClearVersion(v => v + 1);
          setConfirmClear(false);
        }
      } catch { setStorageWarning("Saved data changed in another tab but could not be read. Refresh to retry."); }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function clearAll() {
    let warning = "";
    try { persistRecords([], localStorage, sessionStorage); }
    catch { warning = "The form and in-memory lists were cleared, but browser storage could not be accessed. Use your browser’s site-data settings to remove any saved copy."; }
    setInitial({records: [], warning});
    setRecords([]);
    setStorageWarning(warning);
    nextClient();
    setClearVersion(v => v + 1);
    setConfirmClear(false);
    setClearStatus(warning ? "In-memory data cleared." : "All saved renewal data in this browser has been cleared.");
  }
  function clearResult() {
    setStats(null);
    setError("");
    setCopy("");
  }
  function nextClient() {
    setPremiums({});
    clearResult();
    document.getElementById("renewing-premium")?.focus();
  }
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopy("Copied to clipboard");
    } catch {
      setCopy("Copy unavailable. Select the text below to copy manually.");
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    clearResult();
    try {
      if (!premiums.renewal?.trim() || !premiums.expiring?.trim())
        throw new Error("Enter both premiums.");
      const result = calculate(
        Number(premiums.renewal),
        Number(premiums.expiring),
      );
      setStats(result);
      if (!result.over) void copyText(result.message);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className={styles.app}>
      <section className={styles.tool} aria-label="Rate calculator">
        <div className={styles.layout}>
          <section>
            <p className={styles.eyebrow}>RATE CALCULATOR</p>
            <h2>A clearer view of your renewal.</h2>
            <p className={styles.description}>
              Compare premiums. Below threshold, copy your note; above
              threshold, prepare the client for their producer.
            </p>
            <form onSubmit={submit}>
              <div className={styles.fields}>
                {[
                  ["renewal", "Renewing premium"],
                  ["expiring", "Expiring premium"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      id={key === "renewal" ? "renewing-premium" : undefined}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={premiums[key] || ""}
                      onChange={(e) => {
                        setPremiums({ ...premiums, [key]: e.target.value });
                        clearResult();
                      }}
                    />
                  </label>
                ))}
              </div>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <div className={styles.actions}>
                <button className={styles.primary}>
                  Calculate renewal <ArrowUpRight size={17} />
                </button>
                <button type="button" onClick={nextClient}>
                  <RotateCcw size={15} />
                  Reset calculator
                </button>
              </div>
            </form>
          </section>
          <aside className={styles.result} aria-live="polite">
            <span className={styles.eyebrow}>YOUR RESULT</span>
            {stats ? (
              <>
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
                <p className={styles.note}>
                  {stats.over
                    ? "Complete the client details below to add this renewal to a producer’s list."
                    : stats.message}
                </p>
                {!stats.over && (
                  <>
                    <button onClick={() => void copyText(stats.message)}>
                      <Copy size={16} />
                      Copy again
                    </button>
                    <p className={styles.copy}>{copy}</p>
                  </>
                )}
              </>
            ) : (
              <div className={styles.empty}>
                <div>
                  <Check size={25} />
                </div>
                <h3>Ready when you are</h3>
                <p>Your renewal comparison will appear here.</p>
              </div>
            )}
            <p className={styles.rule}>
              Threshold: an increase of at least 10% and $100.
            </p>
          </aside>
        </div>
      </section>
      {stats?.over && (
        <ClientRenewal
          premiums={premiums}
          records={records}
          onSave={setRecords}
          onNext={nextClient}
        />
      )}
      {storageWarning && (
        <p role="alert" className={styles.error}>
          {storageWarning}
        </p>
      )}
      <ProducerLists key={clearVersion} records={records} onChange={setRecords} />
      <div className={styles.followups}>
        <button type="button" onClick={() => { setConfirmClear(true); setClearStatus(""); }}>Clear all renewal data</button>
        {confirmClear && <section role="alertdialog" aria-labelledby="clear-title" aria-describedby="clear-description" className={styles.messagePreview}>
          <h3 id="clear-title">Are you sure?</h3>
          <p id="clear-description">Delete all saved producer lists and current form data from this browser? This cannot be undone. Downloaded PDFs and other websites’ data are not affected.</p>
          <div className={styles.actions}>
            <button type="button" onClick={clearAll}>Yes, delete all renewal data</button>
            <button type="button" autoFocus onClick={() => setConfirmClear(false)}>No, keep my data</button>
          </div>
        </section>}
        <p role="status" className={styles.copy}>{clearStatus}</p>
      </div>
    </div>
  );
}

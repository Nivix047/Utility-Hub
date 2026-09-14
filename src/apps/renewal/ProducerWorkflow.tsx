import { useState, type FormEvent } from "react";
import { Copy, FileDown, Plus, Trash2 } from "lucide-react";
import { rateNote, type Values } from "./logic";
import {
  makeRecord,
  groupRecords,
  recordKey,
  saveRecord,
  dateLabel,
  type RenewalRecord,
} from "./producerRecords";
import { downloadProducer } from "./producerPdf";
import styles from "./renewal.module.css";
const clients = [
  ["lastName", "Last name"],
  ["firstName", "First name"],
  ["policyNumber", "Policy number"],
  ["effDate", "Effective date", "date"],
  ["producer", "Producer name"],
];
const details = [
  ["covRenewal", "Coverage A · renewing", "number"],
  ["covExpiring", "Coverage A · expiring", "number"],
  ["deductible", "Deductible", "number"],
  ["yearBuilt", "Year built", "number"],
  ["squareFeet", "Square feet", "number"],
  ["company", "Rate company"],
];
export function ClientRenewal({
  premiums,
  records,
  onSave,
  onNext,
}: {
  premiums: Values;
  records: RenewalRecord[];
  onSave: (records: RenewalRecord[]) => void;
  onNext: () => void;
}) {
  const [values, setValues] = useState<Values>({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  let message = "",
    noteError = "";
  try {
    message = rateNote({ ...premiums, ...values });
  } catch (e) {
    noteError = (e as Error).message;
  }
  const saved = records.some(
    (r) =>
      recordKey(r) ===
      JSON.stringify([
        (values.producer || "").trim().replace(/\s+/g, " ").toLowerCase(),
        (values.policyNumber || "").trim().toUpperCase(),
        values.effDate,
      ]),
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const record = makeRecord({ ...premiums, ...values });
      onSave(saveRecord(records, record));
      setStatus(
        saved
          ? "Client updated in the producer list."
          : "Client added to the producer list.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const inputs = (fields: string[][], required: boolean) =>
    fields.map(([key, label, type]) => (
      <label key={key}>
        {label}
        <input
          required={required}
          type={type || "text"}
          min={type === "number" ? 0 : undefined}
          step={key === "yearBuilt" ? 1 : "any"}
          list={key === "producer" ? "producer-names" : undefined}
          value={values[key] || ""}
          onChange={(e) => {
            setValues({ ...values, [key]: e.target.value });
            setStatus("");
            setError("");
          }}
        />
      </label>
    ));
  return (
    <section className={styles.followups} aria-label="Client renewal">
      <p className={styles.eyebrow}>OVER-THRESHOLD RENEWAL</p>
      <h2>Prepare this client for review.</h2>
      <p className={styles.description}>
        Enter the client and producer once, then add the renewal to their PDF
        list. Producer name replaces “Emailed who”; adding a client does not
        send an email.
      </p>
      <form onSubmit={submit}>
        <h3>Client details</h3>
        <div className={styles.fields}>{inputs(clients, true)}</div>
        <datalist id="producer-names">
          {groupRecords(records).map((g) => (
            <option key={g.producer} value={g.producer} />
          ))}
        </datalist>
        <h3 className={styles.subheading}>
          Rate increase details <small>Optional</small>
        </h3>
        <div className={styles.fields}>{inputs(details, false)}</div>
        <div className={styles.messagePreview}>
          <span className={styles.eyebrow}>RATE INCREASE MESSAGE</span>
          <p className={styles.note}>{noteError || message}</p>
          <button
            type="button"
            disabled={!!noteError}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(message);
                setStatus("Message copied.");
              } catch {
                setStatus(
                  "Copy unavailable. Select the message to copy manually.",
                );
              }
            }}
          >
            <Copy size={15} /> Copy message
          </button>
        </div>
        {(error || noteError) && (
          <p role="alert" className={styles.error}>
            {error || noteError}
          </p>
        )}
        <div className={styles.actions}>
          <button className={styles.primary} disabled={!!noteError}>
            <Plus size={16} />
            {saved ? "Update client in list" : "Add client to producer list"}
          </button>
          <button type="button" onClick={onNext}>
            Next client
          </button>
        </div>
        <p role="status" className={styles.copy}>
          {status}
        </p>
      </form>
    </section>
  );
}
export function ProducerLists({
  records,
  onChange,
}: {
  records: RenewalRecord[];
  onChange: (records: RenewalRecord[]) => void;
}) {
  const [removed, setRemoved] = useState<RenewalRecord | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const groups = groupRecords(records);
  return (
    <section className={styles.followups} aria-label="Producer PDF lists">
      <p className={styles.eyebrow}>PRODUCER PDF LISTS</p>
      <h2>Ready for each producer.</h2>
      <p className={styles.description}>
        Each PDF contains one producer’s client names, policy numbers, effective
        dates, and rate increase messages. Lists stay in this browser tab
        through refreshes. Download before closing the tab.
      </p>
      {!records.length && (
        <p className={styles.description}>
          No clients added yet. Calculate an over-threshold renewal to start a
          list.
        </p>
      )}
      {groups.map((group) => (
        <section
          className={styles.producerGroup}
          key={group.producer}
          aria-label={`Producer ${group.producer}`}
        >
          <div className={styles.groupHeader}>
            <h3>
              {group.producer}{" "}
              <small>
                {group.records.length} client
                {group.records.length === 1 ? "" : "s"}
              </small>
            </h3>
            <button
              className={styles.primary}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setStatus("Preparing PDF…");
                try {
                  await downloadProducer(group.producer, group.records);
                  setStatus(`PDF ready for ${group.producer}.`);
                } catch {
                  setStatus(
                    "PDF could not be created. Your client list is still here; please try again.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <FileDown size={16} />
              Download PDF
            </button>
          </div>
          {group.records.map((r) => (
            <article className={styles.record} key={r.id}>
              <div className={styles.groupHeader}>
                <strong>
                  {r.lastName}, {r.firstName}
                </strong>
                <button
                  aria-label={`Remove ${r.lastName}, ${r.firstName}`}
                  onClick={() => {
                    onChange(records.filter((v) => v.id !== r.id));
                    setRemoved(r);
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
              <p className={styles.description}>
                Policy {r.policyNumber} · Effective {dateLabel(r.effDate)}
              </p>
              <p className={styles.note}>{r.message}</p>
            </article>
          ))}
        </section>
      ))}
      {removed && (
        <p className={styles.description}>
          Removed {removed.lastName}, {removed.firstName}.{" "}
          <button
            onClick={() => {
              onChange(saveRecord(records, removed));
              setRemoved(null);
            }}
          >
            Undo
          </button>
        </p>
      )}
      <p role="status" className={styles.copy}>
        {status}
      </p>
    </section>
  );
}

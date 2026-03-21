import type { ColumnKey, ColumnMapping } from "../lib/types";
import styles from "../app/page.module.css";

type Props = {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (next: ColumnMapping) => void;
  onAutoDetect: () => void;
};

const COLUMN_LABELS: Record<ColumnKey, string> = {
  date: "Date",
  description: "Description",
  amount: "Amount",
  debit: "Debit",
  credit: "Credit",
  balance: "Balance",
};

const COLUMN_HELP: Record<ColumnKey, string> = {
  date: "Required",
  description: "Required",
  amount: "Use when there is one amount column",
  debit: "Use when debits are separated",
  credit: "Use when credits are separated",
  balance: "Optional",
};

export const MappingPanel = ({ headers, mapping, onChange, onAutoDetect }: Props) => {
  const handleSelect = (key: ColumnKey, value: string) => {
    onChange({ ...mapping, [key]: value || undefined });
  };

  return (
    <div className={styles.mappingGrid}>
      <div className={styles.mappingHeader}>
        <div>
          <h3>Column mapping</h3>
          <p>Match your statement columns to bookkeeping fields.</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={onAutoDetect}>
          Auto-detect
        </button>
      </div>
      {(
        ["date", "description", "amount", "debit", "credit", "balance"] as ColumnKey[]
      ).map((key) => (
        <label key={key} className={styles.mappingField}>
          <span>
            {COLUMN_LABELS[key]}
            <em>{COLUMN_HELP[key]}</em>
          </span>
          <select
            className={styles.select}
            value={mapping[key] ?? ""}
            onChange={(event) => handleSelect(key, event.target.value)}
          >
            <option value="">None</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
};

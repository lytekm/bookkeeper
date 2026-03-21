import type { ChangeEvent } from "react";
import styles from "../app/page.module.css";

type Props = {
  onCsvText: (text: string) => void;
  onLoadSample: () => void;
  onReset: () => void;
  hasData: boolean;
};

export const CsvUploader = ({ onCsvText, onLoadSample, onReset, hasData }: Props) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        onCsvText(result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.uploadCard}>
      <div>
        <label className={styles.fileLabel}>
          Upload CSV
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        </label>
        <p className={styles.helperText}>Drag or select a bank statement CSV.</p>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.secondaryButton} onClick={onLoadSample}>
          Load demo data
        </button>
        <button type="button" className={styles.ghostButton} onClick={onReset} disabled={!hasData}>
          Reset
        </button>
      </div>
    </div>
  );
};

import type { ChangeEvent } from "react";
import styles from "../app/page.module.css";
import { pdfTextToCsvText } from "../lib/pdf";

type Props = {
  onCsvText: (text: string) => void;
  onLoadSample: () => void;
  onReset: () => void;
  hasData: boolean;
};

export const CsvUploader = ({ onCsvText, onLoadSample, onReset, hasData }: Props) => {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");

    if (isPdf) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          console.error("PDF parse failed", response.status);
          return;
        }
        const data = (await response.json()) as { text?: string };
        const text = typeof data.text === "string" ? data.text : "";
        const csvText = pdfTextToCsvText(text);
        if (!csvText) {
          console.error("PDF parse returned no rows");
          return;
        }
        onCsvText(csvText);
      } catch (error) {
        console.error("PDF parse error", error);
      }
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
          Upload CSV or PDF
          <input
            type="file"
            accept=".csv,text/csv,application/pdf,.pdf"
            onChange={handleFileChange}
          />
        </label>
        <p className={styles.helperText}>
          Drag or select a bank statement CSV or text-based PDF.
        </p>
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

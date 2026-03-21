"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { parseCsv } from "../lib/csv";
import { autoDetectMapping } from "../lib/mapping";
import { normalizeTransactions, summarizeTransactions } from "../lib/accounting";
import { chartOfAccounts, BANK_ACCOUNT_ID, getAccountName } from "../lib/chart";
import { clearState, loadState, saveState } from "../lib/storage";
import { formatCurrency } from "../lib/format";
import type { ColumnMapping } from "../lib/types";
import { CsvUploader } from "../components/CsvUploader";
import { MappingPanel } from "../components/MappingPanel";
import { CsvPreviewTable } from "../components/CsvPreviewTable";
import { SummaryCards } from "../components/SummaryCards";
import { TransactionTable } from "../components/TransactionTable";
import { JournalPreview } from "../components/JournalPreview";
import { SectionHeader } from "../components/SectionHeader";

export default function Home() {
  const [csvText, setCsvText] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setCsvText(saved.csvText);
      setMapping(saved.mapping);
      setAssignments(saved.assignments);
    }
    setHydrated(true);
  }, []);

  const parsed = useMemo(() => (csvText ? parseCsv(csvText) : { headers: [], rows: [], sampleRows: [] }), [csvText]);

  useEffect(() => {
    if (!parsed.headers.length || Object.keys(mapping).length > 0) {
      return;
    }
    setMapping(autoDetectMapping(parsed));
  }, [parsed, mapping]);

  const transactions = useMemo(
    () => normalizeTransactions(parsed, mapping),
    [parsed, mapping],
  );

  const summary = useMemo(
    () => summarizeTransactions(transactions, assignments),
    [transactions, assignments],
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveState({ csvText, mapping, assignments });
  }, [csvText, mapping, assignments, hydrated]);

  const handleAutoDetect = () => {
    setMapping(autoDetectMapping(parsed));
  };

  const handleAssign = (id: string, accountId: string) => {
    setAssignments((prev) => ({ ...prev, [id]: accountId }));
  };

  const handleApplySuggestion = (id: string) => {
    const tx = transactions.find((item) => item.id === id);
    if (!tx?.suggestedAccountId) {
      return;
    }
    handleAssign(id, tx.suggestedAccountId);
  };

  const handleApplyAllSuggestions = () => {
    const next = { ...assignments };
    transactions.forEach((tx) => {
      if (!next[tx.id] && tx.suggestedAccountId) {
        next[tx.id] = tx.suggestedAccountId;
      }
    });
    setAssignments(next);
  };

  const handleLoadSample = async () => {
    const response = await fetch("/demo-bank-statement.csv");
    const text = await response.text();
    setCsvText(text);
    setAssignments({});
    setMapping(autoDetectMapping(parseCsv(text)));
  };

  const handleReset = () => {
    clearState();
    setCsvText("");
    setMapping({});
    setAssignments({});
  };

  const selectableAccounts = chartOfAccounts.filter((account) => account.id !== BANK_ACCOUNT_ID);
  const totalsByAccount = Object.entries(summary.totalsByAccount)
    .map(([accountId, total]) => ({
      accountId,
      total,
    }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.badge}>Bookkeeping Prototype</span>
          <h1>Statement intake, clean mapping, and journal-ready reviews.</h1>
          <p>
            Upload a bank CSV, map the columns, and review normalized transactions with suggested
            accounts. Built for quick demos and accountant-ready workflows.
          </p>
        </div>
        <div className={styles.heroCard}>
          <h3>Workflow snapshot</h3>
          <ul>
            <li>Upload a CSV statement</li>
            <li>Auto-map columns and preview</li>
            <li>Assign accounts with suggestions</li>
            <li>Review balanced journal entries</li>
          </ul>
        </div>
      </header>

      <section className={styles.section}>
        <SectionHeader
          title="1. Upload statement"
          description="CSV only. Data stays in your browser."
        />
        <CsvUploader
          onCsvText={setCsvText}
          onLoadSample={handleLoadSample}
          onReset={handleReset}
          hasData={Boolean(parsed.headers.length)}
        />
      </section>

      {!parsed.headers.length ? (
        <section className={styles.emptyState}>
          <h3>No data yet</h3>
          <p>Upload a CSV or load the demo file to see the full workflow.</p>
        </section>
      ) : (
        <>
          <section className={styles.section}>
            <SectionHeader
              title="2. Map columns"
              description="Confirm how dates, descriptions, and amounts should be interpreted."
            />
            <MappingPanel
              headers={parsed.headers}
              mapping={mapping}
              onChange={setMapping}
              onAutoDetect={handleAutoDetect}
            />
          </section>

          <section className={styles.section}>
            <SectionHeader
              title="3. Preview rows"
              description="Check the first few rows before normalizing transactions."
            />
            <CsvPreviewTable headers={parsed.headers} rows={parsed.sampleRows} />
          </section>

          <section className={styles.section}>
            <SectionHeader
              title="4. Review transactions"
              description="Assign the opposite-side account for each bank transaction."
            />
            <SummaryCards summary={summary} transactionCount={transactions.length} />
            <TransactionTable
              transactions={transactions}
              assignments={assignments}
              accounts={selectableAccounts}
              onAssign={handleAssign}
              onApplySuggestion={handleApplySuggestion}
              onApplyAllSuggestions={handleApplyAllSuggestions}
            />
          </section>

          <section className={styles.section}>
            <SectionHeader
              title="5. Journal entry preview"
              description={`Balanced entries using ${getAccountName(BANK_ACCOUNT_ID)} as the bank account.`}
            />
            <JournalPreview
              transactions={transactions}
              assignments={assignments}
              bankAccountId={BANK_ACCOUNT_ID}
            />
          </section>

          <section className={styles.section}>
            <SectionHeader
              title="6. Summary analytics"
              description="Totals are calculated from the normalized transaction list."
            />
            <div className={styles.summarySplit}>
              <div className={styles.summaryPanel}>
                <h3>Totals by account</h3>
                <ul>
                  {totalsByAccount.map((item) => (
                    <li key={item.accountId}>
                      <span>{getAccountName(item.accountId)}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.summaryPanel}>
                <h3>Notes</h3>
                <p>
                  Suggestions are keyword-based and meant for quick triage. Adjust mappings or
                  account selections as needed before exporting to your accounting system.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

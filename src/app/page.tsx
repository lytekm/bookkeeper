"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { parseCsv } from "../lib/csv";
import { autoDetectMapping } from "../lib/mapping";
import { normalizeTransactions, summarizeTransactions } from "../lib/accounting";
import { chartOfAccounts, BANK_ACCOUNT_ID, getAccountName } from "../lib/chart";
import { clearState, loadState, saveState } from "../lib/storage";
import { formatCurrency } from "../lib/format";
import type { Account, ColumnMapping } from "../lib/types";
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
  const [customAccounts, setCustomAccounts] = useState<Account[]>([]);
  const [activePanel, setActivePanel] = useState<
    "overview" | "upload" | "mapping" | "preview" | "transactions" | "journal" | "analytics"
  >("overview");
  const [newCategoryDrafts, setNewCategoryDrafts] = useState<Record<string, string>>({});
  const [suggestionsApplied, setSuggestionsApplied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setCsvText(saved.csvText);
      setMapping(saved.mapping);
      setAssignments(saved.assignments);
      setCustomAccounts(saved.customAccounts ?? []);
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
    saveState({ csvText, mapping, assignments, customAccounts });
  }, [csvText, mapping, assignments, customAccounts, hydrated]);

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
    setSuggestionsApplied(true);
  };

  const handleApplyAllSuggestions = () => {
    const next = { ...assignments };
    transactions.forEach((tx) => {
      if (!next[tx.id] && tx.suggestedAccountId) {
        next[tx.id] = tx.suggestedAccountId;
      }
    });
    setAssignments(next);
    setSuggestionsApplied(true);
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
    setCustomAccounts([]);
    setNewCategoryDrafts({});
    setSuggestionsApplied(false);
  };

  const allAccounts = useMemo(() => [...chartOfAccounts, ...customAccounts], [customAccounts]);
  const selectableAccounts = allAccounts.filter((account) => account.id !== BANK_ACCOUNT_ID);
  const assignableAccounts = selectableAccounts.filter((account) => account.id !== "uncategorized");
  const totalsByAccount = Object.entries(summary.totalsByAccount)
    .map(([accountId, total]) => ({
      accountId,
      total,
    }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  const uncategorizedTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        const assigned = assignments[tx.id];
        return !assigned || assigned === "uncategorized";
      }),
    [transactions, assignments],
  );

  const assignedCount = transactions.length - uncategorizedTransactions.length;
  const hasData = parsed.headers.length > 0;
  const showUncategorized = suggestionsApplied || Object.keys(assignments).length > 0;

  const createAccountId = (name: string) => {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const safeBase = base || `category-${Date.now()}`;
    const existingIds = new Set(allAccounts.map((account) => account.id));
    let nextId = safeBase;
    let suffix = 2;
    while (existingIds.has(nextId)) {
      nextId = `${safeBase}-${suffix}`;
      suffix += 1;
    }
    return nextId;
  };

  const handleDraftChange = (id: string, value: string) => {
    setNewCategoryDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddCategory = (id: string) => {
    const name = (newCategoryDrafts[id] ?? "").trim();
    if (!name) {
      return;
    }
    const accountId = createAccountId(name);
    setCustomAccounts((prev) => [...prev, { id: accountId, name, type: "Expense" }]);
    setNewCategoryDrafts((prev) => ({ ...prev, [id]: "" }));
    handleAssign(id, accountId);
  };

  useEffect(() => {
    if (!hasData && activePanel !== "overview" && activePanel !== "upload") {
      setActivePanel("upload");
    }
  }, [hasData, activePanel]);

  const dashboardItems = [
    {
      id: "overview",
      title: "Overview",
      description: "Totals, progress, and next steps.",
      badge: hasData ? `${assignedCount} assigned` : "No data",
      disabled: false,
    },
    {
      id: "upload",
      title: "Upload statement",
      description: "Load a CSV to start the workflow.",
      badge: hasData ? "Loaded" : "Required",
      disabled: false,
    },
    {
      id: "mapping",
      title: "Map columns",
      description: "Confirm date, description, and amounts.",
      badge: hasData ? "Ready" : "Waiting",
      disabled: !hasData,
    },
    {
      id: "preview",
      title: "Preview rows",
      description: "Spot check the first records.",
      badge: hasData ? `${parsed.sampleRows.length} rows` : "Waiting",
      disabled: !hasData,
    },
    {
      id: "transactions",
      title: "Review transactions",
      description: "Apply suggestions and categorize.",
      badge: hasData ? `${uncategorizedTransactions.length} open` : "Waiting",
      disabled: !hasData,
    },
    {
      id: "journal",
      title: "Journal preview",
      description: "Confirm balanced entries.",
      badge: hasData ? "Draft" : "Waiting",
      disabled: !hasData,
    },
    {
      id: "analytics",
      title: "Summary analytics",
      description: "Totals by category and notes.",
      badge: hasData ? `${totalsByAccount.length} categories` : "Waiting",
      disabled: !hasData,
    },
  ] as const;

  const suggestedCount = transactions.filter(
    (tx) => tx.suggestedAccountId && tx.suggestedAccountId !== "uncategorized",
  ).length;

  return (
    <div className={styles.page}>
      <header className={styles.dashboardHeader}>
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

      <div className={styles.dashboard}>
        <nav className={styles.navPanel}>
          {dashboardItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navButton} ${
                activePanel === item.id ? styles.navButtonActive : ""
              }`}
              onClick={() => setActivePanel(item.id)}
              disabled={item.disabled}
            >
              <div className={styles.navHeader}>
                <span className={styles.navTitle}>{item.title}</span>
                <span className={styles.navBadge}>{item.badge}</span>
              </div>
              <span className={styles.navDescription}>{item.description}</span>
            </button>
          ))}
        </nav>

        <section className={styles.detailPanel}>
          {activePanel === "overview" ? (
            <div className={styles.detailStack}>
              <SectionHeader
                title="Dashboard overview"
                description="Track progress across the import, mapping, and categorization workflow."
              />
              {!hasData ? (
                <section className={styles.emptyState}>
                  <h3>No data yet</h3>
                  <p>Upload a CSV or load the demo file to see the full workflow.</p>
                </section>
              ) : (
                <>
                  <SummaryCards summary={summary} transactionCount={transactions.length} />
                  <div className={styles.overviewGrid}>
                    <div className={styles.overviewCard}>
                      <span>Assigned</span>
                      <strong>{assignedCount}</strong>
                    </div>
                    <div className={styles.overviewCard}>
                      <span>Uncategorized</span>
                      <strong>{uncategorizedTransactions.length}</strong>
                    </div>
                    <div className={styles.overviewCard}>
                      <span>Suggested matches</span>
                      <strong>{suggestedCount}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {activePanel === "upload" ? (
            <div className={styles.detailStack}>
              <SectionHeader
                title="Upload statement"
                description="CSV only. Data stays in your browser."
              />
              <CsvUploader
                onCsvText={setCsvText}
                onLoadSample={handleLoadSample}
                onReset={handleReset}
                hasData={Boolean(parsed.headers.length)}
              />
            </div>
          ) : null}

          {activePanel === "mapping" ? (
            <div className={styles.detailStack}>
              <SectionHeader
                title="Map columns"
                description="Confirm how dates, descriptions, and amounts should be interpreted."
              />
              {hasData ? (
                <MappingPanel
                  headers={parsed.headers}
                  mapping={mapping}
                  onChange={setMapping}
                  onAutoDetect={handleAutoDetect}
                />
              ) : (
                <section className={styles.emptyState}>
                  <h3>Waiting on data</h3>
                  <p>Upload a CSV to configure the column mapping.</p>
                </section>
              )}
            </div>
          ) : null}

          {activePanel === "preview" ? (
            <div className={styles.detailStack}>
              <SectionHeader
                title="Preview rows"
                description="Check the first few rows before normalizing transactions."
              />
              {hasData ? (
                <CsvPreviewTable headers={parsed.headers} rows={parsed.sampleRows} />
              ) : (
                <section className={styles.emptyState}>
                  <h3>Waiting on data</h3>
                  <p>Upload a CSV to preview parsed rows.</p>
                </section>
              )}
            </div>
          ) : null}

          {activePanel === "transactions" ? (
            <div className={styles.detailStack}>
              <SectionHeader
                title="Review transactions"
                description="Apply suggestions, then finalize remaining categories."
              />
              {hasData ? (
                <>
                  <SummaryCards summary={summary} transactionCount={transactions.length} />
                  <TransactionTable
                    transactions={transactions}
                    assignments={assignments}
                    accounts={selectableAccounts}
                    onAssign={handleAssign}
                    onApplySuggestion={handleApplySuggestion}
                    onApplyAllSuggestions={handleApplyAllSuggestions}
                  />
                  <div className={styles.uncatPanel}>
                    <div className={styles.uncatHeader}>
                      <div>
                        <h3>Uncategorized queue</h3>
                        <p>Focus on the items still missing a category after suggestions.</p>
                      </div>
                      <span className={styles.navBadge}>
                        {uncategorizedTransactions.length} remaining
                      </span>
                    </div>
                    {!showUncategorized ? (
                      <p className={styles.uncatEmpty}>
                        Apply suggestions to surface items that need manual categories.
                      </p>
                    ) : uncategorizedTransactions.length ? (
                      <div className={styles.uncatList}>
                        {uncategorizedTransactions.map((tx) => (
                          <div key={tx.id} className={styles.uncatItem}>
                            <div className={styles.uncatMeta}>
                              <span>{tx.date}</span>
                              <strong>{tx.description}</strong>
                              <span className={tx.amount >= 0 ? styles.amountIn : styles.amountOut}>
                                {formatCurrency(tx.amount)}
                              </span>
                            </div>
                            <div className={styles.uncatActions}>
                              <select
                                className={styles.select}
                                value={assignments[tx.id] ?? ""}
                                onChange={(event) => handleAssign(tx.id, event.target.value)}
                              >
                                <option value="">Select category</option>
                                {assignableAccounts.map((account) => (
                                  <option key={account.id} value={account.id}>
                                    {account.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                className={styles.inlineInput}
                                type="text"
                                placeholder="New category"
                                value={newCategoryDrafts[tx.id] ?? ""}
                                onChange={(event) => handleDraftChange(tx.id, event.target.value)}
                              />
                              <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => handleAddCategory(tx.id)}
                              >
                                Add & assign
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.uncatEmpty}>All transactions are categorized.</p>
                    )}
                  </div>
                </>
              ) : (
                <section className={styles.emptyState}>
                  <h3>Waiting on data</h3>
                  <p>Upload a CSV to review transactions.</p>
                </section>
              )}
            </div>
          ) : null}

          {activePanel === "journal" ? (
            <div className={styles.detailStack}>
              <SectionHeader
                title="Journal entry preview"
                description={`Balanced entries using ${getAccountName(
                  BANK_ACCOUNT_ID,
                  allAccounts,
                )} as the bank account.`}
              />
              {hasData ? (
                <JournalPreview
                  transactions={transactions}
                  assignments={assignments}
                  bankAccountId={BANK_ACCOUNT_ID}
                  accounts={allAccounts}
                />
              ) : (
                <section className={styles.emptyState}>
                  <h3>Waiting on data</h3>
                  <p>Upload a CSV to preview journal entries.</p>
                </section>
              )}
            </div>
          ) : null}

          {activePanel === "analytics" ? (
            <div className={styles.detailStack}>
              <SectionHeader
                title="Summary analytics"
                description="Totals are calculated from the normalized transaction list."
              />
              {hasData ? (
                <div className={styles.summarySplit}>
                  <div className={styles.summaryPanel}>
                    <h3>Totals by account</h3>
                    <ul>
                      {totalsByAccount.map((item) => (
                        <li key={item.accountId}>
                          <span>
                            {item.accountId === "unassigned"
                              ? "Unassigned"
                              : getAccountName(item.accountId, allAccounts)}
                          </span>
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
              ) : (
                <section className={styles.emptyState}>
                  <h3>Waiting on data</h3>
                  <p>Upload a CSV to view summary analytics.</p>
                </section>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

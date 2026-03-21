import type { Summary } from "../lib/types";
import { formatCurrency } from "../lib/format";
import styles from "../app/page.module.css";

type Props = {
  summary: Summary;
  transactionCount: number;
};

export const SummaryCards = ({ summary, transactionCount }: Props) => (
  <div className={styles.summaryGrid}>
    <div className={styles.summaryCard}>
      <span>Total in</span>
      <strong>{formatCurrency(summary.totalIn)}</strong>
    </div>
    <div className={styles.summaryCard}>
      <span>Total out</span>
      <strong>{formatCurrency(summary.totalOut)}</strong>
    </div>
    <div className={styles.summaryCard}>
      <span>Ending balance</span>
      <strong>{formatCurrency(summary.endingBalance)}</strong>
    </div>
    <div className={styles.summaryCard}>
      <span>Transactions</span>
      <strong>{transactionCount}</strong>
    </div>
  </div>
);

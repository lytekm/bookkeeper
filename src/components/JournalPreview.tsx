import type { Account, Transaction } from "../lib/types";
import { formatCurrency } from "../lib/format";
import { getAccountName } from "../lib/chart";
import styles from "../app/page.module.css";

type Props = {
  transactions: Transaction[];
  assignments: Record<string, string>;
  bankAccountId: string;
  accounts: Account[];
};

export const JournalPreview = ({ transactions, assignments, bankAccountId, accounts }: Props) => (
  <div className={styles.journalGrid}>
    {transactions.map((tx) => {
      const assigned = assignments[tx.id] ?? "";
      const counterpart = assigned || "unassigned";
      const amount = Math.abs(tx.amount);
      const isInflow = tx.amount >= 0;
      const debitAccount = isInflow ? bankAccountId : counterpart;
      const creditAccount = isInflow ? counterpart : bankAccountId;

      return (
        <div key={tx.id} className={styles.journalCard}>
          <div className={styles.journalHeader}>
            <span>{tx.date}</span>
            <strong>{tx.description}</strong>
          </div>
          <div className={styles.journalLine}>
            <span>Debit</span>
            <span>{getAccountName(debitAccount, accounts)}</span>
            <span>{formatCurrency(amount)}</span>
          </div>
          <div className={styles.journalLine}>
            <span>Credit</span>
            <span>{getAccountName(creditAccount, accounts)}</span>
            <span>{formatCurrency(amount)}</span>
          </div>
          {!assigned ? <em className={styles.journalHint}>Assign an account to finalize.</em> : null}
        </div>
      );
    })}
  </div>
);

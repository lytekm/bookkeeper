import type { Account, Transaction } from "../lib/types";
import { formatCurrency } from "../lib/format";
import { getAccountName } from "../lib/chart";
import styles from "../app/page.module.css";

type Props = {
  transactions: Transaction[];
  assignments: Record<string, string>;
  accounts: Account[];
  onAssign: (id: string, accountId: string) => void;
  onApplySuggestion: (id: string) => void;
  onApplyAllSuggestions: () => void;
};

export const TransactionTable = ({
  transactions,
  assignments,
  accounts,
  onAssign,
  onApplySuggestion,
  onApplyAllSuggestions,
}: Props) => (
  <div className={styles.tableCard}>
    <div className={styles.tableToolbar}>
      <span>{transactions.length} transactions ready for review</span>
      <button type="button" className={styles.secondaryButton} onClick={onApplyAllSuggestions}>
        Apply suggestions
      </button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Running balance</th>
          <th>Suggested</th>
          <th>Opposite account</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => {
          const assigned = assignments[tx.id] ?? "";
          const suggested = tx.suggestedAccountId ?? "";
          return (
            <tr key={tx.id}>
              <td>{tx.date}</td>
              <td>{tx.description}</td>
              <td className={tx.amount >= 0 ? styles.amountIn : styles.amountOut}>
                {formatCurrency(tx.amount)}
              </td>
              <td>{formatCurrency(tx.runningBalance)}</td>
              <td>
                <div className={styles.suggestionCell}>
                  <span>{getAccountName(suggested)}</span>
                  {!assigned && suggested ? (
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => onApplySuggestion(tx.id)}
                    >
                      Use
                    </button>
                  ) : null}
                </div>
              </td>
              <td>
                <select
                  className={styles.select}
                  value={assigned}
                  onChange={(event) => onAssign(tx.id, event.target.value)}
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

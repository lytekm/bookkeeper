import type { ColumnMapping, ParsedCsv, Summary, Transaction } from "./types";
import { toNumber } from "./numbers";
import { suggestAccountId } from "./suggestions";

export const normalizeTransactions = (
  parsed: ParsedCsv,
  mapping: ColumnMapping,
): Transaction[] => {
  const { headers, rows } = parsed;
  if (!headers.length || !rows.length) {
    return [];
  }

  const columnIndex = (header?: string) =>
    header ? headers.indexOf(header) : -1;

  const dateIndex = columnIndex(mapping.date);
  const descriptionIndex = columnIndex(mapping.description);
  const amountIndex = columnIndex(mapping.amount);
  const debitIndex = columnIndex(mapping.debit);
  const creditIndex = columnIndex(mapping.credit);
  const balanceIndex = columnIndex(mapping.balance);

  let runningBalance = 0;
  const output: Transaction[] = [];

  rows.forEach((row, index) => {
    const dateValue = row[dateIndex] ?? "";
    const description = row[descriptionIndex] ?? "";
    const amount = resolveAmount(row, amountIndex, debitIndex, creditIndex);
    const balance = balanceIndex >= 0 ? toNumber(row[balanceIndex]) ?? undefined : undefined;
    const normalizedDate = normalizeDate(dateValue);

    if (balance !== undefined) {
      runningBalance = balance;
    } else {
      runningBalance += amount;
    }

    output.push({
      id: `row-${index}`,
      date: normalizedDate,
      description,
      amount,
      balance,
      runningBalance,
      sourceRow: row,
      suggestedAccountId: suggestAccountId(description, amount),
    });
  });

  return output;
};

export const summarizeTransactions = (
  transactions: Transaction[],
  assignments: Record<string, string>,
): Summary => {
  const totalsByAccount: Record<string, number> = {};
  let totalIn = 0;
  let totalOut = 0;
  let endingBalance = 0;

  transactions.forEach((tx) => {
    if (tx.amount >= 0) {
      totalIn += tx.amount;
    } else {
      totalOut += Math.abs(tx.amount);
    }
    endingBalance = tx.runningBalance;
    const accountId = assignments[tx.id] ?? "unassigned";
    totalsByAccount[accountId] = (totalsByAccount[accountId] ?? 0) + tx.amount;
  });

  return { totalIn, totalOut, endingBalance, totalsByAccount };
};

const resolveAmount = (
  row: string[],
  amountIndex: number,
  debitIndex: number,
  creditIndex: number,
) => {
  if (amountIndex >= 0) {
    return toNumber(row[amountIndex]) ?? 0;
  }

  const debit = debitIndex >= 0 ? toNumber(row[debitIndex]) ?? 0 : 0;
  const credit = creditIndex >= 0 ? toNumber(row[creditIndex]) ?? 0 : 0;
  return credit - debit;
};

const normalizeDate = (value: string) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  const date = new Date(parsed);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type ColumnKey =
  | "date"
  | "description"
  | "amount"
  | "debit"
  | "credit"
  | "balance";

export type ColumnMapping = Partial<Record<ColumnKey, string>>;

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  sampleRows: string[][];
};

export type AccountType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance?: number;
  runningBalance: number;
  sourceRow: string[];
  suggestedAccountId?: string;
};

export type Summary = {
  totalIn: number;
  totalOut: number;
  endingBalance: number;
  totalsByAccount: Record<string, number>;
};

export type DemoState = {
  csvText: string;
  mapping: ColumnMapping;
  assignments: Record<string, string>;
};

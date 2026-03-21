import type { Account } from "./types";

export const BANK_ACCOUNT_ID = "business-checking";

export const chartOfAccounts: Account[] = [
  { id: BANK_ACCOUNT_ID, name: "Business Checking", type: "Asset" },
  { id: "sales-revenue", name: "Sales Revenue", type: "Income" },
  { id: "interest-income", name: "Interest Income", type: "Income" },
  { id: "office-supplies", name: "Office Supplies", type: "Expense" },
  { id: "software-subscriptions", name: "Software Subscriptions", type: "Expense" },
  { id: "rent-expense", name: "Rent Expense", type: "Expense" },
  { id: "payroll-expense", name: "Payroll Expense", type: "Expense" },
  { id: "travel-expense", name: "Travel Expense", type: "Expense" },
  { id: "meals-entertainment", name: "Meals and Entertainment", type: "Expense" },
  { id: "taxes-expense", name: "Taxes", type: "Expense" },
  { id: "bank-fees", name: "Bank Fees", type: "Expense" },
  { id: "owner-draw", name: "Owner Draw", type: "Equity" },
  { id: "uncategorized", name: "Uncategorized", type: "Expense" },
];

export const getAccountName = (accountId: string, accounts: Account[] = chartOfAccounts) =>
  accounts.find((account) => account.id === accountId)?.name ?? accountId;

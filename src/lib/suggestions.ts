type SuggestionRule = {
  keywords: string[];
  accountId: string;
  direction?: "in" | "out";
};

const RULES: SuggestionRule[] = [
  { keywords: ["stripe", "invoice", "client payment", "payout"], accountId: "sales-revenue", direction: "in" },
  { keywords: ["interest"], accountId: "interest-income", direction: "in" },
  { keywords: ["rent", "lease"], accountId: "rent-expense", direction: "out" },
  { keywords: ["payroll", "gusto"], accountId: "payroll-expense", direction: "out" },
  { keywords: ["office", "depot", "staples", "amazon"], accountId: "office-supplies", direction: "out" },
  { keywords: ["software", "saas", "adobe", "google", "aws"], accountId: "software-subscriptions", direction: "out" },
  { keywords: ["uber", "lyft", "flight", "hotel"], accountId: "travel-expense", direction: "out" },
  { keywords: ["restaurant", "meal", "coffee"], accountId: "meals-entertainment", direction: "out" },
  { keywords: ["irs", "tax"], accountId: "taxes-expense", direction: "out" },
  { keywords: ["fee"], accountId: "bank-fees", direction: "out" },
  { keywords: ["owner draw", "owner", "distribution"], accountId: "owner-draw", direction: "out" },
];

export const suggestAccountId = (description: string, amount: number) => {
  const lower = description.toLowerCase();
  const direction = amount >= 0 ? "in" : "out";

  for (const rule of RULES) {
    if (rule.direction && rule.direction !== direction) {
      continue;
    }
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.accountId;
    }
  }

  return "uncategorized";
};

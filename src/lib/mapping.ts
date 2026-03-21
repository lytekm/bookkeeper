import type { ColumnKey, ColumnMapping, ParsedCsv } from "./types";
import { isDateLike, isNumericLike, toNumber } from "./numbers";

const HEADER_ALIASES: Record<ColumnKey, string[]> = {
  date: ["date", "posted", "transaction date"],
  description: ["description", "details", "memo", "payee", "name"],
  amount: ["amount", "amt", "transaction amount"],
  debit: ["debit", "withdrawal", "charge", "outflow"],
  credit: ["credit", "deposit", "payment", "inflow"],
  balance: ["balance", "running balance", "ending balance"],
};

export const autoDetectMapping = (parsed: ParsedCsv): ColumnMapping => {
  const mapping: ColumnMapping = {};
  const { headers, rows } = parsed;

  const sampleRows = rows.slice(0, 12);
  const headerMap = headers.map((header) => header.toLowerCase());

  (Object.keys(HEADER_ALIASES) as ColumnKey[]).forEach((key) => {
    const match = matchHeader(headerMap, HEADER_ALIASES[key]);
    if (match !== null) {
      mapping[key] = headers[match];
    }
  });

  const missing = (key: ColumnKey) => !mapping[key];

  if (missing("date")) {
    mapping.date = pickByScore(headers, sampleRows, (value) =>
      isDateLike(value) ? 1 : 0,
    );
  }

  if (missing("description")) {
    mapping.description = pickByScore(headers, sampleRows, (value) =>
      value && !isNumericLike(value) ? 0.6 : 0,
    );
  }

  if (missing("balance")) {
    mapping.balance = pickByScore(headers, sampleRows, (value) =>
      isNumericLike(value) ? 0.4 : 0,
    );
  }

  if (missing("amount") && missing("debit") && missing("credit")) {
    const amountHeader = pickByScore(headers, sampleRows, (value) => {
      if (!isNumericLike(value)) {
        return 0;
      }
      const numeric = toNumber(value) ?? 0;
      return Math.abs(numeric) > 0 ? 0.6 : 0.2;
    });
    if (amountHeader) {
      mapping.amount = amountHeader;
    }
  }

  return mapping;
};

const matchHeader = (headers: string[], aliases: string[]) => {
  for (let i = 0; i < headers.length; i += 1) {
    const header = headers[i];
    if (aliases.some((alias) => header.includes(alias))) {
      return i;
    }
  }
  return null;
};

const pickByScore = (
  headers: string[],
  rows: string[][],
  scorer: (value: string) => number,
) => {
  let bestHeader = "";
  let bestScore = 0;

  headers.forEach((header, index) => {
    let score = 0;
    rows.forEach((row) => {
      score += scorer(row[index] ?? "");
    });

    if (score > bestScore) {
      bestScore = score;
      bestHeader = header;
    }
  });

  return bestHeader || undefined;
};

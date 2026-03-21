import type { ParsedCsv } from "./types";

const MAX_SAMPLE_ROWS = 8;

const normalizeCell = (value: string) => value.trim();

export const parseCsv = (text: string): ParsedCsv => {
  const rows = parseRows(text);
  if (rows.length === 0) {
    return { headers: [], rows: [], sampleRows: [] };
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((cell, index) =>
    cell ? normalizeCell(cell) : `Column ${index + 1}`,
  );
  const normalizedRows = dataRows.map((row) => normalizeRow(row, headers.length));
  return {
    headers,
    rows: normalizedRows,
    sampleRows: normalizedRows.slice(0, MAX_SAMPLE_ROWS),
  };
};

const normalizeRow = (row: string[], length: number) => {
  const next = [...row];
  while (next.length < length) {
    next.push("");
  }
  return next.map(normalizeCell);
};

const parseRows = (text: string): string[][] => {
  if (!text.trim()) {
    return [];
  }

  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      value += "\"";
      i += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      current.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      current.push(value);
      if (current.length > 1 || current[0]?.trim()) {
        rows.push(current);
      }
      current = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value);
    rows.push(current);
  }

  return rows;
};

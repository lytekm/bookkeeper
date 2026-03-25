const HEADER_KEYWORDS = [
  "date",
  "description",
  "amount",
  "debit",
  "credit",
  "balance",
  "transaction",
];

const splitLine = (line: string) =>
  line
    .split(/\s{2,}|\t/)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

const normalizeRowLength = (row: string[], length: number) => {
  const next = row.slice(0, length);
  while (next.length < length) {
    next.push("");
  }
  return next;
};

const escapeCell = (value: string) => {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
};

const findHeaderIndex = (rows: string[][]) => {
  let bestIndex = -1;
  let bestScore = 0;

  rows.slice(0, 6).forEach((row, index) => {
    const score = row.reduce((count, cell) => {
      const lower = cell.toLowerCase();
      return (
        count +
        (HEADER_KEYWORDS.some((keyword) => lower.includes(keyword)) ? 1 : 0)
      );
    }, 0);

    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

export const pdfTextToCsvText = (text: string) => {
  if (!text.trim()) {
    return "";
  }

  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitLine)
    .filter((row) => row.length > 1);

  if (!rows.length) {
    return "";
  }

  const headerIndex = findHeaderIndex(rows);
  const headerRow = headerIndex === -1 ? [] : rows[headerIndex];
  const dataRows = headerIndex === -1 ? rows : rows.slice(headerIndex + 1);
  const maxColumns = Math.max(
    headerRow.length,
    ...dataRows.map((row) => row.length),
  );

  const headers = headerRow.length
    ? normalizeRowLength(headerRow, maxColumns)
    : Array.from({ length: maxColumns }, (_, index) => `Column ${index + 1}`);
  const normalizedRows = dataRows.map((row) =>
    normalizeRowLength(row, maxColumns),
  );

  return [headers, ...normalizedRows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");
};

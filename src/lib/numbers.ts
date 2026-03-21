const CURRENCY_PATTERN = /[,$]/g;

export const toNumber = (value: string): number | null => {
  if (!value) {
    return null;
  }
  const cleaned = value.replace(CURRENCY_PATTERN, "").replace(/\s/g, "");
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isNumericLike = (value: string) => toNumber(value) !== null;

export const isDateLike = (value: string) => {
  if (!value) {
    return false;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
};

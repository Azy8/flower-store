// Prices are stored as plain digits ("500000") and shown Lao-style: "500.000 ₭".

/** Keeps only the digits (also cleans older values like "250,000 ກີບ"). Max 12 digits. */
export function priceDigits(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12);
}

/** "500000" → "500.000" (dots between thousands, no currency). */
export function groupDigits(raw: string): string {
  return priceDigits(raw).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "500000" → "500.000 ₭"; empty when there is no number. */
export function formatPrice(raw: string): string {
  const grouped = groupDigits(raw);
  return grouped ? `${grouped} ₭` : "";
}

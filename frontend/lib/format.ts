const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return currencyFormatter.format(value);
}

export function maskCurrencyInput(value: string): string {
  const digits = value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 12);
  return digits ? currencyFormatter.format(Number(digits) / 100) : "";
}

export function formatCompactCurrency(
  value: number | null | undefined,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return compactCurrencyFormatter.format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const [date, time = ""] = value.split("T");
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) return value;

  const clock = time.slice(0, 5);
  return `${day}/${month}/${year}${clock ? ` ${clock}` : ""}`;
}

export function parseDecimalInput(value: string): number {
  const cleaned = value.trim().replace(/R\$/gi, "").replace(/\s/g, "");

  if (!cleaned) return Number.NaN;

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  return Number(normalized);
}

export function formatPriceInput(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return value.toFixed(2).replace(".", ",");
}

export function formatStock(value: number): string {
  return `${value} un.`;
}

export function formatPercentage(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.round((value / max) * 100)}%`;
}

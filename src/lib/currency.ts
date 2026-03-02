type FormatCurrencyOptions = {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

const DEFAULT_LOCALE = "en-CA";

export function formatCurrency(
  cents: number,
  currency: string,
  options: FormatCurrencyOptions = {}
): string {
  const normalizedCurrency = currency.toUpperCase();
  const locale = options.locale ?? DEFAULT_LOCALE;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(cents / 100);
}

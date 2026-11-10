import { SUPPORTED_CURRENCIES } from '@koin/shared';

/**
 * Locale mapping for standard currency formatting.
 * Using native locales ensures correct currency symbols (e.g. '$' for COP instead of 'COP'),
 * appropriate thousand separators ('.' for COP/EUR/ARS/BRL/CLP, ',' for USD/MXN/GBP/PEN),
 * and zero decimal places for currencies without cents (COP, CLP).
 */
export const CURRENCY_LOCALES: Record<string, string> = {
  COP: 'es-CO', // '$ 1.500.000'
  USD: 'en-US', // '$1,500,000.00'
  EUR: 'es-ES', // '1.500.000,00 €'
  MXN: 'es-MX', // '$1,500,000.00'
  ARS: 'es-AR', // '$ 1.500.000,00'
  BRL: 'pt-BR', // 'R$ 1.500.000,00'
  GBP: 'en-GB', // '£1,500,000.00'
  PEN: 'es-PE', // 'S/ 1,500,000.00'
  CLP: 'es-CL', // '$1.500.000'
};

/**
 * Returns the locale associated with a given currency code.
 */
export function getCurrencyLocale(currencyCode?: string): string {
  const code = (currencyCode || 'USD').toUpperCase().trim();
  return CURRENCY_LOCALES[code] || 'en-US';
}

/**
 * Returns the thousand (group) and decimal separators for a given currency code.
 */
export function getCurrencySeparators(currencyCode?: string): { group: string; decimal: string } {
  const locale = getCurrencyLocale(currencyCode);
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234567.89);
    const group = parts.find((p) => p.type === 'group')?.value || ',';
    const decimal = parts.find((p) => p.type === 'decimal')?.value || '.';
    return { group, decimal };
  } catch (_) {
    return { group: ',', decimal: '.' };
  }
}

/**
 * Universal Currency Formatter for Koin.
 * Formats monetary amounts dynamically based on currency code,
 * using proper symbols, thousand separators and decimal places.
 */
export function formatMoney(
  amount: number | string | undefined | null,
  currencyCode: string = 'USD'
): string {
  const code = (currencyCode || 'USD').toUpperCase().trim();
  const currDef = SUPPORTED_CURRENCIES[code];
  const decimals = currDef ? currDef.decimals : 2;
  const locale = getCurrencyLocale(code);

  let num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num)) {
    num = 0;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch (_) {
    const symbol = currDef?.symbol || '$';
    return `${symbol} ${num.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
}

/**
 * Formats only the numeric portion of an amount with thousand separators
 * and decimal precision, omitting the currency symbol.
 */
export function formatNumber(
  amount: number | string | undefined | null,
  currencyCode: string = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  const code = (currencyCode || 'USD').toUpperCase().trim();
  const currDef = SUPPORTED_CURRENCIES[code];
  const decimals = currDef ? currDef.decimals : 2;
  const locale = getCurrencyLocale(code);

  let num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num)) {
    num = 0;
  }

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...options,
    }).format(num);
  } catch (_) {
    return num.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...options,
    });
  }
}

/**
 * Formats a raw numeric string (e.g. "1500000" or "1500000.5") into an input-friendly
 * display string with live thousand separators (e.g. "1.500.000" or "1.500.000,5").
 * Preserves partially typed decimals (e.g. "1500.") so typing is not interrupted.
 */
export function formatAmountForDisplay(
  rawAmount: string | number | undefined | null,
  currencyCode: string = 'USD'
): string {
  if (rawAmount === undefined || rawAmount === null) return '';
  const str = String(rawAmount).trim();
  if (!str) return '';

  const code = (currencyCode || 'USD').toUpperCase().trim();
  const currDef = SUPPORTED_CURRENCIES[code];
  const isZeroDec = currDef ? currDef.decimals === 0 : false;
  const { group, decimal } = getCurrencySeparators(code);

  let sign = '';
  let clean = str;
  if (clean.startsWith('-')) {
    sign = '-';
    clean = clean.slice(1);
  }

  const [intPart, decPart] = clean.split('.');
  const formattedInt = (intPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, group);

  if (isZeroDec || decPart === undefined) {
    return sign + formattedInt;
  }
  return sign + formattedInt + decimal + decPart;
}

/**
 * Parses user input from an input field (which may include thousand separators,
 * spaces, currency symbols, or localized decimal separators) back into a clean
 * raw numeric string (e.g. "1500000" or "1500000.50") suitable for state, Zod validation,
 * and JSON payloads.
 */
export function parseDisplayToRaw(
  displayAmount: string,
  currencyCode: string = 'USD'
): string {
  if (!displayAmount && displayAmount !== '0') return '';
  const str = String(displayAmount).trim();
  if (!str) return '';

  const code = (currencyCode || 'USD').toUpperCase().trim();
  const currDef = SUPPORTED_CURRENCIES[code];
  const isZeroDec = currDef ? currDef.decimals === 0 : false;
  const { group, decimal } = getCurrencySeparators(code);

  let sign = '';
  let clean = str;
  if (clean.startsWith('-')) {
    sign = '-';
    clean = clean.slice(1);
  }

  // Currencies with zero decimals (COP, CLP) only allow digits
  if (isZeroDec) {
    const digits = clean.replace(/\D/g, '');
    return digits ? sign + digits : '';
  }

  // Remove group/thousand separators
  let withoutGroups = clean.split(group).join('');

  // Normalize decimal separator to '.'
  let normalized = withoutGroups.split(decimal).join('.');
  // In case the user pasted/typed comma instead of dot or vice versa
  normalized = normalized.replace(/[,.]/g, (match, offset, full) => {
    return full.indexOf('.') === offset ? '.' : '';
  });

  const parts = normalized.split('.');
  let result = parts[0].replace(/\D/g, '');
  if (parts.length > 1) {
    result += '.' + parts[1].replace(/\D/g, '').slice(0, 2);
  }

  return result ? sign + result : '';
}

/**
 * Formats monetary amounts compactly for chart axes and small indicators (e.g. $ 1.5M, $ 450k, $ 100).
 */
export function formatCompactMoney(
  amount: number | string | undefined | null,
  currencyCode: string = 'USD'
): string {
  const code = (currencyCode || 'USD').toUpperCase().trim();
  const currDef = SUPPORTED_CURRENCIES[code];
  const symbol = currDef?.symbol || '$';

  let num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num)) {
    return `${symbol} 0`;
  }

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000;
    return `${sign}${symbol} ${val.toFixed(val % 1 === 0 ? 0 : 1)}B`;
  }
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${sign}${symbol} ${val.toFixed(val % 1 === 0 ? 0 : 1)}M`;
  }
  if (abs >= 1_000) {
    const val = abs / 1_000;
    return `${sign}${symbol} ${val.toFixed(val % 1 === 0 ? 0 : 1)}k`;
  }
  return `${sign}${symbol} ${Math.round(abs)}`;
}

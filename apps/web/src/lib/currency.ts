import { SUPPORTED_CURRENCIES } from '@koin/shared';

/**
 * Universal Currency Formatter for Koin.
 * Formats monetary amounts dynamically based on the currency code,
 * using the proper decimal places (e.g. 0 decimals for COP/CLP, 2 for USD/EUR/MXN)
 * and correct symbol placement, without hardcoding any arbitrary locale.
 */
export function formatMoney(
  amount: number | string | undefined | null,
  currencyCode: string = 'USD'
): string {
  const code = currencyCode.toUpperCase().trim() || 'USD';
  const currDef = SUPPORTED_CURRENCIES[code];
  const decimals = currDef ? currDef.decimals : 2;

  let num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num)) {
    num = 0;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch (_) {
    return `${code} ${num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
}

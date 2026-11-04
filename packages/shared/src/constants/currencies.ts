export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDefinition> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  COP: { code: 'COP', name: 'Peso Colombiano', symbol: '$', decimals: 0 },
  MXN: { code: 'MXN', name: 'Peso Mexicano', symbol: '$', decimals: 2 },
  ARS: { code: 'ARS', name: 'Peso Argentino', symbol: '$', decimals: 2 },
  BRL: { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  PEN: { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', decimals: 2 },
  CLP: { code: 'CLP', name: 'Peso Chileno', symbol: '$', decimals: 0 },
};

export const SUPPORTED_CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCIES) as [string, ...string[]];

export interface FinancialInstitution {
  name: string;
  shortName: string;
  color: string;
  defaultAccountType?: 'bank' | 'credit' | 'savings';
}

export const POPULAR_FINANCIAL_INSTITUTIONS: FinancialInstitution[] = [
  { name: 'Nu', shortName: 'Nu', color: '#820AD1', defaultAccountType: 'bank' },
  { name: 'Bancolombia', shortName: 'Bancolombia', color: '#FDDA24', defaultAccountType: 'bank' },
  { name: 'Nequi', shortName: 'Nequi', color: '#E01E5A', defaultAccountType: 'savings' },
  { name: 'Daviplata', shortName: 'Daviplata', color: '#ED1C24', defaultAccountType: 'savings' },
  { name: 'BBVA', shortName: 'BBVA', color: '#004481', defaultAccountType: 'bank' },
  { name: 'Mercado Pago', shortName: 'Mercado Pago', color: '#009EE3', defaultAccountType: 'savings' },
  { name: 'Lulo Bank', shortName: 'Lulo Bank', color: '#10B981', defaultAccountType: 'bank' },
  { name: 'Revolut', shortName: 'Revolut', color: '#191C1F', defaultAccountType: 'bank' },
  { name: 'Santander', shortName: 'Santander', color: '#EC0000', defaultAccountType: 'bank' },
  { name: 'Chase', shortName: 'Chase', color: '#117ACA', defaultAccountType: 'bank' },
  { name: 'Scotiabank Colpatria', shortName: 'Scotiabank', color: '#ED0722', defaultAccountType: 'bank' },
  { name: 'Itaú', shortName: 'Itaú', color: '#EC7000', defaultAccountType: 'bank' },
];

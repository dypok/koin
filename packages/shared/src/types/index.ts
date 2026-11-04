export type AccountType = 'cash' | 'bank' | 'credit' | 'savings' | 'investment';
export type AccountRole = 'owner' | 'editor' | 'viewer';
export type AccountMemberStatus = 'pending' | 'accepted' | 'rejected';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type BudgetPeriod = 'monthly' | 'weekly';

export interface ThemeConfig {
  preset: string;
  primaryHex: string;
  accentHex: string;
  baseMode: 'dark' | 'light';
}

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileDTO {
  id: string;
  userId: string;
  name: string;
  avatarIcon: string;
  themeConfig: ThemeConfig;
  baseCurrency: string;
  hasPin: boolean;
  useBiometrics: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDTO {
  id: string;
  createdByProfileId: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: string;
  currentBalance: string;
  isShared: boolean;
  color: string;
  icon: string;
  isArchived: boolean;
  role?: AccountRole;
  createdAt: string;
}

export interface AccountMemberDTO {
  id: string;
  accountId: string;
  profileId: string | null;
  role: AccountRole;
  invitedEmail: string | null;
  status: AccountMemberStatus;
  profileName?: string;
  profileAvatarIcon?: string;
  createdAt: string;
}

export interface CategoryDTO {
  id: string;
  profileId: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TransactionDTO {
  id: string;
  profileId: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string;
  type: TransactionType;
  amount: string;
  currency: string;
  exchangeRateToBase: string;
  baseAmount: string;
  date: string;
  note: string | null;
  tags: string[] | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  // Included relations for UI convenience
  accountName?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export interface BudgetDTO {
  id: string;
  profileId: string;
  categoryId: string;
  period: BudgetPeriod;
  limitAmount: string;
  alertThresholdPercent: number;
  spentAmount?: string;
  percentageUsed?: number;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateDTO {
  pair: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface UserSession {
  user: UserDTO;
  activeProfile: ProfileDTO | null;
  profiles: ProfileDTO[];
}

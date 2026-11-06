export type AccountType = 'cash' | 'bank' | 'credit' | 'savings' | 'investment';
export type AccountRole = 'owner' | 'editor' | 'viewer';
export type AccountMemberStatus = 'pending' | 'accepted' | 'rejected';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type BudgetPeriod = 'monthly' | 'weekly';

export interface ThemeConfig {
  preset: string;
  primaryHex: string;
  accentHex: string;
  baseMode: 'dark' | 'light' | 'amoled';
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
  pinDigits?: number;
  useBiometrics: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDTO {
  id: string;
  createdByProfileId: string;
  name: string;
  institutionName?: string | null;
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

export interface AccountInvitationDTO {
  id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType;
  accountCurrency: string;
  inviterProfileName: string;
  role: AccountRole;
  token: string;
  inviteLink: string;
  expiresAt: string;
  isExpired: boolean;
  isAccepted: boolean;
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

export interface CategoryWithUsageDTO extends CategoryDTO {
  usageCount: number;
}

export interface TransactionDTO {
  id: string;
  profileId: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  type: TransactionType;
  amount: string;
  toAmount?: string | null;
  currency: string;
  exchangeRateToBase: string;
  baseAmount: string;
  date: string;
  note: string | null;
  tags: string[] | null;
  isRecurring: boolean;
  recurringRuleId?: string | null;
  installmentNumber?: number | null;
  principalPortion?: string | null;
  interestPortion?: string | null;
  createdAt: string;
  updatedAt: string;
  // Included relations for UI convenience
  accountName?: string;
  accountColor?: string;
  accountIcon?: string;
  accountCurrency?: string;
  toAccountName?: string;
  toAccountColor?: string;
  toAccountIcon?: string;
  toAccountCurrency?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export type RecurrenceFrequency = 'monthly' | 'biweekly' | 'weekly' | 'yearly';
export type RecurringRuleStatus = 'active' | 'paused' | 'completed';

export interface RecurringRuleDTO {
  id: string;
  profileId: string;
  accountId: string;
  categoryId?: string | null;
  name: string;
  type: TransactionType;
  amount: string;
  currency: string;
  frequency: RecurrenceFrequency;
  dayOfMonth: number;
  isInstallment: boolean;
  totalInstallments?: number | null;
  currentInstallment: number;
  principalAmount?: string | null;
  totalInterestAmount?: string | null;
  installmentPrincipal?: string | null;
  installmentInterest?: string | null;
  interestRate?: string | null;
  autoApply: boolean;
  nextRunDate: string;
  lastRunAt?: string | null;
  status: RecurringRuleStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  // Enriched UI relations
  accountName?: string;
  accountColor?: string;
  accountIcon?: string;
  accountInstitutionName?: string | null;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export type BudgetStatus = 'on_track' | 'warning' | 'exceeded';

export interface BudgetDTO {
  id: string;
  profileId: string;
  categoryId: string;
  period: BudgetPeriod;
  limitAmount: string;
  alertThresholdPercent: number;
  spentAmount?: string;
  remainingAmount?: string;
  percentageUsed?: number;
  status?: BudgetStatus;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummaryDTO {
  netWorth: string;
  monthIncome: string;
  monthExpense: string;
  netSavings: string;
  savingsRatePercent: number;
  currency: string;
}

export interface CategoryExpenseItemDTO {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  monthPeriod: string;
  transactionCount: number;
  totalSpent: string;
  percentage: number;
  averageTicket: string;
}

export interface MonthlyCashflowItemDTO {
  monthPeriod: string;
  totalIncome: string;
  totalExpense: string;
  netSavings: string;
  savingsRatePercent: number;
}

export interface ExportBackupDataDTO {
  exportedAt: string;
  version: string;
  profile: ProfileDTO;
  accounts: AccountDTO[];
  categories: CategoryDTO[];
  budgets: BudgetDTO[];
  recurringRules: RecurringRuleDTO[];
  transactions: TransactionDTO[];
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

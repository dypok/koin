import {
  pgTable,
  uuid,
  varchar,
  numeric,
  boolean,
  timestamp,
  jsonb,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ------------------------------------------------------
// 1. Users (Master Accounts)
// ------------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_users_email').on(table.email),
  ]
);

// ------------------------------------------------------
// 2. Profiles (Isolated Sub-accounts per User)
// ------------------------------------------------------
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    avatarIcon: varchar('avatar_icon', { length: 50 }).default('User').notNull(), // Lucide SVG (Zero Emojis)
    themeConfig: jsonb('theme_config')
      .$type<{ preset: string; primaryHex: string; accentHex: string; baseMode: 'dark' | 'light' }>()
      .notNull(),
    baseCurrency: varchar('base_currency', { length: 3 }).default('USD').notNull(),
    hasPin: boolean('has_pin').default(false).notNull(),
    pinHash: varchar('pin_hash', { length: 255 }),
    useBiometrics: boolean('use_biometrics').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_profiles_user').on(table.userId),
  ]
);

// ------------------------------------------------------
// 3. Accounts (Wallets, Bank Accounts, Cards)
// ------------------------------------------------------
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdByProfileId: uuid('created_by_profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'cash' | 'bank' | 'credit' | 'savings' | 'investment'
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    initialBalance: numeric('initial_balance', { precision: 14, scale: 2 }).default('0.00').notNull(),
    currentBalance: numeric('current_balance', { precision: 14, scale: 2 }).default('0.00').notNull(),
    isShared: boolean('is_shared').default(false).notNull(),
    color: varchar('color', { length: 20 }).default('#10B981').notNull(),
    icon: varchar('icon', { length: 50 }).default('Wallet').notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_accounts_creator').on(table.createdByProfileId, table.isArchived),
  ]
);

// ------------------------------------------------------
// 4. Account Members (RBAC: Owner, Editor, Viewer)
// ------------------------------------------------------
export const accountMembers = pgTable(
  'account_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .references(() => accounts.id, { onDelete: 'cascade' })
      .notNull(),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull(), // 'owner' | 'editor' | 'viewer'
    invitedEmail: varchar('invited_email', { length: 255 }),
    status: varchar('status', { length: 20 }).default('accepted').notNull(), // 'pending' | 'accepted' | 'rejected'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_account_members_profile').on(table.profileId),
    uniqueIndex('uq_account_profile_member').on(table.accountId, table.profileId),
  ]
);

// ------------------------------------------------------
// 5. Categories
// ------------------------------------------------------
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'expense' | 'income'
    icon: varchar('icon', { length: 50 }).default('Tag').notNull(),
    color: varchar('color', { length: 20 }).default('#6B7280').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_categories_profile').on(table.profileId, table.type),
  ]
);

// ------------------------------------------------------
// 6. Exchange Rates (Multi-currency Normalization)
// ------------------------------------------------------
export const exchangeRates = pgTable('exchange_rates', {
  pair: varchar('pair', { length: 7 }).primaryKey(), // Ej: 'USD_COP', 'EUR_USD'
  fromCurrency: varchar('from_currency', { length: 3 }).notNull(),
  toCurrency: varchar('to_currency', { length: 3 }).notNull(),
  rate: numeric('rate', { precision: 18, scale: 6 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ------------------------------------------------------
// 7. Transactions
// ------------------------------------------------------
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'restrict' })
      .notNull(),
    accountId: uuid('account_id')
      .references(() => accounts.id, { onDelete: 'restrict' })
      .notNull(),
    toAccountId: uuid('to_account_id').references(() => accounts.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id')
      .references(() => categories.id, { onDelete: 'restrict' })
      .notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'expense' | 'income' | 'transfer'
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    exchangeRateToBase: numeric('exchange_rate_to_base', { precision: 18, scale: 6 }).default('1.000000').notNull(),
    baseAmount: numeric('base_amount', { precision: 14, scale: 2 }).notNull(),
    date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
    note: text('note'),
    tags: text('tags').array(),
    isRecurring: boolean('is_recurring').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_transactions_profile_date').on(table.profileId, table.date),
    index('idx_transactions_account_date').on(table.accountId, table.date),
  ]
);

// ------------------------------------------------------
// 8. Budgets
// ------------------------------------------------------
export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => categories.id, { onDelete: 'cascade' })
      .notNull(),
    period: varchar('period', { length: 20 }).default('monthly').notNull(), // 'monthly' | 'weekly'
    limitAmount: numeric('limit_amount', { precision: 14, scale: 2 }).notNull(),
    alertThresholdPercent: integer('alert_threshold_percent').default(80).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_profile_category_budget').on(table.profileId, table.categoryId, table.period),
  ]
);

// ------------------------------------------------------
// 9. Audit Logs
// ------------------------------------------------------
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 50 }).notNull(),
    entity: varchar('entity', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    details: jsonb('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_logs_user').on(table.userId, table.createdAt),
    index('idx_audit_logs_profile').on(table.profileId, table.createdAt),
  ]
);

// ------------------------------------------------------
// Relations Definitions
// ------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  memberships: many(accountMembers),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  creatorProfile: one(profiles, {
    fields: [accounts.createdByProfileId],
    references: [profiles.id],
  }),
  members: many(accountMembers),
  transactions: many(transactions),
}));

export const accountMembersRelations = relations(accountMembers, ({ one }) => ({
  account: one(accounts, {
    fields: [accountMembers.accountId],
    references: [accounts.id],
  }),
  profile: one(profiles, {
    fields: [accountMembers.profileId],
    references: [profiles.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [categories.profileId],
    references: [profiles.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [transactions.profileId],
    references: [profiles.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  profile: one(profiles, {
    fields: [budgets.profileId],
    references: [profiles.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

import { z } from 'zod';
import { ALLOWED_ACCOUNT_ICONS, ALLOWED_AVATAR_ICONS, ALLOWED_CATEGORY_ICONS } from '../constants/icons';

// ------------------------------------------------------
// Auth DTOs
// ------------------------------------------------------

export const RegisterUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150).trim(),
  baseCurrency: z.string().length(3).default('USD'),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
});
export type LoginUserInput = z.infer<typeof LoginUserSchema>;

// ------------------------------------------------------
// Profile DTOs
// ------------------------------------------------------

export const ThemeConfigSchema = z.object({
  preset: z.string().default('gold'),
  primaryHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#F59E0B'),
  accentHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#FCD34D'),
  baseMode: z.enum(['dark', 'light', 'amoled']).default('dark'),
});

export const CreateProfileSchema = z.object({
  name: z.string().min(1, 'El nombre del perfil es requerido').max(100).trim(),
  avatarIcon: z.enum(ALLOWED_AVATAR_ICONS as unknown as [string, ...string[]]).default('User'),
  themeConfig: ThemeConfigSchema.default({
    preset: 'gold',
    primaryHex: '#F59E0B',
    accentHex: '#FCD34D',
    baseMode: 'dark',
  }),
  baseCurrency: z.string().length(3).default('USD'),
  pin: z.string().regex(/^\d{4,6}$/, 'El PIN debe ser de 4 a 6 dígitos').optional(),
  useBiometrics: z.boolean().default(false),
});
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

export const UpdateProfileSchema = CreateProfileSchema.partial();
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const VerifyProfilePinSchema = z.object({
  profileId: z.string().uuid('ID de perfil inválido'),
  pin: z.string().regex(/^\d{4,6}$/, 'El PIN debe ser de 4 a 6 dígitos'),
});
export type VerifyProfilePinInput = z.infer<typeof VerifyProfilePinSchema>;

// ------------------------------------------------------
// Account DTOs
// ------------------------------------------------------

export const AccountTypeEnum = z.enum(['cash', 'bank', 'credit', 'savings', 'investment']);

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'El nombre de la cuenta es requerido').max(100).trim(),
  type: AccountTypeEnum.default('cash'),
  currency: z.string().length(3).default('USD'),
  initialBalance: z.string().regex(/^-?\d+(\.\d{1,2})?$/, 'Monto inicial decimal inválido').default('0.00'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#10B981'),
  icon: z.enum(ALLOWED_ACCOUNT_ICONS as unknown as [string, ...string[]]).default('Wallet'),
  isShared: z.boolean().default(false),
});
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;

export const UpdateAccountSchema = CreateAccountSchema.partial().extend({
  isArchived: z.boolean().optional(),
});
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;

export const InviteAccountMemberSchema = z.object({
  email: z.string().email('Correo de invitación inválido').toLowerCase().trim(),
  role: z.enum(['editor', 'viewer']).default('editor'),
});
export type InviteAccountMemberInput = z.infer<typeof InviteAccountMemberSchema>;

export const CreateAccountInvitationSchema = z.object({
  role: z.enum(['editor', 'viewer']).default('editor'),
});
export type CreateAccountInvitationInput = z.infer<typeof CreateAccountInvitationSchema>;

export const AcceptAccountInvitationSchema = z.object({
  token: z.string().min(1, 'Token de invitación requerido'),
  profileId: z.string().uuid('ID de perfil inválido'),
});
export type AcceptAccountInvitationInput = z.infer<typeof AcceptAccountInvitationSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

// ------------------------------------------------------
// Category DTOs
// ------------------------------------------------------

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido').max(100).trim(),
  type: z.enum(['expense', 'income']),
  icon: z.enum(ALLOWED_CATEGORY_ICONS as unknown as [string, ...string[]]).default('Tag'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#6B7280'),
  sortOrder: z.number().int().default(0),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

// ------------------------------------------------------
// Transaction DTOs
// ------------------------------------------------------

export const TransactionTypeEnum = z.enum(['expense', 'income', 'transfer']);

export const BaseTransactionSchema = z.object({
  accountId: z.string().uuid('ID de cuenta inválido'),
  toAccountId: z.string().uuid('ID de cuenta destino inválido').optional().nullable(),
  categoryId: z.string().uuid('ID de categoría inválido').optional().nullable(),
  type: TransactionTypeEnum,
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto decimal positivo inválido'),
  toAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto destino decimal positivo inválido').optional().nullable(),
  currency: z.string().length(3).default('USD'),
  exchangeRateToBase: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Tasa de cambio inválida').optional().nullable(),
  date: z.string().datetime().or(z.date()).transform((val) => (typeof val === 'string' ? val : val.toISOString())),
  note: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().trim().max(30)).max(10).optional().nullable(),
  isRecurring: z.boolean().default(false),
});

export const CreateTransactionSchema = BaseTransactionSchema.refine(
  (data) => {
    if (data.type === 'transfer' && !data.toAccountId) {
      return false;
    }
    if ((data.type === 'expense' || data.type === 'income') && !data.categoryId) {
      return false;
    }
    return true;
  },
  {
    message: 'Transacción inválida: los gastos e ingresos requieren categoría, y las transferencias requieren cuenta de destino',
  }
);
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = BaseTransactionSchema.partial();
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

export const CreateTransferSchema = z.object({
  fromAccountId: z.string().uuid('ID de cuenta origen inválido'),
  toAccountId: z.string().uuid('ID de cuenta destino inválido'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto decimal positivo inválido'),
  toAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto destino decimal positivo inválido').optional().nullable(),
  exchangeRate: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Tasa de cambio inválida').optional().nullable(),
  date: z.string().datetime().or(z.date()).transform((val) => (typeof val === 'string' ? val : val.toISOString())).optional(),
  note: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().trim().max(30)).max(10).optional().nullable(),
});
export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;

// ------------------------------------------------------
// Budget DTOs
// ------------------------------------------------------

export const CreateBudgetSchema = z.object({
  categoryId: z.string().uuid('ID de categoría inválido'),
  period: z.enum(['monthly', 'weekly']).default('monthly'),
  limitAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto límite decimal inválido'),
  alertThresholdPercent: z.number().int().min(1).max(100).default(80),
});
export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;

export const UpdateBudgetSchema = CreateBudgetSchema.partial();
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>;

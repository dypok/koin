/**
 * Whitelist of allowed Lucide SVG icon names across the application.
 * Strictly 100% Lucide SVG icons - ZERO EMOJIS anywhere.
 */
export const ALLOWED_AVATAR_ICONS = [
  'User',
  'UserCheck',
  'Briefcase',
  'Coffee',
  'Home',
  'Smile',
  'Shield',
  'Heart',
  'Star',
  'Compass',
  'Zap',
  'Sparkles',
] as const;

export const ALLOWED_ACCOUNT_ICONS = [
  'Wallet',
  'Building2',
  'CreditCard',
  'PiggyBank',
  'TrendingUp',
  'Coins',
  'Banknote',
  'Vault',
  'Receipt',
  'Scale',
] as const;

export const ALLOWED_CATEGORY_ICONS = [
  'Utensils',
  'Car',
  'Home',
  'Zap',
  'Tv',
  'HeartPulse',
  'GraduationCap',
  'Briefcase',
  'TrendingUp',
  'Gift',
  'ShoppingBag',
  'Smartphone',
  'Plane',
  'Music',
  'Wifi',
  'Tag',
  'DollarSign',
  'HelpCircle',
] as const;

export type AllowedAvatarIcon = typeof ALLOWED_AVATAR_ICONS[number];
export type AllowedAccountIcon = typeof ALLOWED_ACCOUNT_ICONS[number];
export type AllowedCategoryIcon = typeof ALLOWED_CATEGORY_ICONS[number];

import React from 'react';
import {
  User,
  UserCheck,
  Briefcase,
  Coffee,
  Home,
  Smile,
  Shield,
  Heart,
  Star,
  Compass,
  Zap,
  Sparkles,
  Wallet,
  Building2,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Coins,
  Banknote,
  Vault,
  Receipt,
  Scale,
  Utensils,
  Car,
  Tv,
  HeartPulse,
  GraduationCap,
  Gift,
  ShoppingBag,
  Smartphone,
  Plane,
  Music,
  Wifi,
  Tag,
  DollarSign,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  // Avatars
  User,
  UserCheck,
  Briefcase,
  Coffee,
  Home,
  Smile,
  Shield,
  Heart,
  Star,
  Compass,
  Zap,
  Sparkles,

  // Accounts
  Wallet,
  Building2,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Coins,
  Banknote,
  Vault,
  Receipt,
  Scale,

  // Categories
  Utensils,
  Car,
  Tv,
  HeartPulse,
  GraduationCap,
  Gift,
  ShoppingBag,
  Smartphone,
  Plane,
  Music,
  Wifi,
  Tag,
  DollarSign,
  HelpCircle,
};

interface KoinIconProps extends LucideProps {
  name: string;
}

/**
 * Universal Vector SVG Icon Component for Koin.
 * Enforces strictly 100% SVG Lucide icons - ZERO EMOJIS.
 */
export const KoinIcon: React.FC<KoinIconProps> = ({ name, ...props }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent {...props} />;
};

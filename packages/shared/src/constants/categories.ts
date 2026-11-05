import { AllowedCategoryIcon } from './icons';

export interface DefaultCategoryDefinition {
  name: string;
  type: 'expense' | 'income';
  icon: AllowedCategoryIcon;
  color: string;
  sortOrder: number;
}

export const DEFAULT_CATEGORIES: DefaultCategoryDefinition[] = [
  // Expenses
  { name: 'Alimentación', type: 'expense', icon: 'Utensils', color: '#F59E0B', sortOrder: 1 },
  { name: 'Transporte', type: 'expense', icon: 'Car', color: '#3B82F6', sortOrder: 2 },
  { name: 'Vivienda y Servicios', type: 'expense', icon: 'Home', color: '#10B981', sortOrder: 3 },
  { name: 'Suscripciones y Ocio', type: 'expense', icon: 'Tv', color: '#8B5CF6', sortOrder: 4 },
  { name: 'Salud y Cuidado', type: 'expense', icon: 'HeartPulse', color: '#EF4444', sortOrder: 5 },
  { name: 'Educación', type: 'expense', icon: 'GraduationCap', color: '#06B6D4', sortOrder: 6 },
  { name: 'Compras y Ropa', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', sortOrder: 7 },
  { name: 'Otros Gastos', type: 'expense', icon: 'Tag', color: '#6B7280', sortOrder: 8 },

  // Income
  { name: 'Salario / Nómina', type: 'income', icon: 'Briefcase', color: '#10B981', sortOrder: 1 },
  { name: 'Inversiones y Dividendos', type: 'income', icon: 'TrendingUp', color: '#3B82F6', sortOrder: 2 },
  { name: 'Regalos / Bonos', type: 'income', icon: 'Gift', color: '#8B5CF6', sortOrder: 3 },
  { name: 'Otros Ingresos', type: 'income', icon: 'DollarSign', color: '#6B7280', sortOrder: 4 },
];

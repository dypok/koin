import { create } from 'zustand';
import {
  AnalyticsSummaryDTO,
  CategoryExpenseItemDTO,
  MonthlyCashflowItemDTO,
} from '@koin/shared';
import { apiRequest } from '../lib/api';

interface AnalyticsState {
  summary: AnalyticsSummaryDTO | null;
  categoryExpenses: CategoryExpenseItemDTO[];
  cashflow: MonthlyCashflowItemDTO[];
  selectedMonth: string;
  isLoadingSummary: boolean;
  isLoadingCategories: boolean;
  isLoadingCashflow: boolean;
  error: string | null;

  setSelectedMonth: (month: string) => void;
  fetchSummary: (profileId?: string) => Promise<AnalyticsSummaryDTO | null>;
  fetchCategoryExpenses: (month?: string, profileId?: string) => Promise<CategoryExpenseItemDTO[]>;
  fetchCashflow: (months?: number, profileId?: string) => Promise<MonthlyCashflowItemDTO[]>;
  clearError: () => void;
}

const getCurrentMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  summary: null,
  categoryExpenses: [],
  cashflow: [],
  selectedMonth: getCurrentMonthString(),
  isLoadingSummary: false,
  isLoadingCategories: false,
  isLoadingCashflow: false,
  error: null,

  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
  },

  fetchSummary: async (profileId?: string) => {
    set({ isLoadingSummary: true, error: null });
    try {
      const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
      const res = await apiRequest<any>('/analytics/summary', { headers });
      const summary: AnalyticsSummaryDTO = res.data || res;
      set({ summary, isLoadingSummary: false });
      return summary;
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener resumen analítico', isLoadingSummary: false });
      return null;
    }
  },

  fetchCategoryExpenses: async (month?: string, profileId?: string) => {
    set({ isLoadingCategories: true, error: null });
    const targetMonth = month || get().selectedMonth || getCurrentMonthString();
    try {
      const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
      const endpoint = `/analytics/categories?month=${encodeURIComponent(targetMonth)}`;
      const res = await apiRequest<any>(endpoint, { headers });
      const items: CategoryExpenseItemDTO[] = Array.isArray(res) ? res : res.data || [];
      set({ categoryExpenses: items, isLoadingCategories: false });
      return items;
    } catch (err: any) {
      set({
        error: err.message || 'Error al obtener gastos por categoría',
        isLoadingCategories: false,
      });
      return [];
    }
  },

  fetchCashflow: async (months = 6, profileId?: string) => {
    set({ isLoadingCashflow: true, error: null });
    try {
      const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
      const endpoint = `/analytics/cashflow?months=${months}`;
      const res = await apiRequest<any>(endpoint, { headers });
      const items: MonthlyCashflowItemDTO[] = Array.isArray(res) ? res : res.data || [];
      set({ cashflow: items, isLoadingCashflow: false });
      return items;
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener flujo de caja', isLoadingCashflow: false });
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));

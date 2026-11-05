import { create } from 'zustand';
import {
  RecurringRuleDTO,
  CreateRecurringRuleInput,
  UpdateRecurringRuleInput,
  TransactionDTO,
} from '@koin/shared';
import { apiRequest } from '../lib/api';

interface RecurringState {
  rules: RecurringRuleDTO[];
  isLoading: boolean;
  error: string | null;

  fetchRules: (profileId?: string, status?: string) => Promise<void>;
  createRule: (data: CreateRecurringRuleInput, profileId?: string) => Promise<RecurringRuleDTO>;
  updateRule: (id: string, data: UpdateRecurringRuleInput) => Promise<RecurringRuleDTO>;
  deleteRule: (id: string) => Promise<void>;
  applyRuleNow: (id: string) => Promise<{ transaction: TransactionDTO; recurringRule: RecurringRuleDTO }>;
  processDueRules: () => Promise<number>;
  clearError: () => void;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,

  fetchRules: async (profileId?: string, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      let endpoint = '/recurring';
      const params = new URLSearchParams();
      if (profileId) params.append('profileId', profileId);
      if (status) params.append('status', status);
      const queryStr = params.toString();
      if (queryStr) endpoint += `?${queryStr}`;

      const res = await apiRequest<{ data: RecurringRuleDTO[] }>(endpoint);
      set({ rules: res.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener compromisos recurrentes', isLoading: false });
    }
  },

  createRule: async (data: CreateRecurringRuleInput, profileId?: string) => {
    set({ error: null });
    const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
    const res = await apiRequest<{ data: RecurringRuleDTO }>('/recurring', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const newRule = res.data;
    set((state) => ({ rules: [newRule, ...state.rules] }));
    return newRule;
  },

  updateRule: async (id: string, data: UpdateRecurringRuleInput) => {
    set({ error: null });
    const res = await apiRequest<{ data: RecurringRuleDTO }>(`/recurring/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const updated = res.data;
    set((state) => ({
      rules: state.rules.map((r) => (r.id === id ? updated : r)),
    }));
    return updated;
  },

  deleteRule: async (id: string) => {
    set({ error: null });
    await apiRequest(`/recurring/${id}`, { method: 'DELETE' });
    set((state) => ({ rules: state.rules.filter((r) => r.id !== id) }));
  },

  applyRuleNow: async (id: string) => {
    set({ error: null });
    const res = await apiRequest<{
      data: { transaction: TransactionDTO; recurringRule: RecurringRuleDTO };
    }>(`/recurring/${id}/apply`, {
      method: 'POST',
    });
    const { recurringRule } = res.data;
    set((state) => ({
      rules: state.rules.map((r) => (r.id === id ? recurringRule : r)),
    }));
    return res.data;
  },

  processDueRules: async () => {
    const res = await apiRequest<{ data: { appliedCount: number } }>('/recurring/process-due', {
      method: 'POST',
    });
    // Refresh rules to reflect advanced dates
    await get().fetchRules();
    return res.data?.appliedCount || 0;
  },

  clearError: () => set({ error: null }),
}));

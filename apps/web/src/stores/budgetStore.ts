import { create } from 'zustand';
import { BudgetDTO, CreateBudgetInput, UpdateBudgetInput } from '@koin/shared';
import { apiRequest } from '../lib/api';

interface BudgetState {
  budgets: BudgetDTO[];
  isLoading: boolean;
  error: string | null;

  fetchBudgets: (profileId?: string) => Promise<BudgetDTO[]>;
  upsertBudget: (data: CreateBudgetInput, profileId?: string) => Promise<BudgetDTO>;
  updateBudget: (id: string, data: UpdateBudgetInput, profileId?: string) => Promise<BudgetDTO>;
  deleteBudget: (id: string, profileId?: string) => Promise<void>;
  clearError: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async (profileId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = profileId ? `/budgets?profileId=${profileId}` : '/budgets';
      const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
      const res = await apiRequest<any>(endpoint, { headers });
      const items: BudgetDTO[] = Array.isArray(res) ? res : res.data || [];
      set({ budgets: items, isLoading: false });
      return items;
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener presupuestos', isLoading: false });
      return [];
    }
  },

  upsertBudget: async (data: CreateBudgetInput, profileId?: string) => {
    set({ error: null });
    const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
    const res = await apiRequest<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
    const budget = (res.data || res) as BudgetDTO;
    await get().fetchBudgets(profileId);
    return budget;
  },

  updateBudget: async (id: string, data: UpdateBudgetInput, profileId?: string) => {
    set({ error: null });
    const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
    const res = await apiRequest<any>(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers,
    });
    const budget = (res.data || res) as BudgetDTO;
    await get().fetchBudgets(profileId);
    return budget;
  },

  deleteBudget: async (id: string, profileId?: string) => {
    set({ error: null });
    const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
    await apiRequest(`/budgets/${id}`, {
      method: 'DELETE',
      headers,
    });
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  clearError: () => set({ error: null }),
}));

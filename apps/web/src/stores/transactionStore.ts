import { create } from 'zustand';
import {
  TransactionDTO,
  CategoryWithUsageDTO,
  ExchangeRateDTO,
  CreateTransactionInput,
  CreateTransferInput,
} from '@koin/shared';
import { apiRequest } from '../lib/api';
import { useAccountStore } from './accountStore';

export interface RecentToastInfo {
  id: string;
  txId: string;
  type: 'expense' | 'income' | 'transfer';
  amount: string;
  currency: string;
  categoryName?: string;
  accountName?: string;
  toAccountName?: string;
}

export interface TransactionFilterParams {
  accountId?: string;
  categoryId?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface TransactionState {
  transactions: TransactionDTO[];
  categories: CategoryWithUsageDTO[];
  exchangeRates: ExchangeRateDTO[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingCategories: boolean;
  error: string | null;
  recentToast: RecentToastInfo | null;
  toastTimer: any | null;

  fetchCategories: (profileId?: string) => Promise<CategoryWithUsageDTO[]>;
  fetchExchangeRates: () => Promise<ExchangeRateDTO[]>;
  fetchTransactions: (filters?: TransactionFilterParams, profileId?: string) => Promise<void>;
  createTransaction: (data: CreateTransactionInput, profileId?: string) => Promise<TransactionDTO>;
  createTransfer: (data: CreateTransferInput, profileId?: string) => Promise<TransactionDTO>;
  deleteTransaction: (id: string, profileId?: string) => Promise<void>;
  undoLastTransaction: () => Promise<void>;
  dismissToast: () => void;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  categories: [],
  exchangeRates: [],
  totalCount: 0,
  hasMore: false,
  isLoading: false,
  isLoadingCategories: false,
  error: null,
  recentToast: null,
  toastTimer: null,

  fetchCategories: async (profileId?: string) => {
    set({ isLoadingCategories: true, error: null });
    try {
      const endpoint = profileId ? `/categories?profileId=${profileId}` : '/categories';
      const res = await apiRequest<any>(endpoint);
      const items: CategoryWithUsageDTO[] = Array.isArray(res) ? res : res.data || [];
      set({ categories: items, isLoadingCategories: false });
      return items;
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener categorías', isLoadingCategories: false });
      return [];
    }
  },

  fetchExchangeRates: async () => {
    try {
      const res = await apiRequest<any>('/currencies/rates');
      const items: ExchangeRateDTO[] = Array.isArray(res) ? res : res.data || [];
      set({ exchangeRates: items });
      return items;
    } catch (err: any) {
      console.warn('Could not fetch exchange rates:', err);
      return [];
    }
  },

  fetchTransactions: async (filters: TransactionFilterParams = {}, profileId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (profileId) params.append('profileId', profileId);
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.offset !== undefined) params.append('offset', String(filters.offset));

      const queryStr = params.toString();
      const endpoint = queryStr ? `/transactions?${queryStr}` : '/transactions';
      const res = await apiRequest<any>(endpoint);

      const items: TransactionDTO[] = res.items || (Array.isArray(res) ? res : res.data || []);
      const totalCount = res.totalCount ?? items.length;
      const hasMore = res.hasMore ?? false;

      set({
        transactions: items,
        totalCount,
        hasMore,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener transacciones', isLoading: false });
    }
  },

  createTransaction: async (data: CreateTransactionInput, profileId?: string) => {
    set({ error: null });
    const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;

    const res = await apiRequest<any>('/transactions', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const newTx: TransactionDTO = res.data || res;

    // Prepend to current list
    set((state) => ({
      transactions: [newTx, ...state.transactions],
      totalCount: state.totalCount + 1,
    }));

    // Trigger real-time balance update in accounts store
    useAccountStore.getState().fetchAccounts(profileId);

    // Refresh categories usage counts
    get().fetchCategories(profileId);

    // Setup 5-second Undo Toast
    if (get().toastTimer) {
      clearTimeout(get().toastTimer);
    }
    const timer = setTimeout(() => {
      set({ recentToast: null, toastTimer: null });
    }, 5000);

    set({
      recentToast: {
        id: Math.random().toString(36).substring(7),
        txId: newTx.id,
        type: newTx.type as 'expense' | 'income' | 'transfer',
        amount: newTx.amount,
        currency: newTx.currency,
        categoryName: newTx.categoryName || 'General',
        accountName: newTx.accountName || 'Cuenta',
      },
      toastTimer: timer,
    });

    return newTx;
  },

  createTransfer: async (data: CreateTransferInput, profileId?: string) => {
    set({ error: null });
    const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;

    const res = await apiRequest<any>('/transfers', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const newTransfer: TransactionDTO = res.data || res;

    set((state) => ({
      transactions: [newTransfer, ...state.transactions],
      totalCount: state.totalCount + 1,
    }));

    useAccountStore.getState().fetchAccounts(profileId);

    if (get().toastTimer) {
      clearTimeout(get().toastTimer);
    }
    const timer = setTimeout(() => {
      set({ recentToast: null, toastTimer: null });
    }, 5000);

    set({
      recentToast: {
        id: Math.random().toString(36).substring(7),
        txId: newTransfer.id,
        type: 'transfer',
        amount: newTransfer.amount,
        currency: newTransfer.currency,
        accountName: newTransfer.accountName,
        toAccountName: newTransfer.toAccountName,
      },
      toastTimer: timer,
    });

    return newTransfer;
  },

  deleteTransaction: async (id: string, profileId?: string) => {
    set({ error: null });
    const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;

    await apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
      headers,
    });

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      totalCount: Math.max(0, state.totalCount - 1),
    }));

    useAccountStore.getState().fetchAccounts(profileId);
    get().fetchCategories(profileId);
  },

  undoLastTransaction: async () => {
    const toast = get().recentToast;
    if (!toast || !toast.txId) return;

    if (get().toastTimer) {
      clearTimeout(get().toastTimer);
    }
    set({ recentToast: null, toastTimer: null });

    try {
      await get().deleteTransaction(toast.txId);
    } catch (err: any) {
      console.error('Failed to undo transaction:', err);
    }
  },

  dismissToast: () => {
    if (get().toastTimer) {
      clearTimeout(get().toastTimer);
    }
    set({ recentToast: null, toastTimer: null });
  },

  clearError: () => set({ error: null }),
}));

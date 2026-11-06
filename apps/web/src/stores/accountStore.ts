import { create } from 'zustand';
import {
  AccountDTO,
  AccountMemberDTO,
  AccountInvitationDTO,
  CreateAccountInput,
  UpdateAccountInput,
} from '@koin/shared';
import { apiRequest } from '../lib/api';

interface AccountState {
  accounts: AccountDTO[];
  isLoading: boolean;
  error: string | null;

  fetchAccounts: (profileId?: string) => Promise<void>;
  createAccount: (data: CreateAccountInput, profileId?: string) => Promise<AccountDTO>;
  updateAccount: (id: string, data: UpdateAccountInput, profileId?: string) => Promise<AccountDTO>;
  deleteAccount: (id: string) => Promise<void>;

  createInvitation: (accountId: string, role?: 'editor' | 'viewer') => Promise<AccountInvitationDTO>;
  fetchMembers: (accountId: string) => Promise<AccountMemberDTO[]>;
  updateMemberRole: (accountId: string, memberId: string, role: 'editor' | 'viewer') => Promise<void>;
  removeMember: (accountId: string, memberId: string) => Promise<void>;
  leaveAccount: (accountId: string) => Promise<void>;

  validateInvitation: (token: string) => Promise<AccountInvitationDTO>;
  acceptInvitation: (token: string, profileId: string) => Promise<AccountDTO>;
  clearError: () => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async (profileId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = profileId ? `/accounts?profileId=${profileId}` : '/accounts';
      const res = await apiRequest<{ data: AccountDTO[] }>(endpoint);
      set({ accounts: res.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener cuentas', isLoading: false });
    }
  },

  createAccount: async (data: CreateAccountInput, profileId?: string) => {
    set({ error: null });
    const headers = profileId ? { 'X-Profile-ID': profileId } : undefined;
    const res = await apiRequest<{ data: AccountDTO }>('/accounts', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const newAccount = res.data;
    set((state) => ({ accounts: [...state.accounts, newAccount] }));
    return newAccount;
  },

  updateAccount: async (id: string, data: UpdateAccountInput, profileId?: string) => {
    set({ error: null });
    const res = await apiRequest<{ data: AccountDTO }>(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const updated = res.data;
    if (profileId) {
      await get().fetchAccounts(profileId);
    } else {
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      }));
    }
    return updated;
  },

  deleteAccount: async (id: string) => {
    set({ error: null });
    await apiRequest(`/accounts/${id}`, { method: 'DELETE' });
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
  },

  createInvitation: async (accountId: string, role: 'editor' | 'viewer' = 'editor') => {
    set({ error: null });
    const res = await apiRequest<{ data: AccountInvitationDTO }>(`/accounts/${accountId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    return res.data;
  },

  fetchMembers: async (accountId: string) => {
    const res = await apiRequest<{ data: AccountMemberDTO[] }>(`/accounts/${accountId}/members`);
    return res.data || [];
  },

  updateMemberRole: async (accountId: string, memberId: string, role: 'editor' | 'viewer') => {
    await apiRequest(`/accounts/${accountId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  removeMember: async (accountId: string, memberId: string) => {
    await apiRequest(`/accounts/${accountId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  leaveAccount: async (accountId: string) => {
    await apiRequest(`/accounts/${accountId}/leave`, {
      method: 'POST',
    });
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== accountId) }));
  },

  validateInvitation: async (token: string) => {
    const res = await apiRequest<{ data: AccountInvitationDTO }>(`/invitations/validate?token=${encodeURIComponent(token)}`);
    return res.data;
  },

  acceptInvitation: async (token: string, profileId: string) => {
    set({ error: null });
    const res = await apiRequest<{ data: AccountDTO }>('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token, profileId }),
    });
    const joined = res.data;
    set((state) => ({ accounts: [...state.accounts, joined] }));
    return joined;
  },

  clearError: () => set({ error: null }),
}));

import { create } from 'zustand';
import { UserDTO, ProfileDTO } from '@koin/shared';
import { apiRequest } from '../lib/api';
import { applyTheme } from '../lib/theme';

interface AuthState {
  user: UserDTO | null;
  profiles: ProfileDTO[];
  activeProfile: ProfileDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setSession: (user: UserDTO, profiles: ProfileDTO[], token: string, activeProfile?: ProfileDTO | null) => void;
  setActiveProfile: (profile: ProfileDTO) => void;
  fetchProfiles: () => Promise<void>;
  createProfile: (input: {
    name: string;
    avatarIcon?: string;
    baseCurrency?: string;
    themeConfig?: any;
    pin?: string;
    useBiometrics?: boolean;
  }) => Promise<ProfileDTO>;
  updateProfile: (
    id: string,
    input: {
      name?: string;
      avatarIcon?: string;
      baseCurrency?: string;
      themeConfig?: any;
      pin?: string;
      useBiometrics?: boolean;
    }
  ) => Promise<ProfileDTO>;
  deleteProfile: (id: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profiles: [],
  activeProfile: null,
  token: localStorage.getItem('koin_auth_token'),
  isAuthenticated: !!localStorage.getItem('koin_auth_token'),
  isLoading: true,
  error: null,

  setSession: (user, profiles, token, activeProfile = null) => {
    localStorage.setItem('koin_auth_token', token);
    const chosenProfile = activeProfile || profiles[0] || null;
    if (chosenProfile) {
      applyTheme(chosenProfile.themeConfig);
      localStorage.setItem('koin_active_profile_id', chosenProfile.id);
    }
    set({
      user,
      profiles,
      activeProfile: chosenProfile,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  setActiveProfile: (profile) => {
    applyTheme(profile.themeConfig);
    localStorage.setItem('koin_active_profile_id', profile.id);
    set({ activeProfile: profile });
  },

  fetchProfiles: async () => {
    try {
      const response = await apiRequest<{ data: ProfileDTO[] }>('/profiles');
      const profiles = response.data || [];
      const currentActive = get().activeProfile;
      const matched = profiles.find((p) => p.id === currentActive?.id) || profiles[0] || null;
      if (matched) {
        applyTheme(matched.themeConfig);
      }
      set({ profiles, activeProfile: matched });
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener perfiles' });
    }
  },

  createProfile: async (input) => {
    try {
      const response = await apiRequest<{ data: ProfileDTO; message: string }>('/profiles', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      const created = response.data;
      const currentProfiles = get().profiles;
      const updatedProfiles = [...currentProfiles, created];
      set({ profiles: updatedProfiles });
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Error al crear perfil' });
      throw err;
    }
  },

  updateProfile: async (id, input) => {
    try {
      const response = await apiRequest<{ data: ProfileDTO; message: string }>(`/profiles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      const updated = response.data;
      const currentProfiles = get().profiles;
      const updatedProfiles = currentProfiles.map((p) => (p.id === id ? updated : p));
      
      const currentActive = get().activeProfile;
      let activeProfile = currentActive;
      if (currentActive?.id === id) {
        activeProfile = updated;
        applyTheme(updated.themeConfig);
      }
      set({ profiles: updatedProfiles, activeProfile });
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Error al actualizar perfil' });
      throw err;
    }
  },

  deleteProfile: async (id) => {
    try {
      await apiRequest(`/profiles/${id}`, { method: 'DELETE' });
      const currentProfiles = get().profiles;
      const filtered = currentProfiles.filter((p) => p.id !== id);
      const currentActive = get().activeProfile;
      let nextActive = currentActive;
      if (currentActive?.id === id) {
        nextActive = filtered[0] || null;
        if (nextActive) {
          applyTheme(nextActive.themeConfig);
          localStorage.setItem('koin_active_profile_id', nextActive.id);
        }
      }
      set({ profiles: filtered, activeProfile: nextActive });
    } catch (err: any) {
      set({ error: err.message || 'Error al eliminar perfil' });
      throw err;
    }
  },

  logout: () => {
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('koin_auth_token');
    localStorage.removeItem('koin_active_profile_id');
    set({
      user: null,
      profiles: [],
      activeProfile: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  checkSession: async () => {
    const token = localStorage.getItem('koin_auth_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true });
      const response = await apiRequest<{ data: { user: UserDTO; profiles: ProfileDTO[] } }>('/auth/me');
      const { user, profiles } = response.data;
      const savedProfileId = localStorage.getItem('koin_active_profile_id');
      const matchedProfile = profiles.find((p) => p.id === savedProfileId) || profiles[0] || null;

      if (matchedProfile) {
        applyTheme(matchedProfile.themeConfig);
      }

      set({
        user,
        profiles,
        activeProfile: matchedProfile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      localStorage.removeItem('koin_auth_token');
      set({
        user: null,
        profiles: [],
        activeProfile: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

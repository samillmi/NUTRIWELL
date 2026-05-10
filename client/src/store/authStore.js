import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMe } from '../api/authApi';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) => {
        localStorage.setItem('accessToken', token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, token: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        try {
          set({ isLoading: true });
          const { data } = await getMe();
          set({ user: data.data.user, isAuthenticated: true });
        } catch {
          get().clearAuth();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ token: s.token }),
    }
  )
);

export default useAuthStore;

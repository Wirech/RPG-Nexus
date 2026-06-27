import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,

      // Ações
      login: (user, token) => 
        set({ 
          user, 
          token, 
          isAuthenticated: true 
        }),

      logout: () => 
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        }),

      setUser: (user) => 
        set({ user }),

      setToken: (token) => 
        set({ token }),
    }),
    {
      name: 'nexus-auth', // nome da chave no localStorage
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  isSpectator: boolean;
  isPending: boolean;
  linkedCharacterId: string | null;
}

export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated } = useAuthStore();

  return useMemo(() => ({
    user,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isPlayer: user?.role === 'player',
    isSpectator: user?.role === 'spectator',
    isPending: user?.role === 'pending' || user?.status === 'pending',
    linkedCharacterId: user?.linkedCharacterId ?? null,
  }), [user, isAuthenticated]);
}

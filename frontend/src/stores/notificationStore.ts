import { create } from 'zustand';
import type { AccessRequest } from '../types';

interface NotificationState {
  pendingRequests: AccessRequest[];
}

interface NotificationActions {
  addPendingRequest: (request: AccessRequest) => void;
  removePendingRequest: (userId: string) => void;
  setPendingRequests: (requests: AccessRequest[]) => void;
  clearPendingRequests: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()((set) => ({
  // Estado inicial
  pendingRequests: [],

  // Ações
  addPendingRequest: (request) =>
    set((state) => ({
      pendingRequests: [
        request,
        ...state.pendingRequests.filter((r) => r.userId !== request.userId),
      ],
    })),

  removePendingRequest: (userId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.userId !== userId),
    })),

  setPendingRequests: (requests) =>
    set({ pendingRequests: requests }),

  clearPendingRequests: () =>
    set({ pendingRequests: [] }),
}));

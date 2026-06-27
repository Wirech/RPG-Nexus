import { create } from 'zustand';
import type { CombatSession, CombatParticipant, CombatEvent } from '../types';

interface CombatState {
  activeCombat: CombatSession | null;
  participants: CombatParticipant[];
  events: CombatEvent[];
  currentRound: number;
}

interface CombatActions {
  setActiveCombat: (combat: CombatSession | null) => void;
  setParticipants: (participants: CombatParticipant[]) => void;
  updateParticipant: (participantId: string, changes: Partial<CombatParticipant>) => void;
  addEvent: (event: CombatEvent) => void;
  setEvents: (events: CombatEvent[]) => void;
  setRound: (round: number) => void;
  reset: () => void;
}

type CombatStore = CombatState & CombatActions;

const initialState: CombatState = {
  activeCombat: null,
  participants: [],
  events: [],
  currentRound: 1,
};

export const useCombatStore = create<CombatStore>()((set) => ({
  // Estado inicial
  ...initialState,

  // Ações
  setActiveCombat: (combat) =>
    set({
      activeCombat: combat,
      participants: combat?.participants || [],
      events: combat?.events || [],
      currentRound: combat?.roundCurrent || 1,
    }),

  setParticipants: (participants) =>
    set({ participants }),

  updateParticipant: (participantId, changes) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === participantId ? { ...p, ...changes } : p
      ),
    })),

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100), // mantém últimos 100 eventos
    })),

  setEvents: (events) =>
    set({ events }),

  setRound: (round) =>
    set((state) => ({
      currentRound: round,
      activeCombat: state.activeCombat
        ? { ...state.activeCombat, roundCurrent: round }
        : null,
    })),

  reset: () => set(initialState),
}));

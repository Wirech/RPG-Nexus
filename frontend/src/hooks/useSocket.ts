import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useCombatStore } from '../stores/combatStore';
import { SOCKET_EVENTS, type AccessRequest, type CombatEvent, type CombatParticipant } from '../types';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token, isAuthenticated, setUser } = useAuthStore();
  const { addPendingRequest } = useNotificationStore();
  const { updateParticipant, addEvent, setRound } = useCombatStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Desconecta se não autenticado
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Conecta ao socket
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current = socket;

    // Identificação após conexão
    socket.on('connect', () => {
      socket.emit(SOCKET_EVENTS.AUTH_IDENTIFY, { token });
    });

    // Evento de identificação confirmada
    socket.on('auth:identified', (data: { userId: string; role: string }) => {
      console.log('Socket identificado:', data);
    });

    // Erro de socket
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
      toast.error(error.message);
    });

    // ─────────────────────────────────────────
    // EVENTOS DE ACESSO
    // ─────────────────────────────────────────

    // Nova solicitação de acesso (admin only)
    socket.on(SOCKET_EVENTS.ACCESS_NEW_REQUEST, (request: AccessRequest) => {
      addPendingRequest(request);
      toast('Nova solicitação de acesso recebida!', {
        icon: '🔔',
        duration: 5000,
      });
    });

    // Acesso aprovado
    socket.on(SOCKET_EVENTS.ACCESS_APPROVED, (data: { user: { id: string; role: string } }) => {
      setUser({ ...useAuthStore.getState().user!, role: data.user.role as 'admin' | 'player' | 'spectator' | 'pending' });
      toast.success('Seu acesso foi aprovado!');
      window.location.href = '/';
    });

    // Acesso rejeitado
    socket.on(SOCKET_EVENTS.ACCESS_REJECTED, (data: { reason?: string }) => {
      const message = data.reason || 'Sua solicitação de acesso foi recusada.';
      toast.error(message);
      // Redireciona para página de pending com mensagem
      window.location.href = `/pending?rejected=true&reason=${encodeURIComponent(message)}`;
    });

    // ─────────────────────────────────────────
    // EVENTOS DE COMBATE
    // ─────────────────────────────────────────

    // Atualização de participante do combate
    socket.on(SOCKET_EVENTS.COMBAT_UPDATED, (data: { 
      participantId: string; 
      field?: string; 
      oldVal?: number; 
      newVal?: number;
      conditions?: string[];
    }) => {
      const changes: Partial<CombatParticipant> = {};
      
      if (data.field && data.newVal !== undefined) {
        const fieldMap: Record<string, string> = {
          pv: 'pvCurrent',
          san: 'sanCurrent',
          pe: 'peCurrent',
        };
        const key = fieldMap[data.field] as keyof CombatParticipant;
        if (key) {
          (changes as Record<string, number>)[key] = data.newVal;
        }
      }
      
      if (data.conditions) {
        changes.conditions = data.conditions;
      }
      
      updateParticipant(data.participantId, changes);
    });

    // Novo evento de combate
    socket.on(SOCKET_EVENTS.COMBAT_EVENT, (data: { event: CombatEvent }) => {
      addEvent(data.event);
    });

    // Mudança de rodada
    socket.on(SOCKET_EVENTS.COMBAT_ROUND_CHANGE, (data: { combatId: string; round: number }) => {
      setRound(data.round);
      toast(`Rodada ${data.round}`, { icon: '⚔️' });
    });

    // ─────────────────────────────────────────
    // NOTIFICAÇÃO GERAL
    // ─────────────────────────────────────────

    socket.on(SOCKET_EVENTS.NOTIFICATION_GENERAL, (data: { message: string; type?: 'info' | 'success' | 'error' }) => {
      if (data.type === 'error') {
        toast.error(data.message);
      } else if (data.type === 'success') {
        toast.success(data.message);
      } else {
        toast(data.message);
      }
    });

    // Cleanup na desmontagem
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, setUser, addPendingRequest, updateParticipant, addEvent, setRound]);

  // Funções para entrar/sair de sala de combate
  const joinCombat = useCallback((combatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.COMBAT_JOIN, { combatId });
    }
  }, []);

  const leaveCombat = useCallback((combatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.COMBAT_LEAVE, { combatId });
    }
  }, []);

  return {
    socket: socketRef.current,
    joinCombat,
    leaveCombat,
  };
}

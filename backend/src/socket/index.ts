import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { SOCKET_EVENTS, SOCKET_ROOMS } from './events';

// Map para associar userId ao socketId
const userSockets = new Map<string, string>();

export function initSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket conectado: ${socket.id}`);

    // Identificação do usuário
    socket.on(SOCKET_EVENTS.AUTH_IDENTIFY, async (data: { token: string }) => {
      try {
        const decoded = verifyToken(data.token);
        
        if (!decoded) {
          socket.emit('error', { message: 'Token inválido' });
          return;
        }

        // Busca usuário para verificar role
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, role: true, status: true },
        });

        if (!user) {
          socket.emit('error', { message: 'Usuário não encontrado' });
          return;
        }

        // Associa socket ao usuário (incluindo pendentes para receber notificações)
        userSockets.set(user.id, socket.id);
        (socket as Socket & { userId?: string }).userId = user.id;
        console.log(`Socket registrado: userId=${user.id}, socketId=${socket.id}, role=${user.role}, status=${user.status}`);

        // Admin entra automaticamente na sala de admins
        if (user.role === 'admin' && user.status === 'active') {
          socket.join(SOCKET_ROOMS.ADMINS);
          logger.debug(`Admin ${user.id} entrou na sala admins`);
        }

        socket.emit('auth:identified', { userId: user.id, role: user.role });
        logger.info(`Socket ${socket.id} identificado como usuário ${user.id}`);
      } catch (error) {
        logger.error('Erro na identificação do socket:', error);
        socket.emit('error', { message: 'Erro na identificação' });
      }
    });

    // Entrar na sala de combate
    socket.on(SOCKET_EVENTS.COMBAT_JOIN, (data: { combatId: string }) => {
      const room = SOCKET_ROOMS.combatRoom(data.combatId);
      socket.join(room);
      logger.debug(`Socket ${socket.id} entrou na sala ${room}`);
    });

    // Sair da sala de combate
    socket.on(SOCKET_EVENTS.COMBAT_LEAVE, (data: { combatId: string }) => {
      const room = SOCKET_ROOMS.combatRoom(data.combatId);
      socket.leave(room);
      logger.debug(`Socket ${socket.id} saiu da sala ${room}`);
    });

    // Desconexão
    socket.on('disconnect', () => {
      const extendedSocket = socket as Socket & { userId?: string };
      if (extendedSocket.userId) {
        userSockets.delete(extendedSocket.userId);
        logger.debug(`Usuário ${extendedSocket.userId} desconectado`);
      }
      logger.debug(`Socket desconectado: ${socket.id}`);
    });
  });
}

// Funções utilitárias para emitir eventos

export function emitToUser(io: Server, userId: string, event: string, data: unknown): void {
  const socketId = userSockets.get(userId);
  console.log(`emitToUser: userId=${userId}, socketId=${socketId}, event=${event}`);
  if (socketId) {
    io.to(socketId).emit(event, data);
    console.log(`Evento ${event} emitido para socket ${socketId}`);
  } else {
    console.log(`Nenhum socket encontrado para userId ${userId}. Sockets registrados:`, Array.from(userSockets.entries()));
  }
}

export function emitToAdmins(io: Server, event: string, data: unknown): void {
  io.to(SOCKET_ROOMS.ADMINS).emit(event, data);
}

export function emitToCombat(io: Server, combatId: string, event: string, data: unknown): void {
  io.to(SOCKET_ROOMS.combatRoom(combatId)).emit(event, data);
}

export { SOCKET_EVENTS, SOCKET_ROOMS };

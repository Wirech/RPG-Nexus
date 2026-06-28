import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { io } from '../app';
import { emitToUser, emitToAdmins, SOCKET_EVENTS } from '../socket';

export class UserController {
  // GET / - Lista todos os usuários
  async list(req: Request, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          linkedCharacters: {
            include: { character: { select: { id: true, name: true } } },
          },
          createdAt: true,
          approvedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transforma para compatibilidade com frontend
      const usersWithLinked = users.map(u => ({
        ...u,
        linkedCharacterIds: u.linkedCharacters.map(lc => lc.characterId),
        linkedCharacterNames: u.linkedCharacters.map(lc => lc.character.name),
      }));

      res.json(usersWithLinked);
    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /pending - Lista solicitações pendentes
  async listPending(req: Request, res: Response): Promise<void> {
    try {
      const requests = await prisma.accessRequest.findMany({
        where: { status: 'pending' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              createdAt: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      res.json(requests);
    } catch (error) {
      logger.error('Erro ao listar pendentes:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /approve/:id - Aprova um usuário
  async approve(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { role, linkedCharacterId } = req.body;

      // Busca o usuário
      const user = await prisma.user.findUnique({
        where: { id },
        include: { accessRequest: true },
      });

      if (!user) {
        res.status(404).json({
          error: true,
          message: 'Usuário não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Type assertion para accessRequest que vem do include
      const accessRequest = user.accessRequest as { status: string } | null;
      if (!accessRequest || accessRequest.status !== 'pending') {
        res.status(400).json({
          error: true,
          message: 'Solicitação não está pendente',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      // Atualiza usuário e access request
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          role,
          status: 'active',
          approvedAt: new Date(),
          approvedById: req.user!.id,
          accessRequest: {
            update: {
              status: 'approved',
              reviewedAt: new Date(),
              reviewedById: req.user!.id,
            },
          },
        },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
        },
      });

      // Se tiver linkedCharacterId, cria a relação UserCharacter
      if (linkedCharacterId) {
        await prisma.userCharacter.upsert({
          where: {
            userId_characterId: { userId: id, characterId: linkedCharacterId },
          },
          create: { userId: id, characterId: linkedCharacterId },
          update: {},
        });
      }

      // Emite evento para o usuário aprovado
      console.log('Emitindo ACCESS_APPROVED para userId:', id);
      emitToUser(io, id, SOCKET_EVENTS.ACCESS_APPROVED, {
        user: { id, role: updatedUser.role },
      });

      // Emite evento para os admins atualizarem suas notificações
      emitToAdmins(io, SOCKET_EVENTS.ACCESS_REQUEST_RESOLVED, {
        userId: id,
        action: 'approved',
      });

      // Audit log
      await createAuditLog({
        userId: req.user!.id,
        entityType: 'user',
        entityId: id,
        entityName: user.username,
        action: 'access_granted',
        newValue: JSON.stringify({ role, linkedCharacterId }),
      });

      logger.info(`Usuário aprovado: ${user.username} como ${role}`);

      res.json({ ...updatedUser, linkedCharacterIds: linkedCharacterId ? [linkedCharacterId] : [] });
    } catch (error) {
      logger.error('Erro ao aprovar usuário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /reject/:id - Rejeita um usuário
  async reject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      const user = await prisma.user.findUnique({
        where: { id },
        include: { accessRequest: true },
      });

      if (!user) {
        res.status(404).json({
          error: true,
          message: 'Usuário não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Type assertion para accessRequest que vem do include
      const accessRequest = user.accessRequest as { id: string; status: string } | null;
      if (!accessRequest || accessRequest.status !== 'pending') {
        res.status(400).json({
          error: true,
          message: 'Solicitação não está pendente',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      await prisma.accessRequest.update({
        where: { id: accessRequest.id },
        data: {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedById: req.user!.id,
          rejectionReason: reason || null,
        },
      });

      // Emite evento para o usuário rejeitado
      emitToUser(io, id, SOCKET_EVENTS.ACCESS_REJECTED, {
        userId: id,
        reason,
      });

      // Emite evento para os admins atualizarem suas notificações
      emitToAdmins(io, SOCKET_EVENTS.ACCESS_REQUEST_RESOLVED, {
        userId: id,
        action: 'rejected',
      });

      logger.info(`Usuário rejeitado: ${user.username}`);

      res.json({ message: 'Solicitação rejeitada' });
    } catch (error) {
      logger.error('Erro ao rejeitar usuário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id - Atualiza um usuário
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { role, linkedCharacterId, status } = req.body;

      const user = await prisma.user.findUnique({
        where: { id },
        include: { linkedCharacters: true },
      });

      if (!user) {
        res.status(404).json({
          error: true,
          message: 'Usuário não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (role !== undefined) updateData.role = role;
      if (status !== undefined) updateData.status = status;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          linkedCharacters: {
            select: { characterId: true },
          },
        },
      });

      // Atualiza linkedCharacter se fornecido
      if (linkedCharacterId !== undefined) {
        // Remove todas as vinculações atuais e adiciona a nova
        await prisma.userCharacter.deleteMany({ where: { userId: id } });
        if (linkedCharacterId) {
          await prisma.userCharacter.create({
            data: { userId: id, characterId: linkedCharacterId },
          });
        }
      }

      // Notifica o usuário sobre a atualização
      emitToUser(io, id, SOCKET_EVENTS.USER_UPDATED, {
        user: {
          ...updatedUser,
          linkedCharacterIds: updatedUser.linkedCharacters.map(lc => lc.characterId),
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'user',
        entityId: id,
        entityName: user.username,
        action: 'update',
        oldValue: JSON.stringify({ role: user.role, linkedCharacterIds: user.linkedCharacters.map(lc => lc.characterId) }),
        newValue: JSON.stringify(updateData),
      });

      res.json({
        ...updatedUser,
        linkedCharacterIds: updatedUser.linkedCharacters.map(lc => lc.characterId),
      });
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id - Deleta um usuário
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      // Não permite deletar próprio admin
      if (id === req.user!.id) {
        res.status(403).json({
          error: true,
          message: 'Não é possível deletar seu próprio usuário',
          code: 'FORBIDDEN',
        });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        res.status(404).json({
          error: true,
          message: 'Usuário não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.user.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'user',
        entityId: id,
        entityName: user.username,
        action: 'delete',
      });

      logger.info(`Usuário deletado: ${user.username}`);

      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar usuário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/block - Bloqueia um usuário
  async block(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (id === req.user!.id) {
        res.status(403).json({
          error: true,
          message: 'Não é possível bloquear seu próprio usuário',
          code: 'FORBIDDEN',
        });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        res.status(404).json({
          error: true,
          message: 'Usuário não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.user.update({
        where: { id },
        data: { status: 'blocked' },
      });

      // Notifica o usuário que foi bloqueado
      emitToUser(io, id, SOCKET_EVENTS.NOTIFICATION_GENERAL, {
        message: 'Sua conta foi bloqueada',
        type: 'error',
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'user',
        entityId: id,
        entityName: user.username,
        action: 'update',
        fieldChanged: 'status',
        oldValue: user.status,
        newValue: 'blocked',
      });

      logger.info(`Usuário bloqueado: ${user.username}`);

      res.json({ message: 'Usuário bloqueado' });
    } catch (error) {
      logger.error('Erro ao bloquear usuário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/unblock - Desbloqueia um usuário
  async unblock(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        res.status(404).json({
          error: true,
          message: 'Usuário não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.user.update({
        where: { id },
        data: { status: 'active' },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'user',
        entityId: id,
        entityName: user.username,
        action: 'update',
        fieldChanged: 'status',
        oldValue: user.status,
        newValue: 'active',
      });

      logger.info(`Usuário desbloqueado: ${user.username}`);

      res.json({ message: 'Usuário desbloqueado' });
    } catch (error) {
      logger.error('Erro ao desbloquear usuário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const userController = new UserController();

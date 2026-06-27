import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';

export class SessionController {
  // GET / - Lista sessões
  async list(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await prisma.sessionNote.findMany({
        orderBy: { sessionDate: 'desc' },
      });

      // Parse tags
      const result = sessions.map((s: typeof sessions[number]) => ({
        ...s,
        tags: JSON.parse(s.tags || '[]'),
      }));

      res.json(result);
    } catch (error) {
      logger.error('Erro ao listar sessões:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id - Busca sessão por ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const session = await prisma.sessionNote.findUnique({
        where: { id },
      });

      if (!session) {
        res.status(404).json({
          error: true,
          message: 'Sessão não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      res.json({
        ...session,
        tags: JSON.parse(session.tags || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao buscar sessão:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST / - Cria sessão
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, sessionNumber, sessionDate, content, tags } = req.body;

      const session = await prisma.sessionNote.create({
        data: {
          title,
          sessionNumber,
          sessionDate: sessionDate ? new Date(sessionDate) : null,
          content,
          tags: JSON.stringify(tags || []),
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'session',
        entityId: session.id,
        entityName: title,
        action: 'create',
      });

      res.status(201).json({
        ...session,
        tags: JSON.parse(session.tags || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao criar sessão:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id - Atualiza sessão
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { title, sessionNumber, sessionDate, content, tags } = req.body;

      const existing = await prisma.sessionNote.findUnique({ where: { id } });

      if (!existing) {
        res.status(404).json({
          error: true,
          message: 'Sessão não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      const session = await prisma.sessionNote.update({
        where: { id },
        data: {
          title,
          sessionNumber,
          sessionDate: sessionDate ? new Date(sessionDate) : null,
          content,
          tags: tags !== undefined ? JSON.stringify(tags) : undefined,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'session',
        entityId: id,
        entityName: session.title,
        action: 'update',
      });

      res.json({
        ...session,
        tags: JSON.parse(session.tags || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao atualizar sessão:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id - Deleta sessão
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const session = await prisma.sessionNote.findUnique({ where: { id } });

      if (!session) {
        res.status(404).json({
          error: true,
          message: 'Sessão não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.sessionNote.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'session',
        entityId: id,
        entityName: session.title,
        action: 'delete',
      });

      res.json({ message: 'Sessão excluída com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar sessão:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const sessionController = new SessionController();

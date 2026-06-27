import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';

export class AuditLogController {
  // GET / - Lista logs com filtros e paginação
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = '1', 
        limit = '50',
        entityType,
        entityId,
        action,
        userId,
        startDate,
        endDate,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100); // máximo 100
      const skip = (pageNum - 1) * limitNum;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (entityType) {
        where.entityType = entityType as string;
      }

      if (entityId) {
        where.entityId = entityId as string;
      }

      if (action) {
        where.action = action as string;
      }

      if (userId) {
        where.userId = userId as string;
      }

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate as string);
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Erro ao listar logs:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /entity/:type/:id - Lista logs de uma entidade específica
  async getByEntity(req: Request, res: Response): Promise<void> {
    try {
      const entityType = req.params.type as string;
      const entityId = req.params.id as string;
      const { limit = '50' } = req.query;

      const limitNum = Math.min(parseInt(limit as string, 10), 100);

      const logs = await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
        },
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limitNum,
      });

      res.json(logs);
    } catch (error) {
      logger.error('Erro ao buscar logs por entidade:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /user/:userId - Lista logs de um usuário específico
  async getByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { page = '1', limit = '50' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const skip = (pageNum - 1) * limitNum;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.auditLog.count({ where: { userId } }),
      ]);

      res.json({
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar logs por usuário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /stats - Estatísticas gerais de auditoria
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalLogs,
        actionCounts,
        entityTypeCounts,
        recentActivity,
      ] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { action: true },
        }),
        prisma.auditLog.groupBy({
          by: ['entityType'],
          _count: { entityType: true },
        }),
        prisma.auditLog.findMany({
          orderBy: { timestamp: 'desc' },
          take: 10,
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        }),
      ]);

      res.json({
        totalLogs,
        actionCounts: actionCounts.map(a => ({ 
          action: a.action, 
          count: a._count.action 
        })),
        entityTypeCounts: entityTypeCounts.map(e => ({ 
          entityType: e.entityType, 
          count: e._count.entityType 
        })),
        recentActivity,
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const auditLogController = new AuditLogController();

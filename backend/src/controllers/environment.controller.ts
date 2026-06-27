import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { deleteFile, getRelativePath } from '../middlewares/upload.middleware';
import fs from 'fs';

export class EnvironmentController {
  // GET / - Lista ambientes
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const isAdmin = req.user!.role === 'admin';

      const where: Record<string, unknown> = {};

      // Player só vê revelados
      if (!isAdmin) {
        where.isRevealed = true;
      }

      if (search) {
        where.name = { contains: search as string };
      }

      const environments = await prisma.environment.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' } },
          _count: { select: { points: true } },
        },
        orderBy: { name: 'asc' },
      });

      res.json(environments);
    } catch (error) {
      logger.error('Erro ao listar ambientes:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id - Busca ambiente por ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const isAdmin = req.user!.role === 'admin';

      const environment = await prisma.environment.findUnique({
        where: { id },
        include: {
          images: { orderBy: { order: 'asc' } },
          points: true,
        },
      });

      if (!environment) {
        res.status(404).json({
          error: true,
          message: 'Ambiente não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Verifica permissão
      if (!isAdmin && !environment.isRevealed) {
        res.status(403).json({
          error: true,
          message: 'Acesso negado a este ambiente',
          code: 'FORBIDDEN',
        });
        return;
      }

      res.json(environment);
    } catch (error) {
      logger.error('Erro ao buscar ambiente:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST / - Cria ambiente
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, isRevealed } = req.body;

      const environment = await prisma.environment.create({
        data: {
          name,
          description,
          isRevealed: isRevealed || false,
        },
        include: { images: true },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment',
        entityId: environment.id,
        entityName: environment.name,
        action: 'create',
      });

      res.status(201).json(environment);
    } catch (error) {
      logger.error('Erro ao criar ambiente:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id - Atualiza ambiente
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;

      const environment = await prisma.environment.findUnique({ where: { id } });

      if (!environment) {
        res.status(404).json({
          error: true,
          message: 'Ambiente não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.environment.update({
        where: { id },
        data,
        include: { images: true },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment',
        entityId: id,
        entityName: updated.name,
        action: 'update',
        oldValue: JSON.stringify(environment),
        newValue: JSON.stringify(updated),
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar ambiente:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id - Deleta ambiente
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const environment = await prisma.environment.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!environment) {
        res.status(404).json({
          error: true,
          message: 'Ambiente não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Deleta imagens do filesystem
      for (const image of environment.images) {
        deleteFile(image.filePath);
      }

      await prisma.environment.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment',
        entityId: id,
        entityName: environment.name,
        action: 'delete',
      });

      res.json({ message: 'Ambiente excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar ambiente:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PATCH /:id/reveal - Revela/oculta ambiente
  async reveal(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isRevealed } = req.body;

      const environment = await prisma.environment.findUnique({ where: { id } });

      if (!environment) {
        res.status(404).json({
          error: true,
          message: 'Ambiente não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.environment.update({
        where: { id },
        data: { isRevealed },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment',
        entityId: id,
        entityName: environment.name,
        action: 'update',
        fieldChanged: 'isRevealed',
        oldValue: String(environment.isRevealed),
        newValue: String(isRevealed),
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao revelar ambiente:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/images - Upload de imagem
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { caption } = req.body;

      if (!req.file) {
        res.status(400).json({
          error: true,
          message: 'Nenhum arquivo enviado',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const environment = await prisma.environment.findUnique({ where: { id } });

      if (!environment) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({
          error: true,
          message: 'Ambiente não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Obtém a maior ordem atual
      const maxOrder = await prisma.environmentImage.aggregate({
        where: { environmentId: id },
        _max: { order: true },
      });

      const filePath = getRelativePath('environments', req.file.filename);

      const image = await prisma.environmentImage.create({
        data: {
          environmentId: id,
          filePath,
          caption: caption || null,
          order: (maxOrder._max.order || 0) + 1,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment_image',
        entityId: image.id,
        entityName: `${environment.name} - Imagem`,
        action: 'create',
      });

      res.status(201).json(image);
    } catch (error) {
      logger.error('Erro ao fazer upload de imagem:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/images/:imageId - Deleta imagem
  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const imageId = req.params.imageId as string;

      const image = await prisma.environmentImage.findFirst({
        where: { id: imageId, environmentId: id },
      });

      if (!image) {
        res.status(404).json({
          error: true,
          message: 'Imagem não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Deleta do filesystem
      deleteFile(image.filePath);

      // Deleta do banco
      await prisma.environmentImage.delete({ where: { id: imageId } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment_image',
        entityId: imageId,
        action: 'delete',
      });

      res.json({ message: 'Imagem excluída com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar imagem:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // ==================== POINTS ====================

  // POST /:id/points - Cria ponto no ambiente
  async createPoint(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, description, linkedNpcId } = req.body;

      const environment = await prisma.environment.findUnique({ where: { id } });

      if (!environment) {
        res.status(404).json({
          error: true,
          message: 'Ambiente não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const point = await prisma.environmentPoint.create({
        data: {
          environmentId: id,
          name,
          description,
          linkedNpcId: linkedNpcId || null,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment_point',
        entityId: point.id,
        entityName: `${environment.name} - ${name}`,
        action: 'create',
      });

      res.status(201).json(point);
    } catch (error) {
      logger.error('Erro ao criar ponto:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id/points/:pointId - Atualiza ponto
  async updatePoint(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const pointId = req.params.pointId as string;
      const data = req.body;

      const point = await prisma.environmentPoint.findFirst({
        where: { id: pointId, environmentId: id },
      });

      if (!point) {
        res.status(404).json({
          error: true,
          message: 'Ponto não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.environmentPoint.update({
        where: { id: pointId },
        data,
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment_point',
        entityId: pointId,
        action: 'update',
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar ponto:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/points/:pointId - Deleta ponto
  async deletePoint(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const pointId = req.params.pointId as string;

      const point = await prisma.environmentPoint.findFirst({
        where: { id: pointId, environmentId: id },
      });

      if (!point) {
        res.status(404).json({
          error: true,
          message: 'Ponto não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.environmentPoint.delete({ where: { id: pointId } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'environment_point',
        entityId: pointId,
        entityName: point.name,
        action: 'delete',
      });

      res.json({ message: 'Ponto excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar ponto:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const environmentController = new EnvironmentController();

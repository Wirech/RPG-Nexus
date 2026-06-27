import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { deleteFile, getRelativePath } from '../middlewares/upload.middleware';
import fs from 'fs';

export class DocumentController {
  // GET / - Lista documentos
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { search, tags } = req.query;
      const isAdmin = req.user!.role === 'admin';

      const where: Record<string, unknown> = {};

      // Player só vê revelados
      if (!isAdmin) {
        where.isRevealed = true;
      }

      if (search) {
        where.title = { contains: search as string };
      }

      const documents = await prisma.document.findMany({
        where,
        include: {
          images: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Desserializa tags e filtra se necessário
      let result = documents.map((d) => ({
        ...d,
        tags: JSON.parse(d.tags || '[]'),
      }));

      // Filtra por tags se especificado
      if (tags) {
        const tagList = (tags as string).split(',').map((t) => t.trim().toLowerCase());
        result = result.filter((d) =>
          d.tags.some((tag: string) => tagList.includes(tag.toLowerCase()))
        );
      }

      res.json(result);
    } catch (error) {
      logger.error('Erro ao listar documentos:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id - Busca documento por ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const isAdmin = req.user!.role === 'admin';

      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          images: true,
        },
      });

      if (!document) {
        res.status(404).json({
          error: true,
          message: 'Documento não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Verifica permissão
      if (!isAdmin && !document.isRevealed) {
        res.status(403).json({
          error: true,
          message: 'Acesso negado a este documento',
          code: 'FORBIDDEN',
        });
        return;
      }

      res.json({
        ...document,
        tags: JSON.parse(document.tags || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao buscar documento:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST / - Cria documento
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, content, tags, isRevealed, category } = req.body;

      const document = await prisma.document.create({
        data: {
          title,
          content: content || '',
          tags: tags ? JSON.stringify(tags) : '[]',
          isRevealed: isRevealed || false,
          category,
        },
        include: { images: true },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'document',
        entityId: document.id,
        entityName: document.title,
        action: 'create',
      });

      res.status(201).json({
        ...document,
        tags: JSON.parse(document.tags || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao criar documento:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id - Atualiza documento
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;

      const document = await prisma.document.findUnique({ where: { id } });

      if (!document) {
        res.status(404).json({
          error: true,
          message: 'Documento não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      if (data.tags) {
        data.tags = JSON.stringify(data.tags);
      }

      const updated = await prisma.document.update({
        where: { id },
        data,
        include: { images: true },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'document',
        entityId: id,
        entityName: updated.title,
        action: 'update',
        oldValue: JSON.stringify(document),
        newValue: JSON.stringify(updated),
      });

      res.json({
        ...updated,
        tags: JSON.parse(updated.tags || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao atualizar documento:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id - Deleta documento
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const document = await prisma.document.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!document) {
        res.status(404).json({
          error: true,
          message: 'Documento não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Deleta imagens do filesystem
      for (const image of document.images) {
        deleteFile(image.filePath);
      }

      await prisma.document.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'document',
        entityId: id,
        entityName: document.title,
        action: 'delete',
      });

      res.json({ message: 'Documento excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar documento:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PATCH /:id/reveal - Revela/oculta documento
  async reveal(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isRevealed } = req.body;

      const document = await prisma.document.findUnique({ where: { id } });

      if (!document) {
        res.status(404).json({
          error: true,
          message: 'Documento não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.document.update({
        where: { id },
        data: { isRevealed },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'document',
        entityId: id,
        entityName: document.title,
        action: 'update',
        fieldChanged: 'isRevealed',
        oldValue: String(document.isRevealed),
        newValue: String(isRevealed),
      });

      res.json({
        ...updated,
        tags: JSON.parse(updated.tags || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao revelar documento:', error);
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

      const document = await prisma.document.findUnique({ where: { id } });

      if (!document) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({
          error: true,
          message: 'Documento não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const filePath = getRelativePath('documents', req.file.filename);

      const image = await prisma.documentImage.create({
        data: {
          documentId: id,
          filePath,
          caption: caption || null,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'document_image',
        entityId: image.id,
        entityName: `${document.title} - Imagem`,
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

      const image = await prisma.documentImage.findFirst({
        where: { id: imageId, documentId: id },
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
      await prisma.documentImage.delete({ where: { id: imageId } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'document_image',
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
}

export const documentController = new DocumentController();

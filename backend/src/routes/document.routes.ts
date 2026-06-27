import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadDocument } from '../middlewares/upload.middleware';
import { validate } from '../validators';
import { z } from 'zod';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// GET / - Lista documentos (admin vê todos, player vê revelados)
router.get('/', documentController.list.bind(documentController));

// GET /:id - Busca documento por ID
router.get('/:id', documentController.getById.bind(documentController));

// POST / - Cria documento (admin)
router.post(
  '/',
  requireAdmin,
  validate(
    z.object({
      title: z.string().min(1).max(200),
      content: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isRevealed: z.boolean().default(false),
      category: z.string().max(50).optional(),
    })
  ),
  documentController.create.bind(documentController)
);

// PUT /:id - Atualiza documento (admin)
router.put(
  '/:id',
  requireAdmin,
  validate(
    z.object({
      title: z.string().min(1).max(200).optional(),
      content: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isRevealed: z.boolean().optional(),
      category: z.string().max(50).nullable().optional(),
    })
  ),
  documentController.update.bind(documentController)
);

// DELETE /:id - Deleta documento (admin)
router.delete(
  '/:id',
  requireAdmin,
  documentController.delete.bind(documentController)
);

// PATCH /:id/reveal - Revela/oculta documento (admin)
router.patch(
  '/:id/reveal',
  requireAdmin,
  validate(
    z.object({
      isRevealed: z.boolean(),
    })
  ),
  documentController.reveal.bind(documentController)
);

// POST /:id/images - Upload de imagem (admin)
router.post(
  '/:id/images',
  requireAdmin,
  uploadDocument,
  documentController.uploadImage.bind(documentController)
);

// DELETE /:id/images/:imageId - Deleta imagem (admin)
router.delete(
  '/:id/images/:imageId',
  requireAdmin,
  documentController.deleteImage.bind(documentController)
);

export default router;

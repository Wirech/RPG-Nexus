import { Router } from 'express';
import { environmentController } from '../controllers/environment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadEnvironmentImage } from '../middlewares/upload.middleware';
import { validate } from '../validators';
import { z } from 'zod';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// GET / - Lista ambientes (admin vê todos, player vê revelados)
router.get('/', environmentController.list.bind(environmentController));

// GET /:id - Busca ambiente por ID
router.get('/:id', environmentController.getById.bind(environmentController));

// POST / - Cria ambiente (admin)
router.post(
  '/',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      isRevealed: z.boolean().default(false),
    })
  ),
  environmentController.create.bind(environmentController)
);

// PUT /:id - Atualiza ambiente (admin)
router.put(
  '/:id',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().nullable().optional(),
      isRevealed: z.boolean().optional(),
    })
  ),
  environmentController.update.bind(environmentController)
);

// DELETE /:id - Deleta ambiente (admin)
router.delete(
  '/:id',
  requireAdmin,
  environmentController.delete.bind(environmentController)
);

// PATCH /:id/reveal - Revela/oculta ambiente (admin)
router.patch(
  '/:id/reveal',
  requireAdmin,
  validate(
    z.object({
      isRevealed: z.boolean(),
    })
  ),
  environmentController.reveal.bind(environmentController)
);

// POST /:id/images - Upload de imagem (admin)
router.post(
  '/:id/images',
  requireAdmin,
  uploadEnvironmentImage,
  environmentController.uploadImage.bind(environmentController)
);

// DELETE /:id/images/:imageId - Deleta imagem (admin)
router.delete(
  '/:id/images/:imageId',
  requireAdmin,
  environmentController.deleteImage.bind(environmentController)
);

// ==================== POINTS ====================

// POST /:id/points - Cria ponto (admin)
router.post(
  '/:id/points',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      linkedNpcId: z.string().uuid().optional(),
    })
  ),
  environmentController.createPoint.bind(environmentController)
);

// PUT /:id/points/:pointId - Atualiza ponto (admin)
router.put(
  '/:id/points/:pointId',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().nullable().optional(),
      linkedNpcId: z.string().uuid().nullable().optional(),
    })
  ),
  environmentController.updatePoint.bind(environmentController)
);

// DELETE /:id/points/:pointId - Deleta ponto (admin)
router.delete(
  '/:id/points/:pointId',
  requireAdmin,
  environmentController.deletePoint.bind(environmentController)
);

export default router;

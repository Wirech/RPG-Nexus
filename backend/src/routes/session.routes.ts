import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authMiddleware, requireAdmin, requireAuthenticated } from '../middlewares';
import { validate } from '../validators';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  sessionNumber: z.number().int().positive().optional().nullable(),
  sessionDate: z.string().datetime().optional().nullable(),
  content: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  sessionNumber: z.number().int().positive().optional().nullable(),
  sessionDate: z.string().datetime().optional().nullable(),
  content: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

// Rotas de sessão

// GET / - Lista sessões [approved]
router.get(
  '/',
  authMiddleware,
  requireAuthenticated,
  sessionController.list.bind(sessionController)
);

// GET /:id - Busca sessão por ID [approved]
router.get(
  '/:id',
  authMiddleware,
  requireAuthenticated,
  sessionController.getById.bind(sessionController)
);

// POST / - Cria sessão [admin]
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createSessionSchema),
  sessionController.create.bind(sessionController)
);

// PUT /:id - Atualiza sessão [admin]
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(updateSessionSchema),
  sessionController.update.bind(sessionController)
);

// DELETE /:id - Deleta sessão [admin]
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  sessionController.delete.bind(sessionController)
);

export default router;

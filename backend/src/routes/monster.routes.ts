import { Router } from 'express';
import { monsterController } from '../controllers/monster.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadToken } from '../middlewares/upload.middleware';
import { validate } from '../validators';
import { z } from 'zod';

const router = Router();

// Todas as rotas de monstros são admin
router.use(authMiddleware);
router.use(requireAdmin);

// GET / - Lista monstros
router.get('/', monsterController.list.bind(monsterController));

// GET /:id - Busca monstro por ID
router.get('/:id', monsterController.getById.bind(monsterController));

// POST / - Cria monstro
router.post(
  '/',
  validate(
    z.object({
      name: z.string().min(1).max(100),
      threatLevel: z.string().max(50).optional(),
      element: z.string().max(50).optional(),
      description: z.string().optional(),
      pvMax: z.number().int().min(0).default(10),
      sanMax: z.number().int().min(0).default(0),
      peMax: z.number().int().min(0).default(0),
      defense: z.number().int().min(0).default(10),
      resistances: z.array(z.string()).optional(),
      immunities: z.array(z.string()).optional(),
      tokenImage: z.string().optional(),
    })
  ),
  monsterController.create.bind(monsterController)
);

// PUT /:id - Atualiza monstro
router.put(
  '/:id',
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      threatLevel: z.string().max(50).nullable().optional(),
      element: z.string().max(50).nullable().optional(),
      description: z.string().nullable().optional(),
      pvMax: z.number().int().min(0).optional(),
      sanMax: z.number().int().min(0).optional(),
      peMax: z.number().int().min(0).optional(),
      defense: z.number().int().min(0).optional(),
      resistances: z.array(z.string()).optional(),
      immunities: z.array(z.string()).optional(),
    })
  ),
  monsterController.update.bind(monsterController)
);

// DELETE /:id - Deleta monstro
router.delete('/:id', monsterController.delete.bind(monsterController));

// POST /:id/token - Upload de token
router.post(
  '/:id/token',
  uploadToken,
  monsterController.uploadToken.bind(monsterController)
);

// ==================== ATTACKS ====================

// POST /:id/attacks
router.post(
  '/:id/attacks',
  validate(
    z.object({
      name: z.string().min(1).max(100),
      damage: z.string().max(50),
      description: z.string().optional(),
      damageType: z.string().max(50).optional(),
      reach: z.string().max(50).optional(),
    })
  ),
  monsterController.createAttack.bind(monsterController)
);

// PUT /:id/attacks/:attackId
router.put(
  '/:id/attacks/:attackId',
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      damage: z.string().max(50).optional(),
      description: z.string().optional(),
      damageType: z.string().max(50).optional(),
      reach: z.string().max(50).optional(),
    })
  ),
  monsterController.updateAttack.bind(monsterController)
);

// DELETE /:id/attacks/:attackId
router.delete(
  '/:id/attacks/:attackId',
  monsterController.deleteAttack.bind(monsterController)
);

// ==================== ABILITIES ====================

// POST /:id/abilities
router.post(
  '/:id/abilities',
  validate(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      type: z.string().max(50),
    })
  ),
  monsterController.createAbility.bind(monsterController)
);

// PUT /:id/abilities/:abilityId
router.put(
  '/:id/abilities/:abilityId',
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      type: z.string().max(50).optional(),
    })
  ),
  monsterController.updateAbility.bind(monsterController)
);

// DELETE /:id/abilities/:abilityId
router.delete(
  '/:id/abilities/:abilityId',
  monsterController.deleteAbility.bind(monsterController)
);

export default router;

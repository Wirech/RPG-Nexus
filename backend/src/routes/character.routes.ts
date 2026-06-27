import { Router } from 'express';
import { characterController } from '../controllers/character.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadToken } from '../middlewares/upload.middleware';
import { validate } from '../validators';
import { z } from 'zod';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// ==================== GRUPOS ====================

// GET /groups - Lista grupos (todos autenticados)
router.get('/groups', characterController.listGroups.bind(characterController));

// POST /groups - Cria grupo (admin)
router.post(
  '/groups',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
  ),
  characterController.createGroup.bind(characterController)
);

// PUT /groups/:id - Atualiza grupo (admin)
router.put(
  '/groups/:id',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      order: z.number().int().min(0).optional(),
    })
  ),
  characterController.updateGroup.bind(characterController)
);

// DELETE /groups/:id - Deleta grupo (admin)
router.delete(
  '/groups/:id',
  requireAdmin,
  characterController.deleteGroup.bind(characterController)
);

// ==================== PERSONAGENS ====================

// GET / - Lista personagens (admin vê todos, player vê revelados + próprio)
router.get('/', characterController.list.bind(characterController));

// GET /:id - Busca personagem por ID
router.get('/:id', characterController.getById.bind(characterController));

// POST / - Cria personagem (admin)
router.post(
  '/',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      groupId: z.string().uuid().optional(),
      nex: z.number().int().min(0).max(99).optional(),
      classe: z.string().max(50).optional(),
      trilha: z.string().max(100).optional(),
      patente: z.string().max(50).optional(),
      pvMax: z.number().int().min(0).default(20),
      pvCurrent: z.number().int().min(0).optional(),
      sanMax: z.number().int().min(0).default(12),
      sanCurrent: z.number().int().min(0).optional(),
      peMax: z.number().int().min(0).default(2),
      peCurrent: z.number().int().min(0).optional(),
      atributos: z.record(z.number()).optional(),
      biography: z.string().optional(),
      conditions: z.array(z.string()).optional(),
      isRevealed: z.boolean().default(false),
      tokenImage: z.string().optional(),
    })
  ),
  characterController.create.bind(characterController)
);

// PUT /:id - Atualiza personagem (admin)
router.put(
  '/:id',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      groupId: z.string().uuid().nullable().optional(),
      nex: z.number().int().min(0).max(99).optional(),
      classe: z.string().max(50).nullable().optional(),
      trilha: z.string().max(100).nullable().optional(),
      patente: z.string().max(50).nullable().optional(),
      pvMax: z.number().int().min(0).optional(),
      pvCurrent: z.number().int().min(0).optional(),
      sanMax: z.number().int().min(0).optional(),
      sanCurrent: z.number().int().min(0).optional(),
      peMax: z.number().int().min(0).optional(),
      peCurrent: z.number().int().min(0).optional(),
      atributos: z.record(z.number()).nullable().optional(),
      biography: z.string().nullable().optional(),
      conditions: z.array(z.string()).optional(),
      isRevealed: z.boolean().optional(),
    })
  ),
  characterController.update.bind(characterController)
);

// DELETE /:id - Deleta personagem (admin)
router.delete(
  '/:id',
  requireAdmin,
  characterController.delete.bind(characterController)
);

// PATCH /:id/vitals - Atualiza vitais (admin ou dono do personagem)
router.patch(
  '/:id/vitals',
  validate(
    z.object({
      pvCurrent: z.number().int().min(0).optional(),
      pvMax: z.number().int().min(0).optional(),
      sanCurrent: z.number().int().min(0).optional(),
      sanMax: z.number().int().min(0).optional(),
      peCurrent: z.number().int().min(0).optional(),
      peMax: z.number().int().min(0).optional(),
    })
  ),
  characterController.updateVitals.bind(characterController)
);

// PATCH /:id/conditions - Atualiza condições (admin)
router.patch(
  '/:id/conditions',
  requireAdmin,
  validate(
    z.object({
      conditions: z.array(z.string()),
    })
  ),
  characterController.updateConditions.bind(characterController)
);

// PATCH /:id/reveal - Revela/oculta personagem (admin)
router.patch(
  '/:id/reveal',
  requireAdmin,
  validate(
    z.object({
      isRevealed: z.boolean(),
    })
  ),
  characterController.reveal.bind(characterController)
);

// POST /:id/token - Upload de token (admin)
router.post(
  '/:id/token',
  requireAdmin,
  uploadToken,
  characterController.uploadToken.bind(characterController)
);

// ==================== SKILLS ====================

// POST /:id/skills - Cria perícia (admin)
router.post(
  '/:id/skills',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      attribute: z.string().min(1).max(20),
      bonus: z.number().int().default(0),
      trained: z.boolean().default(false),
    })
  ),
  characterController.createSkill.bind(characterController)
);

// PUT /:id/skills/:skillId - Atualiza perícia (admin)
router.put(
  '/:id/skills/:skillId',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      attribute: z.string().min(1).max(20).optional(),
      bonus: z.number().int().optional(),
      trained: z.boolean().optional(),
    })
  ),
  characterController.updateSkill.bind(characterController)
);

// DELETE /:id/skills/:skillId - Deleta perícia (admin)
router.delete(
  '/:id/skills/:skillId',
  requireAdmin,
  characterController.deleteSkill.bind(characterController)
);

// ==================== ABILITIES ====================

// POST /:id/abilities - Cria habilidade (admin)
router.post(
  '/:id/abilities',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      peCost: z.number().int().min(0).default(0),
      type: z.string().max(50).optional(),
      element: z.string().max(50).optional(),
    })
  ),
  characterController.createAbility.bind(characterController)
);

// PUT /:id/abilities/:abilityId - Atualiza habilidade (admin)
router.put(
  '/:id/abilities/:abilityId',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      peCost: z.number().int().min(0).optional(),
      type: z.string().max(50).optional(),
      element: z.string().max(50).optional(),
    })
  ),
  characterController.updateAbility.bind(characterController)
);

// DELETE /:id/abilities/:abilityId - Deleta habilidade (admin)
router.delete(
  '/:id/abilities/:abilityId',
  requireAdmin,
  characterController.deleteAbility.bind(characterController)
);

// ==================== INVENTORY ====================

// POST /:id/inventory - Cria item (admin ou dono)
router.post(
  '/:id/inventory',
  validate(
    z.object({
      name: z.string().min(1).max(100),
      quantity: z.number().int().min(0).default(1),
      description: z.string().max(500).optional(),
      category: z.string().max(50).optional(),
      weight: z.number().min(0).optional(),
    })
  ),
  characterController.createInventoryItem.bind(characterController)
);

// PUT /:id/inventory/:itemId - Atualiza item (admin ou dono)
router.put(
  '/:id/inventory/:itemId',
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      quantity: z.number().int().min(0).optional(),
      description: z.string().max(500).optional(),
      category: z.string().max(50).optional(),
      weight: z.number().min(0).optional(),
    })
  ),
  characterController.updateInventoryItem.bind(characterController)
);

// DELETE /:id/inventory/:itemId - Deleta item (admin ou dono)
router.delete(
  '/:id/inventory/:itemId',
  characterController.deleteInventoryItem.bind(characterController)
);

export default router;

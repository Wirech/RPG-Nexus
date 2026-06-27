import { Router } from 'express';
import { combatController } from '../controllers/combat.controller';
import { authMiddleware, requireAdmin, requireAuthenticated } from '../middlewares';
import { validate } from '../validators';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const participantSchema = z.object({
  entityType: z.enum(['character', 'monster']),
  entityId: z.string().uuid(),
  initiative: z.number().int(),
});

const createCombatSchema = z.object({
  name: z.string().min(1).max(100),
  participants: z.array(participantSchema).min(1),
});

const updateCombatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'paused', 'finished']).optional(),
});

const vitalsSchema = z.object({
  field: z.enum(['pv', 'san', 'pe']),
  value: z.number().int(),
});

const conditionsSchema = z.object({
  conditions: z.array(z.string()),
});

const addParticipantSchema = z.object({
  entityType: z.enum(['character', 'monster']),
  entityId: z.string().uuid(),
  initiative: z.number().int(),
});

// Rotas de combate - todas requerem autenticação

// GET / - Lista combates
router.get(
  '/',
  authMiddleware,
  requireAuthenticated,
  combatController.list.bind(combatController)
);

// GET /:id - Busca combate por ID
router.get(
  '/:id',
  authMiddleware,
  requireAuthenticated,
  combatController.getById.bind(combatController)
);

// POST / - Cria combate [admin]
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createCombatSchema),
  combatController.create.bind(combatController)
);

// PUT /:id - Atualiza combate [admin]
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(updateCombatSchema),
  combatController.update.bind(combatController)
);

// DELETE /:id - Deleta combate [admin]
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  combatController.delete.bind(combatController)
);

// PATCH /:id/participants/:participantId/vitals - Atualiza vitais
router.patch(
  '/:id/participants/:participantId/vitals',
  authMiddleware,
  requireAuthenticated,
  validate(vitalsSchema),
  combatController.updateParticipantVitals.bind(combatController)
);

// PATCH /:id/participants/:participantId/conditions - Atualiza condições
router.patch(
  '/:id/participants/:participantId/conditions',
  authMiddleware,
  requireAuthenticated,
  validate(conditionsSchema),
  combatController.updateParticipantConditions.bind(combatController)
);

// POST /:id/next-round - Avança rodada [admin]
router.post(
  '/:id/next-round',
  authMiddleware,
  requireAdmin,
  combatController.nextRound.bind(combatController)
);

// POST /:id/finish - Finaliza combate [admin]
router.post(
  '/:id/finish',
  authMiddleware,
  requireAdmin,
  combatController.finish.bind(combatController)
);

// POST /:id/participants - Adiciona participante [admin]
router.post(
  '/:id/participants',
  authMiddleware,
  requireAdmin,
  validate(addParticipantSchema),
  combatController.addParticipant.bind(combatController)
);

// DELETE /:id/participants/:participantId - Remove participante [admin]
router.delete(
  '/:id/participants/:participantId',
  authMiddleware,
  requireAdmin,
  combatController.removeParticipant.bind(combatController)
);

// GET /:id/events - Lista eventos do combate
router.get(
  '/:id/events',
  authMiddleware,
  requireAuthenticated,
  combatController.getEvents.bind(combatController)
);

export default router;

import { Router } from 'express';
import {
  getAbilities,
  getRituals,
  createAbility,
  createRitual,
} from '../controllers/compendium.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// Rotas públicas para leitura
router.get('/abilities', authMiddleware, getAbilities);
router.get('/rituals', authMiddleware, getRituals);

// Rotas admin para criação de itens customizados
router.post('/abilities', authMiddleware, requireAdmin, createAbility);
router.post('/rituals', authMiddleware, requireAdmin, createRitual);

export default router;

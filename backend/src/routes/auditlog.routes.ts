import { Router } from 'express';
import { auditLogController } from '../controllers/auditlog.controller';
import { authMiddleware, requireAdmin } from '../middlewares';

const router = Router();

// Rotas de auditoria - todas requerem admin

// GET / - Lista logs com filtros e paginação
router.get(
  '/',
  authMiddleware,
  requireAdmin,
  auditLogController.list.bind(auditLogController)
);

// GET /stats - Estatísticas de auditoria
router.get(
  '/stats',
  authMiddleware,
  requireAdmin,
  auditLogController.getStats.bind(auditLogController)
);

// GET /entity/:type/:id - Logs de uma entidade
router.get(
  '/entity/:type/:id',
  authMiddleware,
  requireAdmin,
  auditLogController.getByEntity.bind(auditLogController)
);

// GET /user/:userId - Logs de um usuário
router.get(
  '/user/:userId',
  authMiddleware,
  requireAdmin,
  auditLogController.getByUser.bind(auditLogController)
);

export default router;

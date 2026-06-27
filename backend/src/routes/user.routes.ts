import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware, requireAdmin } from '../middlewares';
import { validate } from '../validators';
import { approveUserSchema, rejectUserSchema, updateUserSchema } from '../validators/schemas';

const router = Router();

// Todas as rotas requerem admin
router.use(authMiddleware);
router.use(requireAdmin);

// GET /api/v1/users
router.get('/', (req, res) => userController.list(req, res));

// GET /api/v1/users/pending
router.get('/pending', (req, res) => userController.listPending(req, res));

// POST /api/v1/users/approve/:id
router.post('/approve/:id', validate(approveUserSchema), (req, res) => userController.approve(req, res));

// POST /api/v1/users/reject/:id
router.post('/reject/:id', validate(rejectUserSchema), (req, res) => userController.reject(req, res));

// PUT /api/v1/users/:id
router.put('/:id', validate(updateUserSchema), (req, res) => userController.update(req, res));

// DELETE /api/v1/users/:id
router.delete('/:id', (req, res) => userController.delete(req, res));

// POST /api/v1/users/:id/block
router.post('/:id/block', (req, res) => userController.block(req, res));

// POST /api/v1/users/:id/unblock
router.post('/:id/unblock', (req, res) => userController.unblock(req, res));

export { router as userRouter };

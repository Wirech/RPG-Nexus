import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares';
import { validate } from '../validators';
import { registerSchema, loginSchema } from '../validators/schemas';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), (req, res) => authController.register(req, res));

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export { router as authRouter };

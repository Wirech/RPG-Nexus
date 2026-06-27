import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import prisma from '../prisma/client';

// Extende o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: true,
        message: 'Token de autenticação não fornecido',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        error: true,
        message: 'Token inválido ou expirado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Busca usuário no banco para verificar status atual
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, status: true },
    });

    if (!user) {
      res.status(401).json({
        error: true,
        message: 'Usuário não encontrado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (user.status === 'pending') {
      res.status(403).json({
        error: true,
        message: 'Conta aguardando aprovação',
        code: 'ACCOUNT_PENDING',
      });
      return;
    }

    if (user.status === 'blocked') {
      res.status(403).json({
        error: true,
        message: 'Conta bloqueada',
        code: 'ACCOUNT_BLOCKED',
      });
      return;
    }

    // Injeta user no request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Erro interno de autenticação',
      code: 'INTERNAL_ERROR',
    });
  }
}

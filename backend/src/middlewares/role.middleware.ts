import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: true,
        message: 'Usuário não autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: true,
        message: 'Acesso negado. Permissão insuficiente.',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

// Atalhos para uso comum
export const requireAdmin = requireRole('admin');
export const requirePlayer = requireRole('admin', 'player');
export const requireAuthenticated = requireRole('admin', 'player', 'spectator');

import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../utils/auditLogger';

export function auditMiddleware(entityType: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Apenas intercepta métodos que modificam dados
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      next();
      return;
    }

    // Armazena o método original de res.json para interceptar a resposta
    const originalJson = res.json.bind(res);
    
    res.json = (body: unknown) => {
      // Só registra se a operação foi bem-sucedida (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = mapMethodToAction(req.method);
        const entityId = req.params.id || (body as Record<string, unknown>)?.id as string || 'unknown';

        createAuditLog({
          userId: req.user?.id,
          entityType,
          entityId: String(entityId),
          action,
          newValue: req.method !== 'DELETE' ? JSON.stringify(req.body) : undefined,
          context: 'manual',
        }).catch(() => {
          // Silently fail - audit log não deve bloquear a operação
        });
      }

      return originalJson(body);
    };

    next();
  };
}

function mapMethodToAction(method: string): string {
  switch (method) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'unknown';
  }
}

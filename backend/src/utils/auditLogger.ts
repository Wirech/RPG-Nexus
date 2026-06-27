import prisma from '../prisma/client';
import { logger } from './logger';

export interface AuditLogParams {
  userId?: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  context?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        action: params.action,
        fieldChanged: params.fieldChanged,
        oldValue: params.oldValue,
        newValue: params.newValue,
        context: params.context || 'manual',
      },
    });

    logger.debug(`AuditLog: ${params.action} on ${params.entityType}:${params.entityId}`);
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
}

export function serializeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function getChangedFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): { field: string; oldValue: string; newValue: string }[] {
  const changes: { field: string; oldValue: string; newValue: string }[] = [];

  for (const key of Object.keys(newObj)) {
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        oldValue: serializeValue(oldVal),
        newValue: serializeValue(newVal),
      });
    }
  }

  return changes;
}

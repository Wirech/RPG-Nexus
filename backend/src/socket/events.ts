// Constantes de eventos do Socket.io

// Eventos emitidos pelo SERVIDOR → CLIENTE
export const SOCKET_EVENTS = {
  // Acesso e autenticação
  ACCESS_NEW_REQUEST: 'access:new_request',
  ACCESS_APPROVED: 'access:approved',
  ACCESS_REJECTED: 'access:rejected',
  ACCESS_REQUEST_RESOLVED: 'access:request_resolved',

  // Usuário
  USER_UPDATED: 'user:updated',

  // Combate
  COMBAT_UPDATED: 'combat:updated',
  COMBAT_EVENT: 'combat:event',
  COMBAT_ROUND_CHANGE: 'combat:round_change',

  // Notificações gerais
  NOTIFICATION_GENERAL: 'notification:general',

  // Eventos do cliente → servidor
  COMBAT_JOIN: 'combat:join',
  COMBAT_LEAVE: 'combat:leave',
  AUTH_IDENTIFY: 'auth:identify',
} as const;

// Salas do socket
export const SOCKET_ROOMS = {
  ADMINS: 'admins',
  combatRoom: (combatId: string) => `combat:${combatId}`,
} as const;

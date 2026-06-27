import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import type {
  User,
  AccessRequest,
  CharacterGroup,
  Character,
  CharacterSkill,
  CharacterAbility,
  InventoryItem,
  Monster,
  MonsterAttack,
  MonsterAbility,
  Environment,
  EnvironmentImage,
  EnvironmentPoint,
  Document,
  DocumentImage,
  CombatSession,
  CombatParticipant,
  CombatEvent,
  SessionNote,
  AuditLog,
  PaginatedResponse,
  LoginInput,
  RegisterInput,
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateMonsterInput,
  CreateEnvironmentInput,
  CreateDocumentInput,
  CreateCombatInput,
  CreateSessionNoteInput,
} from '../types';

// Instância Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request - Injeta token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response - Trata erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ code?: string; message?: string }>) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token inválido ou expirado
      useAuthStore.getState().logout();
      window.location.href = '/login';
      // Toast será exibido pelo componente
    }
    
    if (response?.status === 403) {
      const code = response.data?.code;
      
      if (code === 'ACCOUNT_PENDING') {
        window.location.href = '/pending';
      }
      
      if (code === 'ACCOUNT_BLOCKED') {
        useAuthStore.getState().logout();
        // Toast de erro será exibido pelo componente
      }
    }
    
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────

export const authApi = {
  login: (data: LoginInput) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  
  register: (data: RegisterInput) =>
    api.post<{ user: User; message: string }>('/auth/register', data),
  
  me: () =>
    api.get<User>('/auth/me'),
  
  refresh: () =>
    api.post<{ token: string }>('/auth/refresh'),
};

// ─────────────────────────────────────────
// USER API
// ─────────────────────────────────────────

export const userApi = {
  list: () =>
    api.get<User[]>('/users'),
  
  getById: (id: string) =>
    api.get<User>(`/users/${id}`),
  
  getPending: () =>
    api.get<AccessRequest[]>('/users/pending'),
  
  approve: (userId: string, data: { role: string; linkedCharacterId?: string }) =>
    api.post(`/users/${userId}/approve`, data),
  
  reject: (userId: string, reason?: string) =>
    api.post(`/users/${userId}/reject`, { reason }),
  
  block: (id: string) =>
    api.post(`/users/${id}/block`),
  
  unblock: (id: string) =>
    api.post(`/users/${id}/unblock`),
  
  update: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/users/${id}`),
};

// ─────────────────────────────────────────
// CHARACTER API
// ─────────────────────────────────────────

export const characterApi = {
  // Grupos
  listGroups: () =>
    api.get<CharacterGroup[]>('/characters/groups'),
  
  createGroup: (data: { name: string; description?: string; color?: string }) =>
    api.post<CharacterGroup>('/characters/groups', data),
  
  updateGroup: (id: string, data: Partial<CharacterGroup>) =>
    api.put<CharacterGroup>(`/characters/groups/${id}`, data),
  
  deleteGroup: (id: string) =>
    api.delete(`/characters/groups/${id}`),
  
  reorderGroups: (groupIds: string[]) =>
    api.post('/characters/groups/reorder', { groupIds }),
  
  // Personagens
  list: (params?: { groupId?: string; search?: string }) =>
    api.get<Character[]>('/characters', { params }),
  
  getById: (id: string) =>
    api.get<Character>(`/characters/${id}`),
  
  create: (data: CreateCharacterInput) =>
    api.post<Character>('/characters', data),
  
  update: (id: string, data: UpdateCharacterInput) =>
    api.put<Character>(`/characters/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/characters/${id}`),
  
  uploadToken: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('token', file);
    return api.post<Character>(`/characters/${id}/token`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Vitais
  updateVitals: (id: string, field: 'pv' | 'san' | 'pe', value: number) =>
    api.patch<Character>(`/characters/${id}/vitals`, { field, value }),
  
  // Condições
  updateConditions: (id: string, conditions: string[]) =>
    api.patch<Character>(`/characters/${id}/conditions`, { conditions }),
  
  // Perícias
  listSkills: (characterId: string) =>
    api.get<CharacterSkill[]>(`/characters/${characterId}/skills`),
  
  createSkill: (characterId: string, data: Omit<CharacterSkill, 'id' | 'characterId'>) =>
    api.post<CharacterSkill>(`/characters/${characterId}/skills`, data),
  
  updateSkill: (characterId: string, skillId: string, data: Partial<CharacterSkill>) =>
    api.put<CharacterSkill>(`/characters/${characterId}/skills/${skillId}`, data),
  
  deleteSkill: (characterId: string, skillId: string) =>
    api.delete(`/characters/${characterId}/skills/${skillId}`),
  
  // Habilidades
  listAbilities: (characterId: string) =>
    api.get<CharacterAbility[]>(`/characters/${characterId}/abilities`),
  
  createAbility: (characterId: string, data: Omit<CharacterAbility, 'id' | 'characterId'>) =>
    api.post<CharacterAbility>(`/characters/${characterId}/abilities`, data),
  
  updateAbility: (characterId: string, abilityId: string, data: Partial<CharacterAbility>) =>
    api.put<CharacterAbility>(`/characters/${characterId}/abilities/${abilityId}`, data),
  
  deleteAbility: (characterId: string, abilityId: string) =>
    api.delete(`/characters/${characterId}/abilities/${abilityId}`),
  
  // Inventário
  listInventory: (characterId: string) =>
    api.get<InventoryItem[]>(`/characters/${characterId}/inventory`),
  
  createItem: (characterId: string, data: Omit<InventoryItem, 'id' | 'characterId'>) =>
    api.post<InventoryItem>(`/characters/${characterId}/inventory`, data),
  
  updateItem: (characterId: string, itemId: string, data: Partial<InventoryItem>) =>
    api.put<InventoryItem>(`/characters/${characterId}/inventory/${itemId}`, data),
  
  deleteItem: (characterId: string, itemId: string) =>
    api.delete(`/characters/${characterId}/inventory/${itemId}`),
};

// ─────────────────────────────────────────
// MONSTER API
// ─────────────────────────────────────────

export const monsterApi = {
  list: (params?: { threatLevel?: string; search?: string }) =>
    api.get<Monster[]>('/monsters', { params }),
  
  getById: (id: string) =>
    api.get<Monster>(`/monsters/${id}`),
  
  create: (data: CreateMonsterInput) =>
    api.post<Monster>('/monsters', data),
  
  update: (id: string, data: Partial<CreateMonsterInput>) =>
    api.put<Monster>(`/monsters/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/monsters/${id}`),
  
  uploadToken: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('token', file);
    return api.post<Monster>(`/monsters/${id}/token`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Ataques
  createAttack: (monsterId: string, data: Omit<MonsterAttack, 'id' | 'monsterId'>) =>
    api.post<MonsterAttack>(`/monsters/${monsterId}/attacks`, data),
  
  updateAttack: (monsterId: string, attackId: string, data: Partial<MonsterAttack>) =>
    api.put<MonsterAttack>(`/monsters/${monsterId}/attacks/${attackId}`, data),
  
  deleteAttack: (monsterId: string, attackId: string) =>
    api.delete(`/monsters/${monsterId}/attacks/${attackId}`),
  
  // Habilidades
  createAbility: (monsterId: string, data: Omit<MonsterAbility, 'id' | 'monsterId'>) =>
    api.post<MonsterAbility>(`/monsters/${monsterId}/abilities`, data),
  
  updateAbility: (monsterId: string, abilityId: string, data: Partial<MonsterAbility>) =>
    api.put<MonsterAbility>(`/monsters/${monsterId}/abilities/${abilityId}`, data),
  
  deleteAbility: (monsterId: string, abilityId: string) =>
    api.delete(`/monsters/${monsterId}/abilities/${abilityId}`),
};

// ─────────────────────────────────────────
// ENVIRONMENT API
// ─────────────────────────────────────────

export const environmentApi = {
  list: (params?: { search?: string }) =>
    api.get<Environment[]>('/environments', { params }),
  
  getById: (id: string) =>
    api.get<Environment>(`/environments/${id}`),
  
  create: (data: CreateEnvironmentInput) =>
    api.post<Environment>('/environments', data),
  
  update: (id: string, data: Partial<CreateEnvironmentInput>) =>
    api.put<Environment>(`/environments/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/environments/${id}`),
  
  reveal: (id: string, isRevealed: boolean) =>
    api.patch<Environment>(`/environments/${id}/reveal`, { isRevealed }),
  
  // Imagens
  uploadImage: (environmentId: string, file: File, caption?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);
    return api.post<EnvironmentImage>(`/environments/${environmentId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  deleteImage: (environmentId: string, imageId: string) =>
    api.delete(`/environments/${environmentId}/images/${imageId}`),
  
  // Pontos de interesse
  createPoint: (environmentId: string, data: Omit<EnvironmentPoint, 'id' | 'environmentId'>) =>
    api.post<EnvironmentPoint>(`/environments/${environmentId}/points`, data),
  
  updatePoint: (environmentId: string, pointId: string, data: Partial<EnvironmentPoint>) =>
    api.put<EnvironmentPoint>(`/environments/${environmentId}/points/${pointId}`, data),
  
  deletePoint: (environmentId: string, pointId: string) =>
    api.delete(`/environments/${environmentId}/points/${pointId}`),
};

// ─────────────────────────────────────────
// DOCUMENT API
// ─────────────────────────────────────────

export const documentApi = {
  list: (params?: { category?: string; search?: string; tags?: string[] }) =>
    api.get<Document[]>('/documents', { params }),
  
  getById: (id: string) =>
    api.get<Document>(`/documents/${id}`),
  
  create: (data: CreateDocumentInput) =>
    api.post<Document>('/documents', data),
  
  update: (id: string, data: Partial<CreateDocumentInput>) =>
    api.put<Document>(`/documents/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/documents/${id}`),
  
  reveal: (id: string, isRevealed: boolean) =>
    api.patch<Document>(`/documents/${id}/reveal`, { isRevealed }),
  
  // Imagens
  uploadImage: (documentId: string, file: File, caption?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);
    return api.post<DocumentImage>(`/documents/${documentId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  deleteImage: (documentId: string, imageId: string) =>
    api.delete(`/documents/${documentId}/images/${imageId}`),
};

// ─────────────────────────────────────────
// COMBAT API
// ─────────────────────────────────────────

export const combatApi = {
  list: (params?: { status?: string }) =>
    api.get<CombatSession[]>('/combat', { params }),
  
  getById: (id: string) =>
    api.get<CombatSession>(`/combat/${id}`),
  
  create: (data: CreateCombatInput) =>
    api.post<CombatSession>('/combat', data),
  
  update: (id: string, data: { name?: string; status?: string }) =>
    api.put<CombatSession>(`/combat/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/combat/${id}`),
  
  // Participantes
  addParticipant: (combatId: string, data: { entityType: 'character' | 'monster'; entityId: string; initiative: number }) =>
    api.post<CombatParticipant>(`/combat/${combatId}/participants`, data),
  
  removeParticipant: (combatId: string, participantId: string) =>
    api.delete(`/combat/${combatId}/participants/${participantId}`),
  
  updateParticipantVitals: (combatId: string, participantId: string, data: { field: 'pv' | 'san' | 'pe'; value: number; sourceId?: string; description?: string }) =>
    api.patch<CombatParticipant>(`/combat/${combatId}/participants/${participantId}/vitals`, data),
  
  updateParticipantConditions: (combatId: string, participantId: string, data: { conditions: string[] }) =>
    api.patch<CombatParticipant>(`/combat/${combatId}/participants/${participantId}/conditions`, data),
  
  // Rodadas
  nextRound: (id: string) =>
    api.post<CombatSession>(`/combat/${id}/next-round`),
  
  finish: (id: string, data?: { updateCharacterVitals?: boolean; createSessionNote?: boolean }) =>
    api.post<CombatSession>(`/combat/${id}/finish`, data),
  
  // Eventos
  getEvents: (combatId: string, round?: number) =>
    api.get<CombatEvent[]>(`/combat/${combatId}/events`, { params: { round } }),
};

// ─────────────────────────────────────────
// SESSION API
// ─────────────────────────────────────────

export const sessionApi = {
  list: () =>
    api.get<SessionNote[]>('/sessions'),
  
  getById: (id: string) =>
    api.get<SessionNote>(`/sessions/${id}`),
  
  create: (data: CreateSessionNoteInput) =>
    api.post<SessionNote>('/sessions', data),
  
  update: (id: string, data: Partial<CreateSessionNoteInput>) =>
    api.put<SessionNote>(`/sessions/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/sessions/${id}`),
};

// ─────────────────────────────────────────
// AUDIT API
// ─────────────────────────────────────────

export const auditApi = {
  list: (params?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<AuditLog>>('/audit', { params }),
  
  getByEntity: (entityType: string, entityId: string, limit?: number) =>
    api.get<AuditLog[]>(`/audit/entity/${entityType}/${entityId}`, { params: { limit } }),
  
  getByUser: (userId: string, page?: number, limit?: number) =>
    api.get<PaginatedResponse<AuditLog>>(`/audit/user/${userId}`, { params: { page, limit } }),
  
  getStats: () =>
    api.get<{
      totalLogs: number;
      actionCounts: { action: string; count: number }[];
      entityTypeCounts: { entityType: string; count: number }[];
      recentActivity: AuditLog[];
    }>('/audit/stats'),
};

export default api;

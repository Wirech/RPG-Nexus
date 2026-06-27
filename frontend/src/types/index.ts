// ─────────────────────────────────────────
// TIPOS AUXILIARES
// ─────────────────────────────────────────

export type VitalField = 'pv' | 'san' | 'pe';

export type ConditionType =
  | 'Abalado'
  | 'Alquebrado'
  | 'Apavorado'
  | 'Atordoado'
  | 'Cego'
  | 'Confuso'
  | 'Debilitado'
  | 'Desprevenido'
  | 'Exausto'
  | 'Fascinado'
  | 'Fraco'
  | 'Imóvel'
  | 'Inconsciente'
  | 'Lento'
  | 'Morto'
  | 'Paralisado'
  | 'Pressionado'
  | 'Sangrando'
  | 'Surdo'
  | 'Vulnerável';

export type ThreatLevel = 'Moderado' | 'Perigoso' | 'Mortal' | 'Lendário';

export type CharacterRole = 'Agente' | 'Combatente' | 'Especialista' | 'Ocultista';

export type UserRole = 'admin' | 'player' | 'spectator' | 'pending';

export type UserStatus = 'pending' | 'active' | 'blocked';

export type DiceValue = 'd4' | 'd6' | 'd8' | 'd12' | 'd20';

export type ElementType = 'Morte' | 'Sangue' | 'Energia' | 'Conhecimento' | 'Medo';

export type AbilityType = 'habilidade' | 'ritual';

export type ItemCategory = 'arma' | 'proteção' | 'item' | 'consumível';

export type DamageType = 'físico' | 'mental' | 'paranormal';

export type AttackReach = 'corpo a corpo' | 'curto' | 'médio' | 'longo';

export type DocumentCategory = 'pista' | 'relatório' | 'foto' | 'mapa' | 'áudio' | 'outro';

export type CombatStatus = 'active' | 'paused' | 'finished';

export type CombatEventAction =
  | 'damage'
  | 'heal'
  | 'san_damage'
  | 'san_heal'
  | 'pe_spend'
  | 'pe_recover'
  | 'condition_add'
  | 'condition_remove'
  | 'custom';

export type EntityType = 'character' | 'monster' | 'environment' | 'document' | 'combat' | 'user' | 'session';

export type AuditAction = 'create' | 'update' | 'delete' | 'access_granted' | 'access_revoked' | 'combat_event';

// ─────────────────────────────────────────
// RESPOSTAS DA API
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: boolean;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────
// EVENTOS SOCKET
// ─────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Servidor → Cliente
  ACCESS_NEW_REQUEST: 'access:new_request',
  ACCESS_APPROVED: 'access:approved',
  ACCESS_REJECTED: 'access:rejected',
  COMBAT_UPDATED: 'combat:updated',
  COMBAT_EVENT: 'combat:event',
  COMBAT_ROUND_CHANGE: 'combat:round_change',
  NOTIFICATION_GENERAL: 'notification:general',
  // Cliente → Servidor
  COMBAT_JOIN: 'combat:join',
  COMBAT_LEAVE: 'combat:leave',
  AUTH_IDENTIFY: 'auth:identify',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// ─────────────────────────────────────────
// USUÁRIOS E AUTENTICAÇÃO
// ─────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  linkedCharacterId?: string | null;
  linkedCharacter?: Character | null;
  createdAt: string;
  approvedAt?: string | null;
  approvedById?: string | null;
}

export interface AccessRequest {
  id: string;
  userId: string;
  user?: User;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  rejectionReason?: string | null;
}

export interface ResourcePermission {
  id: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  permission: 'view' | 'edit';
  grantedById: string;
  grantedAt: string;
}

// ─────────────────────────────────────────
// PERSONAGENS
// ─────────────────────────────────────────

export interface CharacterGroup {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  order: number;
  characters?: Character[];
  _count?: { characters: number };
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  groupId: string;
  group?: CharacterGroup;
  name: string;
  tokenImage?: string | null;
  description?: string | null;
  historySummary?: string | null;
  historyFull?: string | null;
  nex?: string | null;
  trilha?: CharacterRole | null;
  pvCurrent: number;
  pvMax: number;
  sanCurrent: number;
  sanMax: number;
  peCurrent: number;
  peMax: number;
  attrForca?: DiceValue | null;
  attrAgilidade?: DiceValue | null;
  attrIntelecto?: DiceValue | null;
  attrPresenca?: DiceValue | null;
  attrVigor?: DiceValue | null;
  conditions: string[]; // desserializado do JSON
  isRevealed: boolean;
  createdAt: string;
  updatedAt: string;
  skills?: CharacterSkill[];
  abilities?: CharacterAbility[];
  inventory?: InventoryItem[];
}

export interface CharacterSkill {
  id: string;
  characterId: string;
  name: string;
  attribute: 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';
  bonus: number;
  trained: boolean;
}

export interface CharacterAbility {
  id: string;
  characterId: string;
  name: string;
  description?: string | null;
  peCost?: number | null;
  type: AbilityType;
  element?: ElementType | null;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  characterId: string;
  name: string;
  quantity: number;
  description?: string | null;
  category?: ItemCategory | null;
  weight?: number | null;
}

// ─────────────────────────────────────────
// MONSTROS / BESTIÁRIO
// ─────────────────────────────────────────

export interface Monster {
  id: string;
  name: string;
  tokenImage?: string | null;
  description?: string | null;
  lore?: string | null;
  threatLevel?: ThreatLevel | null;
  pvMax: number;
  sanMax?: number | null;
  attrForca?: DiceValue | null;
  attrAgilidade?: DiceValue | null;
  attrIntelecto?: DiceValue | null;
  attrPresenca?: DiceValue | null;
  attrVigor?: DiceValue | null;
  resistances: string[]; // desserializado do JSON
  immunities: string[]; // desserializado do JSON
  createdAt: string;
  updatedAt: string;
  attacks?: MonsterAttack[];
  abilities?: MonsterAbility[];
}

export interface MonsterAttack {
  id: string;
  monsterId: string;
  name: string;
  damage: string;
  damageType?: DamageType | null;
  description?: string | null;
  reach?: AttackReach | null;
}

export interface MonsterAbility {
  id: string;
  monsterId: string;
  name: string;
  description?: string | null;
  type: 'habilidade' | 'ritual' | 'passiva';
}

// ─────────────────────────────────────────
// AMBIENTES
// ─────────────────────────────────────────

export interface Environment {
  id: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  isRevealed: boolean;
  createdAt: string;
  updatedAt: string;
  images?: EnvironmentImage[];
  points?: EnvironmentPoint[];
}

export interface EnvironmentImage {
  id: string;
  environmentId: string;
  filePath: string;
  caption?: string | null;
  order: number;
}

export interface EnvironmentPoint {
  id: string;
  environmentId: string;
  name: string;
  description?: string | null;
  linkedNpcId?: string | null;
}

// ─────────────────────────────────────────
// DOCUMENTOS DE INVESTIGAÇÃO
// ─────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  content?: string | null;
  category?: DocumentCategory | null;
  tags: string[]; // desserializado do JSON
  isRevealed: boolean;
  sessionId?: string | null;
  createdAt: string;
  updatedAt: string;
  images?: DocumentImage[];
}

export interface DocumentImage {
  id: string;
  documentId: string;
  filePath: string;
  caption?: string | null;
}

// ─────────────────────────────────────────
// COMBATE
// ─────────────────────────────────────────

export interface CombatSession {
  id: string;
  name: string;
  roundCurrent: number;
  status: CombatStatus;
  createdAt: string;
  finishedAt?: string | null;
  participants?: CombatParticipant[];
  events?: CombatEvent[];
  _count?: { participants: number };
}

export interface CombatParticipant {
  id: string;
  combatSessionId: string;
  entityType: 'character' | 'monster';
  characterId?: string | null;
  character?: Pick<Character, 'id' | 'name' | 'tokenImage'> | null;
  monsterId?: string | null;
  monster?: Pick<Monster, 'id' | 'name' | 'tokenImage'> | null;
  customName?: string | null;
  initiative: number;
  pvCurrent: number;
  pvMax: number;
  sanCurrent: number;
  sanMax: number;
  peCurrent: number;
  peMax: number;
  conditions: string[]; // desserializado do JSON
  isActive: boolean;
  order: number;
}

export interface CombatEvent {
  id: string;
  combatSessionId: string;
  round: number;
  sourceId?: string | null;
  sourceName?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  action: CombatEventAction;
  field?: VitalField | null;
  value?: number | null;
  description?: string | null;
  timestamp: string;
}

// ─────────────────────────────────────────
// NOTAS DE SESSÃO
// ─────────────────────────────────────────

export interface SessionNote {
  id: string;
  title: string;
  sessionNumber?: number | null;
  sessionDate?: string | null;
  content?: string | null;
  tags: string[]; // desserializado do JSON
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────
// LOG DE AUDITORIA
// ─────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: Pick<User, 'id' | 'username'> | null;
  entityType: EntityType;
  entityId: string;
  entityName?: string | null;
  action: AuditAction;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  context?: 'manual' | 'combat' | 'system' | null;
  timestamp: string;
}

// ─────────────────────────────────────────
// INPUTS PARA API
// ─────────────────────────────────────────

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
}

export interface CreateCharacterInput {
  groupId: string;
  name: string;
  description?: string;
  nex?: string;
  trilha?: CharacterRole;
  pvMax?: number;
  sanMax?: number;
  peMax?: number;
  attrForca?: DiceValue;
  attrAgilidade?: DiceValue;
  attrIntelecto?: DiceValue;
  attrPresenca?: DiceValue;
  attrVigor?: DiceValue;
}

export interface UpdateCharacterInput extends Partial<CreateCharacterInput> {
  pvCurrent?: number;
  sanCurrent?: number;
  peCurrent?: number;
  conditions?: string[];
  historySummary?: string;
  historyFull?: string;
  isRevealed?: boolean;
}

export interface CreateMonsterInput {
  name: string;
  description?: string;
  lore?: string;
  threatLevel?: ThreatLevel;
  pvMax: number;
  sanMax?: number;
  attrForca?: DiceValue;
  attrAgilidade?: DiceValue;
  attrIntelecto?: DiceValue;
  attrPresenca?: DiceValue;
  attrVigor?: DiceValue;
  resistances?: string[];
  immunities?: string[];
}

export interface CreateEnvironmentInput {
  name: string;
  description?: string;
  notes?: string;
  isRevealed?: boolean;
}

export interface CreateDocumentInput {
  title: string;
  content?: string;
  category?: DocumentCategory;
  tags?: string[];
  isRevealed?: boolean;
  sessionId?: string;
}

export interface CreateCombatInput {
  name: string;
  participants: Array<{
    entityType: 'character' | 'monster';
    entityId: string;
    initiative: number;
  }>;
}

export interface CreateSessionNoteInput {
  title: string;
  sessionNumber?: number;
  sessionDate?: string;
  content?: string;
  tags?: string[];
}

// ─────────────────────────────────────────
// TIPOS AUXILIARES
// ─────────────────────────────────────────

export type VitalField = 'pv' | 'san' | 'pe';

export type ConditionType =
  // Medo
  | 'Abalado'
  | 'Apavorado'
  // Mentais
  | 'Alquebrado'
  | 'Atordoado'
  | 'Confuso'
  | 'Esmorecido'
  | 'Fascinado'
  | 'Frustrado'
  | 'Pasmo'
  // Paralisia/Movimento
  | 'Agarrado'
  | 'Enredado'
  | 'Imóvel'
  | 'Lento'
  | 'Paralisado'
  // Sentidos
  | 'Cego'
  | 'Ofuscado'
  | 'Surdo'
  // Fadiga
  | 'Debilitado'
  | 'Exausto'
  | 'Fatigado'
  | 'Fraco'
  // Estado Geral
  | 'Asfixiado'
  | 'Caído'
  | 'Desprevenido'
  | 'Doente'
  | 'Em Chamas'
  | 'Enjoado'
  | 'Envenenado'
  | 'Indefeso'
  | 'Inconsciente'
  | 'Morto'
  | 'Morrendo'
  | 'Petrificado'
  | 'Pressionado'
  | 'Sangrando'
  | 'Surpreendido'
  | 'Vulnerável';

export type ThreatLevel = 'Moderado' | 'Perigoso' | 'Mortal' | 'Lendário';

export type CharacterRole = 'Combatente' | 'Especialista' | 'Ocultista';

export type UserRole = 'admin' | 'player' | 'spectator' | 'pending';

export type UserStatus = 'pending' | 'active' | 'blocked';

export type DiceValue = 'd4' | 'd6' | 'd8' | 'd12' | 'd20';

export type ElementType = 'Morte' | 'Sangue' | 'Energia' | 'Conhecimento' | 'Medo';

export type AbilityType = 'habilidade' | 'ritual' | 'origem';

export type ItemCategory = 'arma' | 'proteção' | 'escudo' | 'equipamento' | 'consumível' | 'misc';

export type WeaponType = 'melee' | 'ranged' | 'thrown';
export type WeaponGrip = 'light' | 'one-handed' | 'two-handed';
export type ProtectionType = 'light' | 'heavy';
export type SkillTraining = 'destreinado' | 'treinado' | 'veterano' | 'expert';

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
  ACCESS_REQUEST_RESOLVED: 'access:request_resolved',
  USER_UPDATED: 'user:updated',
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
  parentId?: string | null;
  parent?: CharacterGroup;
  children?: CharacterGroup[];
  characters?: Character[];
  memberships?: CharacterGroupMembership[];
  _count?: { characters: number; memberships: number };
  createdAt: string;
  updatedAt: string;
}

export interface CharacterGroupMembership {
  id: string;
  characterId: string;
  character?: Character;
  groupId: string;
  group?: CharacterGroup;
  addedAt: string;
}

export interface Character {
  id: string;
  groupId: string;
  group?: CharacterGroup;
  groupMemberships?: CharacterGroupMembership[];
  name: string;
  tokenImage?: string | null;
  description?: string | null;
  historySummary?: string | null;
  historyFull?: string | null;
  nex?: string | null;
  trilha?: CharacterRole | null;
  origem?: string | null;
  // Recursos vitais
  pvCurrent: number;
  pvMax: number;
  sanCurrent: number;
  sanMax: number;
  peCurrent: number;
  peMax: number;
  // Atributos (1-6)
  attrForca: number;
  attrAgilidade: number;
  attrIntelecto: number;
  attrPresenca: number;
  attrVigor: number;
  // Defesas e Resistências
  defesa: number;
  esquiva?: number | null;
  bloqueio?: number | null;
  fortitude: number;
  reflexos: number;
  vontade: number;
  // Movimento e Inventário
  deslocamento: number;
  espacosInventario: number;
  // Limite de PE por rodada e Redução de Dano
  limitePE?: number;
  reducaoDano?: number;
  // Status de aprovação
  isApproved: boolean;
  approvedAt?: string | null;
  approvedById?: string | null;
  createdById?: string | null;
  // Outros
  conditions: string[];
  isRevealed: boolean;
  createdAt: string;
  updatedAt: string;
  skills?: CharacterSkill[];
  abilities?: CharacterAbility[];
  inventory?: InventoryItem[];
  linkedUsers?: UserCharacter[];
}

export interface UserCharacter {
  id: string;
  userId: string;
  characterId: string;
  assignedAt: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface CharacterSkill {
  id: string;
  characterId: string;
  name: string;
  attribute: 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';
  training: SkillTraining;
  otherBonus: number;
  // Novos campos
  isTrained: boolean;
  hasSpecialization: boolean;
  specializationName?: string | null;
  bonusModifier: number;
  isOfficial: boolean;
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
  // Novos campos - link com compêndio
  compendiumAbilityId?: string | null;
  compendiumAbility?: AbilityCompendium | null;
  compendiumRitualId?: string | null;
  compendiumRitual?: RitualCompendium | null;
  // Overrides
  nameOverride?: string | null;
  descriptionOverride?: string | null;
  peCostOverride?: number | null;
  // Tracking de uso
  currentUses: number;
  notes?: string | null;
  addedAt: string;
  // Campos do Ordem
  actionType?: string | null;
  usesPerScene?: number | null;
  trilha?: string | null;
  nex?: string | null;
}

export interface InventoryLocation {
  id: string;
  characterId: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  _count?: { items: number };
}

export interface InventoryItem {
  id: string;
  characterId: string;
  name: string;
  quantity: number;
  description?: string | null;
  category?: ItemCategory | null;
  weight: number;
  spaces: number;
  isEquipped: boolean;
  // Localização
  locationId?: string | null;
  inventoryLocation?: InventoryLocation | null;
  locationCustomName?: string | null;
  // Campos para ARMAS
  weaponType?: WeaponType | null;
  weaponGrip?: WeaponGrip | null;
  damage?: string | null;
  damageType?: string | null;
  criticalMargin?: number | null;
  criticalMult?: number | null;
  weaponRange?: number | null;
  weaponProperties?: string | null; // JSON array
  wProficiency?: string | null;
  wAmmunition?: number | null;
  wAmmunitionType?: string | null;
  // Campos para PROTEÇÕES
  protectionType?: ProtectionType | null;
  defenseBonus?: number | null;
  damageReduction?: number | null;
  pPenalty?: number | null;
  pMaxDex?: number | null;
  // Campos para CONSUMÍVEIS
  cEffect?: string | null;
  cDuration?: string | null;
  cCharges?: number | null;
  // Campos para MUNIÇÃO
  aType?: string | null;
  aDamageBonus?: string | null;
  aProperties?: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────
// COMPÊNDIO
// ─────────────────────────────────────────

export interface AbilityCompendium {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  trilha?: string | null;
  nex?: string | null;
  actionType: string;
  peCost: number;
  usesPerScene?: number | null;
  requiresConcentration: boolean;
  tags: string;
  source: 'official' | 'custom';
  createdAt: string;
  updatedAt: string;
}

export interface RitualCompendium {
  id: string;
  name: string;
  description?: string | null;
  effectDescription?: string | null;
  element: ElementType;
  circle: number;
  executionTime: string;
  range: string;
  duration: string;
  resistance?: string | null;
  peCost: number;
  nex?: string | null;
  components: string;
  source: 'official' | 'custom';
  createdAt: string;
  updatedAt: string;
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
  origem?: string;
  nex?: string;
  trilha?: CharacterRole;
  pvMax?: number;
  sanMax?: number;
  peMax?: number;
  attrForca?: number;
  attrAgilidade?: number;
  attrIntelecto?: number;
  attrPresenca?: number;
  attrVigor?: number;
  defesa?: number;
  esquiva?: number;
  bloqueio?: number;
  fortitude?: number;
  reflexos?: number;
  vontade?: number;
  deslocamento?: number;
  espacosInventario?: number;
}

export interface UpdateCharacterInput extends Partial<CreateCharacterInput> {
  pvCurrent?: number;
  sanCurrent?: number;
  peCurrent?: number;
  conditions?: string[];
  historySummary?: string;
  historyFull?: string;
  isRevealed?: boolean;
  isApproved?: boolean;
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

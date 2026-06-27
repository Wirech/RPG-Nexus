import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^\S+$/, 'Username não pode conter espaços'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// User schemas
export const approveUserSchema = z.object({
  role: z.enum(['player', 'spectator'], {
    errorMap: () => ({ message: 'Role deve ser player ou spectator' }),
  }),
  linkedCharacterId: z.string().optional(),
});

export const rejectUserSchema = z.object({
  reason: z.string().optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(['admin', 'player', 'spectator']).optional(),
  linkedCharacterId: z.string().nullable().optional(),
  status: z.enum(['active', 'blocked']).optional(),
});

// Character schemas
export const createCharacterSchema = z.object({
  groupId: z.string().min(1, 'Grupo é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  historySummary: z.string().optional(),
  historyFull: z.string().optional(),
  nex: z.string().optional(),
  trilha: z.string().optional(),
  pvCurrent: z.number().int().min(0).default(0),
  pvMax: z.number().int().min(0).default(0),
  sanCurrent: z.number().int().min(0).default(0),
  sanMax: z.number().int().min(0).default(0),
  peCurrent: z.number().int().min(0).default(0),
  peMax: z.number().int().min(0).default(0),
  attrForca: z.string().default('d4'),
  attrAgilidade: z.string().default('d4'),
  attrIntelecto: z.string().default('d4'),
  attrPresenca: z.string().default('d4'),
  attrVigor: z.string().default('d4'),
  conditions: z.array(z.string()).optional(),
});

export const updateVitalsSchema = z.object({
  pvCurrent: z.number().int().optional(),
  pvMax: z.number().int().optional(),
  sanCurrent: z.number().int().optional(),
  sanMax: z.number().int().optional(),
  peCurrent: z.number().int().optional(),
  peMax: z.number().int().optional(),
});

export const updateConditionsSchema = z.object({
  conditions: z.array(z.string()),
});

export const createCharacterGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const createSkillSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  attribute: z.enum(['forca', 'agilidade', 'intelecto', 'presenca', 'vigor']),
  bonus: z.number().int().default(0),
  trained: z.boolean().default(false),
});

export const createAbilitySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  peCost: z.number().int().min(0).optional(),
  type: z.enum(['habilidade', 'ritual']),
  element: z.string().optional(),
});

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  quantity: z.number().int().min(1).default(1),
  description: z.string().optional(),
  category: z.string().optional(),
  weight: z.number().optional(),
});

// Monster schemas
export const createMonsterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  lore: z.string().optional(),
  threatLevel: z.string().optional(),
  pvMax: z.number().int().min(0).default(0),
  sanMax: z.number().int().optional(),
  attrForca: z.string().default('d4'),
  attrAgilidade: z.string().default('d4'),
  attrIntelecto: z.string().default('d4'),
  attrPresenca: z.string().default('d4'),
  attrVigor: z.string().default('d4'),
  resistances: z.array(z.string()).optional(),
  immunities: z.array(z.string()).optional(),
});

export const createMonsterAttackSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  damage: z.string().min(1, 'Dano é obrigatório'),
  damageType: z.string().optional(),
  description: z.string().optional(),
  reach: z.string().optional(),
});

export const createMonsterAbilitySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['habilidade', 'ritual', 'passiva']),
});

// Environment schemas
export const createEnvironmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const createEnvironmentPointSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  linkedNpcId: z.string().optional(),
});

// Document schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sessionId: z.string().optional(),
});

// Combat schemas
export const createCombatSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  participants: z.array(z.object({
    entityType: z.enum(['character', 'monster']),
    entityId: z.string(),
    customName: z.string().optional(),
    initiative: z.number().int(),
  })),
});

export const updateCombatVitalsSchema = z.object({
  field: z.enum(['pv', 'san', 'pe']),
  value: z.number().int(),
  description: z.string().optional(),
  sourceId: z.string().optional(),
});

export const createCombatEventSchema = z.object({
  round: z.number().int().optional(),
  sourceId: z.string().optional(),
  targetId: z.string().optional(),
  action: z.string(),
  field: z.string().optional(),
  value: z.number().int().optional(),
  description: z.string().optional(),
});

// Session Note schemas
export const createSessionNoteSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  sessionNumber: z.number().int().optional(),
  sessionDate: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Reveal schema
export const revealSchema = z.object({
  isRevealed: z.boolean(),
});

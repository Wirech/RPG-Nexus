// ═══════════════════════════════════════════════════════════════════════════
// ORDEM PARANORMAL RPG - REGRAS E FÓRMULAS DO SISTEMA
// ═══════════════════════════════════════════════════════════════════════════

import type { CharacterRole } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// TABELA DE NEX
// ─────────────────────────────────────────────────────────────────────────────

export interface NexLevel {
  nex: string;
  value: number;        // Valor numérico (5, 10, 15...)
  limitePE: number;     // Limite de PE por rodada
  avancos: number;      // Número de avanços desde NEX 5%
  bonusAtributo: number; // Quantos +1 em atributos ganhou
  veteranoDisponivel: boolean;
  expertDisponivel: boolean;
}

export const NEX_TABLE: NexLevel[] = [
  { nex: '5%',  value: 5,  limitePE: 1,  avancos: 0,  bonusAtributo: 0, veteranoDisponivel: false, expertDisponivel: false },
  { nex: '10%', value: 10, limitePE: 2,  avancos: 1,  bonusAtributo: 0, veteranoDisponivel: false, expertDisponivel: false },
  { nex: '15%', value: 15, limitePE: 3,  avancos: 2,  bonusAtributo: 0, veteranoDisponivel: false, expertDisponivel: false },
  { nex: '20%', value: 20, limitePE: 4,  avancos: 3,  bonusAtributo: 1, veteranoDisponivel: false, expertDisponivel: false },
  { nex: '25%', value: 25, limitePE: 5,  avancos: 4,  bonusAtributo: 1, veteranoDisponivel: false, expertDisponivel: false },
  { nex: '30%', value: 30, limitePE: 6,  avancos: 5,  bonusAtributo: 1, veteranoDisponivel: false, expertDisponivel: false },
  { nex: '35%', value: 35, limitePE: 7,  avancos: 6,  bonusAtributo: 1, veteranoDisponivel: true,  expertDisponivel: false },
  { nex: '40%', value: 40, limitePE: 8,  avancos: 7,  bonusAtributo: 1, veteranoDisponivel: true,  expertDisponivel: false },
  { nex: '45%', value: 45, limitePE: 9,  avancos: 8,  bonusAtributo: 1, veteranoDisponivel: true,  expertDisponivel: false },
  { nex: '50%', value: 50, limitePE: 10, avancos: 9,  bonusAtributo: 2, veteranoDisponivel: true,  expertDisponivel: false },
  { nex: '55%', value: 55, limitePE: 11, avancos: 10, bonusAtributo: 2, veteranoDisponivel: true,  expertDisponivel: false },
  { nex: '60%', value: 60, limitePE: 12, avancos: 11, bonusAtributo: 2, veteranoDisponivel: true,  expertDisponivel: false },
  { nex: '65%', value: 65, limitePE: 13, avancos: 12, bonusAtributo: 2, veteranoDisponivel: true,  expertDisponivel: false },
  { nex: '70%', value: 70, limitePE: 14, avancos: 13, bonusAtributo: 2, veteranoDisponivel: true,  expertDisponivel: true },
  { nex: '75%', value: 75, limitePE: 15, avancos: 14, bonusAtributo: 2, veteranoDisponivel: true,  expertDisponivel: true },
  { nex: '80%', value: 80, limitePE: 16, avancos: 15, bonusAtributo: 3, veteranoDisponivel: true,  expertDisponivel: true },
  { nex: '85%', value: 85, limitePE: 17, avancos: 16, bonusAtributo: 3, veteranoDisponivel: true,  expertDisponivel: true },
  { nex: '90%', value: 90, limitePE: 18, avancos: 17, bonusAtributo: 3, veteranoDisponivel: true,  expertDisponivel: true },
  { nex: '95%', value: 95, limitePE: 19, avancos: 18, bonusAtributo: 4, veteranoDisponivel: true,  expertDisponivel: true },
  { nex: '99%', value: 99, limitePE: 20, avancos: 19, bonusAtributo: 4, veteranoDisponivel: true,  expertDisponivel: true },
];

export function getNexLevel(nex: string): NexLevel | undefined {
  return NEX_TABLE.find(n => n.nex === nex);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSES (TRILHAS)
// ─────────────────────────────────────────────────────────────────────────────

export interface ClassStats {
  pvBase: number;      // PV inicial no NEX 5%
  pvPorNex: number;    // PV ganho a cada +5% de NEX (sem VIG)
  peBase: number;      // PE inicial no NEX 5%
  pePorNex: number;    // PE ganho a cada +5% de NEX (sem PRE)
  sanBase: number;     // SAN inicial no NEX 5%
  sanPorNex: number;   // SAN ganho a cada +5% de NEX
  pericias: number;    // Número de perícias treinadas iniciais
}

export const CLASS_STATS: Record<CharacterRole, ClassStats> = {
  Combatente: {
    pvBase: 20,
    pvPorNex: 4,
    peBase: 2,
    pePorNex: 2,
    sanBase: 12,
    sanPorNex: 3,
    pericias: 2, // 2 + INT perícias
  },
  Especialista: {
    pvBase: 16,
    pvPorNex: 3,
    peBase: 3,
    pePorNex: 2,
    sanBase: 16,
    sanPorNex: 4,
    pericias: 4, // 4 + INT perícias
  },
  Ocultista: {
    pvBase: 12,
    pvPorNex: 2,
    peBase: 4,
    pePorNex: 3,
    sanBase: 20,
    sanPorNex: 5,
    pericias: 3, // 3 + INT perícias
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PERÍCIAS
// ─────────────────────────────────────────────────────────────────────────────

export type SkillTraining = 'destreinado' | 'treinado' | 'veterano' | 'expert';

export const SKILL_TRAINING_BONUS: Record<SkillTraining, number> = {
  destreinado: 0,
  treinado: 5,
  veterano: 10,
  expert: 15,
};

export interface SkillDefinition {
  name: string;
  attribute: 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';
  isResistance?: boolean; // Fortitude, Reflexos, Vontade
  onlyTrained?: boolean;  // Só pode usar se treinado
}

export const SKILLS: SkillDefinition[] = [
  // Força
  { name: 'Atletismo', attribute: 'forca' },
  { name: 'Intimidação', attribute: 'forca' },
  { name: 'Luta', attribute: 'forca' },
  
  // Agilidade
  { name: 'Acrobacia', attribute: 'agilidade' },
  { name: 'Furtividade', attribute: 'agilidade' },
  { name: 'Iniciativa', attribute: 'agilidade' },
  { name: 'Pilotagem', attribute: 'agilidade', onlyTrained: true },
  { name: 'Pontaria', attribute: 'agilidade' },
  { name: 'Reflexos', attribute: 'agilidade', isResistance: true },
  
  // Intelecto
  { name: 'Atualidades', attribute: 'intelecto' },
  { name: 'Ciências', attribute: 'intelecto', onlyTrained: true },
  { name: 'Investigação', attribute: 'intelecto' },
  { name: 'Medicina', attribute: 'intelecto', onlyTrained: true },
  { name: 'Ocultismo', attribute: 'intelecto', onlyTrained: true },
  { name: 'Percepção', attribute: 'intelecto' },
  { name: 'Profissão', attribute: 'intelecto' },
  { name: 'Sobrevivência', attribute: 'intelecto' },
  { name: 'Tática', attribute: 'intelecto', onlyTrained: true },
  { name: 'Tecnologia', attribute: 'intelecto', onlyTrained: true },
  
  // Presença
  { name: 'Artes', attribute: 'presenca' },
  { name: 'Diplomacia', attribute: 'presenca' },
  { name: 'Enganação', attribute: 'presenca' },
  { name: 'Intuição', attribute: 'presenca' },
  { name: 'Vontade', attribute: 'presenca', isResistance: true },
  
  // Vigor
  { name: 'Fortitude', attribute: 'vigor', isResistance: true },
];

export const SKILLS_BY_ATTRIBUTE = SKILLS.reduce((acc, skill) => {
  if (!acc[skill.attribute]) acc[skill.attribute] = [];
  acc[skill.attribute].push(skill);
  return acc;
}, {} as Record<string, SkillDefinition[]>);

// ─────────────────────────────────────────────────────────────────────────────
// ARMAS
// ─────────────────────────────────────────────────────────────────────────────

export type WeaponType = 'melee' | 'ranged' | 'thrown';
export type WeaponGrip = 'light' | 'one-handed' | 'two-handed';
export type DamageType = 'ballistic' | 'cutting' | 'impact' | 'piercing' | 'fire' | 'chemical' | 'electric' | 'cold';

export interface WeaponProperty {
  name: string;
  description: string;
}

export const WEAPON_PROPERTIES: Record<string, WeaponProperty> = {
  agil: { name: 'Ágil', description: 'Usa Agilidade em vez de Força para ataques e dano' },
  automática: { name: 'Automática', description: 'Pode fazer rajada (–1d20, +1 dado de dano)' },
  duas_maos: { name: 'Duas Mãos', description: 'Requer as duas mãos para usar' },
  leve: { name: 'Leve', description: 'Pode ser usada enquanto agarrado' },
  pesada: { name: 'Pesada', description: '+2 dados de dano em ataques' },
  recarga: { name: 'Recarga', description: 'Precisa recarregar após X usos' },
  alcance: { name: 'Alcance', description: 'Pode atacar a 3m de distância' },
};

export interface WeaponDefinition {
  name: string;
  type: WeaponType;
  grip: WeaponGrip;
  damage: string;        // ex: "1d6", "2d6", "1d10"
  damageType: DamageType;
  critical: number;      // Margem de ameaça (ex: 20, 19, 18)
  criticalMult: number;  // Multiplicador (ex: 2, 3)
  range?: number;        // Alcance em metros (para armas à distância)
  properties: string[];  // IDs das propriedades
  spaces: number;        // Espaços no inventário
  category: string;      // Categoria I, II, etc.
}

// Armas exemplo (pode ser expandido)
export const WEAPONS: WeaponDefinition[] = [
  // Armas Corpo a Corpo Simples
  { name: 'Faca', type: 'melee', grip: 'light', damage: '1d4', damageType: 'piercing', critical: 19, criticalMult: 2, properties: ['agil', 'leve'], spaces: 1, category: '0' },
  { name: 'Soco Inglês', type: 'melee', grip: 'light', damage: '1d4', damageType: 'impact', critical: 20, criticalMult: 2, properties: ['leve'], spaces: 1, category: '0' },
  { name: 'Bastão', type: 'melee', grip: 'two-handed', damage: '1d6', damageType: 'impact', critical: 20, criticalMult: 2, properties: ['duas_maos'], spaces: 1, category: '0' },
  
  // Armas Corpo a Corpo Táticas
  { name: 'Machado', type: 'melee', grip: 'one-handed', damage: '1d8', damageType: 'cutting', critical: 20, criticalMult: 3, properties: [], spaces: 1, category: 'I' },
  { name: 'Katana', type: 'melee', grip: 'two-handed', damage: '1d10', damageType: 'cutting', critical: 19, criticalMult: 2, properties: ['agil', 'duas_maos'], spaces: 1, category: 'I' },
  { name: 'Espada', type: 'melee', grip: 'one-handed', damage: '1d8', damageType: 'cutting', critical: 19, criticalMult: 2, properties: [], spaces: 1, category: 'I' },
  { name: 'Lança', type: 'melee', grip: 'two-handed', damage: '1d8', damageType: 'piercing', critical: 20, criticalMult: 3, properties: ['duas_maos', 'alcance'], spaces: 1, category: 'I' },
  
  // Armas de Fogo Leves
  { name: 'Pistola', type: 'ranged', grip: 'light', damage: '1d12', damageType: 'ballistic', critical: 19, criticalMult: 2, range: 15, properties: [], spaces: 1, category: 'I' },
  { name: 'Revólver', type: 'ranged', grip: 'light', damage: '1d10', damageType: 'ballistic', critical: 19, criticalMult: 3, range: 12, properties: [], spaces: 1, category: 'I' },
  
  // Armas de Fogo Táticas
  { name: 'Submetralhadora', type: 'ranged', grip: 'one-handed', damage: '1d10', damageType: 'ballistic', critical: 19, criticalMult: 2, range: 20, properties: ['automática'], spaces: 1, category: 'II' },
  { name: 'Rifle de Assalto', type: 'ranged', grip: 'two-handed', damage: '2d8', damageType: 'ballistic', critical: 19, criticalMult: 2, range: 60, properties: ['automática', 'duas_maos'], spaces: 2, category: 'II' },
  { name: 'Escopeta', type: 'ranged', grip: 'two-handed', damage: '2d8', damageType: 'ballistic', critical: 20, criticalMult: 3, range: 6, properties: ['duas_maos'], spaces: 2, category: 'II' },
  { name: 'Rifle de Precisão', type: 'ranged', grip: 'two-handed', damage: '2d10', damageType: 'ballistic', critical: 18, criticalMult: 3, range: 120, properties: ['duas_maos'], spaces: 2, category: 'II' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROTEÇÕES
// ─────────────────────────────────────────────────────────────────────────────

export type ProtectionType = 'light' | 'heavy';

export interface ProtectionDefinition {
  name: string;
  type: ProtectionType;
  defenseBonus: number;
  damageReduction: number;
  spaces: number;
  category: string;
}

export const PROTECTIONS: ProtectionDefinition[] = [
  // Proteções Leves
  { name: 'Colete à Prova de Balas Leve', type: 'light', defenseBonus: 5, damageReduction: 0, spaces: 1, category: 'I' },
  { name: 'Colete Leve Reforçado', type: 'light', defenseBonus: 7, damageReduction: 0, spaces: 1, category: 'I' },
  { name: 'Jaqueta de Couro', type: 'light', defenseBonus: 3, damageReduction: 0, spaces: 1, category: '0' },
  
  // Proteções Pesadas
  { name: 'Colete Tático', type: 'heavy', defenseBonus: 10, damageReduction: 2, spaces: 2, category: 'II' },
  { name: 'Colete Tático Blindado', type: 'heavy', defenseBonus: 12, damageReduction: 5, spaces: 2, category: 'II' },
  { name: 'Armadura Corporal', type: 'heavy', defenseBonus: 10, damageReduction: 5, spaces: 3, category: 'II' },
];

export const SHIELDS: { name: string; defenseBonus: number; spaces: number }[] = [
  { name: 'Escudo Leve', defenseBonus: 2, spaces: 1 },
  { name: 'Escudo Tático', defenseBonus: 2, spaces: 1 },
  { name: 'Escudo Balístico', defenseBonus: 2, spaces: 2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES DE CÁLCULO
// ─────────────────────────────────────────────────────────────────────────────

export interface CharacterAttributes {
  forca: number;
  agilidade: number;
  intelecto: number;
  presenca: number;
  vigor: number;
}

export interface CalculatedStats {
  pvMax: number;
  peMax: number;
  sanMax: number;
  defesa: number;
  esquiva: number;
  bloqueio: number;
  fortitude: number;
  reflexos: number;
  vontade: number;
  espacosInventario: number;
  deslocamento: number;
  limitePE: number;
  pericias: number; // Número de perícias que pode treinar
}

/**
 * Calcula todas as estatísticas de um personagem baseado na classe, NEX e atributos
 */
export function calculateCharacterStats(
  trilha: CharacterRole,
  nex: string,
  attributes: CharacterAttributes,
  protectionBonus: number = 0,
  shieldBonus: number = 0
): CalculatedStats {
  const classStats = CLASS_STATS[trilha];
  const nexLevel = getNexLevel(nex);
  
  if (!classStats || !nexLevel) {
    throw new Error('Trilha ou NEX inválido');
  }

  const avancos = nexLevel.avancos;

  // PV = base + VIG + (avanços × (pvPorNex + VIG))
  const pvMax = classStats.pvBase + attributes.vigor + (avancos * (classStats.pvPorNex + attributes.vigor));

  // PE = base + PRE + (avanços × (pePorNex + PRE))
  const peMax = classStats.peBase + attributes.presenca + (avancos * (classStats.pePorNex + attributes.presenca));

  // SAN = base + (avanços × sanPorNex) - SAN NÃO recebe bônus de atributo
  const sanMax = classStats.sanBase + (avancos * classStats.sanPorNex);

  // DEF = 10 + AGI + proteção + escudo
  const defesa = 10 + attributes.agilidade + protectionBonus + shieldBonus;

  // Esquiva = AGI (bônus base de Reflexos, usado como reação)
  const esquiva = attributes.agilidade;

  // Bloqueio = VIG (bônus base de Fortitude, usado como reação para RD)
  const bloqueio = attributes.vigor;

  // Resistências = atributo base (treinamento adiciona bônus separado)
  const fortitude = attributes.vigor;
  const reflexos = attributes.agilidade;
  const vontade = attributes.presenca;

  // Espaços = FOR > 0 ? 5 + FOR : 2
  const espacosInventario = attributes.forca > 0 ? 5 + attributes.forca : 2;

  // Deslocamento padrão
  const deslocamento = 9;

  // Limite de PE por rodada
  const limitePE = nexLevel.limitePE;

  // Número de perícias = classe base + INT
  const pericias = classStats.pericias + attributes.intelecto;

  return {
    pvMax,
    peMax,
    sanMax,
    defesa,
    esquiva,
    bloqueio,
    fortitude,
    reflexos,
    vontade,
    espacosInventario,
    deslocamento,
    limitePE,
    pericias,
  };
}

/**
 * Calcula o bônus de uma perícia
 */
export function calculateSkillBonus(
  training: SkillTraining,
  otherBonuses: number = 0
): number {
  return SKILL_TRAINING_BONUS[training] + otherBonuses;
}

/**
 * Calcula a DT de uma habilidade
 */
export function calculateAbilityDT(
  limitePE: number,
  attributeValue: number
): number {
  return 10 + limitePE + attributeValue;
}

/**
 * Verifica se um grau de treinamento está disponível para um NEX
 */
export function isTrainingAvailable(training: SkillTraining, nex: string): boolean {
  const nexLevel = getNexLevel(nex);
  if (!nexLevel) return training === 'destreinado' || training === 'treinado';
  
  if (training === 'expert') return nexLevel.expertDisponivel;
  if (training === 'veterano') return nexLevel.veteranoDisponivel;
  return true;
}

/**
 * Calcula o dano de uma arma
 */
export function calculateWeaponDamage(
  weapon: WeaponDefinition,
  attributes: CharacterAttributes,
  isCritical: boolean = false
): string {
  const usesAgi = weapon.properties.includes('agil');
  const attrBonus = usesAgi ? attributes.agilidade : attributes.forca;
  
  // Dano à distância não adiciona atributo por padrão
  const addAttr = weapon.type === 'melee' || weapon.properties.includes('agil');
  
  if (isCritical) {
    const mult = weapon.criticalMult;
    // Crítico multiplica apenas os dados
    return `${mult}×(${weapon.damage})${addAttr ? ` + ${attrBonus}` : ''}`;
  }
  
  return `${weapon.damage}${addAttr ? ` + ${attrBonus}` : ''}`;
}

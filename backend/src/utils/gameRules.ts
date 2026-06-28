// ═══════════════════════════════════════════════════════════════════════════
// ORDEM PARANORMAL RPG - REGRAS E FÓRMULAS DO SISTEMA (BACKEND)
// ═══════════════════════════════════════════════════════════════════════════

export type CharacterRole = 'Combatente' | 'Especialista' | 'Ocultista';
export type SkillTraining = 'destreinado' | 'treinado' | 'veterano' | 'expert';

// ─────────────────────────────────────────────────────────────────────────────
// TABELA DE NEX
// ─────────────────────────────────────────────────────────────────────────────

interface NexLevel {
  nex: string;
  value: number;
  limitePE: number;
  avancos: number;
  bonusAtributo: number;
  veteranoDisponivel: boolean;
  expertDisponivel: boolean;
}

const NEX_TABLE: NexLevel[] = [
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

interface ClassStats {
  pvBase: number;
  pvPorNex: number;
  peBase: number;
  pePorNex: number;
  sanBase: number;
  sanPorNex: number;
  pericias: number;
}

const CLASS_STATS: Record<CharacterRole, ClassStats> = {
  Combatente: {
    pvBase: 20,
    pvPorNex: 4,
    peBase: 2,
    pePorNex: 2,
    sanBase: 12,
    sanPorNex: 3,
    pericias: 2,
  },
  Especialista: {
    pvBase: 16,
    pvPorNex: 3,
    peBase: 3,
    pePorNex: 2,
    sanBase: 16,
    sanPorNex: 4,
    pericias: 4,
  },
  Ocultista: {
    pvBase: 12,
    pvPorNex: 2,
    peBase: 4,
    pePorNex: 3,
    sanBase: 20,
    sanPorNex: 5,
    pericias: 3,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PERÍCIAS
// ─────────────────────────────────────────────────────────────────────────────

export const SKILL_TRAINING_BONUS: Record<SkillTraining, number> = {
  destreinado: 0,
  treinado: 5,
  veterano: 10,
  expert: 15,
};

export interface SkillDefinition {
  name: string;
  attribute: 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';
  isResistance?: boolean;
  onlyTrained?: boolean;
}

export const SKILLS: SkillDefinition[] = [
  { name: 'Atletismo', attribute: 'forca' },
  { name: 'Intimidação', attribute: 'forca' },
  { name: 'Luta', attribute: 'forca' },
  { name: 'Acrobacia', attribute: 'agilidade' },
  { name: 'Furtividade', attribute: 'agilidade' },
  { name: 'Iniciativa', attribute: 'agilidade' },
  { name: 'Pilotagem', attribute: 'agilidade', onlyTrained: true },
  { name: 'Pontaria', attribute: 'agilidade' },
  { name: 'Reflexos', attribute: 'agilidade', isResistance: true },
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
  { name: 'Artes', attribute: 'presenca' },
  { name: 'Diplomacia', attribute: 'presenca' },
  { name: 'Enganação', attribute: 'presenca' },
  { name: 'Intuição', attribute: 'presenca' },
  { name: 'Vontade', attribute: 'presenca', isResistance: true },
  { name: 'Fortitude', attribute: 'vigor', isResistance: true },
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
  pericias: number;
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
    // Valores padrão se não encontrar
    return {
      pvMax: 20,
      peMax: 5,
      sanMax: 20,
      defesa: 10 + attributes.agilidade,
      esquiva: attributes.agilidade,
      bloqueio: attributes.vigor,
      fortitude: attributes.vigor,
      reflexos: attributes.agilidade,
      vontade: attributes.presenca,
      espacosInventario: attributes.forca > 0 ? 5 + attributes.forca : 2,
      deslocamento: 9,
      limitePE: 1,
      pericias: 0,
    };
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

  // Resistências = atributo base
  const fortitude = attributes.vigor;
  const reflexos = attributes.agilidade;
  const vontade = attributes.presenca;

  // Espaços = FOR > 0 ? 5 + FOR : 2
  const espacosInventario = attributes.forca > 0 ? 5 + attributes.forca : 2;

  const deslocamento = 9;
  const limitePE = nexLevel.limitePE;
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
 * Calcula a DT de uma habilidade
 */
export function calculateAbilityDT(limitePE: number, attributeValue: number): number {
  return 10 + limitePE + attributeValue;
}
